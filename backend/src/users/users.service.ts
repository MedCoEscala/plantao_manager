import clerkClient from '@clerk/clerk-sdk-node';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { User, Prisma } from '@prisma/client';

import { UpdateProfileDto } from './users.controller';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async syncUserWithClerk(tokenPayload: Record<string, any>): Promise<User> {
    const clerkId = tokenPayload?.sub;
    if (!clerkId) {
      this.logger.error("Payload do token não contém 'sub'", tokenPayload);
      throw new InternalServerErrorException(
        'ID do usuário Clerk ausente no token.',
      );
    }

    this.logger.log(`syncUser iniciado para Clerk ID: ${clerkId}`);

    try {
      const clerkUser = await clerkClient.users.getUser(clerkId);

      const primaryEmailObject = clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId,
      );
      const email =
        primaryEmailObject?.emailAddress ||
        clerkUser.emailAddresses[0]?.emailAddress;

      if (!email) {
        this.logger.error(
          `Email não encontrado no Clerk para ${clerkId}`,
          clerkUser.emailAddresses,
        );
        throw new InternalServerErrorException(
          'Email principal não encontrado no Clerk.',
        );
      }

      const firstName = clerkUser.firstName || '';
      const lastName = clerkUser.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim() || email.split('@')[0];

      const imageUrl = clerkUser.imageUrl || null;
      const phoneNumber = clerkUser.phoneNumbers?.[0]?.phoneNumber || null;

      this.logger.log(
        `Sincronizando ${clerkId} com dados: nome="${fullName}", email="${email}"`,
      );

      const user = await this.prisma.user.upsert({
        where: { clerkId },
        update: {
          email,
          firstName: firstName || null,
          lastName: lastName || null,
          name: fullName,
          imageUrl,
          phoneNumber,
        },
        create: {
          clerkId,
          email,
          firstName: firstName || null,
          lastName: lastName || null,
          name: fullName,
          imageUrl,
          phoneNumber,
        },
      });

      this.logger.log(
        `Usuário sincronizado: DB ID ${user.id}, nome: "${user.name}"`,
      );

      return user;
    } catch (error: any) {
      this.logger.error(`Falha ao sincronizar usuário ${clerkId}:`, error);

      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        this.logger.error(`Email já existe (P2002).`);
        throw new InternalServerErrorException(`Email já cadastrado.`);
      } else if (error.code === 'P2002') {
        this.logger.error(
          `Constraint único falhou em ${error.meta?.target} (P2002).`,
        );
        throw new InternalServerErrorException(`Erro de constraint único.`);
      }
      throw new InternalServerErrorException(
        'Falha na sincronização do usuário.',
      );
    }
  }

  async findOneByClerkId(clerkId: string): Promise<User> {
    this.logger.log(`Buscando usuário com Clerk ID: ${clerkId}`);
    try {
      const user = await this.prisma.user.findUnique({ where: { clerkId } });
      if (!user) {
        this.logger.warn(`Usuário com Clerk ID ${clerkId} não encontrado.`);
        throw new NotFoundException(
          `Usuário com Clerk ID ${clerkId} não encontrado.`,
        );
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `Falha ao buscar usuário por Clerk ID ${clerkId}:`,
        error,
      );
      throw new InternalServerErrorException(
        'Falha ao buscar usuário por Clerk ID.',
      );
    }
  }

  async updateProfileByClerkId(
    clerkId: string,
    data: UpdateProfileDto,
  ): Promise<User> {
    this.logger.log(`Atualizando perfil para Clerk ID: ${clerkId}`);

    const currentUser = await this.findOneByClerkId(clerkId);

    let birthDateForUpdate: Date | undefined = undefined;
    if (data.birthDate) {
      try {
        const parsedDate = new Date(data.birthDate);
        if (!isNaN(parsedDate.getTime())) {
          birthDateForUpdate = parsedDate;
        }
      } catch {}
    }

    const updateData: Prisma.UserUpdateInput = {};

    if (data.phoneNumber !== undefined)
      updateData.phoneNumber = data.phoneNumber;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (birthDateForUpdate !== undefined)
      updateData.birthDate = birthDateForUpdate;

    let needsNameUpdate = false;
    let newFirstName = currentUser.firstName || '';
    let newLastName = currentUser.lastName || '';

    if (data.firstName !== undefined) {
      newFirstName = data.firstName;
      needsNameUpdate = true;
    }
    if (data.lastName !== undefined) {
      newLastName = data.lastName;
      needsNameUpdate = true;
    }

    if (needsNameUpdate) {
      updateData.firstName = newFirstName;
      updateData.lastName = newLastName;
      updateData.name =
        `${newFirstName} ${newLastName}`.trim() ||
        currentUser.email.split('@')[0];
    }

    if (Object.keys(updateData).length === 0) {
      this.logger.log(
        `Nenhum dado fornecido para atualizar o perfil de ${clerkId}.`,
      );
      return currentUser;
    }

    try {
      const user = await this.prisma.user.update({
        where: { clerkId },
        data: updateData,
      });

      this.logger.log(
        `Perfil atualizado: DB ID ${user.id}, nome: "${user.name}"`,
      );
      return user;
    } catch (error: any) {
      if (error.code === 'P2025') {
        this.logger.error(
          `Usuário com Clerk ID ${clerkId} não encontrado para atualização.`,
        );
        throw new NotFoundException(`Usuário não encontrado.`);
      }
      this.logger.error(
        `Falha ao atualizar perfil para Clerk ID ${clerkId}:`,
        error,
      );
      throw new InternalServerErrorException(
        'Falha ao atualizar perfil do usuário.',
      );
    }
  }

  async create(createUserDto: any): Promise<User> {
    this.logger.warn(
      'Método create direto não recomendado, use a sincronização.',
    );
    try {
      return await this.prisma.user.create({ data: createUserDto });
    } catch (error) {
      this.logger.error('Falha ao criar usuário diretamente:', error);
      throw new InternalServerErrorException('Falha ao criar usuário.');
    }
  }

  async findAll(): Promise<User[]> {
    this.logger.log('Buscando todos os usuários');
    try {
      return await this.prisma.user.findMany();
    } catch (error) {
      this.logger.error('Falha ao buscar todos os usuários:', error);
      throw new InternalServerErrorException('Falha ao buscar usuários.');
    }
  }

  async findOne(id: string): Promise<User> {
    this.logger.log(`Buscando usuário com ID (DB): ${id}`);
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) {
        this.logger.warn(`Usuário com ID (DB) ${id} não encontrado.`);
        throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Falha ao buscar usuário ${id}:`, error);
      throw new InternalServerErrorException('Falha ao buscar usuário.');
    }
  }

  async update(id: string, updateUserDto: any): Promise<User> {
    this.logger.log(`Atualizando usuário com ID (DB): ${id}`);
    try {
      await this.findOne(id);
      return await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Falha ao atualizar usuário ${id}:`, error);
      throw new InternalServerErrorException('Falha ao atualizar usuário.');
    }
  }

  async remove(id: string): Promise<User> {
    this.logger.log(`Removendo usuário com ID (DB): ${id}`);
    try {
      await this.findOne(id);
      return await this.prisma.user.delete({ where: { id } });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Falha ao remover usuário ${id}:`, error);
      throw new InternalServerErrorException('Falha ao remover usuário.');
    }
  }
}
