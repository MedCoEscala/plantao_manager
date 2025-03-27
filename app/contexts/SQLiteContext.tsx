import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { Alert } from "react-native";
import * as SQLite from "expo-sqlite";
import { initDatabase, executeSql as dbExecuteSql } from "../database";

interface SQLiteContextType {
  isDBReady: boolean;
  executeSql: (sql: string, params?: any[]) => Promise<SQLite.SQLResultSet>;
  refetchDB: () => Promise<void>;
}

const SQLiteContext = createContext<SQLiteContextType | undefined>(undefined);

interface SQLiteProviderProps {
  children: ReactNode;
}

export const SQLiteProvider = ({ children }: SQLiteProviderProps) => {
  const [isDBReady, setIsDBReady] = useState(false);

  const initializeDatabase = async () => {
    try {
      await initDatabase();
      setIsDBReady(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro ao inicializar o banco de dados";
      console.error("Erro ao inicializar o banco de dados:", error);
      Alert.alert(
        "Erro",
        `Falha ao inicializar o banco de dados: ${errorMessage}`
      );
    }
  };

  useEffect(() => {
    initializeDatabase();
  }, []);

  const executeSql = async (
    sql: string,
    params: any[] = []
  ): Promise<SQLite.SQLResultSet> => {
    try {
      if (!isDBReady) {
        throw new Error("O banco de dados ainda não está pronto");
      }
      return await dbExecuteSql(sql, params);
    } catch (error) {
      console.error("Erro ao executar SQL:", sql, params, error);
      throw error;
    }
  };

  const refetchDB = async (): Promise<void> => {
    setIsDBReady(false);
    await initializeDatabase();
  };

  const value = {
    isDBReady,
    executeSql,
    refetchDB,
  };

  return (
    <SQLiteContext.Provider value={value}>{children}</SQLiteContext.Provider>
  );
};

export const useSQLite = (): SQLiteContextType => {
  const context = useContext(SQLiteContext);

  if (context === undefined) {
    throw new Error("useSQLite deve ser usado dentro de um SQLiteProvider");
  }

  return context;
};

export default SQLiteProvider;
