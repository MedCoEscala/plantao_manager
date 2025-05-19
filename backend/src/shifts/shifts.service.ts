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

      const startParts = createShiftDto.startTime.split(':');
      const endParts = createShiftDto.endTime.split(':');

      const startMinutes =
        parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
      const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

      if (startMinutes >= endMinutes) {
        throw new BadRequestException(
          'O horário de término deve ser posterior ao horário de início',
        );
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
          date: new Date(createShiftDto.date),
          value: createShiftDto.value,
          isFixed: createShiftDto.isFixed || false,
          paymentType: createShiftDto.paymentType,
          notes: notes,
          userId: user.id,
          locationId: locationId,
          contractorId: contractorId,
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
      await this.findOne(id);

      const updateData: Prisma.PlantaoUpdateInput = {};

      if (updateShiftDto.date !== undefined) {
        updateData.date = new Date(updateShiftDto.date);
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
}
