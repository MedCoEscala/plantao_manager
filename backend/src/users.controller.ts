import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Param,
  UsePipes,
  ValidationPipe,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users') // Define a rota base /users
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Comentar rota /sync pois syncUser foi comentado no service
  // @Post('sync')
  // @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  // @HttpCode(HttpStatus.OK)
  // async syncUser(@Body() syncUserDto: SyncUserDto) {
  //   const user = await this.usersService.syncUser(syncUserDto);
  //   return { message: 'Usuário sincronizado com sucesso', userId: user.id };
  // }

  // Comentar rota GET /:userId pois findUserById foi comentado no service
  // @Get(':userId')
  // async findUserById(@Param('userId') userId: string) {
  //   const user = await this.usersService.findUserById(userId);
  //   if (!user) {
  //     throw new NotFoundException('Usuário não encontrado.');
  //   }
  //   return user;
  // }

  // Comentar rota PUT /:userId pois updateUser foi comentado no service
  // @Put(':userId')
  // @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  // async updateUser(
  //   @Param('userId') userId: string,
  //   @Body() updateUserDto: UpdateUserDto,
  // ) {
  //   const updatedUser = await this.usersService.updateUser(
  //     userId,
  //     updateUserDto,
  //   );
  //   const { email, createdAt, updatedAt, ...result } = updatedUser;
  //   return result;
  // }
}
