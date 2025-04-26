// Comentando todo o conteúdo, pois usa Prisma no frontend
/*
import { PrismaClient, User } from '@prisma/client';
import { AuthUser, ClerkAuthService } from './clerkAuthService'; // Reutiliza a busca do Clerk

export class ClerkPrismaAuthService extends ClerkAuthService {
  private prisma: PrismaClient;

  constructor(clerkClient: any, prismaClient: PrismaClient) {
    super(clerkClient);
    this.prisma = prismaClient;
  }

  // Sobrescreve ou estende o método para buscar/criar usuário no Prisma após validação do Clerk
  async verifyTokenAndGetUser(token: string): Promise<AuthUser | null> {
    const clerkUser = await super.verifyTokenAndGetUser(token);
    if (!clerkUser) {
      return null;
    }

    try {
      // Tenta encontrar o usuário no DB local usando o ID do Clerk
      let dbUser = await this.prisma.user.findUnique({
        where: { id: clerkUser.id },
      });

      // Se não encontrar, cria o usuário no DB
      if (!dbUser) {
        console.log(`Usuário ${clerkUser.id} não encontrado no DB, criando...`);
        dbUser = await this.prisma.user.create({
          data: {
            id: clerkUser.id,
            email: clerkUser.email || 'no-email@example.com', // Garante um email
            name: clerkUser.name || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Usuário Sem Nome',
            // Mapear outros campos se necessário (imageUrl, etc.)
            // Cuidado com campos obrigatórios no schema Prisma
          },
        });
        console.log(`Usuário ${clerkUser.id} criado no DB.`);
      }

      // Retorna uma combinação ou apenas os dados do Clerk/DB conforme necessário
      // Aqui retornamos os dados do Clerk, assumindo que são suficientes para AuthUser
      return clerkUser;

    } catch (error) {
      console.error('Erro ao buscar/criar usuário no Prisma:', error);
      // Decide se falha a autenticação ou continua sem o usuário do DB
      // Retornar null falharia a autenticação se o Guard depender disso
      // return null;
      // Ou retorna os dados do Clerk mesmo com erro no DB?
       return clerkUser; // CUIDADO: Permite login mesmo se o DB falhar
    }
  }

  // Outros métodos específicos que interagem com Prisma podem ser adicionados aqui
}
*/
export {}; // Export vazio
