import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  Logger,
  Req,
} from '@nestjs/common';
import { CNPJService } from './cnpj.service';
import { CreateCNPJDto } from './dto/create-cnpj.dto';
import { UpdateCNPJDto } from './dto/update-cnpj.dto';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { Request } from 'express';
import { CNPJData } from '@prisma/client';

interface RequestWithUserContext extends Request {
  userContext: Record<string, any>;
}

@Controller('cnpj')
@UseGuards(ClerkAuthGuard)
export class CNPJController {
  private readonly logger = new Logger(CNPJController.name);

  constructor(private readonly cnpjService: CNPJService) {}

  @Get()
  async findMyCNPJ(
    @Req() req: RequestWithUserContext,
  ): Promise<CNPJData | null> {
    const clerkId = req.userContext.sub;
    this.logger.log(
      `Buscando dados CNPJ para usuário com Clerk ID: ${clerkId}`,
    );
    return this.cnpjService.findByUserId(clerkId);
  }

  @Post()
  async create(
    @Body() createCNPJDto: CreateCNPJDto,
    @Req() req: RequestWithUserContext,
  ): Promise<CNPJData> {
    const clerkId = req.userContext.sub;
    this.logger.log(`Criando dados CNPJ para usuário com Clerk ID: ${clerkId}`);
    return this.cnpjService.createOrUpdate(clerkId, createCNPJDto);
  }

  @Put()
  async update(
    @Body() updateCNPJDto: UpdateCNPJDto,
    @Req() req: RequestWithUserContext,
  ): Promise<CNPJData> {
    const clerkId = req.userContext.sub;
    this.logger.log(
      `Atualizando dados CNPJ para usuário com Clerk ID: ${clerkId}`,
    );
    return this.cnpjService.createOrUpdate(clerkId, updateCNPJDto);
  }

  @Delete()
  async remove(@Req() req: RequestWithUserContext): Promise<CNPJData> {
    const clerkId = req.userContext.sub;
    this.logger.log(
      `Excluindo dados CNPJ para usuário com Clerk ID: ${clerkId}`,
    );
    return this.cnpjService.delete(clerkId);
  }
}
