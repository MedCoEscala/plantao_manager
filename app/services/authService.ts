import { executeSql } from "../database";
import { User } from "../database/types";

// Função para gerar ID único sem depender de randomvalues
function generateUID() {
  // Math.random deve ser suficiente para este caso de uso
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Interface para dados de registro
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  birthDate?: string;
}

// Interface para dados de login
export interface LoginData {
  email: string;
  password: string;
}

// Função para registrar um novo usuário
export const registerUser = async (userData: RegisterData): Promise<User> => {
  const id = generateUID();
  const now = new Date().toISOString();

  try {
    await executeSql(
      `INSERT INTO users (id, name, email, password, phone, birth_date, profile_image, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userData.name,
        userData.email,
        userData.password,
        userData.phone || null,
        userData.birthDate || null,
        null,
        now,
        now,
      ]
    );

    return {
      id,
      name: userData.name,
      email: userData.email,
      password: userData.password,
      phone: userData.phone,
      birthDate: userData.birthDate,
      profileImage: undefined,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    throw new Error(
      "Falha ao registrar usuário. Verifique se o e-mail já está em uso."
    );
  }
};

// Função para fazer login
export const loginUser = async ({
  email,
  password,
}: LoginData): Promise<User | null> => {
  try {
    const result = await executeSql(
      `SELECT id, name, email, password, phone, birth_date as birthDate, profile_image as profileImage, 
              created_at as createdAt, updated_at as updatedAt 
       FROM users 
       WHERE email = ?`,
      [email]
    );

    if (result.rows._array && result.rows._array.length > 0) {
      const user = result.rows._array[0] as User;

      // Verificar se a senha está correta
      if (user.password === password) {
        return user;
      }
    }
    return null;
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    throw new Error("Falha ao fazer login. Verifique suas credenciais.");
  }
};

// Função para verificar se o e-mail já está registrado
export const isEmailRegistered = async (email: string): Promise<boolean> => {
  try {
    const result = await executeSql(
      `SELECT COUNT(*) as count FROM users WHERE email = ?`,
      [email]
    );

    if (result.rows._array && result.rows._array.length > 0) {
      return result.rows._array[0].count > 0;
    }
    return false;
  } catch (error) {
    console.error("Erro ao verificar e-mail:", error);
    throw new Error("Falha ao verificar e-mail.");
  }
};

// Exportação default para expo-router
export default { registerUser, loginUser, isEmailRegistered };
