import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';
import { TableDefinitions, Tables } from './schema';

let db: SQLiteDatabase | null = null;

export const initializeDb = async (): Promise<SQLiteDatabase> => {
  if (db !== null) {
    return db;
  }

  try {
    db = await openDatabaseAsync('plantao_manager_v2.db');
    return db;
  } catch (error) {
    console.error('Erro ao abrir o banco de dados:', error);
    throw error;
  }
};

export const executeSql = async (sql: string, params: any[] = []): Promise<any> => {
  try {
    if (!db) {
      await initializeDb();
    }

    if (!db) {
      throw new Error('Banco de dados não inicializado');
    }

    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      const result = await db.getAllAsync(sql, params);
      return {
        rows: { _array: result || [] },
        rowsAffected: 0,
      };
    } else {
      const result = await db.runAsync(sql, params);
      return {
        rows: { _array: [] },
        rowsAffected: result.changes,
      };
    }
  } catch (error) {
    console.error('Erro ao executar SQL:', sql, params, error);
    throw error;
  }
};

const createTables = async () => {
  try {
    await executeSql('PRAGMA foreign_keys = ON;');

    await executeSql(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        birth_date TEXT,
        profile_image TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    await executeSql(`
      CREATE TABLE IF NOT EXISTS locations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        phone TEXT,
        color TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    await executeSql(`
      CREATE TABLE IF NOT EXISTS contractors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    await executeSql(`
      CREATE TABLE IF NOT EXISTS shifts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        contractor_id TEXT,
        location_id TEXT NOT NULL,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        value REAL,
        status TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (contractor_id) REFERENCES contractors (id) ON DELETE SET NULL,
        FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE CASCADE
      )
    `);

    await executeSql(`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        shift_id TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        method TEXT,
        status TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (shift_id) REFERENCES shifts (id) ON DELETE CASCADE
      )
    `);

    console.log('Tabelas criadas com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabelas:', error);
    throw error;
  }
};

export const initDatabase = async (): Promise<void> => {
  try {
    await initializeDb();
    await createTables();
    console.log('Banco de dados inicializado com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
    throw error;
  }
};

export const listTables = async (): Promise<string[]> => {
  try {
    const result = await executeSql(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
      []
    );
    return result.rows._array.map((table: any) => table.name);
  } catch (error) {
    console.error('Erro ao listar tabelas:', error);
    throw error;
  }
};

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
    const result = await executeSql(`SELECT COUNT(*) as count FROM ${tableName}`, []);
    return result.rows._array[0]?.count || 0;
  } catch (error) {
    console.error(`Erro ao contar registros da tabela ${tableName}:`, error);
    return 0;
  }
};

export const clearTable = async (tableName: string): Promise<void> => {
  try {
    await executeSql(`DELETE FROM ${tableName}`, []);
    console.log(`Tabela ${tableName} limpa com sucesso`);
  } catch (error) {
    console.error(`Erro ao limpar tabela ${tableName}:`, error);
    throw error;
  }
};

export const compatibility = {
  transaction: async (callback: (tx: any) => void): Promise<void> => {
    try {
      if (!db) {
        await initializeDb();
      }

      if (!db) {
        throw new Error('Banco de dados não inicializado');
      }

      await callback({
        executeSql: async (sql: string, params: any[] = []): Promise<any> => {
          return await executeSql(sql, params);
        },
      });
    } catch (error) {
      console.error('Erro na transação:', error);
      throw error;
    }
  },
};

export const getDatabase = (): SQLiteDatabase | null => {
  return db;
};

export default {
  executeSql,
  initDatabase,
  listTables,
  getTableData,
  getTableCount,
  clearTable,
  compatibility,
  getDatabase,
  Tables,
};
