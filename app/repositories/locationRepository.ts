import { SQLiteDatabase } from 'expo-sqlite';
import { v4 as uuidv4 } from 'uuid';
import syncManager from '../services/sync/syncManager';

export interface Location {
  id: string;
  name: string;
  address: string;
  phone?: string;
  color?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocationCreateInput {
  name: string;
  address: string;
  phone?: string;
  color?: string;
  userId: string;
}

export interface LocationUpdateInput {
  name?: string;
  address?: string;
  phone?: string;
  color?: string;
}

export class LocationRepository {
  private db: SQLiteDatabase | null = null;

  initialize(database: SQLiteDatabase) {
    this.db = database;
    this.setupDatabase();
  }

  private async setupDatabase() {
    if (!this.db) return;

    try {
      await this.db.runAsync(`
        CREATE TABLE IF NOT EXISTS locations (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          address TEXT NOT NULL,
          phone TEXT,
          color TEXT,
          user_id TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          is_synced INTEGER DEFAULT 0,
          last_synced TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `);
    } catch (error) {
      console.error('Erro ao criar tabela de locais:', error);
    }
  }

  async createLocation(data: LocationCreateInput, id?: string): Promise<Location | null> {
    if (!this.db) return null;

    try {
      const locationId = id || uuidv4();
      const now = new Date().toISOString();

      await this.db.runAsync(
        `
        INSERT INTO locations (
          id, name, address, phone, color, user_id, created_at, updated_at, is_synced
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          locationId,
          data.name,
          data.address,
          data.phone || null,
          data.color || '#0077B6',
          data.userId,
          now,
          now,
          0,
        ]
      );

      syncManager.queueOperation('create', 'location', {
        id: locationId,
        ...data,
        createdAt: now,
        updatedAt: now,
      });

      return {
        id: locationId,
        name: data.name,
        address: data.address,
        phone: data.phone,
        color: data.color || '#0077B6',
        userId: data.userId,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error('Erro ao criar local:', error);
      return null;
    }
  }

  async updateLocation(id: string, data: LocationUpdateInput): Promise<boolean> {
    if (!this.db) return false;

    try {
      const now = new Date().toISOString();

      const fieldsToUpdate: string[] = [];
      const values: any[] = [];

      if (data.name !== undefined) {
        fieldsToUpdate.push('name = ?');
        values.push(data.name);
      }

      if (data.address !== undefined) {
        fieldsToUpdate.push('address = ?');
        values.push(data.address);
      }

      if (data.phone !== undefined) {
        fieldsToUpdate.push('phone = ?');
        values.push(data.phone);
      }

      if (data.color !== undefined) {
        fieldsToUpdate.push('color = ?');
        values.push(data.color);
      }

      fieldsToUpdate.push('updated_at = ?');
      values.push(now);

      fieldsToUpdate.push('is_synced = ?');
      values.push(0);

      values.push(id);

      await this.db.runAsync(
        `
        UPDATE locations
        SET ${fieldsToUpdate.join(', ')}
        WHERE id = ?
      `,
        values
      );

      const location = await this.getLocationById(id);
      if (location) {
        syncManager.queueOperation('update', 'location', {
          id,
          ...data,
          userId: location.userId,
          updatedAt: now,
        });
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar local:', error);
      return false;
    }
  }

  async deleteLocation(id: string): Promise<boolean> {
    if (!this.db) return false;

    try {
      const location = await this.getLocationById(id);
      if (!location) return false;

      const result = await this.db.getAllAsync(
        'SELECT COUNT(*) as count FROM shifts WHERE location_id = ?',
        [id]
      );

      const hasShifts = result[0]?.count > 0;

      if (hasShifts) {
        throw new Error('Não é possível excluir este local porque há plantões associados a ele');
      }

      await this.db.runAsync('DELETE FROM locations WHERE id = ?', [id]);

      syncManager.queueOperation('delete', 'location', {
        id,
        userId: location.userId,
      });

      return true;
    } catch (error) {
      console.error('Erro ao excluir local:', error);
      throw error;
    }
  }

  async getLocations(userId: string): Promise<Location[]> {
    if (!this.db) return [];

    try {
      const results = await this.db.getAllAsync(
        `
        SELECT 
          id, name, address, phone, color,
          user_id as userId,
          created_at as createdAt, 
          updated_at as updatedAt
        FROM locations
        WHERE user_id = ?
        ORDER BY name ASC
      `,
        [userId]
      );

      return results as Location[];
    } catch (error) {
      console.error('Erro ao buscar locais:', error);
      return [];
    }
  }

  async getLocationById(id: string): Promise<Location | null> {
    if (!this.db) return null;

    try {
      const results = await this.db.getAllAsync(
        `
        SELECT 
          id, name, address, phone, color,
          user_id as userId,
          created_at as createdAt, 
          updated_at as updatedAt
        FROM locations
        WHERE id = ?
      `,
        [id]
      );

      if (results.length > 0) {
        return results[0] as Location;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar local por ID:', error);
      return null;
    }
  }

  async syncLocationFromRemote(location: Location): Promise<boolean> {
    if (!this.db) return false;

    try {
      const now = new Date().toISOString();
      const existingLocation = await this.getLocationById(location.id);

      if (existingLocation) {
        await this.db.runAsync(
          `
          UPDATE locations 
          SET 
            name = ?, 
            address = ?, 
            phone = ?, 
            color = ?,
            user_id = ?,
            updated_at = ?,
            is_synced = ?,
            last_synced = ?
          WHERE id = ?
        `,
          [
            location.name,
            location.address,
            location.phone || null,
            location.color || '#0077B6',
            location.userId,
            location.updatedAt,
            1,
            now,
            location.id,
          ]
        );
      } else {
        await this.db.runAsync(
          `
          INSERT INTO locations (
            id, name, address, phone, color, user_id,
            created_at, updated_at, is_synced, last_synced
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            location.id,
            location.name,
            location.address,
            location.phone || null,
            location.color || '#0077B6',
            location.userId,
            location.createdAt,
            location.updatedAt,
            1,
            now,
          ]
        );
      }

      return true;
    } catch (error) {
      console.error('Erro ao sincronizar local do remoto:', error);
      return false;
    }
  }

  async getUnsyncedLocations(): Promise<Location[]> {
    if (!this.db) return [];

    try {
      const results = await this.db.getAllAsync(`
        SELECT 
          id, name, address, phone, color,
          user_id as userId,
          created_at as createdAt, 
          updated_at as updatedAt
        FROM locations 
        WHERE is_synced = 0
      `);

      return results as Location[];
    } catch (error) {
      console.error('Erro ao buscar locais não sincronizados:', error);
      return [];
    }
  }

  async resolveConflict(localLocation: Location, remoteLocation: Location): Promise<Location> {
    const localUpdatedAt = new Date(localLocation.updatedAt).getTime();
    const remoteUpdatedAt = new Date(remoteLocation.updatedAt).getTime();

    if (remoteUpdatedAt >= localUpdatedAt) {
      await this.syncLocationFromRemote(remoteLocation);
      return remoteLocation;
    } else {
      syncManager.queueOperation('update', 'location', localLocation);
      return localLocation;
    }
  }
}

const locationRepository = new LocationRepository();
export default locationRepository;
