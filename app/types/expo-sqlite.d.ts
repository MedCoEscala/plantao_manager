declare module 'expo-sqlite' {
  // Tipos para a versão 15.1.3
  export interface SQLiteDatabase {
    // Métodos assíncronos (preferidos na nova API)
    execAsync(sqlStatement: string | string[]): Promise<any>;
    getAllAsync<T = any>(sqlStatement: string, params?: any[]): Promise<T[]>;
    getFirstAsync<T = any>(sqlStatement: string, params?: any[]): Promise<T>;
    runAsync(
      sqlStatement: string,
      ...params: any[]
    ): Promise<{ changes: number; lastInsertRowId?: number }>;
    withTransactionAsync<T>(callback: () => Promise<T>): Promise<T>;

    // Métodos síncronos (para compatibilidade)
    execSync(sqlStatement: string | string[]): void;
    getAllSync<T = any>(sqlStatement: string, params?: any[]): T[];
    getFirstSync<T = any>(sqlStatement: string, params?: any[]): T;
    runSync(sqlStatement: string, ...params: any[]): { changes: number; lastInsertRowId?: number };
    withTransactionSync<T>(callback: () => T): T;

    // Métodos para compatibilidade com WebSQL
    transaction(
      callback: (transaction: SQLTransaction) => void,
      error?: (error: Error) => void,
      success?: () => void
    ): void;
    readTransaction(
      callback: (transaction: SQLTransaction) => void,
      error?: (error: Error) => void,
      success?: () => void
    ): void;

    // Outros métodos
    closeAsync(): Promise<void>;
    close(): void;
  }

  export interface SQLTransaction {
    executeSql(
      sqlStatement: string,
      args?: any[],
      success?: (transaction: SQLTransaction, resultSet: SQLResultSet) => void,
      error?: (transaction: SQLTransaction, error: Error) => boolean
    ): void;
  }

  export interface SQLResultSet {
    insertId?: number;
    rowsAffected: number;
    rows: {
      length: number;
      item(index: number): any;
      _array: any[];
    };
  }

  // Funções para criar/abrir o banco de dados
  export function openDatabase(name: string): SQLiteDatabase; // API antiga (compatibilidade)
  export function openDatabaseAsync(name: string): Promise<SQLiteDatabase>; // API moderna
}

// Exportação default para satisfazer o expo-router
export default {};
