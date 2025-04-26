import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Configurações adicionais do PrismaClient podem ir aqui, como logging
    super({
      // log: ['query', 'info', 'warn', 'error'], // Descomente para ver logs do Prisma
    });
  }

  async onModuleInit() {
    // O Prisma Client conecta-se preguiçosamente, mas podemos conectar explicitamente aqui
    await this.$connect();
    console.log('PrismaService conectado ao banco de dados.');
  }

  async onModuleDestroy() {
    // Fecha a conexão com o banco de dados quando a aplicação desliga
    await this.$disconnect();
    console.log('PrismaService desconectado do banco de dados.');
  }

  // Você pode adicionar métodos personalizados aqui para limpar dados em testes,
  // ou para lidar com transações complexas, se necessário.
}
