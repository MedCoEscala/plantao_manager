import { fetchWithAuth } from '@app/utils/api-client';

import { ProfileResponse, ProfileService, ProfileUpdateData } from './profileTypes';
import { User } from '../../types/user';

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
        name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        phoneNumber: userData.phoneNumber || '',
        birthDate: userData.birthDate || '',
      };

      console.log('✅ [ApiProfileService] Perfil carregado:', user);
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
            name:
              syncedUserData.name ||
              `${syncedUserData.firstName || ''} ${syncedUserData.lastName || ''}`.trim(),
            createdAt: syncedUserData.createdAt,
            updatedAt: syncedUserData.updatedAt,
            phoneNumber: syncedUserData.phoneNumber || '',
            birthDate: syncedUserData.birthDate || '',
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

  async updateUserProfile(data: ProfileUpdateData): Promise<ProfileResponse> {
    try {
      console.log('💾 [ApiProfileService] Atualizando perfil:', data);

      const updatePayload: any = {};

      if (data.name) {
        const nameParts = data.name.split(' ');
        updatePayload.firstName = nameParts[0];
        updatePayload.lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      }

      if (data.phoneNumber !== undefined) {
        updatePayload.phoneNumber = data.phoneNumber;
      }

      if (data.birthDate) {
        updatePayload.birthDate = data.birthDate;
      }

      const updatedUser = await fetchWithAuth<any>(
        '/users/me',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        },
        this.getToken
      );

      const user: User = {
        id: updatedUser.id,
        email: updatedUser.email,
        name:
          updatedUser.name || `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim(),
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        phoneNumber: updatedUser.phoneNumber || '',
        birthDate: updatedUser.birthDate || '',
      };

      console.log('✅ [ApiProfileService] Perfil atualizado com sucesso:', user);

      return {
        success: true,
        user,
      };
    } catch (error) {
      console.error('❌ [ApiProfileService] Erro ao atualizar perfil:', error);
      return {
        success: false,
        error: (error as any)?.response?.data?.message || 'Erro ao atualizar perfil',
      };
    }
  }
}

export const createApiProfileService = (getToken: () => Promise<string | null>) => {
  return new ApiProfileService(getToken);
};

// Default export para resolver warning do React Router
export default { createApiProfileService };
