import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftFromTemplateDto } from './dto/create-shift-from-template.dto';
import { CreateShiftTemplateDto } from './dto/create-shift-template.dto';
import { GetShiftTemplatesFilterDto } from './dto/get-shift-templates-filter.dto';
import { UpdateShiftTemplateDto } from './dto/update-shift-template.dto';

@Injectable()
export class ShiftTemplatesSafeService {
  private readonly logger = new Logger(ShiftTemplatesSafeService.name);

  constructor(private prisma: PrismaService) {}

  private validateTimeFormat(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    return timeRegex.test(time);
  }

  // Retorna array vazio quando tabela não existe
  async findAllByUserId(
    clerkId: string,
    filterDto: GetShiftTemplatesFilterDto,
  ): Promise<any[]> {
    try {
      // Verificar se a tabela existe fazendo uma query simples
      await this.prisma.$queryRaw`SELECT 1 FROM shift_templates LIMIT 1`;

      // Se chegou aqui, a tabela existe, pode continuar normalmente
      const user = await this.prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      });

      if (!user) {
        throw new NotFoundException(
          `Usuário com Clerk ID ${clerkId} não encontrado`,
        );
      }

      // TODO: Implementar query real quando migração for aplicada
      return [];
    } catch (error) {
      // Se a tabela não existir, retornar array vazio
      this.logger.warn(
        `Tabela shift_templates não encontrada: ${error.message}`,
      );
      return [];
    }
  }

  async findOne(clerkId: string, id: string): Promise<any> {
    try {
      await this.prisma.$queryRaw`SELECT 1 FROM shift_templates LIMIT 1`;
      throw new NotFoundException('Template não encontrado');
    } catch (error) {
      this.logger.warn(
        'Funcionalidade de templates temporariamente indisponível',
      );
      throw new NotFoundException(
        'Funcionalidade temporariamente indisponível',
      );
    }
  }

  async create(
    clerkId: string,
    createDto: CreateShiftTemplateDto,
  ): Promise<any> {
    try {
      await this.prisma.$queryRaw`SELECT 1 FROM shift_templates LIMIT 1`;
      // Se chegou aqui, a tabela existe, mas ainda vamos retornar erro temporário
      this.logger.warn(
        'Criação de templates ainda não implementada no service seguro',
      );
      throw new BadRequestException(
        'Funcionalidade de templates será disponibilizada em breve. Aguarde a atualização do sistema.',
      );
    } catch (error) {
      this.logger.warn(
        'Tabela shift_templates não encontrada - criação indisponível',
      );
      throw new BadRequestException(
        'Funcionalidade de templates será disponibilizada em breve. O banco de dados está sendo atualizado.',
      );
    }
  }

  async update(
    clerkId: string,
    id: string,
    updateDto: UpdateShiftTemplateDto,
  ): Promise<any> {
    throw new BadRequestException(
      'Funcionalidade de templates será disponibilizada em breve.',
    );
  }

  async remove(clerkId: string, id: string): Promise<any> {
    throw new BadRequestException(
      'Funcionalidade de templates será disponibilizada em breve.',
    );
  }

  async createShiftFromTemplate(
    clerkId: string,
    templateId: string,
    createShiftDto: CreateShiftFromTemplateDto,
  ): Promise<any> {
    throw new BadRequestException(
      'Funcionalidade de templates será disponibilizada em breve.',
    );
  }
}
