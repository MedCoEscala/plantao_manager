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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { Request } from 'express';
import { User } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Endpoint para sincronizar (criar/atualizar) o usuário logado no DB local.
   * Chamado pelo frontend após o login bem-sucedido.
   */
  @Post('sync')
  @UseGuards(ClerkAuthGuard)
  @HttpCode(HttpStatus.OK)
  async syncUser(
    @Req() req: Request & { auth: { userId: string } },
  ): Promise<User> {
    console.log(
      `UsersController: syncUser chamado por Clerk ID: ${req.auth.userId}`,
    );
    return this.usersService.syncUserWithClerk(req.auth);
  }

  /**
   * Retorna o perfil do usuário atualmente autenticado.
   */
  @UseGuards(ClerkAuthGuard)
  @Get('me')
  async getMyProfile(
    @Req() req: Request & { auth: { userId: string } },
  ): Promise<User> {
    const clerkId = req.auth.userId;
    console.log(
      `UsersController: getMyProfile chamado para Clerk ID: ${clerkId}`,
    );
    return this.usersService.findOneByClerkId(clerkId);
  }

  @UseGuards(ClerkAuthGuard)
  @Get()
  findAll(@Req() req: Request) {
    console.log('UsersController: findAll chamado');
    console.log('Usuário autenticado (Claims):', (req as any).auth);
    return this.usersService.findAll();
  }

  @UseGuards(ClerkAuthGuard)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: Request & { auth: { userId: string } },
  ): Promise<User> {
    console.log(`UsersController: findOne chamado para DB ID: ${id}`);
    const user = await this.usersService.findOne(id);

    if (user.clerkId !== req.auth.userId) {
      console.warn(
        `Permissão negada: Usuário ${req.auth.userId} tentando acessar DB ID ${id} de outro usuário (${user.clerkId})`,
      );
      throw new ForbiddenException(
        'Você não tem permissão para acessar este recurso.',
      );
    }

    console.log(
      `Permissão concedida para ${req.auth.userId} acessar DB ID ${id}`,
    );
    return user;
  }

  @UseGuards(ClerkAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: any,
    @Req() req: Request & { auth: { userId: string } },
  ): Promise<User> {
    console.log(
      `UsersController: update chamado para DB ID: ${id} por ${req.auth.userId}`,
    );

    const userToUpdate = await this.usersService.findOne(id);

    if (userToUpdate.clerkId !== req.auth.userId) {
      console.warn(
        `Permissão negada: Usuário ${req.auth.userId} tentando atualizar DB ID ${id} de outro usuário (${userToUpdate.clerkId})`,
      );
      throw new ForbiddenException(
        'Você não tem permissão para modificar este recurso.',
      );
    }

    console.log(
      `Permissão concedida para ${req.auth.userId} atualizar DB ID ${id}`,
    );
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(ClerkAuthGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() req: Request & { auth: { userId: string } },
  ): Promise<User> {
    console.log(
      `UsersController: remove chamado para DB ID: ${id} por ${req.auth.userId}`,
    );

    const userToDelete = await this.usersService.findOne(id);

    if (userToDelete.clerkId !== req.auth.userId) {
      console.warn(
        `Permissão negada: Usuário ${req.auth.userId} tentando deletar DB ID ${id} de outro usuário (${userToDelete.clerkId})`,
      );
      throw new ForbiddenException(
        'Você não tem permissão para remover este recurso.',
      );
    }

    console.log(
      `Permissão concedida para ${req.auth.userId} remover DB ID ${id}`,
    );
    return this.usersService.remove(id);
  }
}
