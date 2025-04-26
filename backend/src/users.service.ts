import { Injectable, NotFoundException } from '@nestjs/common';
// import { CreateUserDto } from './dto/create-user.dto';
// import { Prisma } from '@prisma/client'; // Comentar se não for usar Prisma agora
// import { PrismaService } from '../prisma/prisma.service'; // Comentar
// import { plainToClass } from 'class-transformer'; // Comentar se não for usar DTOs
// import { SyncUserDto } from './dto/sync-user.dto'; // Comentar
// import { UpdateUserDto } from './dto/update-user.dto'; // Comentar

@Injectable()
export class UsersService {
  // constructor(private prisma: PrismaService) {} // Comentar construtor do Prisma

  // Comentar toda a função syncUser pois depende de Prisma e DTOs
  // syncUser(syncUserDto: SyncUserDto) {
  //   const { id, email_addresses, first_name, last_name, image_url, created_at, updated_at } = syncUserDto.data;
  //   const email = email_addresses?.find(e => e.id === syncUserDto.data.primary_email_address_id)?.email_address;
  //   if (!email) {
  //     console.error('Email principal não encontrado para o usuário:', id);
  //     throw new Error('Email principal não encontrado.');
  //   }
  //   const userData: Prisma.UserCreateInput = {
  //     id: id,
  //     email: email,
  //     firstName: first_name,
  //     lastName: last_name,
  //     imageUrl: image_url,
  //     createdAt: new Date(created_at),
  //     updatedAt: new Date(updated_at),
  //   };
  //   return this.prisma.user.upsert({
  //     where: { id: id },
  //     update: userData,
  //     create: userData,
  //   });
  // }

  create(createUserDto: any) {
    console.log('UsersService: create chamado com', createUserDto);
    // return this.prisma.user.create({ data: createUserDto }); // Comentar chamada ao Prisma
    return 'This action adds a new user (placeholder)';
  }

  findAll() {
    console.log('UsersService: findAll chamado');
    // return this.prisma.user.findMany(); // Comentar chamada ao Prisma
    return `This action returns all users (placeholder)`;
  }

  findOne(id: string) {
    console.log(`UsersService: findOne chamado para ID: ${id}`);
    // const user = await this.prisma.user.findUnique({ where: { id } }); // Comentar chamada ao Prisma
    // if (!user) {
    //   throw new NotFoundException(`User with ID "${id}" not found`);
    // }
    // return user;
    return `This action returns a #${id} user (placeholder)`;
  }

  update(id: string, updateUserDto: any) {
    console.log(
      `UsersService: update chamado para ID: ${id} com`,
      updateUserDto,
    );
    // return this.prisma.user.update({ where: { id }, data: updateUserDto }); // Comentar chamada ao Prisma
    return `This action updates a #${id} user (placeholder)`;
  }

  remove(id: string) {
    console.log(`UsersService: remove chamado para ID: ${id}`);
    // return this.prisma.user.delete({ where: { id } }); // Comentar chamada ao Prisma
    return `This action removes a #${id} user (placeholder)`;
  }
}
