import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { User, Prisma } from '@prisma/client';

import { UpdateProfileDto } from './users.controller';
import { clerkClient } from '../config/clerk.config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async syncUserWithClerk(userContext: any): Promise<User> {
    const clerkId = userContext.sub;

    if (!clerkId) {
      throw new BadRequestException('Clerk ID não encontrado no contexto.');
    }

    // Obter email para autenticação (apenas do Clerk)
    const primaryEmailAddress =
      userContext.email ||
      userContext.email_address ||
      userContext.primary_email_address ||
      userContext.emailAddress;

    this.logger.log('Sincronizando usuário:', {
      clerkId,
      hasEmail: !!primaryEmailAddress,
    });

    if (!primaryEmailAddress) {
      // Última tentativa: buscar email do Clerk diretamente
      try {
        const clerkUser = await clerkClient.users.getUser(clerkId);
        let emailFromClerk = '';

        if (clerkUser.emailAddresses && clerkUser.primaryEmailAddressId) {
          const emailObj = clerkUser.emailAddresses.find(
            (e: any) => e.id === clerkUser.primaryEmailAddressId,
          );
          emailFromClerk = emailObj?.emailAddress || '';
        }

        if (
          !emailFromClerk &&
          (clerkUser as any).primaryEmailAddress?.emailAddress
        ) {
          emailFromClerk = (clerkUser as any).primaryEmailAddress.emailAddress;
        }

        if (!emailFromClerk) {
          throw new BadRequestException(
            'Email não encontrado no Clerk. Impossível sincronizar usuário.',
          );
        }

        this.logger.log(`Email obtido do Clerk: ${emailFromClerk}`);
        return this.findOrCreateUser(clerkId, emailFromClerk);
      } catch (error) {
        this.logger.error('Erro ao buscar email do Clerk:', error);
        throw new BadRequestException(
          'Não foi possível obter email para sincronização.',
        );
      }
    }

    return this.findOrCreateUser(clerkId, primaryEmailAddress);
  }

  private async findOrCreateUser(
    clerkId: string,
    email: string,
  ): Promise<User> {
    // Tentar encontrar usuário existente
    let user = await this.prisma.user.findFirst({
      where: { clerkId },
    });

    if (user) {
      // Usuário existe: apenas atualizar email se necessário
      if (user.email !== email) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            email,
            updatedAt: new Date(),
          },
        });
        this.logger.log(`Email do usuário atualizado: ${user.id}`);
      } else {
        this.logger.log(`Usuário já existe: ${user.id}`);
      }
      return user;
    } else {
      // Criar novo usuário com dados mínimos (Clerk apenas fornece autenticação)
      const emailUsername = email.split('@')[0];
      const fallbackName =
        emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);

      user = await this.prisma.user.create({
        data: {
          clerkId,
          email,
          name: fallbackName, // Nome temporário baseado no email
          // Outros campos serão preenchidos pelo usuário posteriormente
        },
      });

      this.logger.log(`Novo usuário criado: ${user.id} (${user.email})`);
      return user;
    }
  }

  async findOneByClerkId(clerkId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      throw new NotFoundException(
        `Usuário com Clerk ID ${clerkId} não encontrado`,
      );
    }

    return user;
  }

  async updateProfileByClerkId(
    clerkId: string,
    updateData: any,
  ): Promise<User> {
    const user = await this.findOneByClerkId(clerkId);

    const processedData: Prisma.UserUpdateInput = {};

    if (updateData.firstName !== undefined) {
      processedData.firstName = updateData.firstName?.trim() || null;
    }

    if (updateData.lastName !== undefined) {
      processedData.lastName = updateData.lastName?.trim() || null;
    }

    if (updateData.birthDate !== undefined) {
      if (updateData.birthDate) {
        try {
          processedData.birthDate = new Date(updateData.birthDate);
        } catch {
          throw new BadRequestException(
            'Formato de data inválido. Use YYYY-MM-DD.',
          );
        }
      } else {
        processedData.birthDate = null;
      }
    }

    if (updateData.gender !== undefined) {
      processedData.gender = updateData.gender?.trim() || null;
    }

    if (updateData.phoneNumber !== undefined) {
      processedData.phoneNumber = updateData.phoneNumber?.trim() || null;
    }

    if (updateData.imageUrl !== undefined) {
      processedData.imageUrl = updateData.imageUrl?.trim() || null;
    }

    // Auto-calcular name se firstName ou lastName mudaram
    if ('firstName' in processedData || 'lastName' in processedData) {
      const newFirstName = processedData.firstName ?? user.firstName;
      const newLastName = processedData.lastName ?? user.lastName;

      if (newFirstName || newLastName) {
        processedData.name =
          `${newFirstName || ''} ${newLastName || ''}`.trim();
      } else {
        processedData.name = user.email?.split('@')[0] || user.name;
      }
    }

    // Suporte para atualização direta de name (compatibilidade)
    if (
      updateData.name !== undefined &&
      !('firstName' in processedData) &&
      !('lastName' in processedData)
    ) {
      processedData.name = updateData.name?.trim() || null;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: processedData,
    });

    return updatedUser;
  }

  async create(createUserDto: any): Promise<User> {
    this.logger.warn(
      '⚠️ [Create] Método create direto não recomendado, use a sincronização.',
    );
    try {
      return await this.prisma.user.create({ data: createUserDto });
    } catch (error) {
      this.logger.error(
        '❌ [Create] Falha ao criar usuário diretamente:',
        error,
      );
      throw new InternalServerErrorException('Falha ao criar usuário.');
    }
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async findOne(id: string): Promise<User> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
      }

      return user;
    } catch (error) {
      this.logger.error(`Falha ao buscar usuário ${id}:`, error);
      throw error;
    }
  }

  async update(id: string, updateUserDto: any): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<User> {
    try {
      return await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Falha ao remover usuário ${id}:`, error);
      if (error.code === 'P2025') {
        throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
      }
      throw error;
    }
  }

  /**
   * Deleta completamente a conta do usuário incluindo:
   * - Todos os dados relacionados no banco (plantões, locais, pagamentos, etc)
   * - A conta do Clerk (autenticação)
   * - O registro do usuário no banco
   */
  async deleteAccountByClerkId(clerkId: string): Promise<void> {
    this.logger.log(
      `Iniciando exclusão completa da conta para Clerk ID: ${clerkId}`,
    );

    // 1. Buscar o usuário
    const user = await this.findOneByClerkId(clerkId);

    try {
      // 2. Deletar dados relacionados no banco (em ordem de dependências)
      this.logger.log(`Deletando dados relacionados do usuário ${user.id}...`);

      // Deletar em transação para garantir consistência
      await this.prisma.$transaction(async (tx) => {
        // Deletar notification logs
        await tx.notificationLog.deleteMany({
          where: { userId: user.id },
        });

        // Deletar device tokens
        await tx.deviceToken.deleteMany({
          where: { userId: user.id },
        });

        // Deletar notification config
        await tx.notificationConfig.deleteMany({
          where: { userId: user.id },
        });

        // Deletar shift templates
        await tx.shiftTemplate.deleteMany({
          where: { userId: user.id },
        });

        // Deletar payments relacionados aos plantões do usuário
        await tx.payment.deleteMany({
          where: {
            plantao: {
              userId: user.id,
            },
          },
        });

        // Deletar plantões (shifts)
        await tx.plantao.deleteMany({
          where: { userId: user.id },
        });

        // Deletar contractors
        await tx.contractor.deleteMany({
          where: { userId: user.id },
        });

        // Deletar locations
        await tx.location.deleteMany({
          where: { userId: user.id },
        });

        // Por último, deletar o usuário
        await tx.user.delete({
          where: { id: user.id },
        });

        this.logger.log(
          `Dados do banco deletados com sucesso para usuário ${user.id}`,
        );
      });

      // 3. Deletar a conta do Clerk
      this.logger.log(`Deletando conta do Clerk para ${clerkId}...`);
      try {
        await clerkClient.users.deleteUser(clerkId);
        this.logger.log(`Conta do Clerk deletada com sucesso: ${clerkId}`);
      } catch (clerkError) {
        this.logger.error(
          `Erro ao deletar conta do Clerk ${clerkId}:`,
          clerkError,
        );
        // Não lançar erro aqui - os dados do banco já foram deletados
        // O usuário não poderá mais fazer login de qualquer forma
      }

      this.logger.log(`Exclusão completa da conta concluída para ${clerkId}`);
    } catch (error) {
      this.logger.error(`Erro ao deletar conta do usuário ${clerkId}:`, error);
      throw new InternalServerErrorException(
        'Erro ao processar exclusão da conta. Entre em contato com o suporte.',
      );
    }
  }
}
