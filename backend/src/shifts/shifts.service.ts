import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Plantao, Prisma } from '@prisma/client';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { GetShiftsFilterDto } from './dto/get-shifts-filter.dto';
import {
  CreateShiftsBatchDto,
  CreateShiftBatchItemDto,
} from './dto/create-shifts-batch.dto';

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
        const startDate = new Date(filterDto.startDate);
        const endDate = new Date(filterDto.endDate);

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
        where.date = {
          gte: new Date(filterDto.startDate),
        };
      } else if (filterDto.endDate) {
        where.date = {
          lte: new Date(filterDto.endDate),
        };
      }

      if (filterDto.locationId) {
        where.locationId = filterDto.locationId;
      }

      if (filterDto.contractorId) {
        where.contractorId = filterDto.contractorId;
      }

      this.logger.log(`Buscando plantões para userId: ${user.id} com filtros`);

      return this.prisma.plantao.findMany({
        where,
        include: {
          location: true,
          contractor: true,
        },
        orderBy: {
          date: 'asc',
        },
      });
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

      return shift;
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

      // Validar formato de hora (HH:MM)
      const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
      if (
        !timeRegex.test(createShiftDto.startTime) ||
        !timeRegex.test(createShiftDto.endTime)
      ) {
        throw new BadRequestException(
          'Os horários devem estar no formato HH:MM',
        );
      }

      // Preparar data base para combinar com horários
      const shiftDate = new Date(createShiftDto.date);

      // Criar objetos Date para início e fim
      const startTime = new Date(shiftDate);
      const endTime = new Date(shiftDate);

      const [startHour, startMinute] = createShiftDto.startTime
        .split(':')
        .map(Number);
      const [endHour, endMinute] = createShiftDto.endTime
        .split(':')
        .map(Number);

      startTime.setHours(startHour, startMinute, 0, 0);
      endTime.setHours(endHour, endMinute, 0, 0);

      // Se o horário de término for antes do início, adiciona um dia ao término
      // Isso lida com plantões noturnos (ex: 23:00 às 01:00)
      if (endTime <= startTime) {
        endTime.setDate(endTime.getDate() + 1);
      }

      const timeInfo = `Horário: ${createShiftDto.startTime} - ${createShiftDto.endTime}`;
      const notes = createShiftDto.notes
        ? `${createShiftDto.notes}\n${timeInfo}`
        : timeInfo;

      const locationId =
        createShiftDto.locationId && createShiftDto.locationId.trim() !== ''
          ? createShiftDto.locationId
          : undefined;

      const contractorId =
        createShiftDto.contractorId && createShiftDto.contractorId.trim() !== ''
          ? createShiftDto.contractorId
          : undefined;

      return this.prisma.plantao.create({
        data: {
          date: shiftDate,
          value: createShiftDto.value,
          startTime: startTime,
          endTime: endTime,
          isFixed: createShiftDto.isFixed || false,
          paymentType: createShiftDto.paymentType,
          notes: notes,
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
    } catch (error) {
      this.logger.error(`Erro ao criar plantão: ${error.message}`, error.stack);

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Erro ao criar plantão: ${error.message}`,
      );
    }
  }

  async update(id: string, updateShiftDto: UpdateShiftDto): Promise<Plantao> {
    try {
      const existingShift = await this.findOne(id);

      const updateData: Prisma.PlantaoUpdateInput = {};

      if (updateShiftDto.date !== undefined) {
        updateData.date = new Date(updateShiftDto.date);
      }

      if (
        updateShiftDto.startTime !== undefined ||
        updateShiftDto.endTime !== undefined
      ) {
        // Obter a data base atual ou a nova data se fornecida
        const shiftDate = updateShiftDto.date
          ? new Date(updateShiftDto.date)
          : existingShift.date;

        // Atualizar horário de início se fornecido
        if (updateShiftDto.startTime !== undefined) {
          const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
          if (!timeRegex.test(updateShiftDto.startTime)) {
            throw new BadRequestException(
              'O horário de início deve estar no formato HH:MM',
            );
          }

          const startTime = new Date(shiftDate);
          const [startHour, startMinute] = updateShiftDto.startTime
            .split(':')
            .map(Number);
          startTime.setHours(startHour, startMinute, 0, 0);

          updateData.startTime = startTime;
        }

        // Atualizar horário de término se fornecido
        if (updateShiftDto.endTime !== undefined) {
          const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
          if (!timeRegex.test(updateShiftDto.endTime)) {
            throw new BadRequestException(
              'O horário de término deve estar no formato HH:MM',
            );
          }

          const endTime = new Date(shiftDate);
          const [endHour, endMinute] = updateShiftDto.endTime
            .split(':')
            .map(Number);
          endTime.setHours(endHour, endMinute, 0, 0);

          // Se já tivermos um novo horário de início
          if (updateData.startTime) {
            // Se o fim for antes do início, adiciona um dia
            if (endTime <= updateData.startTime) {
              endTime.setDate(endTime.getDate() + 1);
            }
          }
          // Usar o horário de início existente para comparação
          else if (existingShift.startTime) {
            const startTime = new Date(existingShift.startTime);

            // Ajustar startTime para ter a mesma data base que endTime para comparação
            startTime.setFullYear(
              endTime.getFullYear(),
              endTime.getMonth(),
              endTime.getDate(),
            );

            // Se o fim for antes do início, adiciona um dia
            if (endTime <= startTime) {
              endTime.setDate(endTime.getDate() + 1);
            }
          }

          updateData.endTime = endTime;
        }

        // Verificação final se ambos startTime e endTime estiverem sendo atualizados
        if (updateData.startTime && updateData.endTime) {
          if (updateData.endTime <= updateData.startTime) {
            (updateData.endTime as Date).setDate(
              (updateData.endTime as Date).getDate() + 1,
            );
          }
        }
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
        updateData.notes = updateShiftDto.notes;
      }

      if (updateShiftDto.locationId !== undefined) {
        if (
          updateShiftDto.locationId &&
          updateShiftDto.locationId.trim() !== ''
        ) {
          updateData.location = {
            connect: { id: updateShiftDto.locationId },
          };
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

      return this.prisma.plantao.update({
        where: { id },
        data: updateData,
        include: {
          location: true,
          contractor: true,
        },
      });
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar plantão ${id}: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Erro ao atualizar plantão: ${error.message}`,
      );
    }
  }

  async remove(id: string): Promise<Plantao> {
    try {
      await this.findOne(id);

      return this.prisma.plantao.delete({
        where: { id },
        include: {
          location: true,
          contractor: true,
        },
      });
    } catch (error) {
      this.logger.error(
        `Erro ao remover plantão ${id}: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Erro ao remover plantão: ${error.message}`,
      );
    }
  }

  async createBatch(
    clerkId: string,
    createShiftsBatchDto: CreateShiftsBatchDto,
  ): Promise<BatchCreateResult> {
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

      const result: BatchCreateResult = {
        created: [],
        skipped: [],
        failed: [],
        summary: {
          total: createShiftsBatchDto.shifts.length,
          created: 0,
          skipped: 0,
          failed: 0,
        },
      };

      // Se skipConflicts for true, verificar conflitos existentes
      const existingShifts = createShiftsBatchDto.skipConflicts
        ? await this.findExistingShifts(
            user.id,
            createShiftsBatchDto.shifts.map((s) => s.date),
          )
        : [];

      for (const shiftData of createShiftsBatchDto.shifts) {
        try {
          // Verificar se já existe plantão na mesma data
          if (createShiftsBatchDto.skipConflicts) {
            const existingShift = existingShifts.find(
              (existing) =>
                existing.date.toISOString().split('T')[0] === shiftData.date,
            );

            if (existingShift) {
              result.skipped.push(shiftData);
              result.summary.skipped++;
              continue;
            }
          }

          // Validar formato de hora
          const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
          if (
            !timeRegex.test(shiftData.startTime) ||
            !timeRegex.test(shiftData.endTime)
          ) {
            throw new BadRequestException(
              `Os horários devem estar no formato HH:MM`,
            );
          }

          // Preparar data e horários
          const shiftDate = new Date(shiftData.date);
          const startTime = new Date(shiftDate);
          const endTime = new Date(shiftDate);

          const [startHour, startMinute] = shiftData.startTime
            .split(':')
            .map(Number);
          const [endHour, endMinute] = shiftData.endTime.split(':').map(Number);

          startTime.setHours(startHour, startMinute, 0, 0);
          endTime.setHours(endHour, endMinute, 0, 0);

          // Se o horário de término for antes do início, adiciona um dia
          if (endTime <= startTime) {
            endTime.setDate(endTime.getDate() + 1);
          }

          // Preparar dados para criação
          const timeInfo = `Horário: ${shiftData.startTime} - ${shiftData.endTime}`;
          const notes = shiftData.notes
            ? `${shiftData.notes}\n${timeInfo}`
            : timeInfo;

          const locationId =
            shiftData.locationId && shiftData.locationId.trim() !== ''
              ? shiftData.locationId
              : undefined;

          const contractorId =
            shiftData.contractorId && shiftData.contractorId.trim() !== ''
              ? shiftData.contractorId
              : undefined;

          // Criar plantão
          const createdShift = await this.prisma.plantao.create({
            data: {
              date: shiftDate,
              value: shiftData.value,
              startTime: startTime,
              endTime: endTime,
              isFixed: shiftData.isFixed || false,
              paymentType: shiftData.paymentType,
              notes: notes,
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

          result.created.push(createdShift);
          result.summary.created++;
        } catch (error) {
          this.logger.error(
            `Erro ao criar plantão para data ${shiftData.date}: ${error.message}`,
          );

          result.failed.push({
            shift: shiftData,
            error: error.message || 'Erro desconhecido',
          });
          result.summary.failed++;

          // Se continueOnError for false, parar o processo
          if (!createShiftsBatchDto.continueOnError) {
            throw error;
          }
        }
      }

      this.logger.log(
        `Criação em lote concluída. Criados: ${result.summary.created}, Pulados: ${result.summary.skipped}, Falharam: ${result.summary.failed}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Erro na criação em lote de plantões: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Erro na criação em lote: ${error.message}`,
      );
    }
  }

  private async findExistingShifts(
    userId: string,
    dates: string[],
  ): Promise<{ id: string; date: Date; startTime: Date; endTime: Date }[]> {
    const dateObjects = dates.map((date) => new Date(date));
    const minDate = new Date(Math.min(...dateObjects.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dateObjects.map((d) => d.getTime())));

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
  }
}
