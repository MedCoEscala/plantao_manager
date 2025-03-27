import { v4 as uuidv4 } from "uuid";
import bcrypt from "react-native-bcrypt";
import { User } from "../contexts/AuthContext";
import { getRandomBytes } from "expo-crypto";

// Interface para resposta de autenticação
interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

// Configurar o bcrypt para usar uma fonte segura de números aleatórios
// Usar crypto.getRandomValues para segurança criptográfica
bcrypt.setRandomFallback(() => {
  // Criar um buffer de 4 bytes (32 bits) e converter para um número entre 0 e 1
  const buffer = getRandomBytes(4);
  // Converter para um número de 32 bits sem sinal (0 a 4294967295)
  const value =
    (buffer[0] << 24) | (buffer[1] << 16) | (buffer[2] << 8) | buffer[3];
  // Normalizar para o intervalo [0, 1)
  return value / 4294967296;
});

// Classe para o serviço de autenticação
class AuthService {
  // Login
  async login(
    executeSql: any,
    email: string,
    password: string
  ): Promise<AuthResponse> {
    try {
      if (!email || !password) {
        return {
          success: false,
          error: "Email e senha são obrigatórios",
        };
      }

      // Buscar usuário pelo email
      const result = await executeSql(
        `SELECT id, email, name, password, created_at as createdAt, updated_at as updatedAt 
         FROM users WHERE email = ?`,
        [email.toLowerCase()]
      );

      if (!result.rows._array || result.rows._array.length === 0) {
        return {
          success: false,
          error: "Email ou senha incorretos",
        };
      }

      const user = result.rows._array[0];

      // Verificar a senha
      const isPasswordValid = await this.verifyPassword(
        password,
        user.password
      );

      if (!isPasswordValid) {
        return {
          success: false,
          error: "Email ou senha incorretos",
        };
      }

      // Remover o campo password do objeto user antes de retornar
      const { password: _, ...userData } = user;

      return {
        success: true,
        user: userData as User,
      };
    } catch (error) {
      console.error("Erro no login:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro durante o login",
      };
    }
  }

  // Registro
  async register(
    executeSql: any,
    name: string,
    email: string,
    password: string
  ): Promise<AuthResponse> {
    try {
      if (!name || !email || !password) {
        return {
          success: false,
          error: "Nome, email e senha são obrigatórios",
        };
      }

      // Verificar se o email já está cadastrado
      const emailCheck = await executeSql(
        "SELECT id FROM users WHERE email = ?",
        [email.toLowerCase()]
      );

      if (emailCheck.rows._array && emailCheck.rows._array.length > 0) {
        return {
          success: false,
          error: "Este email já está cadastrado",
        };
      }

      // Gerar hash da senha
      const hashedPassword = await this.hashPassword(password);

      // Criar novo usuário
      const userId = uuidv4();
      const now = new Date().toISOString();

      await executeSql(
        `INSERT INTO users (id, name, email, password, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, name, email.toLowerCase(), hashedPassword, now, now]
      );

      return {
        success: true,
        user: {
          id: userId,
          name,
          email: email.toLowerCase(),
          createdAt: now,
          updatedAt: now,
        },
      };
    } catch (error) {
      console.error("Erro no registro:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro durante o registro",
      };
    }
  }

  // Obter usuário pelo ID
  async getUserById(executeSql: any, userId: string): Promise<User | null> {
    try {
      const result = await executeSql(
        `SELECT id, email, name, created_at as createdAt, updated_at as updatedAt 
         FROM users WHERE id = ?`,
        [userId]
      );

      if (result.rows._array && result.rows._array.length > 0) {
        return result.rows._array[0] as User;
      }

      return null;
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      return null;
    }
  }

  // Métodos auxiliares para hash e verificação de senha
  private async hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Gerar salt com 10 rounds
      bcrypt.genSalt(10, (err: Error | null, salt: string) => {
        if (err) {
          reject(err);
          return;
        }

        // Gerar hash com o salt
        bcrypt.hash(password, salt, (hashErr: Error | null, hash: string) => {
          if (hashErr) {
            reject(hashErr);
            return;
          }

          resolve(hash);
        });
      });
    });
  }

  private async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      bcrypt.compare(password, hash, (err: Error | null, result: boolean) => {
        if (err) {
          resolve(false);
          return;
        }

        resolve(result);
      });
    });
  }
}

export const authService = new AuthService();
export default authService;
