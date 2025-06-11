import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Plantao, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import {
  CreateShiftsBatchDto,
  CreateShiftBatchItemDto,
} from './dto/create-shifts-batch.dto';
import { GetShiftsFilterDto } from './dto/get-shifts-filter.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';

export interface BatchCreateResult {
  created: Plantao[];
  skipped: CreateShiftBatchItemDto[];
  failed: { shift: CreateShiftBatchItemDto; error: string }[];
  summary: {
    total: number;
    created: number;
    skipped: number;
    failed: number;
  };
}

@Injectable()
export class ShiftsService {
  private readonly logger = new Logger(ShiftsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Criar um objeto Date local a partir de uma string de data (YYYY-MM-DD)
   * Evita problemas de timezone tratando a data como local
   */
  private createLocalDate(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    if (
      !year ||
      !month ||
      !day ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      throw new BadRequestException('Formato de data inválido. Use YYYY-MM-DD');
    }
    return new Date(year, month - 1, day);
  }

  /**
   * Criar um objeto Date local com horário específico
   */
  private createLocalDateTime(dateString: string, timeString: string): Date {
    const baseDate = this.createLocalDate(dateString);
    const [hours, minutes] = timeString.split(':').map(Number);

    if (
      isNaN(hours) ||
      isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      throw new BadRequestException('Formato de horário inválido. Use HH:MM');
    }

    baseDate.setHours(hours, minutes, 0, 0);
    return baseDate;
  }

  /**
   * Validar formato de horário
   */
  private validateTimeFormat(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    return timeRegex.test(time);
  }

  async findAllByUserId(
    clerkId: string,
    filterDto: GetShiftsFilterDto,
  ): Promise<Plantao[]> {
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

      const where: Prisma.PlantaoWhereInput = {
        userId: user.id,
      };

      if (filterDto.startDate && filterDto.endDate) {
        const startDate = this.createLocalDate(filterDto.startDate);
        const endDate = this.createLocalDate(filterDto.endDate);

        endDate.setHours(23, 59, 59, 999);

        if (startDate > endDate) {
          throw new BadRequestException(
            'A data inicial deve ser anterior à data final',
          );
        }

        where.date = {
          gte: startDate,
          lte: endDate,
        };
      } else if (filterDto.startDate) {
        const startDate = this.createLocalDate(filterDto.startDate);
        where.date = {
          gte: startDate,
        };
      } else if (filterDto.endDate) {
        const endDate = this.createLocalDate(filterDto.endDate);
        endDate.setHours(23, 59, 59, 999);
        where.date = {
          lte: endDate,
        };
      }

      if (filterDto.locationId) {
        where.locationId = filterDto.locationId;
      }

      if (filterDto.contractorId) {
        where.contractorId = filterDto.contractorId;
      }

      this.logger.log(`Buscando plantões para userId: ${user.id} com filtros`);

      const plantoes = await this.prisma.plantao.findMany({
        where,
        include: {
          location: true,
          contractor: true,
        },
        orderBy: {
          date: 'asc',
        },
      });

      return plantoes.map((plantao) => ({
        ...plantao,
        date: this.formatDateToLocalString(plantao.date),
        startTime: plantao.startTime.toISOString(),
        endTime: plantao.endTime.toISOString(),
      })) as any;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar plantões: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private formatDateToLocalString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async findOne(id: string): Promise<Plantao & { user: { clerkId: string } }> {
    try {
      const shift = await this.prisma.plantao.findUnique({
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

      if (!shift) {
        throw new NotFoundException(`Plantão com ID ${id} não encontrado`);
      }

      return {
        ...shift,
        date: this.formatDateToLocalString(shift.date),
        startTime: shift.startTime.toISOString(),
        endTime: shift.endTime.toISOString(),
      } as any;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar plantão ${id}: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Erro ao buscar plantão: ${error.message}`,
      );
    }
  }

  async create(
    clerkId: string,
    createShiftDto: CreateShiftDto,
  ): Promise<Plantao> {
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

      // Validar formatos de horário
      if (!this.validateTimeFormat(createShiftDto.startTime)) {
        throw new BadRequestException(
          'Horário de início deve estar no formato HH:MM (ex: 08:00)',
        );
      }

      if (!this.validateTimeFormat(createShiftDto.endTime)) {
        throw new BadRequestException(
          'Horário de término deve estar no formato HH:MM (ex: 14:00)',
        );
      }

      // Criar datas locais para o plantão
      const shiftDate = this.createLocalDate(createShiftDto.date);
      const startTime = this.createLocalDateTime(
        createShiftDto.date,
        createShiftDto.startTime,
      );
      const endTime = this.createLocalDateTime(
        createShiftDto.date,
        createShiftDto.endTime,
      );

      // Verificar se o horário de término é após o início
      // Para plantões noturnos, o endTime pode ser no dia seguinte
      if (endTime <= startTime) {
        endTime.setDate(endTime.getDate() + 1);
      }

      // Validar se a data não é muito antiga (opcional - pode ser configurável)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      if (shiftDate < oneYearAgo) {
        this.logger.warn(
          `Plantão criado com data muito antiga: ${createShiftDto.date}`,
        );
      }

      // Verificar conflitos de horário no mesmo dia (opcional)
      const existingShifts = await this.prisma.plantao.findMany({
        where: {
          userId: user.id,
          date: {
            gte: new Date(
              shiftDate.getFullYear(),
              shiftDate.getMonth(),
              shiftDate.getDate(),
            ),
            lt: new Date(
              shiftDate.getFullYear(),
              shiftDate.getMonth(),
              shiftDate.getDate() + 1,
            ),
          },
        },
        select: { id: true, startTime: true, endTime: true },
      });

      // Log de conflitos para monitoramento
      if (existingShifts.length > 0) {
        this.logger.warn(
          `Possível sobreposição de plantões para o dia ${createShiftDto.date}`,
        );
      }

      const locationId =
        createShiftDto.locationId && createShiftDto.locationId.trim() !== ''
          ? createShiftDto.locationId
          : undefined;

      const contractorId =
        createShiftDto.contractorId && createShiftDto.contractorId.trim() !== ''
          ? createShiftDto.contractorId
          : undefined;

      // Criar o plantão
      const newShift = await this.prisma.plantao.create({
        data: {
          date: shiftDate,
          value: createShiftDto.value,
          startTime,
          endTime,
          isFixed: createShiftDto.isFixed || false,
          paymentType: createShiftDto.paymentType,
          notes: createShiftDto.notes || null,
          user: {
            connect: { id: user.id },
          },
          ...(locationId && {
            location: {
              connect: { id: locationId },
            },
          }),
          ...(contractorId && {
            contractor: {
              connect: { id: contractorId },
            },
          }),
        },
        include: {
          location: true,
          contractor: true,
        },
      });

      this.logger.log(`Plantão criado com sucesso: ${newShift.id}`);
      return {
        ...newShift,
        date: this.formatDateToLocalString(newShift.date),
        startTime: newShift.startTime.toISOString(),
        endTime: newShift.endTime.toISOString(),
      } as any;
    } catch (error) {
      this.logger.error(`Erro ao criar plantão: ${error.message}`, error.stack);

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Erro interno ao criar plantão: ${error.message}`,
      );
    }
  }

  async update(id: string, updateShiftDto: UpdateShiftDto): Promise<Plantao> {
    try {
      const existingShift = await this.prisma.plantao.findUnique({
        where: { id },
        select: {
          id: true,
          date: true,
          startTime: true,
          endTime: true,
          value: true,
          paymentType: true,
          isFixed: true,
          notes: true,
          locationId: true,
          contractorId: true,
        },
      });

      if (!existingShift) {
        throw new NotFoundException(`Plantão com ID ${id} não encontrado`);
      }

      const updateData: Prisma.PlantaoUpdateInput = {};

      // Atualizar data se fornecida
      if (updateShiftDto.date !== undefined) {
        updateData.date = this.createLocalDate(updateShiftDto.date);
      }

      const workingDate =
        updateShiftDto.date || existingShift.date.toISOString().split('T')[0];

      // Atualizar horário de início se fornecido
      if (updateShiftDto.startTime !== undefined) {
        if (!this.validateTimeFormat(updateShiftDto.startTime)) {
          throw new BadRequestException(
            'Horário de início deve estar no formato HH:MM',
          );
        }
        updateData.startTime = this.createLocalDateTime(
          workingDate,
          updateShiftDto.startTime,
        );
      }

      // Atualizar horário de término se fornecido
      if (updateShiftDto.endTime !== undefined) {
        if (!this.validateTimeFormat(updateShiftDto.endTime)) {
          throw new BadRequestException(
            'Horário de término deve estar no formato HH:MM',
          );
        }

        const endTime = this.createLocalDateTime(
          workingDate,
          updateShiftDto.endTime,
        );

        // Verificar com horário de início atualizado ou existente
        const startTime = updateData.startTime || existingShift.startTime;

        if (endTime <= startTime) {
          endTime.setDate(endTime.getDate() + 1);
        }

        updateData.endTime = endTime;
      }

      // Atualizar outros campos
      if (updateShiftDto.value !== undefined) {
        updateData.value = updateShiftDto.value;
      }

      if (updateShiftDto.paymentType !== undefined) {
        updateData.paymentType = updateShiftDto.paymentType;
      }

      if (updateShiftDto.isFixed !== undefined) {
        updateData.isFixed = updateShiftDto.isFixed;
      }

      if (updateShiftDto.notes !== undefined) {
        updateData.notes = updateShiftDto.notes || null;
      }

      if (updateShiftDto.locationId !== undefined) {
        if (
          updateShiftDto.locationId &&
          updateShiftDto.locationId.trim() !== ''
        ) {
          updateData.location = { connect: { id: updateShiftDto.locationId } };
        } else {
          updateData.location = { disconnect: true };
        }
      }

      if (updateShiftDto.contractorId !== undefined) {
        if (
          updateShiftDto.contractorId &&
          updateShiftDto.contractorId.trim() !== ''
        ) {
          updateData.contractor = {
            connect: { id: updateShiftDto.contractorId },
          };
        } else {
          updateData.contractor = { disconnect: true };
        }
      }

      const updatedShift = await this.prisma.plantao.update({
        where: { id },
        data: updateData,
        include: {
          location: true,
          contractor: true,
        },
      });

      this.logger.log(`Plantão atualizado com sucesso: ${id}`);
      return {
        ...updatedShift,
        date: this.formatDateToLocalString(updatedShift.date),
        startTime: updatedShift.startTime.toISOString(),
        endTime: updatedShift.endTime.toISOString(),
      } as any;
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar plantão ${id}: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Erro interno ao atualizar plantão: ${error.message}`,
      );
    }
  }

  async remove(id: string): Promise<Plantao> {
    try {
      const existingShift = await this.prisma.plantao.findUnique({
        where: { id },
      });

      if (!existingShift) {
        throw new NotFoundException(`Plantão com ID ${id} não encontrado`);
      }

      const deletedShift = await this.prisma.plantao.delete({
        where: { id },
        include: {
          location: true,
          contractor: true,
        },
      });

      this.logger.log(`Plantão removido com sucesso: ${id}`);
      return {
        ...deletedShift,
        date: this.formatDateToLocalString(deletedShift.date),
        startTime: deletedShift.startTime.toISOString(),
        endTime: deletedShift.endTime.toISOString(),
      } as any;
    } catch (error) {
      this.logger.error(
        `Erro ao remover plantão ${id}: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Erro interno ao remover plantão: ${error.message}`,
      );
    }
  }

  async createBatch(
    clerkId: string,
    createShiftsBatchDto: CreateShiftsBatchDto,
  ): Promise<BatchCreateResult> {
    const {
      shifts,
      skipConflicts = true,
      continueOnError = true,
    } = createShiftsBatchDto;

    const result: BatchCreateResult = {
      created: [],
      skipped: [],
      failed: [],
      summary: {
        total: shifts.length,
        created: 0,
        skipped: 0,
        failed: 0,
      },
    };

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

      // Validar todos os shifts antes de criar qualquer um
      const validationErrors: string[] = [];
      for (let i = 0; i < shifts.length; i++) {
        const shift = shifts[i];

        if (!this.validateTimeFormat(shift.startTime)) {
          validationErrors.push(`Shift ${i + 1}: Horário de início inválido`);
        }

        if (!this.validateTimeFormat(shift.endTime)) {
          validationErrors.push(`Shift ${i + 1}: Horário de término inválido`);
        }

        try {
          this.createLocalDate(shift.date);
        } catch {
          validationErrors.push(`Shift ${i + 1}: Data inválida`);
        }
      }

      if (validationErrors.length > 0 && !continueOnError) {
        throw new BadRequestException(
          `Erros de validação: ${validationErrors.join(', ')}`,
        );
      }

      // Buscar conflitos existentes se skipConflicts estiver habilitado
      let existingShifts: {
        date: Date;
        startTime: Date;
        endTime: Date;
      }[] = [];

      if (skipConflicts) {
        const dates = shifts.map((s) => s.date);
        existingShifts = await this.findExistingShifts(user.id, dates);
      }

      // Processar cada shift
      for (const shift of shifts) {
        try {
          // Verificar conflitos
          if (skipConflicts) {
            const shiftDate = this.createLocalDate(shift.date);
            const hasConflict = existingShifts.some((existing) => {
              const existingDate = new Date(existing.date);
              return (
                existingDate.getFullYear() === shiftDate.getFullYear() &&
                existingDate.getMonth() === shiftDate.getMonth() &&
                existingDate.getDate() === shiftDate.getDate()
              );
            });

            if (hasConflict) {
              result.skipped.push(shift);
              result.summary.skipped++;
              continue;
            }
          }

          // Criar o shift
          const createdShift = await this.create(clerkId, shift);
          result.created.push(createdShift);
          result.summary.created++;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Erro desconhecido';

          result.failed.push({
            shift,
            error: errorMessage,
          });
          result.summary.failed++;

          if (!continueOnError) {
            throw error;
          }

          this.logger.warn(`Erro ao criar plantão em lote: ${errorMessage}`, {
            shift,
          });
        }
      }

      this.logger.log(
        `Criação em lote concluída: ${result.summary.created} criados, ${result.summary.skipped} ignorados, ${result.summary.failed} falharam`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Erro na criação em lote: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Erro interno na criação em lote: ${error.message}`,
      );
    }
  }

  private async findExistingShifts(
    userId: string,
    dates: string[],
  ): Promise<{ id: string; date: Date; startTime: Date; endTime: Date }[]> {
    try {
      const dateObjects = dates.map((date) => this.createLocalDate(date));
      const minDate = new Date(
        Math.min(...dateObjects.map((d) => d.getTime())),
      );
      const maxDate = new Date(
        Math.max(...dateObjects.map((d) => d.getTime())),
      );

      // Estender o range para incluir todo o dia
      maxDate.setHours(23, 59, 59, 999);

      return this.prisma.plantao.findMany({
        where: {
          userId,
          date: {
            gte: minDate,
            lte: maxDate,
          },
        },
        select: {
          id: true,
          date: true,
          startTime: true,
          endTime: true,
        },
      });
    } catch (error) {
      this.logger.error(
        `Erro ao buscar plantões existentes: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }
}
