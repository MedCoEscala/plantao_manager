import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import { PrismaService } from './prisma/prisma.service';
import { UpdateProfileDto } from './users/users.controller';

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

    this.logger.log(`syncUser (básico) iniciado para Clerk ID: ${clerkId}`);
    let email: string | undefined | null = undefined;

    try {
      email = tokenPayload.email;

      if (!email) {
        this.logger.error(
          `Email não encontrado no token para ${clerkId}`,
          tokenPayload,
        );
        throw new InternalServerErrorException(
          'Email principal não encontrado no token.',
        );
      }

      this.logger.log(`Upsert básico para ${clerkId} com email ${email}`);
      const user = await this.prisma.user.upsert({
        where: { clerkId: clerkId },
        update: {
          email: email,
        },
        create: {
          clerkId: clerkId,
          email: email,
        },
      });

      this.logger.log(
        `Usuário básico sincronizado: DB ID ${user.id}, Clerk ID ${user.clerkId}`,
      );

      return user;
    } catch (error: any) {
      this.logger.error(
        `Falha ao sincronizar usuário básico ${clerkId}:`,
        error,
      );

      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        this.logger.error(`Email '${email || 'N/A'}' já existe (P2002).`);
        throw new InternalServerErrorException(`Email já cadastrado.`);
      } else if (error.code === 'P2002') {
        this.logger.error(
          `Constraint único falhou em ${error.meta?.target} (P2002).`,
        );
        throw new InternalServerErrorException(`Erro de constraint único.`);
      }
      throw new InternalServerErrorException(
        'Falha na sincronização básica do usuário.',
      );
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
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.phoneNumber !== undefined)
      updateData.phoneNumber = data.phoneNumber;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (birthDateForUpdate !== undefined)
      updateData.birthDate = birthDateForUpdate;

    if (data.firstName !== undefined || data.lastName !== undefined) {
      const currentUser = await this.findOneByClerkId(clerkId);

      const firstName =
        data.firstName !== undefined
          ? data.firstName
          : currentUser.firstName || '';
      const lastName =
        data.lastName !== undefined
          ? data.lastName
          : currentUser.lastName || '';

      if (firstName || lastName) {
        updateData.name = `${firstName} ${lastName}`.trim();
      }
    }

    if (Object.keys(updateData).length === 0) {
      this.logger.log(
        `Nenhum dado válido fornecido para atualizar o perfil de ${clerkId}.`,
      );
      const existingUser = await this.findOneByClerkId(clerkId);
      return existingUser;
    }

    try {
      const user = await this.prisma.user.update({
        where: { clerkId: clerkId },
        data: updateData,
      });
      this.logger.log(`Perfil atualizado com sucesso para DB ID: ${user.id}`);
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

  async findAll(): Promise<User[]> {
    this.logger.log('Buscando todos os usuários');
    return this.prisma.user.findMany();
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
