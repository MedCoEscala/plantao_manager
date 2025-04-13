import { PrismaClient } from '@prisma/client';

// Inicialização do cliente Prisma (singleton)
let prismaInstance: PrismaClient | undefined;

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return prismaInstance;
}

// Cliente Prisma exportado para uso em toda a aplicação
export const prisma = getPrismaClient();
