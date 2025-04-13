import { prisma } from '../../_lib/prisma';

export const skipMiddleware = true; // Sinaliza que podemos pular o middleware de autenticação

// Função para verificar a saúde da API
async function handler(request: Request) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro na verificação de health check:', error);
    return Response.json(
      { status: 'error', message: 'Database error', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

// Expo Router requer um componente React como default export
export default function HealthCheckRoute() {
  return null; // Componente vazio, já que esta é uma rota de API
}

// Métodos HTTP suportados
export const GET = handler;
