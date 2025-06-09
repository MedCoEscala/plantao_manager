import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Configurações do PrismaClient com logs básicos
    super({
      log: ['info', 'warn', 'error'],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      await this.$queryRaw`SELECT 1 as test`;
    } catch (error) {
      console.error('Erro ao conectar com banco de dados:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Teste de conectividade falhou:', error);
      return false;
    }
  }

  // Você pode adicionar métodos personalizados aqui para limpar dados em testes,
  // ou para lidar com transações complexas, se necessário.
}
