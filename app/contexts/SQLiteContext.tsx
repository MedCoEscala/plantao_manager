import React, { createContext, useState, useContext, useEffect, useRef, ReactNode } from 'react';
import { Alert } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { initDatabase, executeSql as dbExecuteSql, getDatabase } from '../database';
import { initializeModules } from '../services/init/initModules';

interface SQLiteContextType {
  isDBReady: boolean;
  executeSql: (sql: string, params?: any[]) => Promise<SQLite.SQLResultSet>;
  refetchDB: () => Promise<void>;
  database: SQLite.SQLiteDatabase | null;
}

const SQLiteContext = createContext<SQLiteContextType | undefined>(undefined);

interface SQLiteProviderProps {
  children: ReactNode;
}

export const SQLiteProvider = ({ children }: SQLiteProviderProps) => {
  const [isDBReady, setIsDBReady] = useState(false);
  const [database, setDatabase] = useState<SQLite.SQLiteDatabase | null>(null);
  const initializationAttempted = useRef(false);

  const initializeDatabase = async () => {
    if (initializationAttempted.current) return;
    initializationAttempted.current = true;

    try {
      console.log('Iniciando inicialização do banco de dados...');
      await initDatabase();
      const db = getDatabase();

      if (!db) {
        throw new Error('Falha ao obter instância do banco de dados');
      }

      setDatabase(db);

      await initializeModules(db);

      setIsDBReady(true);
      console.log('Banco de dados e módulos inicializados com sucesso');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro ao inicializar o banco de dados';
      console.error('Erro ao inicializar o banco de dados:', error);
      Alert.alert('Erro', `Falha ao inicializar o banco de dados: ${errorMessage}`);
    }
  };

  useEffect(() => {
    if (!isDBReady && !initializationAttempted.current) {
      initializeDatabase();
    }
  }, [isDBReady]);

  const executeSql = async (sql: string, params: any[] = []): Promise<SQLite.SQLResultSet> => {
    try {
      if (!isDBReady) {
        throw new Error('O banco de dados ainda não está pronto');
      }
      return await dbExecuteSql(sql, params);
    } catch (error) {
      console.error('Erro ao executar SQL:', sql, params, error);
      throw error;
    }
  };

  const refetchDB = async (): Promise<void> => {
    initializationAttempted.current = false;
    setIsDBReady(false);
    setDatabase(null);
    await initializeDatabase();
  };

  const value = {
    isDBReady,
    executeSql,
    refetchDB,
    database,
  };

  return <SQLiteContext.Provider value={value}>{children}</SQLiteContext.Provider>;
};

export const useSQLite = (): SQLiteContextType => {
  const context = useContext(SQLiteContext);

  if (context === undefined) {
    throw new Error('useSQLite deve ser usado dentro de um SQLiteProvider');
  }

  return context;
};

export default SQLiteProvider;
