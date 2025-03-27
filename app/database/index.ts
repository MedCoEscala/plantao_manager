// Implementação temporária enquanto resolvemos o problema do SQLite
// Em vez de usar SQLite diretamente, vamos armazenar os dados na memória
// para você poder testar o aplicativo

import { openDatabaseAsync, SQLiteDatabase } from "expo-sqlite";
import { TableDefinitions, Tables } from "./schema";

// Abertura do banco de dados como uma Promise
// Isso permite que o banco de dados seja inicializado de forma assíncrona
let dbPromise: Promise<SQLiteDatabase>;

// Inicialização do banco de dados
const initializeDb = async (): Promise<SQLiteDatabase> => {
  try {
    return await openDatabaseAsync("plantao_manager.db");
  } catch (error) {
    console.error("Erro ao abrir banco de dados:", error);
    throw error;
  }
};

// Inicializa a Promise do banco de dados
dbPromise = initializeDb();

// Função para executar consultas SQL
export const executeSql = async (
  query: string,
  params: any[] = []
): Promise<{ rows: { _array: any[] }; rowsAffected: number }> => {
  try {
    const db = await dbPromise;

    // Para consultas SELECT, usamos getAllAsync
    if (query.trim().toUpperCase().startsWith("SELECT")) {
      const result = await db.getAllAsync(query, params);
      return {
        rows: { _array: result || [] },
        rowsAffected: 0,
      };
    }
    // Para outras consultas (INSERT, UPDATE, DELETE), usamos runAsync
    else {
      const result = await db.runAsync(query, ...params);
      return {
        rows: { _array: [] },
        rowsAffected: result.changes,
      };
    }
  } catch (error) {
    console.error("Erro ao executar SQL:", query, params, error);
    throw error;
  }
};

// Criação das tabelas
export const createTables = async (): Promise<void> => {
  try {
    const db = await dbPromise;

    // Configurar o modo journal WAL para melhor performance - FORA da transação
    await db.execAsync("PRAGMA journal_mode = WAL;");

    // Habilitar chaves estrangeiras - FORA da transação
    await db.execAsync("PRAGMA foreign_keys = ON;");

    // Usar withTransactionAsync para criar todas as tabelas em uma única transação
    await db.withTransactionAsync(async () => {
      // Criar tabelas usando as definições do schema
      await db.execAsync(TableDefinitions.users);
      await db.execAsync(TableDefinitions.locations);
      await db.execAsync(TableDefinitions.contractors);
      await db.execAsync(TableDefinitions.shifts);
      await db.execAsync(TableDefinitions.payments);
    });

    console.log("Tabelas criadas com sucesso!");
    return Promise.resolve();
  } catch (error) {
    console.error("Erro na criação das tabelas:", error);
    throw error;
  }
};

// Inicialização do banco de dados
export const initDatabase = async (): Promise<void> => {
  try {
    await createTables();
    console.log("Banco de dados inicializado com sucesso!");
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error);
    throw error;
  }
};

// Função para listar todas as tabelas do banco de dados
export const listTables = async (): Promise<string[]> => {
  try {
    const result = await executeSql(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
      []
    );
    return result.rows._array.map((table: any) => table.name);
  } catch (error) {
    console.error("Erro ao listar tabelas:", error);
    throw error;
  }
};

// Funções para debug e visualização do banco de dados
export const getTableData = async (tableName: string): Promise<any[]> => {
  try {
    const result = await executeSql(`SELECT * FROM ${tableName}`, []);
    return result.rows._array;
  } catch (error) {
    console.error(`Erro ao obter dados da tabela ${tableName}:`, error);
    return [];
  }
};

export const getTableCount = async (tableName: string): Promise<number> => {
  try {
    const result = await executeSql(
      `SELECT COUNT(*) as count FROM ${tableName}`,
      []
    );
    return result.rows._array[0]?.count || 0;
  } catch (error) {
    console.error(`Erro ao contar registros da tabela ${tableName}:`, error);
    return 0;
  }
};

// Função para limpar uma tabela (útil para testes)
export const clearTable = async (tableName: string): Promise<void> => {
  try {
    await executeSql(`DELETE FROM ${tableName}`, []);
    console.log(`Tabela ${tableName} limpa com sucesso`);
  } catch (error) {
    console.error(`Erro ao limpar tabela ${tableName}:`, error);
    throw error;
  }
};

// Objeto de compatibilidade para a API antiga (para trechos de código que ainda usam)
const compatibilityDb = {
  transaction: async (callback: (tx: any) => void): Promise<void> => {
    const db = await dbPromise;
    await db.withTransactionAsync(async () => {
      const tx = {
        executeSql: async (
          query: string,
          params: any[],
          success: (tx: any, result: any) => void
        ) => {
          try {
            const result = await executeSql(query, params);
            if (success) {
              success(tx, result);
            }
          } catch (error) {
            console.error("Erro na transação:", error);
          }
        },
      };
      callback(tx);
    });
  },
};

// Exportação default para expo-router
export default {
  getDb: async () => await dbPromise,
  db: compatibilityDb,
  executeSql,
  createTables,
  initDatabase,
  listTables,
  getTableData,
  getTableCount,
  clearTable,
  Tables,
};
