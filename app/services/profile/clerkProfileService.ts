import * as SecureStore from 'expo-secure-store';
import { ProfileResponse, ProfileService, ProfileUpdateData } from './profileTypes';
import { User } from '../../types/user';
import { formatUserFromClerk } from '../auth/utils';

// Constante para armazenamento seguro
const CLERK_USER_KEY = 'clerk_user';

class ClerkProfileService implements ProfileService {
  /**
   * Obtém os dados do perfil do usuário atual
   */
  async getUserProfile(): Promise<User | null> {
    try {
      // Verificar se o usuário está logado
      const clerk = globalThis.Clerk;
      if (!clerk || !clerk.session) {
        return null;
      }

      // Tentar obter os dados do usuário do armazenamento local primeiro (para acesso offline)
      const userJson = await SecureStore.getItemAsync(CLERK_USER_KEY);
      if (userJson) {
        return JSON.parse(userJson) as User;
      }

      // Se não houver dados locais, buscar do Clerk
      const user = await clerk.user;
      if (!user) {
        return null;
      }

      // Formatar e salvar os dados localmente
      const userInfo = formatUserFromClerk(user, user.primaryEmailAddress?.emailAddress || '');
      await SecureStore.setItemAsync(CLERK_USER_KEY, JSON.stringify(userInfo));

      return userInfo;
    } catch (error) {
      console.error('Erro ao obter perfil do usuário:', error);
      return null;
    }
  }

  /**
   * Atualiza os dados do perfil do usuário
   */
  async updateUserProfile(data: ProfileUpdateData): Promise<ProfileResponse> {
    try {
      // Verificar se o usuário está logado
      const clerk = globalThis.Clerk;
      if (!clerk || !clerk.user) {
        return {
          success: false,
          error: 'Usuário não autenticado',
        };
      }

      const user = clerk.user;
      const updateData: any = {};
      const publicMetadata: any = {};

      // Preparar dados a serem atualizados
      if (data.name) {
        const nameParts = data.name.split(' ');
        updateData.firstName = nameParts[0];
        updateData.lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      }

      if (data.phoneNumber) {
        try {
          // Verificar se já tem um telefone cadastrado
          const existingPhones = user.phoneNumbers || [];

          if (existingPhones.length === 0) {
            // Criar novo telefone
            await user.createPhoneNumber({ phoneNumber: data.phoneNumber });
          } else {
            // Atualizar telefone existente
            await user.updatePhoneNumber({
              phoneNumberId: existingPhones[0].id,
              phoneNumber: data.phoneNumber,
            });
          }
        } catch (phoneError) {
          console.error('Erro ao atualizar telefone:', phoneError);
        }
      }

      if (data.birthDate) {
        publicMetadata.birthDate = data.birthDate;
      }

      // Se houver metadados, atualizar
      if (Object.keys(publicMetadata).length > 0) {
        updateData.publicMetadata = publicMetadata;
      }

      // Atualizar dados no Clerk
      if (Object.keys(updateData).length > 0) {
        await user.update(updateData);
      }

      // Obter dados atualizados
      const updatedUser = await this.getUserProfile();
      if (!updatedUser) {
        return {
          success: false,
          error: 'Não foi possível obter os dados atualizados',
        };
      }

      return {
        success: true,
        user: updatedUser,
      };
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar perfil',
      };
    }
  }
}

export default new ClerkProfileService();
