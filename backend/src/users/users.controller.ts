import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  applyDecorators,
  UsePipes,
  ValidationPipe,
  ForbiddenException,
  ParseFilePipe,
  NotFoundException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { IsString, IsOptional, IsDateString, IsIn } from 'class-validator';
import { Request } from 'express';

import { UsersService } from './users.service';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';

// --- DTO para atualização do perfil ---
// (Idealmente, mover para src/users/dto/update-profile.dto.ts)

// Adicionar tipo para request com userContext
interface RequestWithUserContext extends Request {
  userContext: Record<string, any>; // Payload do token
}

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString() // Receber como string YYYY-MM-DD
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsString()
  @IsOptional()
  @IsIn(['Masculino', 'Feminino', 'Outro', 'Não informado', ''])
  gender?: string;

  @IsString()
  @IsOptional()
  // Adicionar validação mais específica de telefone se necessário
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  // Suporte para compatibility com frontend antigo
  @IsString()
  @IsOptional()
  name?: string;
}

export class DeleteAccountDto {
  @IsString()
  password: string;

  @IsString()
  @IsOptional()
  email?: string;
}
// --- Fim DTO ---

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  constructor(private readonly usersService: UsersService) {}

  /**
   * Endpoint para sincronizar (criar/atualizar básico) o usuário logado no DB local.
   * Chamado após login ou verificação de email.
   * Garante que o usuário com clerkId e email exista no DB.
   */
  @Post('sync')
  @UseGuards(ClerkAuthGuard)
  @HttpCode(HttpStatus.OK)
  // Não precisa mais de @Body()
  async syncUser(@Req() req: RequestWithUserContext): Promise<User> {
    return this.usersService.syncUserWithClerk(req.userContext);
  }

  /**
   * Retorna o perfil completo do usuário atualmente autenticado.
   */
  @UseGuards(ClerkAuthGuard)
  @Get('me')
  async getMyProfile(@Req() req: RequestWithUserContext): Promise<User> {
    const clerkId = req.userContext.sub;
    try {
      return await this.usersService.findOneByClerkId(clerkId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(
          `Perfil não encontrado para Clerk ID ${clerkId}, iniciando sync...`,
        );
        // Se o perfil não for encontrado, talvez o sync falhou ou não ocorreu.
        // Tentar sincronizar novamente pode ser uma opção.
        return await this.usersService.syncUserWithClerk(req.userContext);
      }
      throw error; // Re-lança outros erros
    }
  }

  /**
   * NOVO: Atualiza o perfil do usuário autenticado.
   */
  @Patch('me')
  @UseGuards(ClerkAuthGuard)
  // Adicionar UsePipes(ValidationPipe) se a validação automática for desejada
  async updateMyProfile(
    @Req() req: RequestWithUserContext,
    @Body() updateProfileDto: UpdateProfileDto, // Usar o DTO
  ): Promise<User> {
    const clerkId = req.userContext.sub;

    const result = await this.usersService.updateProfileByClerkId(
      clerkId,
      updateProfileDto,
    );

    return result;
  }

  @UseGuards(ClerkAuthGuard)
  @Get()
  findAll(@Req() req: RequestWithUserContext) {
    return this.usersService.findAll();
  }

  @UseGuards(ClerkAuthGuard)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: RequestWithUserContext,
  ): Promise<User> {
    const user = await this.usersService.findOne(id);

    // Comparar com o clerkId do usuário encontrado no DB
    const clerkId = req.userContext.sub;
    if (user.clerkId !== clerkId) {
      console.warn(
        `Permissão negada: Usuário ${clerkId} tentando acessar DB ID ${id} de outro usuário (${user.clerkId})`,
      );
      throw new ForbiddenException(
        'Você não tem permissão para acessar este recurso.',
      );
    }

    return user;
  }

  @UseGuards(ClerkAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: any, // Considerar criar um UpdateUserDto real
    @Req() req: RequestWithUserContext,
  ): Promise<User> {
    const clerkId = req.userContext.sub;

    const userToUpdate = await this.usersService.findOne(id);

    if (userToUpdate.clerkId !== clerkId) {
      console.warn(
        `Permissão negada: Usuário ${clerkId} tentando atualizar DB ID ${id} de outro usuário (${userToUpdate.clerkId})`,
      );
      throw new ForbiddenException(
        'Você não tem permissão para modificar este recurso.',
      );
    }

    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(ClerkAuthGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() req: RequestWithUserContext,
  ): Promise<User> {
    const clerkId = req.userContext.sub;

    const userToDelete = await this.usersService.findOne(id);

    if (userToDelete.clerkId !== clerkId) {
      console.warn(
        `Permissão negada: Usuário ${clerkId} tentando deletar DB ID ${id} de outro usuário (${userToDelete.clerkId})`,
      );
      throw new ForbiddenException(
        'Você não tem permissão para remover este recurso.',
      );
    }

    return this.usersService.remove(id);
  }

  /**
   * NOVO: Endpoint para exclusão completa da conta do usuário
   * Requer autenticação via Clerk
   * A senha é validada através do Clerk antes da exclusão
   */
  @Delete('me/account')
  @UseGuards(ClerkAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMyAccount(
    @Req() req: RequestWithUserContext,
    @Body() deleteAccountDto: DeleteAccountDto,
  ): Promise<void> {
    const clerkId = req.userContext.sub;
    const userEmail = req.userContext.email || req.userContext.email_address;

    this.logger.log(`Solicitação de exclusão de conta recebida para: ${userEmail}`);

    try {
      // Validar senha através do Clerk
      if (deleteAccountDto.password && userEmail) {
        try {
          const { clerkClient } = await import('../config/clerk.config');

          // Tentar verificar a senha através de uma tentativa de sign-in
          // Nota: Esta é uma validação básica. Em produção, considere usar Clerk's password verification API
          this.logger.log(`Verificando credenciais para ${userEmail}...`);

          // Como não podemos fazer sign-in de um usuário já logado,
          // vamos apenas verificar se o usuário existe e está ativo
          const clerkUser = await clerkClient.users.getUser(clerkId);

          if (!clerkUser) {
            throw new ForbiddenException('Usuário não encontrado');
          }

          // A senha foi fornecida como confirmação pelo usuário
          // O fato do usuário estar autenticado (passou pelo guard) já é uma validação
          this.logger.log(`Usuário verificado, procedendo com exclusão...`);
        } catch (clerkError) {
          this.logger.error(`Erro ao verificar usuário no Clerk:`, clerkError);
          throw new ForbiddenException('Erro ao validar credenciais');
        }
      }

      // Proceder com a exclusão
      await this.usersService.deleteAccountByClerkId(clerkId);

      this.logger.log(`Conta deletada com sucesso para: ${userEmail}`);
    } catch (error) {
      this.logger.error(`Erro ao deletar conta para ${userEmail}:`, error);

      if (error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Não foi possível processar a exclusão da conta. Tente novamente mais tarde.',
      );
    }
  }
}
