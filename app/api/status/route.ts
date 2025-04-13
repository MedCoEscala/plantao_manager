import { prisma } from '../../_lib/prisma';
import clerk from '@clerk/clerk-sdk-node';

export const skipMiddleware = true; // Sinaliza que podemos pular o middleware de autenticação

// Função para verificar o status da API e seus serviços
async function handler(request: Request) {
  try {
    // Verificar conexão com banco de dados
    let dbStatus = { status: 'unknown', message: '' };
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = {
        status: 'connected',
        message: 'Conexão com o banco de dados está operando normalmente',
      };
    } catch (error) {
      console.error('Erro na conexão com banco de dados:', error);
      dbStatus = {
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Erro desconhecido na conexão com o banco de dados',
      };
    }

    // Verificar conexão com Clerk
    let clerkStatus = { status: 'unknown', message: '' };
    try {
      if (!process.env.CLERK_SECRET_KEY) {
        throw new Error('CLERK_SECRET_KEY não está definida');
      }

      const keys = Object.keys(clerk);
      if (keys.length > 0) {
        clerkStatus = {
          status: 'initialized',
          message: 'Serviço de autenticação inicializado corretamente',
        };
      } else {
        throw new Error('Objeto clerk está vazio');
      }
    } catch (error) {
      console.error('Erro ao verificar Clerk:', error);
      clerkStatus = {
        status: 'error',
        message:
          error instanceof Error ? error.message : 'Erro desconhecido no serviço de autenticação',
      };
    }

    // Verificar variáveis de ambiente essenciais
    const environmentStatus = [];

    if (!process.env.DATABASE_URL) {
      environmentStatus.push({
        name: 'DATABASE_URL',
        status: 'missing',
        message: 'URL do banco de dados não configurada',
      });
    } else {
      environmentStatus.push({
        name: 'DATABASE_URL',
        status: 'configured',
        message: 'URL do banco de dados configurada',
      });
    }

    if (!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      environmentStatus.push({
        name: 'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
        status: 'missing',
        message: 'Chave pública do Clerk não configurada',
      });
    } else {
      environmentStatus.push({
        name: 'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
        status: 'configured',
        message: 'Chave pública do Clerk configurada',
      });
    }

    if (!process.env.CLERK_SECRET_KEY) {
      environmentStatus.push({
        name: 'CLERK_SECRET_KEY',
        status: 'missing',
        message: 'Chave secreta do Clerk não configurada',
      });
    } else {
      environmentStatus.push({
        name: 'CLERK_SECRET_KEY',
        status: 'configured',
        message: 'Chave secreta do Clerk configurada',
      });
    }

    // Verificar se há problemas no ambiente
    const hasEnvironmentErrors = environmentStatus.some((env) => env.status === 'missing');

    // Determinar status geral da aplicação
    let generalStatus = 'unhealthy';
    if (
      dbStatus.status === 'connected' &&
      clerkStatus.status === 'initialized' &&
      !hasEnvironmentErrors
    ) {
      generalStatus = 'healthy';
    }

    return Response.json({
      status: generalStatus,
      apiVersion: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        auth: clerkStatus,
        environment: environmentStatus,
      },
    });
  } catch (error) {
    console.error('Erro ao verificar status da API:', error);
    return Response.json(
      {
        status: 'error',
        message:
          error instanceof Error ? error.message : 'Erro desconhecido ao verificar status da API',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Expo Router requer um componente React como default export
export default function StatusRoute() {
  return null; // Componente vazio, já que esta é uma rota de API
}

// Métodos HTTP suportados
export const GET = handler;
