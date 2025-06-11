import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { User, Prisma } from '@prisma/client';

import { clerkClient } from '../config/clerk.config';

import { UpdateProfileDto } from './users.controller';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async syncUserWithClerk(tokenPayload: Record<string, any>): Promise<User> {
    const clerkId = tokenPayload?.sub;
    if (!clerkId) {
      this.logger.error(
        '[ERROR] Payload do token não contém "sub"',
        tokenPayload,
      );
      throw new InternalServerErrorException(
        'ID do usuário Clerk ausente no token.',
      );
    }

    this.logger.log(
      `🔄 [Sync] Iniciando sincronização para Clerk ID: ${clerkId}`,
    );

    try {
      this.logger.log(`📋 [Sync] Buscando usuário no Clerk: ${clerkId}`);
      const clerkUser = await clerkClient.users.getUser(clerkId);

      const primaryEmailObject = clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId,
      );
      const email =
        primaryEmailObject?.emailAddress ||
        clerkUser.emailAddresses[0]?.emailAddress;

      if (!email) {
        this.logger.error(
          `[ERROR] Email não encontrado no Clerk para ${clerkId}`,
          clerkUser.emailAddresses,
        );
        throw new InternalServerErrorException(
          'Email principal não encontrado no Clerk.',
        );
      }

      const firstName = clerkUser.firstName || '';
      const lastName = clerkUser.lastName || '';
      const imageUrl = clerkUser.imageUrl || null;
      const phoneNumber = clerkUser.phoneNumbers?.[0]?.phoneNumber || null;

      let fullName = `${firstName} ${lastName}`.trim();

      if (!fullName) {
        const emailName = email.split('@')[0];
        fullName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
      }

      this.logger.log(`📊 [Sync] Dados extraídos do Clerk:`, {
        firstName: `"${firstName}"`,
        lastName: `"${lastName}"`,
        fullName: `"${fullName}"`,
        email: `"${email}"`,
        phoneNumber: phoneNumber || 'N/A',
      });

      const existingUser = await this.prisma.user.findUnique({
        where: { clerkId },
      });

      if (existingUser) {
        this.logger.log(
          `♻️ [Sync] Usuário existente encontrado, fazendo merge: ${existingUser.id}`,
        );

        const updateData: Prisma.UserUpdateInput = {
          email,
          imageUrl,
        };

        if (firstName) {
          updateData.firstName = firstName;
        }
        if (lastName) {
          updateData.lastName = lastName;
        }

        updateData.name = fullName;

        if (!existingUser.phoneNumber && phoneNumber) {
          updateData.phoneNumber = phoneNumber;
        }

        const user = await this.prisma.user.update({
          where: { clerkId },
          data: updateData,
        });

        this.logger.log(`✅ [Sync] Usuário atualizado: DB ID ${user.id}`, {
          name: `"${user.name}"`,
          firstName: `"${user.firstName}"`,
          lastName: `"${user.lastName}"`,
        });
        return user;
      }

      const userWithSameEmail = await this.prisma.user.findUnique({
        where: { email },
      });

      if (userWithSameEmail) {
        this.logger.warn(
          `⚠️ [Sync] Usuário com email ${email} já existe com clerkId diferente. Atualizando clerkId de ${userWithSameEmail.clerkId} para ${clerkId}`,
        );

        const updateData: Prisma.UserUpdateInput = {
          clerkId,
          imageUrl,
          name: fullName,
        };

        if (firstName) {
          updateData.firstName = firstName;
        }
        if (lastName) {
          updateData.lastName = lastName;
        }
        if (!userWithSameEmail.phoneNumber && phoneNumber) {
          updateData.phoneNumber = phoneNumber;
        }

        const user = await this.prisma.user.update({
          where: { email },
          data: updateData,
        });

        this.logger.log(
          `✅ [Sync] Usuário sincronizado (email existente): DB ID ${user.id}`,
          {
            name: `"${user.name}"`,
            firstName: `"${user.firstName}"`,
            lastName: `"${user.lastName}"`,
          },
        );
        return user;
      }

      this.logger.log(`➕ [Sync] Criando novo usuário no banco de dados`);

      const user = await this.prisma.user.create({
        data: {
          clerkId,
          email,
          firstName: firstName || null,
          lastName: lastName || null,
          name: fullName,
          imageUrl,
          phoneNumber,
        },
      });

      this.logger.log(`🎉 [Sync] Novo usuário criado: DB ID ${user.id}`, {
        name: `"${user.name}"`,
        firstName: `"${user.firstName}"`,
        lastName: `"${user.lastName}"`,
      });

      return user;
    } catch (error: any) {
      this.logger.error(
        `❌ [Sync] Falha ao sincronizar usuário ${clerkId}:`,
        error,
      );

      if (error.code === 'P2002') {
        const constraintField = error.meta?.target;
        this.logger.error(
          `🔒 [Sync] Constraint único falhou em ${constraintField} (P2002).`,
        );

        if (constraintField?.includes('email')) {
          try {
            this.logger.log(
              `🔍 [Sync] Tentando recuperar usuário existente após P2002`,
            );

            const existingUser = await this.prisma.user.findFirst({
              where: {
                OR: [{ clerkId }, { email: tokenPayload.email }],
              },
            });

            if (existingUser) {
              this.logger.log(
                `✅ [Sync] Usuário existente recuperado após erro P2002: ${existingUser.id}`,
              );
              return existingUser;
            }
          } catch (recoveryError) {
            this.logger.error(
              '❌ [Sync] Falha na recuperação após P2002:',
              recoveryError,
            );
          }
        }

        throw new InternalServerErrorException(
          `Erro de constraint único: ${constraintField?.join(', ') || 'campo desconhecido'}`,
        );
      }

      throw new InternalServerErrorException(
        'Falha na sincronização do usuário.',
      );
    }
  }

  async findOneByClerkId(clerkId: string): Promise<User> {
    this.logger.log(`🔍 [Find] Buscando usuário com Clerk ID: ${clerkId}`);
    try {
      const user = await this.prisma.user.findUnique({ where: { clerkId } });
      if (!user) {
        this.logger.warn(
          `⚠️ [Find] Usuário com Clerk ID ${clerkId} não encontrado.`,
        );
        throw new NotFoundException(
          `Usuário com Clerk ID ${clerkId} não encontrado.`,
        );
      }
      this.logger.log(
        `✅ [Find] Usuário encontrado: ${user.id} - "${user.name}"`,
      );
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `❌ [Find] Falha ao buscar usuário por Clerk ID ${clerkId}:`,
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
    this.logger.log(`📝 [Update] Atualizando perfil para Clerk ID: ${clerkId}`);
    this.logger.log(
      `📋 [Update] Dados recebidos:`,
      JSON.stringify(data, null, 2),
    );

    const currentUser = await this.findOneByClerkId(clerkId);
    this.logger.log(`👤 [Update] Usuário atual:`, {
      id: currentUser.id,
      name: currentUser.name,
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      email: currentUser.email,
    });

    let birthDateForUpdate: Date | undefined = undefined;
    if (data.birthDate) {
      try {
        const parsedDate = new Date(data.birthDate);
        if (!isNaN(parsedDate.getTime())) {
          birthDateForUpdate = parsedDate;
          this.logger.log(
            `📅 [Update] Data de nascimento processada: ${parsedDate.toISOString()}`,
          );
        }
      } catch {
        this.logger.warn(
          `⚠️ [Update] Data de nascimento inválida: ${data.birthDate}`,
        );
      }
    }

    const updateData: Prisma.UserUpdateInput = {};

    if (data.phoneNumber !== undefined) {
      updateData.phoneNumber = data.phoneNumber || null;
      this.logger.log(
        `📞 [Update] Telefone: "${data.phoneNumber}" -> "${updateData.phoneNumber}"`,
      );
    }
    if (data.gender !== undefined) {
      updateData.gender = data.gender || null;
      this.logger.log(
        `🚻 [Update] Gênero: "${data.gender}" -> "${updateData.gender}"`,
      );
    }
    if (data.imageUrl !== undefined) {
      updateData.imageUrl = data.imageUrl || null;
      this.logger.log(
        `🖼️ [Update] ImageUrl: "${data.imageUrl}" -> "${updateData.imageUrl}"`,
      );
    }
    if (birthDateForUpdate !== undefined) {
      updateData.birthDate = birthDateForUpdate;
    }

    let needsNameUpdate = false;
    let newFirstName = currentUser.firstName || '';
    let newLastName = currentUser.lastName || '';

    if (data.name !== undefined && data.name.trim()) {
      const nameParts = data.name.trim().split(' ');
      newFirstName = nameParts[0] || '';
      newLastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      needsNameUpdate = true;
      this.logger.log(
        `📝 [Update] Nome dividido de "${data.name}" em: "${newFirstName}" + "${newLastName}"`,
      );
    }

    if (data.firstName !== undefined) {
      newFirstName = data.firstName.trim();
      needsNameUpdate = true;
      this.logger.log(
        `👤 [Update] FirstName NOVO: "${newFirstName}" (era: "${currentUser.firstName}")`,
      );
    }
    if (data.lastName !== undefined) {
      newLastName = data.lastName.trim();
      needsNameUpdate = true;
      this.logger.log(
        `👤 [Update] LastName NOVO: "${newLastName}" (era: "${currentUser.lastName}")`,
      );
    }

    if (needsNameUpdate) {
      updateData.firstName = newFirstName || null;
      updateData.lastName = newLastName || null;

      const fullName = `${newFirstName} ${newLastName}`.trim();

      if (fullName.length > 0) {
        updateData.name = fullName;
        this.logger.log(
          `✅ [Update] Nome completo NOVO: "${fullName}" (era: "${currentUser.name}")`,
        );
      } else {
        const emailPrefix = currentUser.email.split('@')[0];
        updateData.name =
          emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
        this.logger.log(
          `🔄 [Update] Usando fallback para nome: "${updateData.name}"`,
        );
      }
    }

    if (Object.keys(updateData).length === 0) {
      this.logger.log(
        `ℹ️ [Update] Nenhum dado fornecido para atualizar o perfil de ${clerkId}.`,
      );
      return currentUser;
    }

    try {
      this.logger.log(
        `💾 [Update] Dados a serem atualizados no banco:`,
        JSON.stringify(updateData, null, 2),
      );

      const user = await this.prisma.user.update({
        where: { clerkId },
        data: updateData,
      });

      this.logger.log(
        `🎉 [Update] Perfil atualizado com sucesso! DB ID: ${user.id}`,
      );
      this.logger.log(`✅ [Update] Resultado final:`, {
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        gender: user.gender,
        birthDate: user.birthDate,
      });

      return user;
    } catch (error: any) {
      if (error.code === 'P2025') {
        this.logger.error(
          `❌ [Update] Usuário com Clerk ID ${clerkId} não encontrado para atualização.`,
        );
        throw new NotFoundException(`Usuário não encontrado.`);
      }
      this.logger.error(
        `❌ [Update] Falha ao atualizar perfil para Clerk ID ${clerkId}:`,
        error,
      );
      throw new InternalServerErrorException(
        'Falha ao atualizar perfil do usuário.',
      );
    }
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
    this.logger.log('📋 [FindAll] Buscando todos os usuários');
    try {
      return await this.prisma.user.findMany();
    } catch (error) {
      this.logger.error(
        '❌ [FindAll] Falha ao buscar todos os usuários:',
        error,
      );
      throw new InternalServerErrorException('Falha ao buscar usuários.');
    }
  }

  async findOne(id: string): Promise<User> {
    this.logger.log(`🔍 [FindOne] Buscando usuário com ID (DB): ${id}`);
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) {
        this.logger.warn(
          `⚠️ [FindOne] Usuário com ID (DB) ${id} não encontrado.`,
        );
        throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`❌ [FindOne] Falha ao buscar usuário ${id}:`, error);
      throw new InternalServerErrorException('Falha ao buscar usuário.');
    }
  }

  async update(id: string, updateUserDto: any): Promise<User> {
    this.logger.log(`📝 [UpdateById] Atualizando usuário com ID (DB): ${id}`);
    try {
      await this.findOne(id);
      return await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `❌ [UpdateById] Falha ao atualizar usuário ${id}:`,
        error,
      );
      throw new InternalServerErrorException('Falha ao atualizar usuário.');
    }
  }

  async remove(id: string): Promise<User> {
    this.logger.log(`🗑️ [Remove] Removendo usuário com ID (DB): ${id}`);
    try {
      await this.findOne(id);
      return await this.prisma.user.delete({ where: { id } });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`❌ [Remove] Falha ao remover usuário ${id}:`, error);
      throw new InternalServerErrorException('Falha ao remover usuário.');
    }
  }
}
