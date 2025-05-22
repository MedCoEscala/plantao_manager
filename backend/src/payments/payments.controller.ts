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
  NotFoundException,
} from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { GetPaymentsFilterDto } from './dto/getPaymentsFilter.dto';

import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { Request } from 'express';
import { Payment } from '@prisma/client';
import { PaymentsService } from './payments.service';

interface RequestWithUserContext extends Request {
  userContext: Record<string, any>;
}

@Controller('payments')
@UseGuards(ClerkAuthGuard)
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  async findAll(
    @Query() filterDto: GetPaymentsFilterDto,
    @Req() req: RequestWithUserContext,
  ): Promise<any[]> {
    const clerkId = req.userContext.sub;
    this.logger.log(
      `Buscando pagamentos para usuário com Clerk ID: ${clerkId}`,
    );
    return this.paymentsService.findAllByUserId(clerkId, filterDto);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: RequestWithUserContext,
  ): Promise<Payment> {
    const clerkId = req.userContext.sub;
    const payment = await this.paymentsService.findOne(id);

    if (payment.plantao.user.clerkId !== clerkId) {
      this.logger.warn(
        `Acesso negado: Usuário ${clerkId} tentou acessar pagamento ${id} de outro usuário`,
      );
      throw new ForbiddenException(
        'Você não tem permissão para acessar este pagamento',
      );
    }

    return payment;
  }

  @Post()
  async create(
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() req: RequestWithUserContext,
  ): Promise<Payment> {
    const clerkId = req.userContext.sub;
    this.logger.log(`Criando pagamento para usuário com Clerk ID: ${clerkId}`);
    return this.paymentsService.create(clerkId, createPaymentDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @Req() req: RequestWithUserContext,
  ): Promise<Payment> {
    const clerkId = req.userContext.sub;

    const payment = await this.paymentsService.findOne(id);
    if (payment.plantao.user.clerkId !== clerkId) {
      this.logger.warn(
        `Acesso negado: Usuário ${clerkId} tentou atualizar pagamento ${id} de outro usuário`,
      );
      throw new ForbiddenException(
        'Você não tem permissão para atualizar este pagamento',
      );
    }

    return this.paymentsService.update(id, updatePaymentDto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() req: RequestWithUserContext,
  ): Promise<Payment> {
    const clerkId = req.userContext.sub;

    const payment = await this.paymentsService.findOne(id);
    if (payment.plantao.user.clerkId !== clerkId) {
      this.logger.warn(
        `Acesso negado: Usuário ${clerkId} tentou excluir pagamento ${id} de outro usuário`,
      );
      throw new ForbiddenException(
        'Você não tem permissão para excluir este pagamento',
      );
    }

    return this.paymentsService.remove(id);
  }
}
