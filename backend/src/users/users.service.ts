import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
// Comentando DTOs não utilizados por enquanto
// import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';
// import { SyncUserDto } from './dto/sync-user.dto'; // Também comentar este
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client'; // Importar tipo User do Prisma
import clerkClient from '@clerk/clerk-sdk-node'; // Importar clerkClient
// Temporariamente usando Record<string, any> para claims. O guard já valida.
// import { SessionClaims } from '@clerk/clerk-sdk-node';
import { UpdateProfileDto } from './users.controller'; // Importar o DTO (ou de dto/update-profile.dto.ts)
import { Prisma } from '@prisma/client'; // Import Prisma type

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {} // Injetar PrismaService

  /**
   * Garante que um usuário exista no DB local com base no token do Clerk.
   * Busca o email verificado diretamente do Clerk.
   * Chamado após login ou verificação de email inicial.
   */
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
      // Buscar usuário no Clerk para pegar o email primário/verificado
      const clerkUser = await clerkClient.users.getUser(clerkId);
      const primaryEmailObject = clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId,
      );
      email =
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

      this.logger.log(`Upsert básico para ${clerkId} com email ${email}`);
      const user = await this.prisma.user.upsert({
        where: { clerkId: clerkId },
        update: {
          email: email, // Garante que o email está atualizado com o do Clerk
        },
        create: {
          clerkId: clerkId,
          email: email,
          // Outros campos (nome, etc.) serão preenchidos via PATCH /users/me
        },
        select: { id: true, clerkId: true, email: true }, // Selecionar apenas campos básicos
      });

      this.logger.log(
        `Usuário básico sincronizado: DB ID ${user.id}, Clerk ID ${user.clerkId}`,
      );
      // Retornar o usuário básico encontrado/criado
      // Precisamos buscar o usuário completo para retornar o tipo User correto
      // Ou ajustar o tipo de retorno para Partial<User> ou um tipo específico
      // Por simplicidade agora, buscamos o usuário completo
      return await this.findOne(user.id);
    } catch (error: any) {
      this.logger.error(
        `Falha ao sincronizar usuário básico ${clerkId}:`,
        error,
      );
      // Reutilizar tratamento de erro P2002 e genérico
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

  /**
   * NOVO: Atualiza o perfil de um usuário baseado no seu Clerk ID.
   * Recebe o DTO vindo do Controller.
   */
  async updateProfileByClerkId(
    clerkId: string,
    data: UpdateProfileDto,
  ): Promise<User> {
    this.logger.log(`Atualizando perfil para Clerk ID: ${clerkId}`);

    let birthDateForUpdate: Date | undefined = undefined;
    if (data.birthDate) {
      // Checar se birthDate existe no DTO
      try {
        const parsedDate = new Date(data.birthDate); // Tentar converter a string
        if (!isNaN(parsedDate.getTime())) {
          birthDateForUpdate = parsedDate;
        }
      } catch {
        /* Ignorar erro de parsing */
      }
    }

    // Construir objeto de dados para Prisma SOMENTE com valores definidos
    const updateData: Prisma.UserUpdateInput = {}; // Usar tipo Prisma para clareza
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.phoneNumber !== undefined)
      updateData.phoneNumber = data.phoneNumber;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (birthDateForUpdate !== undefined)
      updateData.birthDate = birthDateForUpdate;

    // Verificar se há dados para atualizar
    if (Object.keys(updateData).length === 0) {
      this.logger.log(
        `Nenhum dado válido fornecido para atualizar o perfil de ${clerkId}.`,
      );
      // O que fazer aqui? Retornar o usuário existente ou lançar erro?
      // Por ora, buscamos e retornamos o usuário existente.
      const existingUser = await this.findOneByClerkId(clerkId); // Reusa método existente
      return existingUser;
    }

    try {
      const user = await this.prisma.user.update({
        where: { clerkId: clerkId },
        data: updateData, // Passar objeto apenas com dados definidos
      });
      this.logger.log(`Perfil atualizado com sucesso para DB ID: ${user.id}`);
      return user;
    } catch (error: any) {
      // Tratar erro P2025 (Record to update not found)
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
}
