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
  failed: { shift: CreateShiftBatchItemDto; error: string }[];
  summary: {
    total: number;
    created: number;
    failed: number;
  };
}

@Injectable()
export class ShiftsService {
  private readonly logger = new Logger(ShiftsService.name);

  constructor(private prisma: PrismaService) {}

  private timeStringToDate(timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);

    if (
      isNaN(hours) ||
      isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      throw new BadRequestException(
        `Horário inválido: ${timeString}. Use formato HH:MM`,
      );
    }

    const date = new Date(2000, 0, 1, hours, minutes, 0, 0);
    return date;
  }

  private dateToTimeString(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private dateToDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private dateStringToDate(dateString: string): Date {
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
      throw new BadRequestException(
        `Data inválida: ${dateString}. Use formato YYYY-MM-DD`,
      );
    }

    return new Date(year, month - 1, day);
  }

  private formatShiftResponse(shift: any): any {
    return {
      ...shift,
      date: this.dateToDateString(shift.date),
      startTime: this.dateToTimeString(shift.startTime),
      endTime: this.dateToTimeString(shift.endTime),
    };
  }

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
        const startDate = this.dateStringToDate(filterDto.startDate);
        const endDate = this.dateStringToDate(filterDto.endDate);
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
        const startDate = this.dateStringToDate(filterDto.startDate);
        where.date = { gte: startDate };
      } else if (filterDto.endDate) {
        const endDate = this.dateStringToDate(filterDto.endDate);
        endDate.setHours(23, 59, 59, 999);
        where.date = { lte: endDate };
      }

      if (filterDto.locationId) {
        where.locationId = filterDto.locationId;
      }

      if (filterDto.contractorId) {
        where.contractorId = filterDto.contractorId;
      }

      this.logger.log(`Buscando plantões para userId: ${user.id}`);

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

      return plantoes.map((plantao) =>
        this.formatShiftResponse(plantao),
      ) as any;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar plantões: ${error.message}`,
        error.stack,
      );
      throw error;
    }
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

      return this.formatShiftResponse(shift) as any;
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

      const shiftDate = this.dateStringToDate(createShiftDto.date);
      const startTime = this.timeStringToDate(createShiftDto.startTime);
      const endTime = this.timeStringToDate(createShiftDto.endTime);

      if (endTime <= startTime) {
        endTime.setDate(endTime.getDate() + 1);
      }

      const locationId = createShiftDto.locationId?.trim() || undefined;
      const contractorId = createShiftDto.contractorId?.trim() || undefined;

      this.logger.log(
        `Criando plantão para ${createShiftDto.date} das ${createShiftDto.startTime} às ${createShiftDto.endTime}`,
      );

      const newShift = await this.prisma.plantao.create({
        data: {
          date: shiftDate,
          value: createShiftDto.value,
          startTime,
          endTime,
          isFixed: createShiftDto.isFixed || false,
          paymentType: createShiftDto.paymentType,
          notes: createShiftDto.notes || null,
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

      this.logger.log(`✅ Plantão criado com sucesso: ${newShift.id}`);

      return this.formatShiftResponse(newShift) as any;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao criar plantão: ${error.message}`,
        error.stack,
      );

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
      });

      if (!existingShift) {
        throw new NotFoundException(`Plantão com ID ${id} não encontrado`);
      }

      const updateData: Prisma.PlantaoUpdateInput = {};

      if (updateShiftDto.date !== undefined) {
        updateData.date = this.dateStringToDate(updateShiftDto.date);
      }

      if (updateShiftDto.startTime !== undefined) {
        if (!this.validateTimeFormat(updateShiftDto.startTime)) {
          throw new BadRequestException(
            'Horário de início deve estar no formato HH:MM',
          );
        }
        updateData.startTime = this.timeStringToDate(updateShiftDto.startTime);
      }

      if (updateShiftDto.endTime !== undefined) {
        if (!this.validateTimeFormat(updateShiftDto.endTime)) {
          throw new BadRequestException(
            'Horário de término deve estar no formato HH:MM',
          );
        }

        const endTime = this.timeStringToDate(updateShiftDto.endTime);
        const startTime = updateData.startTime || existingShift.startTime;

        if (endTime <= startTime) {
          endTime.setDate(endTime.getDate() + 1);
        }

        updateData.endTime = endTime;
      }

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
        if (updateShiftDto.locationId?.trim()) {
          updateData.location = { connect: { id: updateShiftDto.locationId } };
        } else {
          updateData.location = { disconnect: true };
        }
      }

      if (updateShiftDto.contractorId !== undefined) {
        if (updateShiftDto.contractorId?.trim()) {
          updateData.contractor = {
            connect: { id: updateShiftDto.contractorId },
          };
        } else {
          updateData.contractor = { disconnect: true };
        }
      }

      this.logger.log(
        `Atualizando plantão ${id} com dados:`,
        JSON.stringify({
          date: updateShiftDto.date,
          startTime: updateShiftDto.startTime,
          endTime: updateShiftDto.endTime,
        }),
      );

      const updatedShift = await this.prisma.plantao.update({
        where: { id },
        data: updateData,
        include: {
          location: true,
          contractor: true,
        },
      });

      this.logger.log(`✅ Plantão atualizado com sucesso: ${id}`);

      return this.formatShiftResponse(updatedShift) as any;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao atualizar plantão ${id}: ${error.message}`,
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

      this.logger.log(`✅ Plantão removido com sucesso: ${id}`);

      return this.formatShiftResponse(deletedShift) as any;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao remover plantão ${id}: ${error.message}`,
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
    const { shifts, continueOnError = true } = createShiftsBatchDto;

    const result: BatchCreateResult = {
      created: [],

      failed: [],
      summary: {
        total: shifts.length,
        created: 0,
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
          this.dateStringToDate(shift.date);
        } catch {
          validationErrors.push(`Shift ${i + 1}: Data inválida`);
        }
      }

      if (validationErrors.length > 0 && !continueOnError) {
        throw new BadRequestException(
          `Erros de validação: ${validationErrors.join(', ')}`,
        );
      }

      const dates = shifts.map((s) => s.date);
      await this.findExistingShifts(user.id, dates);

      this.logger.log(`Criando ${shifts.length} plantões em lote`);

      for (const shift of shifts) {
        try {
          const createdShift = await this.create(clerkId, shift);
          result.created.push(createdShift);
          result.summary.created++;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Erro desconhecido';

          result.failed.push({ shift, error: errorMessage });
          result.summary.failed++;

          if (!continueOnError) {
            throw error;
          }

          this.logger.warn(
            `❌ Erro ao criar plantão em lote: ${errorMessage}`,
            { shift },
          );
        }
      }

      this.logger.log(
        `✅ Criação em lote concluída: ${result.summary.created} criados, ${result.summary.failed} falharam`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `❌ Erro na criação em lote: ${error.message}`,
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
      const dateObjects = dates.map((date) => this.dateStringToDate(date));
      const minDate = new Date(
        Math.min(...dateObjects.map((d) => d.getTime())),
      );
      const maxDate = new Date(
        Math.max(...dateObjects.map((d) => d.getTime())),
      );

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
        `❌ Erro ao buscar plantões existentes: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }
}
