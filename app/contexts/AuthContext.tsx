import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../database/types";
import {
  registerUser,
  loginUser,
  isEmailRegistered,
  LoginData,
  RegisterData,
} from "../services/authService";
import { ToastProvider, useToast } from "../components/ui/Toast";

// Interface para o contexto de autenticação
interface AuthContextData {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (data: LoginData) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  checkEmailExists: (email: string) => Promise<boolean>;
  clearError: () => void;
}

// Criando o contexto com valor padrão
const AuthContext = createContext<AuthContextData>({} as AuthContextData);

// Hook personalizado para usar o contexto
export const useAuth = (): AuthContextData => {
  return useContext(AuthContext);
};

// Provedor do contexto
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // Carrega dados do usuário ao iniciar o app
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem("@PlantaoManager:user");
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (err) {
        console.error("Erro ao carregar dados do usuário:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Função de login
  const login = async (data: LoginData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const userData = await loginUser(data);

      if (userData) {
        setUser(userData);
        await AsyncStorage.setItem(
          "@PlantaoManager:user",
          JSON.stringify(userData)
        );
        showToast("Login realizado com sucesso!", "success");
        return true;
      } else {
        const errorMsg = "Email ou senha incorretos.";
        setError(errorMsg);
        showToast(errorMsg, "error");
        return false;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao fazer login";
      setError(errorMessage);
      showToast(errorMessage, "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Função de registro
  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const emailExists = await isEmailRegistered(userData.email);
      if (emailExists) {
        const errorMsg = "Este email já está registrado.";
        setError(errorMsg);
        showToast(errorMsg, "error");
        return false;
      }

      const newUser = await registerUser(userData);
      setUser(newUser);
      await AsyncStorage.setItem(
        "@PlantaoManager:user",
        JSON.stringify(newUser)
      );
      showToast("Cadastro realizado com sucesso!", "success");
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao registrar usuário";
      setError(errorMessage);
      showToast(errorMessage, "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Função de logout
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await AsyncStorage.removeItem("@PlantaoManager:user");
      setUser(null);
      showToast("Logout realizado com sucesso", "info");
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
    } finally {
      setLoading(false);
    }
  };

  // Verificar se email existe
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      return await isEmailRegistered(email);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao verificar email";
      setError(errorMessage);
      showToast(errorMessage, "error");
      return false;
    }
  };

  // Limpar mensagens de erro
  const clearError = (): void => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        checkEmailExists,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Exportação default para expo-router
export default AuthProvider;
