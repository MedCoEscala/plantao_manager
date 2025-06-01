// Comentando todo o conteúdo
/*
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-expo';
import { AuthUser, AuthService } from './authTypes'; // Importação provavelmente quebrada agora

export class ClerkAuthService implements AuthService {
  private clerk: any; // Deveria usar tipo específico do Clerk se possível

  constructor(clerkInstance: any) {
    this.clerk = clerkInstance; // Passar a instância do Clerk ou usar hooks
  }

  // Este método faria mais sentido no backend com clerk-sdk-node
  // No frontend, a validação é feita pelo próprio ClerkProvider/hooks
  async verifyTokenAndGetUser(token: string): Promise<AuthUser | null> {
    // No frontend, geralmente não validamos o token manualmente assim.
    // O estado de autenticação é gerenciado pelos hooks useAuth/useUser.
    console.warn('verifyTokenAndGetUser chamado no frontend, geralmente desnecessário.');
    // Se precisar realmente dos dados do usuário logado, use o hook useUser
    // const { user } = useUser();
    // Se precisar do token para enviar ao backend, use useAuth().getToken()
    // Este método como está provavelmente não funcionará corretamente no Expo.
    try {
      // Tentar obter usuário logado via hook (isso só funciona em componentes)
      // const { user } = useUser(); // Não funciona fora de componentes
      // Simulação:
      const user = this.clerk?.user; // Acesso direto pode não funcionar
      if (!user) return null;

      return {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress || null,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        imageUrl: user.imageUrl || null,
      };
    } catch (error) {
      console.error('Erro simulando verifyTokenAndGetUser no frontend:', error);
      return null;
    }
  }

  // Outros métodos podem ser implementados aqui se necessário,
  // mas geralmente os hooks do Clerk são suficientes no frontend.
}
*/

// Default export para resolver warning do React Router
const clerkAuthService = {};

export default clerkAuthService;
