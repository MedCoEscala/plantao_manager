import { createClerkClient } from '@clerk/clerk-sdk-node';

const clerkSecretKey = process.env.CLERK_SECRET_KEY;

if (!clerkSecretKey) {
  throw new Error(
    'CLERK_SECRET_KEY não encontrada nas variáveis de ambiente. Certifique-se de que está configurada no arquivo .env',
  );
}

// Criar cliente do Clerk com configuração explícita
export const clerkClient = createClerkClient({
  secretKey: clerkSecretKey,
});
