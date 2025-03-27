import React, { createContext, useContext, useEffect, useState } from "react";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { authService } from "../services/authService";
import { useSQLite } from "./SQLiteContext";
import { useDialog } from "./DialogContext";

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isDBReady, executeSql } = useSQLite();
  const { showDialog } = useDialog();

  // Verifica se o usuário está logado ao iniciar o app
  useEffect(() => {
    const checkAuth = async () => {
      if (!isDBReady) return;

      try {
        setIsLoading(true);
        const userId = await SecureStore.getItemAsync("userId");

        if (userId) {
          const userData = await authService.getUserById(executeSql, userId);
          if (userData) {
            setUser(userData);
            router.replace("/(app)");
          } else {
            // Token inválido ou usuário não encontrado
            await SecureStore.deleteItemAsync("userId");
            router.replace("/");
          }
        } else {
          // Não há token, redireciona para login
          router.replace("/");
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        showDialog({
          type: "error",
          title: "Erro de Autenticação",
          message: "Erro ao verificar seu login. Por favor, tente novamente.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [isDBReady]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await authService.login(executeSql, email, password);

      if (result.success && result.user) {
        await SecureStore.setItemAsync("userId", result.user.id);
        setUser(result.user);
        router.replace("/(app)");
      } else {
        setError(result.error || "Erro desconhecido ao fazer login");
        showDialog({
          type: "error",
          title: "Falha no Login",
          message:
            result.error ||
            "Email ou senha inválidos. Por favor, tente novamente.",
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao fazer login";
      setError(errorMessage);
      showDialog({
        type: "error",
        title: "Erro de Login",
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await authService.register(
        executeSql,
        name,
        email,
        password
      );

      if (result.success && result.user) {
        await SecureStore.setItemAsync("userId", result.user.id);
        setUser(result.user);
        router.replace("/(app)");

        showDialog({
          type: "success",
          title: "Cadastro Realizado",
          message: "Sua conta foi criada com sucesso!",
        });
      } else {
        setError(result.error || "Erro desconhecido ao registrar");
        showDialog({
          type: "error",
          title: "Falha no Cadastro",
          message:
            result.error ||
            "Não foi possível criar sua conta. Por favor, tente novamente.",
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao registrar";
      setError(errorMessage);
      showDialog({
        type: "error",
        title: "Erro de Cadastro",
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await SecureStore.deleteItemAsync("userId");
      setUser(null);
      router.replace("/");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      showDialog({
        type: "error",
        title: "Erro de Logout",
        message: "Ocorreu um erro ao sair da sua conta.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }

  return context;
};

export default AuthProvider;
