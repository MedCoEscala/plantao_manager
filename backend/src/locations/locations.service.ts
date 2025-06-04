import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Location, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateLocationDto } from './dto/create-locations.dto';
import { GetLocationsFilterDto } from './dto/get-locations-filter.dto';
import { UpdateLocationDto } from './dto/update-locations.dto';

@Injectable()
export class LocationsService {
  private readonly logger = new Logger(LocationsService.name);

  constructor(private prisma: PrismaService) {}

  async findAllByUserId(
    clerkId: string,
    filterDto: GetLocationsFilterDto,
  ): Promise<Location[]> {
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

      const where: Prisma.LocationWhereInput = {
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
            address: {
              contains: filterDto.searchTerm,
              mode: 'insensitive',
            },
          },
        ];
      }

      this.logger.log(`Buscando locais para userId: ${user.id} com filtros`);

      return this.prisma.location.findMany({
        where,
        orderBy: {
          name: 'asc',
        },
      });
    } catch (error) {
      this.logger.error(`Erro ao buscar locais: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string): Promise<Location & { user: { clerkId: string } }> {
    try {
      const location = await this.prisma.location.findUnique({
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

      if (!location) {
        throw new NotFoundException(`Local com ID ${id} não encontrado`);
      }

      return location;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar local ${id}: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Erro ao buscar local: ${error.message}`,
      );
    }
  }

  async create(
    clerkId: string,
    createLocationDto: CreateLocationDto,
  ): Promise<Location> {
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

      // Preparar dados de criação com campos opcionais
      const locationData: any = {
        name: createLocationDto.name,
        color: createLocationDto.color,
        userId: user.id,
      };

      // Adicionar campos opcionais apenas se preenchidos
      if (createLocationDto.address) {
        locationData.address = createLocationDto.address;
      }

      if (createLocationDto.phone) {
        locationData.phone = createLocationDto.phone.toString();
      }

      return this.prisma.location.create({
        data: locationData,
      });
    } catch (error) {
      this.logger.error(`Erro ao criar local: ${error.message}`, error.stack);

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Erro ao criar local: ${error.message}`,
      );
    }
  }

  async update(
    id: string,
    updateLocationDto: UpdateLocationDto,
  ): Promise<Location> {
    try {
      await this.findOne(id);

      // Preparar dados de atualização
      const updateData: any = { ...updateLocationDto };

      // Converter phone para string se fornecido
      if (updateLocationDto.phone) {
        updateData.phone = updateLocationDto.phone.toString();
      }

      return this.prisma.location.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar local ${id}: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Erro ao atualizar local: ${error.message}`,
      );
    }
  }

  async remove(id: string): Promise<Location> {
    try {
      await this.findOne(id);

      return this.prisma.location.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(
        `Erro ao remover local ${id}: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Erro ao remover local: ${error.message}`,
      );
    }
  }
}
