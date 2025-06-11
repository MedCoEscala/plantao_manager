import { fetchWithAuth } from '@/utils/api-client';
import { User, UserUpdateInput } from '@/types/user';
import { ProfileService, ProfileResponse } from './profileTypes';

class ApiProfileService implements ProfileService {
  constructor(private getToken: () => Promise<string | null>) {}

  async getUserProfile(): Promise<User | null> {
    try {
      console.log('🔍 [ApiProfileService] Buscando perfil do usuário...');

      const userData = await fetchWithAuth<any>('/users/me', { method: 'GET' }, this.getToken);

      if (!userData) {
        console.warn('⚠️ [ApiProfileService] Dados do usuário não encontrados');
        return null;
      }

      const user: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber || undefined,
        birthDate: userData.birthDate || undefined,
        gender: userData.gender || undefined,
        imageUrl: userData.imageUrl || undefined,
        clerkId: userData.clerkId,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      };

      console.log('✅ [ApiProfileService] Perfil carregado:', {
        id: user.id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      });
      return user;
    } catch (error) {
      console.error('❌ [ApiProfileService] Erro ao obter perfil:', error);

      // Se usuário não encontrado, tentar sincronizar
      if ((error as any)?.response?.status === 404) {
        try {
          console.log('👤 [ApiProfileService] Tentando sincronizar usuário...');
          await fetchWithAuth('/users/sync', { method: 'POST' }, this.getToken);

          // Tentar buscar novamente
          const syncedUserData = await fetchWithAuth<any>(
            '/users/me',
            { method: 'GET' },
            this.getToken
          );

          const user: User = {
            id: syncedUserData.id,
            email: syncedUserData.email,
            name: syncedUserData.name,
            firstName: syncedUserData.firstName,
            lastName: syncedUserData.lastName,
            phoneNumber: syncedUserData.phoneNumber || undefined,
            birthDate: syncedUserData.birthDate || undefined,
            gender: syncedUserData.gender || undefined,
            imageUrl: syncedUserData.imageUrl || undefined,
            clerkId: syncedUserData.clerkId,
            createdAt: syncedUserData.createdAt,
            updatedAt: syncedUserData.updatedAt,
          };

          console.log('✅ [ApiProfileService] Perfil sincronizado e carregado:', user);
          return user;
        } catch (syncError) {
          console.error('❌ [ApiProfileService] Erro na sincronização:', syncError);
          return null;
        }
      }

      return null;
    }
  }

  async updateUserProfile(data: UserUpdateInput): Promise<ProfileResponse> {
    try {
      console.log('📝 [ApiProfileService] Atualizando perfil:', data);

      const updatedUserData = await fetchWithAuth<any>(
        '/users/me',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
        this.getToken
      );

      const user: User = {
        id: updatedUserData.id,
        email: updatedUserData.email,
        name: updatedUserData.name,
        firstName: updatedUserData.firstName,
        lastName: updatedUserData.lastName,
        phoneNumber: updatedUserData.phoneNumber || undefined,
        birthDate: updatedUserData.birthDate || undefined,
        gender: updatedUserData.gender || undefined,
        imageUrl: updatedUserData.imageUrl || undefined,
        clerkId: updatedUserData.clerkId,
        createdAt: updatedUserData.createdAt,
        updatedAt: updatedUserData.updatedAt,
      };

      console.log('✅ [ApiProfileService] Perfil atualizado:', user);
      return {
        success: true,
        user,
      };
    } catch (error: any) {
      console.error('❌ [ApiProfileService] Erro ao atualizar perfil:', error);
      return {
        success: false,
        error: error?.response?.data?.message || error?.message || 'Erro ao atualizar perfil',
      };
    }
  }
}

let profileServiceInstance: ApiProfileService | null = null;

export function getProfileService(getToken: () => Promise<string | null>): ProfileService {
  if (!profileServiceInstance) {
    profileServiceInstance = new ApiProfileService(getToken);
  }
  return profileServiceInstance;
}

export default profileServiceInstance;
