import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';
import { SQLiteDatabase } from 'expo-sqlite';
import { v4 as uuidv4 } from 'uuid';

const SYNC_QUEUE_KEY = 'sync_queue';
const LAST_SYNC_TIME_KEY = 'last_sync_time';
const CONFLICT_STRATEGY_KEY = 'sync_conflict_strategy';

export type SyncEntityType = 'user' | 'location' | 'shift' | 'payment';
export type SyncOperationType = 'create' | 'update' | 'delete';
export type ConflictStrategy = 'remote-wins' | 'local-wins' | 'manual';

export interface SyncOperation {
  id: string;
  type: SyncOperationType;
  entity: SyncEntityType;
  data: any;
  timestamp: number;
  retryCount?: number;
}

export interface ConflictData {
  id: string;
  entity: SyncEntityType;
  entityId: string;
  localData: any;
  remoteData: any;
  timestamp: number;
}

export class SyncManager {
  private db: SQLiteDatabase | null = null;
  private syncQueue: SyncOperation[] = [];
  private conflicts: ConflictData[] = [];
  private isSyncing: boolean = false;
  private isOnline: boolean = false;
  private conflictStrategy: ConflictStrategy = 'remote-wins';
  private unsubscribeNetInfo: (() => void) | null = null;
  private repositories: Record<SyncEntityType, any> = {
    user: null,
    location: null,
    shift: null,
    payment: null,
  };

  constructor() {
    this.unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = !!state.isConnected;

      if (wasOffline && this.isOnline && this.syncQueue.length > 0) {
        this.syncNow();
      }
    });

    this.loadConflictStrategy();
  }

  public initialize = async (database: SQLiteDatabase): Promise<void> => {
    this.db = database;
    await this.loadQueueFromStorage();

    const netState = await NetInfo.fetch();
    this.isOnline = !!netState.isConnected;
  };

  public registerRepository = (entity: SyncEntityType, repository: any): void => {
    this.repositories[entity] = repository;
  };

  public queueOperation = async (
    type: SyncOperationType,
    entity: SyncEntityType,
    data: any
  ): Promise<string> => {
    const operation: SyncOperation = {
      id: uuidv4(),
      type,
      entity,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.syncQueue.push(operation);
    await this.saveQueueToStorage();

    if (this.isOnline && !this.isSyncing) {
      this.syncNow();
    }

    return operation.id;
  };

  public syncNow = async (): Promise<boolean> => {
    if (this.isSyncing || !this.isOnline || this.syncQueue.length === 0) {
      return false;
    }

    try {
      this.isSyncing = true;

      const operationsToSync = [...this.syncQueue];
      const successfulOps: string[] = [];
      const failedOps: string[] = [];

      for (const operation of operationsToSync) {
        try {
          const success = await this.processOperation(operation);
          if (success) {
            successfulOps.push(operation.id);
          } else {
            const opIndex = this.syncQueue.findIndex((op) => op.id === operation.id);
            if (opIndex >= 0) {
              this.syncQueue[opIndex].retryCount = (this.syncQueue[opIndex].retryCount || 0) + 1;

              if (this.syncQueue[opIndex].retryCount > 5) {
                failedOps.push(operation.id);
              }
            }
          }
        } catch (error) {
          console.error(`Erro ao processar operação ${operation.id}:`, error);
        }
      }

      if (successfulOps.length > 0 || failedOps.length > 0) {
        this.syncQueue = this.syncQueue.filter(
          (op) => !successfulOps.includes(op.id) && !failedOps.includes(op.id)
        );
        await this.saveQueueToStorage();
        await this.updateLastSyncTime();
      }

      return successfulOps.length === operationsToSync.length;
    } catch (error) {
      console.error('Erro durante sincronização:', error);
      return false;
    } finally {
      this.isSyncing = false;
    }
  };

  public getLastSyncTime = async (): Promise<Date | null> => {
    try {
      const lastSyncStr = await SecureStore.getItemAsync(LAST_SYNC_TIME_KEY);
      if (!lastSyncStr) return null;

      return new Date(parseInt(lastSyncStr));
    } catch (error) {
      console.error('Erro ao obter último horário de sincronização:', error);
      return null;
    }
  };

  public hasPendingOperations = (): boolean => {
    return this.syncQueue.length > 0;
  };

  public getPendingOperationsCount = (): number => {
    return this.syncQueue.length;
  };

  public getUnresolvedConflicts = (): ConflictData[] => {
    return this.conflicts;
  };

  public setConflictStrategy = async (strategy: ConflictStrategy): Promise<void> => {
    this.conflictStrategy = strategy;
    await SecureStore.setItemAsync(CONFLICT_STRATEGY_KEY, strategy);
  };

  private loadConflictStrategy = async (): Promise<void> => {
    try {
      const strategy = await SecureStore.getItemAsync(CONFLICT_STRATEGY_KEY);
      if (strategy) {
        this.conflictStrategy = strategy as ConflictStrategy;
      }
    } catch (error) {
      console.error('Erro ao carregar estratégia de resolução de conflitos:', error);
    }
  };

  public resolveConflict = async (
    conflictId: string,
    resolution: 'local' | 'remote' | 'merged',
    mergedData?: any
  ): Promise<boolean> => {
    const conflictIndex = this.conflicts.findIndex((c) => c.id === conflictId);
    if (conflictIndex < 0) return false;

    const conflict = this.conflicts[conflictIndex];

    try {
      if (resolution === 'local') {
        await this.queueOperation('update', conflict.entity, conflict.localData);
      } else if (resolution === 'remote') {
        await this.applyRemoteData(conflict.entity, conflict.remoteData);
      } else if (resolution === 'merged' && mergedData) {
        await this.applyRemoteData(conflict.entity, mergedData);
        await this.queueOperation('update', conflict.entity, mergedData);
      } else {
        return false;
      }

      this.conflicts.splice(conflictIndex, 1);
      return true;
    } catch (error) {
      console.error('Erro ao resolver conflito:', error);
      return false;
    }
  };

  private processOperation = async (operation: SyncOperation): Promise<boolean> => {
    try {
      console.log(`Sincronizando ${operation.entity} - ${operation.type}:`, operation.data);

      await new Promise((resolve) => setTimeout(resolve, 300));

      return true;
    } catch (error) {
      console.error(`Erro ao processar operação ${operation.id}:`, error);
      return false;
    }
  };

  private applyRemoteData = async (entity: SyncEntityType, data: any): Promise<boolean> => {
    try {
      const repository = this.repositories[entity];
      if (!repository) {
        console.error(`Repositório para entidade ${entity} não registrado`);
        return false;
      }

      if (typeof repository.syncFromRemote === 'function') {
        return await repository.syncFromRemote(data);
      }

      return false;
    } catch (error) {
      console.error('Erro ao aplicar dados remotos:', error);
      return false;
    }
  };

  public addConflict = (
    entity: SyncEntityType,
    entityId: string,
    localData: any,
    remoteData: any
  ): string => {
    const conflictId = uuidv4();
    this.conflicts.push({
      id: conflictId,
      entity,
      entityId,
      localData,
      remoteData,
      timestamp: Date.now(),
    });
    return conflictId;
  };

  // Gerenciamento de armazenamento da fila
  private loadQueueFromStorage = async (): Promise<void> => {
    try {
      const queueStr = await SecureStore.getItemAsync(SYNC_QUEUE_KEY);
      if (queueStr) {
        this.syncQueue = JSON.parse(queueStr);
      }
    } catch (error) {
      console.error('Erro ao carregar fila de sincronização:', error);
      this.syncQueue = [];
    }
  };

  private saveQueueToStorage = async (): Promise<void> => {
    try {
      await SecureStore.setItemAsync(SYNC_QUEUE_KEY, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Erro ao salvar fila de sincronização:', error);
    }
  };

  private updateLastSyncTime = async (): Promise<void> => {
    try {
      await SecureStore.setItemAsync(LAST_SYNC_TIME_KEY, Date.now().toString());
    } catch (error) {
      console.error('Erro ao atualizar horário de sincronização:', error);
    }
  };

  public dispose = (): void => {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
  };
}

const syncManager = new SyncManager();
export default syncManager;
