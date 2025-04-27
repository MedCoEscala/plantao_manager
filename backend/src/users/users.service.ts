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
// Temporariamente usando Record<string, any> para claims. O guard já valida.
// import { SessionClaims } from '@clerk/clerk-sdk-node';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {} // Injetar PrismaService

  async syncUserWithClerk(claims: Record<string, any>): Promise<User> {
    const clerkId = claims?.sub;
    if (!clerkId) {
      this.logger.error(
        `Claims do Clerk não contém um 'sub' (ID do usuário)`,
        claims,
      );
      throw new InternalServerErrorException('ID do usuário Clerk ausente.');
    }

    const email = claims?.email_address || claims?.email;
    const firstName = claims?.first_name || claims?.firstName;
    const lastName = claims?.last_name || claims?.lastName;
    const imageUrl =
      claims?.profile_image_url || claims?.imageUrl || claims?.picture;

    this.logger.log(`Sincronizando usuário com Clerk ID: ${clerkId}`);

    if (!email) {
      this.logger.error('Email não encontrado nas claims do Clerk', claims);
      throw new InternalServerErrorException('Email do usuário Clerk ausente.');
    }

    try {
      const user = await this.prisma.user.upsert({
        where: { clerkId: clerkId },
        update: {
          email: email,
          firstName: firstName,
          lastName: lastName,
          imageUrl: imageUrl,
        },
        create: {
          clerkId: clerkId,
          email: email,
          firstName: firstName,
          lastName: lastName,
          imageUrl: imageUrl,
        },
      });
      this.logger.log(
        `Usuário sincronizado com sucesso: ${user.id} (DB) / ${user.clerkId} (Clerk)`,
      );
      return user;
    } catch (error) {
      this.logger.error(`Falha ao sincronizar usuário ${clerkId}:`, error);
      if (error.code === 'P2002') {
        throw new InternalServerErrorException(
          `Erro de constraint único ao sincronizar usuário: ${error.meta?.target}`,
        );
      }
      throw new InternalServerErrorException(
        'Falha ao sincronizar informações do usuário.',
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
}
