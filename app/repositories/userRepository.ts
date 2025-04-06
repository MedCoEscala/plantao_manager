import { SQLiteDatabase } from 'expo-sqlite';
import { User, UserCreateInput, UserUpdateInput } from '../types/user';
import syncManager from '../services/sync/syncManager';
import { v4 as uuidv4 } from 'uuid';

export class UserRepository {
  private db: SQLiteDatabase | null = null;

  initialize(database: SQLiteDatabase) {
    this.db = database;
    this.setupDatabase();
  }

  private async setupDatabase() {
    if (!this.db) return;

    try {
      await this.db.runAsync(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone_number TEXT,
          birth_date TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          is_synced INTEGER DEFAULT 0,
          last_synced TEXT
        );
      `);
    } catch (error) {
      console.error('Erro ao criar tabela de usuários:', error);
    }
  }

  async getUserById(id: string): Promise<User | null> {
    if (!this.db) return null;

    try {
      const results = await this.db.getAllAsync(
        `
        SELECT 
          id, 
          name, 
          email, 
          phone_number as phoneNumber, 
          birth_date as birthDate,
          created_at as createdAt,
          updated_at as updatedAt
        FROM users 
        WHERE id = ?
      `,
        [id]
      );

      if (results && results.length > 0) {
        return results[0] as unknown as User;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }
  }

  async createUser(userData: UserCreateInput, id?: string): Promise<User | null> {
    if (!this.db) return null;

    try {
      const userId = id || uuidv4();
      const now = new Date().toISOString();

      await this.db.runAsync(
        `
        INSERT INTO users (
          id, name, email, phone_number, birth_date, created_at, updated_at, is_synced
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          userId,
          userData.name,
          userData.email,
          userData.phoneNumber || null,
          userData.birthDate || null,
          now,
          now,
          0,
        ]
      );

      syncManager.queueOperation('create', 'user', {
        ...userData,
        id: userId,
        createdAt: now,
        updatedAt: now,
      });

      return {
        id: userId,
        name: userData.name,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        birthDate: userData.birthDate,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return null;
    }
  }

  async updateUser(id: string, userData: UserUpdateInput): Promise<boolean> {
    if (!this.db) return false;

    try {
      const now = new Date().toISOString();

      const fieldsToUpdate: string[] = [];
      const values: any[] = [];

      if (userData.name !== undefined) {
        fieldsToUpdate.push('name = ?');
        values.push(userData.name);
      }

      if (userData.email !== undefined) {
        fieldsToUpdate.push('email = ?');
        values.push(userData.email);
      }

      if (userData.phoneNumber !== undefined) {
        fieldsToUpdate.push('phone_number = ?');
        values.push(userData.phoneNumber);
      }

      if (userData.birthDate !== undefined) {
        fieldsToUpdate.push('birth_date = ?');
        values.push(userData.birthDate);
      }

      fieldsToUpdate.push('updated_at = ?');
      values.push(now);

      fieldsToUpdate.push('is_synced = ?');
      values.push(0);

      values.push(id);

      await this.db.runAsync(
        `
        UPDATE users 
        SET ${fieldsToUpdate.join(', ')} 
        WHERE id = ?
      `,
        values
      );

      syncManager.queueOperation('update', 'user', {
        id,
        ...userData,
        updatedAt: now,
      });

      return true;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return false;
    }
  }

  async syncUserFromRemote(user: User): Promise<boolean> {
    if (!this.db) return false;

    try {
      const existingUser = await this.getUserById(user.id);
      const now = new Date().toISOString();

      if (existingUser) {
        await this.db.runAsync(
          `
          UPDATE users 
          SET 
            name = ?, 
            email = ?, 
            phone_number = ?, 
            birth_date = ?,
            updated_at = ?,
            is_synced = ?,
            last_synced = ?
          WHERE id = ?
        `,
          [
            user.name,
            user.email,
            user.phoneNumber || null,
            user.birthDate || null,
            user.updatedAt || now,
            1,
            now,
            user.id,
          ]
        );
      } else {
        await this.db.runAsync(
          `
          INSERT INTO users (
            id, name, email, phone_number, birth_date, 
            created_at, updated_at, is_synced, last_synced
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            user.id,
            user.name,
            user.email,
            user.phoneNumber || null,
            user.birthDate || null,
            user.createdAt || now,
            user.updatedAt || now,
            1,
            now,
          ]
        );
      }

      return true;
    } catch (error) {
      console.error('Erro ao sincronizar usuário do remoto:', error);
      return false;
    }
  }

  async getUnsyncedUsers(): Promise<User[]> {
    if (!this.db) return [];

    try {
      const results = await this.db.getAllAsync(`
        SELECT 
          id, 
          name, 
          email, 
          phone_number as phoneNumber, 
          birth_date as birthDate,
          created_at as createdAt,
          updated_at as updatedAt
        FROM users 
        WHERE is_synced = 0
      `);

      return results as unknown as User[];
    } catch (error) {
      console.error('Erro ao buscar usuários não sincronizados:', error);
      return [];
    }
  }
}

const userRepository = new UserRepository();
export default userRepository;
