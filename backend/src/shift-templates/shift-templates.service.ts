import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ShiftTemplate, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftTemplateDto } from './dto/create-shift-template.dto';
import { UpdateShiftTemplateDto } from './dto/update-shift-template.dto';
import { GetShiftTemplatesFilterDto } from './dto/get-shift-templates-filter.dto';
import { CreateShiftFromTemplateDto } from './dto/create-shift-from-template.dto';
import { ShiftsService } from '../shifts/shifts.service';

@Injectable()
export class ShiftTemplatesService {
  private readonly logger = new Logger(ShiftTemplatesService.name);

  constructor(
    private prisma: PrismaService,
    private shiftsService: ShiftsService,
  ) {}

  private validateTimeFormat(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    return timeRegex.test(time);
  }

  async findAllByUserId(
    clerkId: string,
    filterDto: GetShiftTemplatesFilterDto,
  ): Promise<ShiftTemplate[]> {
    try {
      // Verificar se a tabela shift_templates existe
      await this.prisma.$queryRaw`SELECT 1 FROM shift_templates LIMIT 1`;
    } catch (error) {
      // Se a tabela não existir, retornar array vazio temporariamente
      this.logger.warn(
        'Tabela shift_templates não encontrada, retornando array vazio',
      );
      return [];
    }
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

      const where: Prisma.ShiftTemplateWhereInput = {
        userId: user.id,
      };

      if (filterDto.isActive !== undefined) {
        where.isActive = filterDto.isActive;
      } else {
        where.isActive = true;
      }

      if (filterDto.searchTerm) {
        where.OR = [
          {
            name: {
              contains: filterDto.searchTerm,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: filterDto.searchTerm,
              mode: 'insensitive',
            },
          },
        ];
      }

      if (filterDto.locationId) {
        where.locationId = filterDto.locationId;
      }

      if (filterDto.contractorId) {
        where.contractorId = filterDto.contractorId;
      }

      this.logger.log(`Buscando modelos de plantão para userId: ${user.id}`);

      return this.prisma.shiftTemplate.findMany({
        where,
        include: {
          location: true,
          contractor: true,
        },
        orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      });
    } catch (error) {
      this.logger.error(
        `Erro ao buscar modelos de plantão: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findOne(
    id: string,
  ): Promise<ShiftTemplate & { user: { clerkId: string } }> {
    try {
      const template = await this.prisma.shiftTemplate.findUnique({
        where: { id },
        include: {
          location: true,
          contractor: true,
          user: {
            select: {
              id: true,
              clerkId: true,
            },
          },
        },
      });

      if (!template) {
        throw new NotFoundException(
          `Modelo de plantão com ID ${id} não encontrado`,
        );
      }

      return template;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar modelo de plantão ${id}: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Erro ao buscar modelo de plantão: ${error.message}`,
      );
    }
  }

  async create(
    clerkId: string,
    createTemplateDto: CreateShiftTemplateDto,
  ): Promise<ShiftTemplate> {
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

      if (!this.validateTimeFormat(createTemplateDto.startTime)) {
        throw new BadRequestException(
          'Horário de início deve estar no formato HH:MM (ex: 08:00)',
        );
      }

      if (!this.validateTimeFormat(createTemplateDto.endTime)) {
        throw new BadRequestException(
          'Horário de término deve estar no formato HH:MM (ex: 14:00)',
        );
      }

      const existingTemplate = await this.prisma.shiftTemplate.findFirst({
        where: {
          userId: user.id,
          name: createTemplateDto.name,
          isActive: true,
        },
      });

      if (existingTemplate) {
        throw new BadRequestException(
          `Já existe um modelo ativo com o nome "${createTemplateDto.name}"`,
        );
      }

      if (createTemplateDto.locationId) {
        const location = await this.prisma.location.findFirst({
          where: {
            id: createTemplateDto.locationId,
            userId: user.id,
          },
        });

        if (!location) {
          throw new BadRequestException(
            'Local não encontrado ou não pertence ao usuário',
          );
        }
      }

      if (createTemplateDto.contractorId) {
        const contractor = await this.prisma.contractor.findFirst({
          where: {
            id: createTemplateDto.contractorId,
            userId: user.id,
          },
        });

        if (!contractor) {
          throw new BadRequestException(
            'Contratante não encontrado ou não pertence ao usuário',
          );
        }
      }

      const locationId = createTemplateDto.locationId?.trim() || undefined;
      const contractorId = createTemplateDto.contractorId?.trim() || undefined;

      this.logger.log(
        `Criando modelo de plantão "${createTemplateDto.name}" para usuário ${clerkId}`,
      );

      const newTemplate = await this.prisma.shiftTemplate.create({
        data: {
          name: createTemplateDto.name,
          description: createTemplateDto.description || null,
          startTime: createTemplateDto.startTime,
          endTime: createTemplateDto.endTime,
          value: createTemplateDto.value,
          paymentType: createTemplateDto.paymentType,
          notes: createTemplateDto.notes || null,
          isActive: createTemplateDto.isActive ?? true,
          user: { connect: { id: user.id } },
          ...(locationId && { location: { connect: { id: locationId } } }),
          ...(contractorId && {
            contractor: { connect: { id: contractorId } },
          }),
        },
        include: {
          location: true,
          contractor: true,
        },
      });

      this.logger.log(
        `✅ Modelo de plantão criado com sucesso: ${newTemplate.id}`,
      );

      return newTemplate;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao criar modelo de plantão: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Erro interno ao criar modelo de plantão: ${error.message}`,
      );
    }
  }

  async update(
    id: string,
    updateTemplateDto: UpdateShiftTemplateDto,
  ): Promise<ShiftTemplate> {
    try {
      const existingTemplate = await this.findOne(id);

      if (
        updateTemplateDto.startTime &&
        !this.validateTimeFormat(updateTemplateDto.startTime)
      ) {
        throw new BadRequestException(
          'Horário de início deve estar no formato HH:MM',
        );
      }

      if (
        updateTemplateDto.endTime &&
        !this.validateTimeFormat(updateTemplateDto.endTime)
      ) {
        throw new BadRequestException(
          'Horário de término deve estar no formato HH:MM',
        );
      }

      if (
        updateTemplateDto.name &&
        updateTemplateDto.name !== existingTemplate.name
      ) {
        const existingWithName = await this.prisma.shiftTemplate.findFirst({
          where: {
            userId: existingTemplate.userId,
            name: updateTemplateDto.name,
            isActive: true,
            NOT: { id },
          },
        });

        if (existingWithName) {
          throw new BadRequestException(
            `Já existe um modelo ativo com o nome "${updateTemplateDto.name}"`,
          );
        }
      }

      const updateData: Prisma.ShiftTemplateUpdateInput = {};

      if (updateTemplateDto.name !== undefined) {
        updateData.name = updateTemplateDto.name;
      }
      if (updateTemplateDto.description !== undefined) {
        updateData.description = updateTemplateDto.description || null;
      }
      if (updateTemplateDto.startTime !== undefined) {
        updateData.startTime = updateTemplateDto.startTime;
      }
      if (updateTemplateDto.endTime !== undefined) {
        updateData.endTime = updateTemplateDto.endTime;
      }
      if (updateTemplateDto.value !== undefined) {
        updateData.value = updateTemplateDto.value;
      }
      if (updateTemplateDto.paymentType !== undefined) {
        updateData.paymentType = updateTemplateDto.paymentType;
      }
      if (updateTemplateDto.notes !== undefined) {
        updateData.notes = updateTemplateDto.notes || null;
      }
      if (updateTemplateDto.isActive !== undefined) {
        updateData.isActive = updateTemplateDto.isActive;
      }

      if (updateTemplateDto.locationId !== undefined) {
        if (updateTemplateDto.locationId?.trim()) {
          updateData.location = {
            connect: { id: updateTemplateDto.locationId },
          };
        } else {
          updateData.location = { disconnect: true };
        }
      }

      if (updateTemplateDto.contractorId !== undefined) {
        if (updateTemplateDto.contractorId?.trim()) {
          updateData.contractor = {
            connect: { id: updateTemplateDto.contractorId },
          };
        } else {
          updateData.contractor = { disconnect: true };
        }
      }

      this.logger.log(`Atualizando modelo de plantão ${id}`);

      const updatedTemplate = await this.prisma.shiftTemplate.update({
        where: { id },
        data: updateData,
        include: {
          location: true,
          contractor: true,
        },
      });

      this.logger.log(`✅ Modelo de plantão atualizado com sucesso: ${id}`);

      return updatedTemplate;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao atualizar modelo de plantão ${id}: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Erro interno ao atualizar modelo de plantão: ${error.message}`,
      );
    }
  }

  async remove(id: string): Promise<ShiftTemplate> {
    try {
      const existingTemplate = await this.findOne(id);

      const deactivatedTemplate = await this.prisma.shiftTemplate.update({
        where: { id },
        data: { isActive: false },
        include: {
          location: true,
          contractor: true,
        },
      });

      this.logger.log(`✅ Modelo de plantão desativado com sucesso: ${id}`);

      return deactivatedTemplate;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao remover modelo de plantão ${id}: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Erro interno ao remover modelo de plantão: ${error.message}`,
      );
    }
  }

  async createShiftFromTemplate(
    clerkId: string,
    createFromTemplateDto: CreateShiftFromTemplateDto,
  ): Promise<any> {
    try {
      const template = await this.findOne(createFromTemplateDto.templateId);

      if (template.user.clerkId !== clerkId) {
        throw new BadRequestException(
          'Você não tem permissão para usar este modelo',
        );
      }

      if (!template.isActive) {
        throw new BadRequestException('Este modelo está desativado');
      }

      const shiftData = {
        date: createFromTemplateDto.date,
        startTime: template.startTime,
        endTime: template.endTime,
        value: template.value,
        paymentType: template.paymentType,
        notes: template.notes || undefined,
        locationId: template.locationId || undefined,
        contractorId: template.contractorId || undefined,
        isFixed: false,
      };

      this.logger.log(
        `Criando plantão a partir do modelo "${template.name}" para data ${createFromTemplateDto.date}`,
      );

      const createdShift = await this.shiftsService.create(clerkId, shiftData);

      this.logger.log(
        `✅ Plantão criado a partir do modelo: ${createdShift.id}`,
      );

      return createdShift;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao criar plantão a partir do modelo: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Erro interno ao criar plantão a partir do modelo: ${error.message}`,
      );
    }
  }
}
