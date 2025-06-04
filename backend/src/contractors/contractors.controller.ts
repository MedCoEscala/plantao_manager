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
import { Contractor } from '@prisma/client';
import { Request } from 'express';

import { ContractorsService } from './contractors.service';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { GetContractorsFilterDto } from './dto/get-contractors-filter.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';

interface RequestWithUserContext extends Request {
  userContext: Record<string, any>;
}

@Controller('contractors')
@UseGuards(ClerkAuthGuard)
export class ContractorsController {
  private readonly logger = new Logger(ContractorsController.name);

  constructor(private readonly contractorsService: ContractorsService) {}

  @Get()
  async findAll(
    @Query() filterDto: GetContractorsFilterDto,
    @Req() req: RequestWithUserContext,
  ): Promise<Contractor[]> {
    const clerkId = req.userContext.sub;
    this.logger.log(
      `Buscando contratantes para usuário com Clerk ID: ${clerkId}`,
    );
    return this.contractorsService.findAllByUserId(clerkId, filterDto);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: RequestWithUserContext,
  ): Promise<Contractor> {
    const clerkId = req.userContext.sub;
    const contractor = await this.contractorsService.findOne(id);

    if (contractor.user.clerkId !== clerkId) {
      this.logger.warn(
        `Acesso negado: Usuário ${clerkId} tentou acessar contratante ${id} de outro usuário`,
      );
      throw new ForbiddenException(
        'Você não tem permissão para acessar este contratante',
      );
    }

    return contractor;
  }

  @Post()
  async create(
    @Body() createContractorDto: CreateContractorDto,
    @Req() req: RequestWithUserContext,
  ): Promise<Contractor> {
    const clerkId = req.userContext.sub;
    this.logger.log(
      `Criando contratante para usuário com Clerk ID: ${clerkId}`,
    );
    return this.contractorsService.create(clerkId, createContractorDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateContractorDto: UpdateContractorDto,
    @Req() req: RequestWithUserContext,
  ): Promise<Contractor> {
    const clerkId = req.userContext.sub;

    const contractor = await this.contractorsService.findOne(id);
    if (contractor.user.clerkId !== clerkId) {
      this.logger.warn(
        `Acesso negado: Usuário ${clerkId} tentou atualizar contratante ${id} de outro usuário`,
      );
      throw new ForbiddenException(
        'Você não tem permissão para atualizar este contratante',
      );
    }

    return this.contractorsService.update(id, updateContractorDto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() req: RequestWithUserContext,
  ): Promise<Contractor> {
    const clerkId = req.userContext.sub;

    const contractor = await this.contractorsService.findOne(id);
    if (contractor.user.clerkId !== clerkId) {
      this.logger.warn(
        `Acesso negado: Usuário ${clerkId} tentou excluir contratante ${id} de outro usuário`,
      );
      throw new ForbiddenException(
        'Você não tem permissão para excluir este contratante',
      );
    }

    return this.contractorsService.remove(id);
  }
}
