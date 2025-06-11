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

    this.logger.log(`[DEBUG] syncUser iniciado para Clerk ID: ${clerkId}`);

    try {
      this.logger.log(`[DEBUG] Buscando usuário no Clerk: ${clerkId}`);
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
      let fullName = `${firstName} ${lastName}`.trim();

      // Se não tiver nome no Clerk, usar um nome padrão mais amigável
      if (!fullName) {
        const emailName = email.split('@')[0];
        fullName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
      }

      const imageUrl = clerkUser.imageUrl || null;
      const phoneNumber = clerkUser.phoneNumbers?.[0]?.phoneNumber || null;

      this.logger.log(
        `[DEBUG] Dados extraídos do Clerk - nome: "${fullName}", email: "${email}", telefone: "${phoneNumber || 'N/A'}"`,
      );

      // Primeiro, verifica se já existe um usuário com este clerkId
      const existingUser = await this.prisma.user.findUnique({
        where: { clerkId },
      });

      if (existingUser) {
        // Usuário já existe, apenas atualiza
        this.logger.log(
          `[DEBUG] Usuário existente encontrado, atualizando: ${existingUser.id}`,
        );

        const user = await this.prisma.user.update({
          where: { clerkId },
          data: {
            email,
            firstName: firstName || null,
            lastName: lastName || null,
            name: fullName,
            imageUrl,
            phoneNumber,
          },
        });

        this.logger.log(
          `[SUCCESS] Usuário atualizado: DB ID ${user.id}, nome: "${user.name}"`,
        );
        return user;
      }

      // Verifica se existe outro usuário com o mesmo email
      const userWithSameEmail = await this.prisma.user.findUnique({
        where: { email },
      });

      if (userWithSameEmail) {
        // Se existe usuário com mesmo email mas clerkId diferente,
        // provavelmente é uma inconsistência. Vamos atualizar o clerkId.
        this.logger.warn(
          `[WARN] Usuário com email ${email} já existe com clerkId diferente. Atualizando clerkId de ${userWithSameEmail.clerkId} para ${clerkId}`,
        );

        const user = await this.prisma.user.update({
          where: { email },
          data: {
            clerkId,
            firstName: firstName || null,
            lastName: lastName || null,
            name: fullName,
            imageUrl,
            phoneNumber,
          },
        });

        this.logger.log(
          `[SUCCESS] Usuário sincronizado (email existente): DB ID ${user.id}, nome: "${user.name}"`,
        );
        return user;
      }

      // Nenhum usuário encontrado, criar novo
      this.logger.log(`[DEBUG] Criando novo usuário no banco de dados`);

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

      this.logger.log(
        `[SUCCESS] Novo usuário criado: DB ID ${user.id}, nome: "${user.name}"`,
      );

      return user;
    } catch (error: any) {
      this.logger.error(
        `[ERROR] Falha ao sincronizar usuário ${clerkId}:`,
        error,
      );

      // Tratamento específico para erros de constraint único
      if (error.code === 'P2002') {
        const constraintField = error.meta?.target;
        this.logger.error(
          `[ERROR] Constraint único falhou em ${constraintField} (P2002).`,
        );

        if (constraintField?.includes('email')) {
          // Tenta recuperar o usuário existente com este email
          try {
            this.logger.log(
              `[DEBUG] Tentando recuperar usuário existente após P2002`,
            );

            const existingUser = await this.prisma.user.findFirst({
              where: {
                OR: [{ clerkId }, { email: tokenPayload.email }],
              },
            });

            if (existingUser) {
              this.logger.log(
                `[SUCCESS] Usuário existente recuperado após erro P2002: ${existingUser.id}`,
              );
              return existingUser;
            }
          } catch (recoveryError) {
            this.logger.error(
              '[ERROR] Falha na recuperação após P2002:',
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

    // Suporte para compatibility - se enviaram 'name', dividir em firstName/lastName
    if (data.name !== undefined) {
      const nameParts = data.name.trim().split(' ');
      newFirstName = nameParts[0] || '';
      newLastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      needsNameUpdate = true;
    }

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

      // Construir o nome completo - só usar email se ambos estiverem realmente vazios
      const firstName = newFirstName?.trim() || '';
      const lastName = newLastName?.trim() || '';
      const fullName = `${firstName} ${lastName}`.trim();

      // Se temos pelo menos um nome não vazio, usar o fullName, senão usar o email
      if (fullName.length > 0) {
        updateData.name = fullName;
      } else {
        // Capitalizar a primeira letra do email para melhor apresentação
        const emailPrefix = currentUser.email.split('@')[0];
        updateData.name =
          emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
      }
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
