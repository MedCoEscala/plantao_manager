import { User } from '../../types/user';

export interface SyncResponse {
  success: boolean;
  error?: string;
}

export interface SyncService {
  syncUserData: () => Promise<SyncResponse>;

  hasPendingSync: () => Promise<boolean>;

  getUserFromLocal: () => Promise<User | null>;

  updateUserInLocal: (user: User) => Promise<boolean>;
}

export default {
  SyncService: null as any,
};

// Comentando todo o conteúdo
/*
export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string; // Ex: 'Shift', 'Location', 'Payment'
  data: any;
  timestamp: number;
  status: 'pending' | 'syncing' | 'synced' | 'error';
  attempts: number;
  lastAttempt?: number;
  error?: string;
}

export interface SyncStats {
  pending: number;
  synced: number;
  errors: number;
  lastSyncTime?: number;
}

export interface SyncConfig {
  retryLimit: number;
  batchSize: number;
  syncInterval: number; // em milissegundos
}
*/
export {}; // Export vazio
