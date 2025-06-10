import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  ForbiddenException,
  Req,
  Headers,
} from '@nestjs/common';
import { Location } from '@prisma/client';
import { Request } from 'express';

import { CreateLocationDto } from './dto/create-locations.dto';
import { GetLocationsFilterDto } from './dto/get-locations-filter.dto';
import { UpdateLocationDto } from './dto/update-locations.dto';
import { LocationsService } from './locations.service';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';

interface RequestWithUserContext extends Request {
  userContext: Record<string, any>;
}

// Cache simples em memória (60 segundos)
const cache = new Map();
const CACHE_TTL = 60000; // 60 segundos

@Controller('locations')
@UseGuards(ClerkAuthGuard)
export class LocationsController {
  private readonly logger = new Logger(LocationsController.name);

  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  async findAll(
    @Query() filterDto: GetLocationsFilterDto,
    @Req() req: RequestWithUserContext,
    @Headers('cache-control') cacheControl?: string,
  ): Promise<Location[]> {
    const clerkId = req.userContext.sub;

    // Verificar se cliente quer pular cache
    const skipCache = cacheControl === 'no-cache';

    // Chave do cache baseada no usuário e filtros
    const cacheKey = `locations:${clerkId}:${JSON.stringify(filterDto)}`;

    // Verificar cache se não for explicitamente pulado
    if (!skipCache) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        this.logger.debug(`Cache hit para usuário ${clerkId}`);
        return cached.data;
      }
    }

    this.logger.log(`Buscando locais para usuário com Clerk ID: ${clerkId}`);
    const locations = await this.locationsService.findAllByUserId(
      clerkId,
      filterDto,
    );

    // Armazenar no cache
    cache.set(cacheKey, {
      data: locations,
      timestamp: Date.now(),
    });

    // Limpar cache antigo periodicamente
    if (cache.size > 100) {
      this.clearExpiredCache();
    }

    return locations;
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: RequestWithUserContext,
  ): Promise<Location> {
    const clerkId = req.userContext.sub;
    const location = await this.locationsService.findOne(id);

    if (location.user.clerkId !== clerkId) {
      this.logger.warn(
        `Acesso negado: Usuário ${clerkId} tentou acessar local ${id} de outro usuário`,
      );
      throw new ForbiddenException(
        'Você não tem permissão para acessar este local',
      );
    }

    return location;
  }

  @Post()
  async create(
    @Body() createLocationDto: CreateLocationDto,
    @Req() req: RequestWithUserContext,
  ): Promise<Location> {
    const clerkId = req.userContext.sub;
    this.logger.log(`Criando local para usuário com Clerk ID: ${clerkId}`);

    const result = await this.locationsService.create(
      clerkId,
      createLocationDto,
    );

    // Limpar cache do usuário após criação
    this.clearUserCache(clerkId);

    return result;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
    @Req() req: RequestWithUserContext,
  ): Promise<Location> {
    const clerkId = req.userContext.sub;

    const location = await this.locationsService.findOne(id);
    if (location.user.clerkId !== clerkId) {
      this.logger.warn(
        `Acesso negado: Usuário ${clerkId} tentou atualizar local ${id} de outro usuário`,
      );
      throw new ForbiddenException(
        'Você não tem permissão para atualizar este local',
      );
    }

    const result = await this.locationsService.update(id, updateLocationDto);

    // Limpar cache do usuário após atualização
    this.clearUserCache(clerkId);

    return result;
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() req: RequestWithUserContext,
  ): Promise<Location> {
    const clerkId = req.userContext.sub;

    const location = await this.locationsService.findOne(id);
    if (location.user.clerkId !== clerkId) {
      this.logger.warn(
        `Acesso negado: Usuário ${clerkId} tentou excluir local ${id} de outro usuário`,
      );
      throw new ForbiddenException(
        'Você não tem permissão para excluir este local',
      );
    }

    const result = await this.locationsService.remove(id);

    // Limpar cache do usuário após remoção
    this.clearUserCache(clerkId);

    return result;
  }

  private clearUserCache(clerkId: string) {
    // Remove todas as entradas de cache do usuário
    for (const [key] of cache) {
      if (key.startsWith(`locations:${clerkId}:`)) {
        cache.delete(key);
      }
    }
  }

  private clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of cache) {
      if (now - value.timestamp > CACHE_TTL) {
        cache.delete(key);
      }
    }
  }
}
