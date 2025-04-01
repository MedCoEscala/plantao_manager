import * as SecureStore from 'expo-secure-store';
import { SQLiteDatabase, SQLTransaction, SQLResultSet } from 'expo-sqlite';
import { SyncResponse, SyncService } from './syncTypes';
import { User } from '../../types/user';
import clerkProfileService from '../profile/clerkProfileService';

// Constantes para armazenamento seguro
const CLERK_USER_KEY = 'clerk_user';
const LAST_SYNC_KEY = 'last_user_sync';

class UserSyncService implements SyncService {
  private db: SQLiteDatabase | null = null;

  initialize(database: SQLiteDatabase) {
    this.db = database;
    this.setupDatabase();
  }

  private async setupDatabase() {
    if (!this.db) return;

    return new Promise<void>((resolve, reject) => {
      this.db?.transaction(
        (tx: SQLTransaction) => {
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS users (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              email TEXT NOT NULL,
              phone_number TEXT,
              birth_date TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              last_synced TEXT NOT NULL
            );`,
            [],
            () => resolve(),
            (_, error) => {
              console.error('Erro ao criar tabela de usuários:', error);
              reject(error);
              return false;
            }
          );
        },
        (error) => {
          console.error('Erro na transação de criação de tabela:', error);
          reject(error);
        }
      );
    });
  }

  async syncUserData(): Promise<SyncResponse> {
    try {
      if (!this.db) {
        return {
          success: false,
          error: 'Banco de dados não inicializado',
        };
      }

      const clerkUser = await clerkProfileService.getUserProfile();
      if (!clerkUser) {
        return {
          success: false,
          error: 'Usuário não encontrado no Clerk',
        };
      }

      const localUser = await this.getUserFromLocal();

      if (!localUser) {
        await this.createUserInLocal(clerkUser);
      } else {
        await this.updateUserInLocal(clerkUser);
      }

      await SecureStore.setItemAsync(LAST_SYNC_KEY, new Date().toISOString());

      return {
        success: true,
      };
    } catch (error) {
      console.error('Erro na sincronização de dados do usuário:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido na sincronização',
      };
    }
  }

  async hasPendingSync(): Promise<boolean> {
    try {
      const lastSync = await SecureStore.getItemAsync(LAST_SYNC_KEY);
      if (!lastSync) return true;

      const lastSyncDate = new Date(lastSync);
      const now = new Date();
      const diff = now.getTime() - lastSyncDate.getTime();
      const hoursDiff = diff / (1000 * 60 * 60);

      return hoursDiff > 24;
    } catch (error) {
      console.error('Erro ao verificar sincronização pendente:', error);
      return true;
    }
  }

  async getUserFromLocal(): Promise<User | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      this.db?.transaction(
        (tx: SQLTransaction) => {
          tx.executeSql(
            'SELECT * FROM users LIMIT 1;',
            [],
            (_, result: SQLResultSet) => {
              if (result.rows.length === 0) {
                resolve(null);
                return;
              }

              const userData = result.rows.item(0);
              const user: User = {
                id: userData.id,
                name: userData.name,
                email: userData.email,
                phoneNumber: userData.phone_number,
                birthDate: userData.birth_date,
                createdAt: userData.created_at,
                updatedAt: userData.updated_at,
              };

              resolve(user);
            },
            (_, error) => {
              console.error('Erro ao buscar usuário local:', error);
              reject(error);
              return false;
            }
          );
        },
        (error) => {
          console.error('Erro na transação de busca de usuário:', error);
          reject(error);
        }
      );
    });
  }

  private async createUserInLocal(user: User): Promise<boolean> {
    if (!this.db) return false;

    return new Promise((resolve, reject) => {
      this.db?.transaction(
        (tx: SQLTransaction) => {
          tx.executeSql(
            `INSERT INTO users (
              id, name, email, phone_number, birth_date, created_at, updated_at, last_synced
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              user.id,
              user.name,
              user.email,
              user.phoneNumber || null,
              user.birthDate || null,
              user.createdAt,
              user.updatedAt,
              new Date().toISOString(),
            ],
            (_, result: SQLResultSet) => {
              resolve(result.rowsAffected > 0);
            },
            (_, error) => {
              console.error('Erro ao inserir usuário local:', error);
              reject(error);
              return false;
            }
          );
        },
        (error) => {
          console.error('Erro na transação de inserção de usuário:', error);
          reject(error);
        }
      );
    });
  }

  async updateUserInLocal(user: User): Promise<boolean> {
    if (!this.db) return false;

    return new Promise((resolve, reject) => {
      this.db?.transaction(
        (tx: SQLTransaction) => {
          tx.executeSql(
            `UPDATE users SET 
              name = ?, 
              email = ?, 
              phone_number = ?, 
              birth_date = ?, 
              updated_at = ?, 
              last_synced = ?
            WHERE id = ?;`,
            [
              user.name,
              user.email,
              user.phoneNumber || null,
              user.birthDate || null,
              user.updatedAt,
              new Date().toISOString(),
              user.id,
            ],
            (_, result: SQLResultSet) => {
              if (result.rowsAffected === 0) {
                this.createUserInLocal(user)
                  .then((success) => resolve(success))
                  .catch((error) => reject(error));
              } else {
                resolve(true);
              }
            },
            (_, error) => {
              console.error('Erro ao atualizar usuário local:', error);
              reject(error);
              return false;
            }
          );
        },
        (error) => {
          console.error('Erro na transação de atualização de usuário:', error);
          reject(error);
        }
      );
    });
  }
}

export default new UserSyncService();
