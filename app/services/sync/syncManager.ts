// Comentando todo o conteúdo
/*
import { initDatabase } from '@/database/init';
import { SyncOperation, SyncStats } from './syncTypes';
import { db } from '@/database/client';
import NetInfo from '@react-native-community/netinfo';
import { synchronizeShifts } from './syncActions/shiftSync';
import { synchronizeLocations } from './syncActions/locationSync';
import { synchronizePayments } from './syncActions/paymentSync';

const MAX_RETRIES = 3;
const BATCH_SIZE = 10;
let isSyncing = false;
let lastSyncTime: number | null = null;

async function getPendingOperations(): Promise<SyncOperation[]> {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM sync_queue WHERE status = 'pending' OR status = 'error' ORDER BY timestamp ASC;`,
        [],
        (_, { rows }) => resolve(rows._array),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
}

async function updateOperationStatus(
  id: string,
  status: 'syncing' | 'synced' | 'error',
  errorMsg?: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `UPDATE sync_queue SET status = ?, error = ?, attempts = attempts + 1, lastAttempt = ? WHERE id = ?;`,
        [status, errorMsg || null, Date.now(), id],
        () => resolve(),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
}

async function processOperation(op: SyncOperation): Promise<void> {
  console.log(`Processing ${op.entity} ${op.type}: ${op.id}`);
  await updateOperationStatus(op.id, 'syncing');
  try {
    switch (op.entity) {
      case 'Shift':
        await synchronizeShifts(op);
        break;
      case 'Location':
        await synchronizeLocations(op);
        break;
      case 'Payment':
        await synchronizePayments(op);
        break;
      default:
        throw new Error(`Unknown entity type: ${op.entity}`);
    }
    await updateOperationStatus(op.id, 'synced');
    console.log(`Synced ${op.entity} ${op.type}: ${op.id}`);
  } catch (error: any) {
    console.error(`Error syncing ${op.entity} ${op.type} ${op.id}:`, error);
    await updateOperationStatus(op.id, 'error', error.message);
    // Considerar não lançar erro aqui para continuar o batch
    // throw error; // Se descomentar, um erro para o batch inteiro
  }
}

export async function triggerSync(): Promise<SyncStats> {
  if (isSyncing) {
    console.log('Sync already in progress.');
    return getSyncStats();
  }

  const netState = await NetInfo.fetch();
  if (!netState.isConnected) {
    console.log('Sync skipped: No internet connection.');
    return getSyncStats();
  }

  isSyncing = true;
  console.log('Starting sync...');

  try {
    await initDatabase(); // Garante que a tabela exista
    let pendingOps = await getPendingOperations();
    console.log(`Found ${pendingOps.length} pending operations.`);

    const opsToProcess = pendingOps.filter(op => op.attempts < MAX_RETRIES);
    const erroredOps = pendingOps.filter(op => op.status === 'error' && op.attempts >= MAX_RETRIES);

    for (let i = 0; i < opsToProcess.length; i += BATCH_SIZE) {
      const batch = opsToProcess.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${i / BATCH_SIZE + 1}/${Math.ceil(opsToProcess.length / BATCH_SIZE)}`);
      await Promise.all(batch.map(processOperation));
      // Poderia adicionar um pequeno delay entre batches se necessário
    }

    lastSyncTime = Date.now();
    console.log('Sync finished.');

  } catch (error) {
    console.error('Error during sync process:', error);
    // O erro específico da operação já foi logado e status atualizado
  } finally {
    isSyncing = false;
  }
  return getSyncStats();
}

export async function getSyncStats(): Promise<SyncStats> {
   return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      let stats: Partial<SyncStats> = { pending: 0, synced: 0, errors: 0 };
      tx.executeSql(
        `SELECT status, COUNT(*) as count FROM sync_queue GROUP BY status;`,
        [],
        (_, { rows }) => {
          rows._array.forEach(row => {
            if (row.status === 'pending') stats.pending = row.count;
            else if (row.status === 'synced') stats.synced = row.count;
            else if (row.status === 'error') stats.errors = row.count;
          });
          stats.lastSyncTime = lastSyncTime || undefined;
          resolve(stats as SyncStats);
        },
        (_, error) => {
          // Se a tabela não existe, retorna stats zerados
          if (error.message.includes('no such table')) {
             resolve({ pending: 0, synced: 0, errors: 0, lastSyncTime: lastSyncTime || undefined });
          } else {
             console.error("Error fetching sync stats:", error);
             reject(error);
          }
          return true; // Indica que o erro foi tratado (ou ignorado)
        }
      );
    });
  });
}

// TODO: Adicionar lógica para enfileirar operações (addSyncOperation)
// que seria chamada pelos repositórios quando offline.
*/

// Default export para resolver warning do React Router
const syncManager = {};

export default syncManager;
