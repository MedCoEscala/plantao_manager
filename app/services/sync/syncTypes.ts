import { User } from '../../types/user';

export interface SyncResponse {
  success: boolean;
  error?: string;
}

export interface SyncService {
  /**
   * Sincroniza dados do usuário entre o Clerk e o SQLite local
   */
  syncUserData: () => Promise<SyncResponse>;

  /**
   * Verifica se há dados locais para sincronizar
   */
  hasPendingSync: () => Promise<boolean>;

  /**
   * Obtém os dados do usuário do armazenamento local (SQLite)
   */
  getUserFromLocal: () => Promise<User | null>;

  /**
   * Atualiza os dados do usuário no armazenamento local (SQLite)
   */
  updateUserInLocal: (user: User) => Promise<boolean>;
}
