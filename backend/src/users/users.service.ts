import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { User, Prisma } from '@prisma/client';

import { clerkClient } from '../config/clerk.config';

import { UpdateProfileDto } from './users.controller';
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

    const primaryEmailAddress = userContext.email;
    if (!primaryEmailAddress) {
      throw new BadRequestException(
        'Email não encontrado no contexto do Clerk.',
      );
    }

    try {
      const clerkUser = await clerkClient.users.getUser(clerkId);

      const firstName = clerkUser.firstName || '';
      const lastName = clerkUser.lastName || '';
      const phoneNumbers = clerkUser.phoneNumbers || [];
      const metadata = clerkUser.publicMetadata || {};

      const firstName_meta = metadata.firstName as string;
      const lastName_meta = metadata.lastName as string;

      let phoneNumber = '';
      if (phoneNumbers.length > 0 && phoneNumbers[0].phoneNumber) {
        phoneNumber = phoneNumbers[0].phoneNumber;
      }

      // Tentar encontrar o usuário existente
      let user = await this.prisma.user.findFirst({
        where: { clerkId },
      });

      if (user) {
        // Atualizar usuário existente
        const updateData: any = {
          email: primaryEmailAddress,
          updatedAt: new Date(),
        };

        // Atualizar firstName se disponível
        if (firstName?.trim() || firstName_meta?.trim()) {
          updateData.firstName = firstName?.trim() || firstName_meta?.trim();
        }

        // Atualizar lastName se disponível
        if (lastName?.trim() || lastName_meta?.trim()) {
          updateData.lastName = lastName?.trim() || lastName_meta?.trim();
        }

        // Calcular nome completo baseado nos campos atualizados
        let fullName = '';
        if (updateData.firstName || updateData.lastName) {
          fullName =
            `${updateData.firstName || ''} ${updateData.lastName || ''}`.trim();
        }

        if (fullName && user.name !== fullName) {
          updateData.name = fullName;
        }

        // Atualizar telefone se disponível
        if (phoneNumber?.trim() && user.phoneNumber !== phoneNumber.trim()) {
          updateData.phoneNumber = phoneNumber.trim();
        }

        user = await this.prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });

        return user;
      } else {
        // Criar novo usuário
        const createData: any = {
          clerkId,
          email: primaryEmailAddress,
        };

        if (firstName?.trim() || firstName_meta?.trim()) {
          createData.firstName = firstName?.trim() || firstName_meta?.trim();
        }

        if (lastName?.trim() || lastName_meta?.trim()) {
          createData.lastName = lastName?.trim() || lastName_meta?.trim();
        }

        // Calcular nome completo
        let fullName = '';
        if (createData.firstName || createData.lastName) {
          fullName =
            `${createData.firstName || ''} ${createData.lastName || ''}`.trim();
        }

        if (!fullName) {
          const emailUsername = primaryEmailAddress.split('@')[0];
          fullName =
            emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
        }

        createData.name = fullName;

        if (phoneNumber?.trim()) {
          createData.phoneNumber = phoneNumber.trim();
        }

        user = await this.prisma.user.create({
          data: createData,
        });

        return user;
      }
    } catch (error) {
      this.logger.error('Falha na sincronização:', error);
      throw new InternalServerErrorException(
        'Falha na sincronização do usuário',
      );
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
}
