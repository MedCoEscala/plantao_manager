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
} from '@nestjs/common';
import { GetLocationsFilterDto } from './dto/get-locations-filter.dto';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { Request } from 'express';
import { Location } from '@prisma/client';
import { CreateLocationDto } from './dto/create-locations.dto';
import { UpdateLocationDto } from './dto/update-locations.dto';
import { LocationsService } from './locations.service';
interface RequestWithUserContext extends Request {
  userContext: Record<string, any>;
}

@Controller('locations')
@UseGuards(ClerkAuthGuard)
export class LocationsController {
  private readonly logger = new Logger(LocationsController.name);

  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  async findAll(
    @Query() filterDto: GetLocationsFilterDto,
    @Req() req: RequestWithUserContext,
  ): Promise<Location[]> {
    const clerkId = req.userContext.sub;
    this.logger.log(`Buscando locais para usuário com Clerk ID: ${clerkId}`);
    return this.locationsService.findAllByUserId(clerkId, filterDto);
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
    return this.locationsService.create(clerkId, createLocationDto);
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

    return this.locationsService.update(id, updateLocationDto);
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

    return this.locationsService.remove(id);
  }
}
