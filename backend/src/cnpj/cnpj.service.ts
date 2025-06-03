import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CNPJData } from '@prisma/client';
import { CreateCNPJDto } from './dto/create-cnpj.dto';
import { UpdateCNPJDto } from './dto/update-cnpj.dto';

@Injectable()
export class CNPJService {
  private readonly logger = new Logger(CNPJService.name);
  private readonly cache = new Map<
    string,
    { data: CNPJData | null; timestamp: number }
  >();
  private readonly CACHE_TTL = 30000; // 30 segundos de cache

  constructor(private prisma: PrismaService) {}

  async findByUserId(clerkId: string): Promise<CNPJData | null> {
    try {
      // Verificar cache primeiro
      const cached = this.cache.get(clerkId);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        this.logger.log(`Cache hit para CNPJ do usuário: ${clerkId}`);
        return cached.data;
      }

      const user = await this.prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      });

      if (!user) {
        throw new NotFoundException(
          `Usuário com Clerk ID ${clerkId} não encontrado`,
        );
      }

      this.logger.log(`Buscando dados CNPJ para userId: ${user.id}`);

      const cnpjData = await this.prisma.cNPJData.findUnique({
        where: { userId: user.id },
      });

      // Atualizar cache
      this.cache.set(clerkId, { data: cnpjData, timestamp: Date.now() });

      return cnpjData;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar dados CNPJ: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async createOrUpdate(
    clerkId: string,
    cnpjDto: CreateCNPJDto | UpdateCNPJDto,
  ): Promise<CNPJData> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      });

      if (!user) {
        throw new NotFoundException(
          `Usuário com Clerk ID ${clerkId} não encontrado`,
        );
      }

      let formattedCnpj = cnpjDto.cnpjNumber;
      if (formattedCnpj) {
        const numbersOnly = formattedCnpj.replace(/\D/g, '');

        if (numbersOnly.length === 14) {
          formattedCnpj = numbersOnly.replace(
            /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
            '$1.$2.$3/$4-$5',
          );
        }
      }

      this.logger.log(`Criando/atualizando dados CNPJ para userId: ${user.id}`);

      const result = await this.prisma.cNPJData.upsert({
        where: { userId: user.id },
        update: {
          companyName: cnpjDto.companyName,
          cnpjNumber: formattedCnpj,
          accountingFirmName: cnpjDto.accountingFirmName,
          monthlyFee: cnpjDto.monthlyFee,
        },
        create: {
          companyName: cnpjDto.companyName,
          cnpjNumber: formattedCnpj,
          accountingFirmName: cnpjDto.accountingFirmName,
          monthlyFee: cnpjDto.monthlyFee,
          userId: user.id,
        },
      });

      // Invalidar cache
      this.cache.delete(clerkId);

      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao criar/atualizar dados CNPJ: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Erro ao salvar dados CNPJ: ${error.message}`,
      );
    }
  }

  async delete(clerkId: string): Promise<CNPJData> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      });

      if (!user) {
        throw new NotFoundException(
          `Usuário com Clerk ID ${clerkId} não encontrado`,
        );
      }

      const existingData = await this.prisma.cNPJData.findUnique({
        where: { userId: user.id },
      });

      if (!existingData) {
        throw new NotFoundException('Dados CNPJ não encontrados');
      }

      this.logger.log(`Excluindo dados CNPJ para userId: ${user.id}`);

      const result = await this.prisma.cNPJData.delete({
        where: { userId: user.id },
      });

      // Invalidar cache
      this.cache.delete(clerkId);

      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao excluir dados CNPJ: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Erro ao excluir dados CNPJ: ${error.message}`,
      );
    }
  }
}
