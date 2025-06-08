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
    const startTime = Date.now();
    try {
      console.log('🔌 [DB] Iniciando conexão com banco de dados...');

      // O Prisma Client conecta-se preguiçosamente, mas podemos conectar explicitamente aqui
      await this.$connect();
      console.log('✅ [DB] PrismaService conectado ao banco de dados.');

      // Teste básico de conectividade
      const testResult = await this.$queryRaw`SELECT 1 as test`;
      console.log('✅ [DB] Teste de conectividade realizado:', testResult);

      // Verificar status da conexão
      const connectionTime = Date.now() - startTime;
      console.log(`📊 [DB] Tempo de conexão: ${connectionTime}ms`);
    } catch (error) {
      const connectionTime = Date.now() - startTime;
      console.error(
        `❌ [DB] Erro ao conectar com banco (${connectionTime}ms):`,
        error,
      );
      console.error(
        `❌ [DB] DATABASE_URL: ${process.env.DATABASE_URL ? 'Definida' : 'NÃO DEFINIDA'}`,
      );
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      // Fecha a conexão com o banco de dados quando a aplicação desliga
      await this.$disconnect();
      console.log('🔌 [DB] PrismaService desconectado do banco de dados.');
    } catch (error) {
      console.error('❌ [DB] Erro ao desconectar:', error);
    }
  }

  // Método para testar conectividade durante runtime
  async testConnection(): Promise<boolean> {
    try {
      const startTime = Date.now();
      await this.$queryRaw`SELECT 1`;
      const duration = Date.now() - startTime;
      console.log(`✅ [DB] Teste de conectividade OK (${duration}ms)`);
      return true;
    } catch (error) {
      console.error('❌ [DB] Teste de conectividade FALHOU:', error);
      return false;
    }
  }

  // Você pode adicionar métodos personalizados aqui para limpar dados em testes,
  // ou para lidar com transações complexas, se necessário.
}
