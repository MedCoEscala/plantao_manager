import * as SecureStore from 'expo-secure-store';

import { SyncResponse, SyncService } from './syncTypes';
import { User } from '../../types/user';

const LAST_SYNC_KEY = 'last_user_sync';

class UserSyncService implements SyncService {
  async syncUserData(): Promise<SyncResponse> {
    try {
      // A sincronização agora é feita pelo ProfileContext via backend
      // Este método é mantido para compatibilidade mas não faz nada
      console.log('⚠️ [UserSyncService] syncUserData is deprecated. Use ProfileContext instead.');

      await SecureStore.setItemAsync(LAST_SYNC_KEY, new Date().toISOString());

      return {
        success: true,
      };
    } catch (error) {
      console.error('Erro na sincronização de dados do usuário:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido na sincronização',
      };
    }
  }

  async hasPendingSync(): Promise<boolean> {
    try {
      const lastSync = await SecureStore.getItemAsync(LAST_SYNC_KEY);
      if (!lastSync) return true;

      const lastSyncDate = new Date(lastSync);
      const now = new Date();
      const diff = now.getTime() - lastSyncDate.getTime();
      const hoursDiff = diff / (1000 * 60 * 60);

      return hoursDiff > 24;
    } catch (error) {
      console.error('Erro ao verificar sincronização pendente:', error);
      return true;
    }
  }

  async getUserFromLocal(): Promise<User | null> {
    // Dados locais agora são gerenciados pelo ProfileContext
    console.log('⚠️ [UserSyncService] getUserFromLocal is deprecated. Use ProfileContext instead.');
    return null;
  }

  async updateUserInLocal(user: User): Promise<boolean> {
    // Atualizações locais agora são gerenciadas pelo ProfileContext
    console.log(
      '⚠️ [UserSyncService] updateUserInLocal is deprecated. Use ProfileContext instead.'
    );
    return true;
  }
}

export default new UserSyncService();
