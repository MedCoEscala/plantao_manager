import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Payment, Prisma } from '@prisma/client';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { GetPaymentsFilterDto } from './dto/getPaymentsFilter.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private prisma: PrismaService) {}

  async findAllByUserId(
    clerkId: string,
    filterDto: GetPaymentsFilterDto,
  ): Promise<any[]> {
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

      const where: Prisma.PaymentWhereInput = {
        plantao: {
          userId: user.id,
          ...(filterDto.startDate &&
            filterDto.endDate && {
              date: {
                gte: new Date(filterDto.startDate),
                lte: new Date(filterDto.endDate),
              },
            }),
        },
      };

      this.logger.log(`Buscando pagamentos para userId: ${user.id}`);

      const payments = await this.prisma.payment.findMany({
        where,
        include: {
          plantao: {
            include: {
              location: true,
              contractor: true,
            },
          },
        },
        orderBy: {
          plantao: {
            date: 'asc',
          },
        },
      });

      // Transformar dados para o formato esperado pela UI
      return payments.map((payment) => ({
        id: payment.id,
        description: payment.plantao?.location?.name
          ? `Plantão ${payment.plantao.location.name}`
          : `Pagamento de plantão`,
        amount: payment.plantao?.value || 0,
        date: payment.paymentDate || payment.createdAt,
        status: payment.paid ? 'completed' : 'pending',
        method: payment.method || 'Não informado',
        shiftTitle: `Plantão ${new Date(payment.plantao?.date || '').toLocaleDateString()}`,
        locationName: payment.plantao?.location?.name || 'Local não informado',
        locationColor: payment.plantao?.location?.color || '#64748b',
        shiftId: payment.plantao?.id,
        plantao: payment.plantao,
        paid: payment.paid,
      }));
    } catch (error) {
      this.logger.error(
        `Erro ao buscar pagamentos: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findOne(id: string): Promise<any> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id },
        include: {
          plantao: {
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
          },
        },
      });

      if (!payment) {
        throw new NotFoundException(`Pagamento com ID ${id} não encontrado`);
      }

      return payment;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar pagamento ${id}: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Erro ao buscar pagamento: ${error.message}`,
      );
    }
  }

  async create(
    clerkId: string,
    createPaymentDto: CreatePaymentDto,
  ): Promise<Payment> {
    try {
      // Verificar se o plantão existe e pertence ao usuário
      const plantao = await this.prisma.plantao.findUnique({
        where: { id: createPaymentDto.shiftId },
        include: {
          user: {
            select: {
              clerkId: true,
            },
          },
        },
      });

      if (!plantao) {
        throw new NotFoundException(
          `Plantão com ID ${createPaymentDto.shiftId} não encontrado`,
        );
      }

      if (plantao.user.clerkId !== clerkId) {
        throw new ForbiddenException(
          'Você não tem permissão para criar pagamento para este plantão',
        );
      }

      // Verificar se já existe pagamento para este plantão
      const existingPayment = await this.prisma.payment.findFirst({
        where: { plantaoId: createPaymentDto.shiftId },
      });

      if (existingPayment) {
        throw new BadRequestException(
          'Já existe um pagamento registrado para este plantão',
        );
      }

      // Criar o pagamento
      return this.prisma.payment.create({
        data: {
          plantaoId: createPaymentDto.shiftId,
          paymentDate: createPaymentDto.paymentDate
            ? new Date(createPaymentDto.paymentDate)
            : null,
          paid: createPaymentDto.paid,
          notes: createPaymentDto.notes,
          method: createPaymentDto.method,
        },
        include: {
          plantao: {
            include: {
              location: true,
              contractor: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Erro ao criar pagamento: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Erro ao criar pagamento: ${error.message}`,
      );
    }
  }

  async update(
    id: string,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment> {
    try {
      await this.findOne(id);

      const updateData: Prisma.PaymentUpdateInput = {};

      if (updatePaymentDto.paymentDate !== undefined) {
        updateData.paymentDate = updatePaymentDto.paymentDate
          ? new Date(updatePaymentDto.paymentDate)
          : null;
      }

      if (updatePaymentDto.paid !== undefined) {
        updateData.paid = updatePaymentDto.paid;
      }

      if (updatePaymentDto.notes !== undefined) {
        updateData.notes = updatePaymentDto.notes;
      }

      if (updatePaymentDto.method !== undefined) {
        updateData.method = updatePaymentDto.method;
      }

      return this.prisma.payment.update({
        where: { id },
        data: updateData,
        include: {
          plantao: {
            include: {
              location: true,
              contractor: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar pagamento ${id}: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Erro ao atualizar pagamento: ${error.message}`,
      );
    }
  }

  async remove(id: string): Promise<Payment> {
    try {
      await this.findOne(id);

      return this.prisma.payment.delete({
        where: { id },
        include: {
          plantao: {
            include: {
              location: true,
              contractor: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Erro ao remover pagamento ${id}: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Erro ao remover pagamento: ${error.message}`,
      );
    }
  }
}
