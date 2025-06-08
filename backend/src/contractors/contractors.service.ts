import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Contractor, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { GetContractorsFilterDto } from './dto/get-contractors-filter.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';

@Injectable()
export class ContractorsService {
  private readonly logger = new Logger(ContractorsService.name);

  constructor(private prisma: PrismaService) {}

  async findAllByUserId(
    clerkId: string,
    filterDto: GetContractorsFilterDto,
  ): Promise<Contractor[]> {
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

      const where: Prisma.ContractorWhereInput = {
        userId: user.id,
      };

      if (filterDto.searchTerm) {
        where.OR = [
          {
            name: {
              contains: filterDto.searchTerm,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: filterDto.searchTerm,
              mode: 'insensitive',
            },
          },
          {
            phone: {
              contains: filterDto.searchTerm,
              mode: 'insensitive',
            },
          },
        ];
      }

      this.logger.log(
        `Buscando contratantes para userId: ${user.id} com filtros`,
      );

      return this.prisma.contractor.findMany({
        where,
        orderBy: {
          name: 'asc',
        },
      });
    } catch (error) {
      this.logger.error(
        `Erro ao buscar contratantes: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findOne(
    id: string,
  ): Promise<Contractor & { user: { clerkId: string } }> {
    try {
      const contractor = await this.prisma.contractor.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              clerkId: true,
            },
          },
        },
      });

      if (!contractor) {
        throw new NotFoundException(`Contratante com ID ${id} não encontrado`);
      }

      return contractor;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar contratante ${id}: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Erro ao buscar contratante: ${error.message}`,
      );
    }
  }

  async create(
    clerkId: string,
    createContractorDto: CreateContractorDto,
  ): Promise<Contractor> {
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

      // Validação manual do email
      let validatedEmail: string | null = null;
      if (
        createContractorDto.email !== undefined &&
        createContractorDto.email !== null
      ) {
        const trimmedEmail = createContractorDto.email.trim();

        // Se não está vazio após trim, valida
        if (trimmedEmail !== '') {
          // Validação básica de email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(trimmedEmail)) {
            throw new BadRequestException('Email inválido');
          }
          validatedEmail = trimmedEmail;
        }
        // Se está vazio, validatedEmail permanece null
      }

      return this.prisma.contractor.create({
        data: {
          name: createContractorDto.name,
          email: validatedEmail,
          phone: createContractorDto.phone,
          userId: user.id,
        },
      });
    } catch (error) {
      this.logger.error(
        `Erro ao criar contratante: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Erro ao criar contratante: ${error.message}`,
      );
    }
  }

  async update(
    id: string,
    updateContractorDto: UpdateContractorDto,
  ): Promise<Contractor> {
    try {
      await this.findOne(id);

      return this.prisma.contractor.update({
        where: { id },
        data: updateContractorDto,
      });
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar contratante ${id}: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Erro ao atualizar contratante: ${error.message}`,
      );
    }
  }

  async remove(id: string): Promise<Contractor> {
    try {
      await this.findOne(id);

      return this.prisma.contractor.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(
        `Erro ao remover contratante ${id}: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Erro ao remover contratante: ${error.message}`,
      );
    }
  }
}
