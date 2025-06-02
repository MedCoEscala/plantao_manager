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
  NotFoundException,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import { ShiftsService, BatchCreateResult } from './shifts.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { GetShiftsFilterDto } from './dto/get-shifts-filter.dto';
import { CreateShiftsBatchDto } from './dto/create-shifts-batch.dto';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { Request } from 'express';
import { Plantao } from '@prisma/client';

interface RequestWithUserContext extends Request {
  userContext: Record<string, any>;
}

@Controller('shifts')
@UseGuards(ClerkAuthGuard)
export class ShiftsController {
  private readonly logger = new Logger(ShiftsController.name);

  constructor(private readonly shiftsService: ShiftsService) {}

  @Get()
  async findAll(
    @Query() filterDto: GetShiftsFilterDto,
    @Req() req: RequestWithUserContext,
  ): Promise<Plantao[]> {
    const clerkId = req.userContext.sub;
    this.logger.log(`Buscando plantões para usuário com Clerk ID: ${clerkId}`);
    return this.shiftsService.findAllByUserId(clerkId, filterDto);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: RequestWithUserContext,
  ): Promise<Plantao> {
    const clerkId = req.userContext.sub;
    const shift = await this.shiftsService.findOne(id);

    if (shift.user.clerkId !== clerkId) {
      this.logger.warn(
        `Acesso negado: Usuário ${clerkId} tentou acessar plantão ${id} de outro usuário`,
      );
      throw new ForbiddenException(
        'Você não tem permissão para acessar este plantão',
      );
    }

    return shift;
  }

  @Post()
  async create(
    @Body() createShiftDto: CreateShiftDto,
    @Req() req: RequestWithUserContext,
  ): Promise<Plantao> {
    const clerkId = req.userContext.sub;
    this.logger.log(`Criando plantão para usuário com Clerk ID: ${clerkId}`);
    return this.shiftsService.create(clerkId, createShiftDto);
  }

  @Post('batch')
  async createBatch(
    @Body() createShiftsBatchDto: CreateShiftsBatchDto,
    @Req() req: RequestWithUserContext,
  ): Promise<BatchCreateResult> {
    const clerkId = req.userContext.sub;
    this.logger.log(
      `Criando ${createShiftsBatchDto.shifts.length} plantões em lote para usuário com Clerk ID: ${clerkId}`,
    );
    return this.shiftsService.createBatch(clerkId, createShiftsBatchDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateShiftDto: UpdateShiftDto,
    @Req() req: RequestWithUserContext,
  ): Promise<Plantao> {
    const clerkId = req.userContext.sub;

    const shift = await this.shiftsService.findOne(id);
    if (shift.user.clerkId !== clerkId) {
      this.logger.warn(
        `Acesso negado: Usuário ${clerkId} tentou atualizar plantão ${id} de outro usuário`,
      );
      throw new ForbiddenException(
        'Você não tem permissão para atualizar este plantão',
      );
    }

    return this.shiftsService.update(id, updateShiftDto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() req: RequestWithUserContext,
  ): Promise<Plantao> {
    const clerkId = req.userContext.sub;

    const shift = await this.shiftsService.findOne(id);
    if (shift.user.clerkId !== clerkId) {
      this.logger.warn(
        `Acesso negado: Usuário ${clerkId} tentou excluir plantão ${id} de outro usuário`,
      );
      throw new ForbiddenException(
        'Você não tem permissão para excluir este plantão',
      );
    }

    return this.shiftsService.remove(id);
  }
}
