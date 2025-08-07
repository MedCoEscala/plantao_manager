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
import { ShiftTemplate } from '@prisma/client';
import { Request } from 'express';

import { ShiftTemplatesService } from './shift-templates.service';
import { CreateShiftTemplateDto } from './dto/create-shift-template.dto';
import { UpdateShiftTemplateDto } from './dto/update-shift-template.dto';
import { GetShiftTemplatesFilterDto } from './dto/get-shift-templates-filter.dto';
import { CreateShiftFromTemplateDto } from './dto/create-shift-from-template.dto';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';

interface RequestWithUserContext extends Request {
  userContext: Record<string, any>;
}

@Controller('shift-templates')
@UseGuards(ClerkAuthGuard)
export class ShiftTemplatesController {
  private readonly logger = new Logger(ShiftTemplatesController.name);

  constructor(private readonly shiftTemplatesService: ShiftTemplatesService) {}

  @Get()
  async findAll(
    @Query() filterDto: GetShiftTemplatesFilterDto,
    @Req() req: RequestWithUserContext,
  ): Promise<ShiftTemplate[]> {
    const clerkId = req.userContext.sub;
    this.logger.log(
      `Buscando modelos de plantão para usuário com Clerk ID: ${clerkId}`,
    );
    return this.shiftTemplatesService.findAllByUserId(clerkId, filterDto);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: RequestWithUserContext,
  ): Promise<ShiftTemplate> {
    const clerkId = req.userContext.sub;
    const template = await this.shiftTemplatesService.findOne(id);

    if (template.user.clerkId !== clerkId) {
      this.logger.warn(
        `Acesso negado: Usuário ${clerkId} tentou acessar modelo ${id} de outro usuário`,
      );
      throw new ForbiddenException(
        'Você não tem permissão para acessar este modelo',
      );
    }

    return template;
  }

  @Post()
  async create(
    @Body() createTemplateDto: CreateShiftTemplateDto,
    @Req() req: RequestWithUserContext,
  ): Promise<ShiftTemplate> {
    const clerkId = req.userContext.sub;
    this.logger.log(
      `Criando modelo de plantão para usuário com Clerk ID: ${clerkId}`,
    );
    return this.shiftTemplatesService.create(clerkId, createTemplateDto);
  }

  @Post(':id/create-shift')
  async createShiftFromTemplate(
    @Param('id') templateId: string,
    @Body()
    createFromTemplateDto: Omit<CreateShiftFromTemplateDto, 'templateId'>,
    @Req() req: RequestWithUserContext,
  ): Promise<any> {
    const clerkId = req.userContext.sub;

    const fullDto: CreateShiftFromTemplateDto = {
      ...createFromTemplateDto,
      templateId,
    };

    this.logger.log(
      `Criando plantão a partir do modelo ${templateId} para usuário ${clerkId}`,
    );

    return this.shiftTemplatesService.createShiftFromTemplate(clerkId, fullDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateShiftTemplateDto,
    @Req() req: RequestWithUserContext,
  ): Promise<ShiftTemplate> {
    const clerkId = req.userContext.sub;

    const template = await this.shiftTemplatesService.findOne(id);
    if (template.user.clerkId !== clerkId) {
      this.logger.warn(
        `Acesso negado: Usuário ${clerkId} tentou atualizar modelo ${id} de outro usuário`,
      );
      throw new ForbiddenException(
        'Você não tem permissão para atualizar este modelo',
      );
    }

    return this.shiftTemplatesService.update(id, updateTemplateDto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() req: RequestWithUserContext,
  ): Promise<ShiftTemplate> {
    const clerkId = req.userContext.sub;

    const template = await this.shiftTemplatesService.findOne(id);
    if (template.user.clerkId !== clerkId) {
      this.logger.warn(
        `Acesso negado: Usuário ${clerkId} tentou excluir modelo ${id} de outro usuário`,
      );
      throw new ForbiddenException(
        'Você não tem permissão para excluir este modelo',
      );
    }

    return this.shiftTemplatesService.remove(id);
  }
}
