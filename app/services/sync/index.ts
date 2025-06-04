import type { SyncResponse, SyncService } from './syncTypes';
import userSyncService from './userSyncService';

export { userSyncService };
export type { SyncResponse, SyncService };

export default {
  userSyncService,
};

// Comentando exportações para desabilitar a pasta sync
/*
export * from './syncManager';
export * from './syncTypes';
// Não exportar ações específicas diretamente, usar o manager
*/
export {}; // Export vazio
