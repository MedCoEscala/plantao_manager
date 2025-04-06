import { SQLiteDatabase } from 'expo-sqlite';
import syncManager from '../sync/syncManager';
import userRepository from '../../repositories/userRepository';
import locationRepository from '../../repositories/locationRepository';
import shiftRepository from '../../repositories/shiftRepository';
import paymentRepository from '../../repositories/paymentRepository';

export async function initializeModules(database: SQLiteDatabase): Promise<void> {
  try {
    console.log('Iniciando inicialização de módulos...');

    userRepository.initialize(database);
    locationRepository.initialize(database);
    shiftRepository.initialize(database);
    paymentRepository.initialize(database);

    console.log('Repositórios inicializados com banco de dados');

    await syncManager.initialize(database);
    console.log('SyncManager inicializado com banco de dados');

    syncManager.registerRepository('user', userRepository);
    syncManager.registerRepository('location', locationRepository);
    syncManager.registerRepository('shift', shiftRepository);
    syncManager.registerRepository('payment', paymentRepository);
    console.log('Repositórios registrados no SyncManager');

    // @ts-ignore
    if (typeof paymentRepository.setSyncManager === 'function') {
      paymentRepository.setSyncManager(syncManager);
    }

    // @ts-ignore
    if (typeof locationRepository.setSyncManager === 'function') {
      locationRepository.setSyncManager(syncManager);
    }

    // @ts-ignore
    if (typeof shiftRepository.setSyncManager === 'function') {
      shiftRepository.setSyncManager(syncManager);
    }

    // @ts-ignore
    if (typeof userRepository.setSyncManager === 'function') {
      userRepository.setSyncManager(syncManager);
    }

    console.log('Módulos inicializados com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar módulos:', error);
    throw error;
  }
}

export default {
  initializeModules,
};
