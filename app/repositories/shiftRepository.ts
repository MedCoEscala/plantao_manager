import { SQLiteDatabase } from 'expo-sqlite';
import { v4 as uuidv4 } from 'uuid';
import syncManager from '../services/sync/syncManager';

export interface Shift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  value: number;
  status: string;
  notes?: string;
  userId: string;
  locationId?: string;
  contractorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftCreateInput {
  date: string;
  startTime: string;
  endTime: string;
  value: number;
  status?: string;
  notes?: string;
  userId: string;
  locationId?: string;
  contractorId?: string;
}

export interface ShiftUpdateInput {
  date?: string;
  startTime?: string;
  endTime?: string;
  value?: number;
  status?: string;
  notes?: string;
  locationId?: string;
  contractorId?: string;
}

export class ShiftRepository {
  private db: SQLiteDatabase | null = null;

  initialize(database: SQLiteDatabase) {
    this.db = database;
    this.setupDatabase();
  }

  private async setupDatabase() {
    if (!this.db) return;

    try {
      await this.db.runAsync(`
        CREATE TABLE IF NOT EXISTS shifts (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          value REAL NOT NULL,
          status TEXT NOT NULL,
          notes TEXT,
          user_id TEXT NOT NULL,
          location_id TEXT,
          contractor_id TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          is_synced INTEGER DEFAULT 0,
          last_synced TEXT,
          version INTEGER DEFAULT 1,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (location_id) REFERENCES locations(id),
          FOREIGN KEY (contractor_id) REFERENCES contractors(id)
        );
      `);
    } catch (error) {
      console.error('Erro ao criar tabela de plantões:', error);
    }
  }

  async createShift(data: ShiftCreateInput, id?: string): Promise<Shift | null> {
    if (!this.db) return null;

    try {
      const shiftId = id || uuidv4();
      const now = new Date().toISOString();
      const status = data.status || 'scheduled';

      await this.db.runAsync(
        `
        INSERT INTO shifts (
          id, date, start_time, end_time, value, status, notes,
          user_id, location_id, contractor_id, created_at, updated_at, is_synced
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          shiftId,
          data.date,
          data.startTime,
          data.endTime,
          data.value,
          status,
          data.notes || null,
          data.userId,
          data.locationId || null,
          data.contractorId || null,
          now,
          now,
          0,
        ]
      );

      syncManager.queueOperation('create', 'shift', {
        id: shiftId,
        ...data,
        status,
        createdAt: now,
        updatedAt: now,
      });

      return {
        id: shiftId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        value: data.value,
        status,
        notes: data.notes,
        userId: data.userId,
        locationId: data.locationId,
        contractorId: data.contractorId,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error('Erro ao criar plantão:', error);
      return null;
    }
  }

  async updateShift(id: string, data: ShiftUpdateInput): Promise<boolean> {
    if (!this.db) return false;

    try {
      const now = new Date().toISOString();

      const shift = await this.getShiftById(id);
      if (!shift) return false;

      const currentVersion = await this.getShiftVersion(id);
      const newVersion = currentVersion + 1;

      const fieldsToUpdate: string[] = [];
      const values: any[] = [];

      if (data.date !== undefined) {
        fieldsToUpdate.push('date = ?');
        values.push(data.date);
      }

      if (data.startTime !== undefined) {
        fieldsToUpdate.push('start_time = ?');
        values.push(data.startTime);
      }

      if (data.endTime !== undefined) {
        fieldsToUpdate.push('end_time = ?');
        values.push(data.endTime);
      }

      if (data.value !== undefined) {
        fieldsToUpdate.push('value = ?');
        values.push(data.value);
      }

      if (data.status !== undefined) {
        fieldsToUpdate.push('status = ?');
        values.push(data.status);
      }

      if (data.notes !== undefined) {
        fieldsToUpdate.push('notes = ?');
        values.push(data.notes);
      }

      if (data.locationId !== undefined) {
        fieldsToUpdate.push('location_id = ?');
        values.push(data.locationId);
      }

      if (data.contractorId !== undefined) {
        fieldsToUpdate.push('contractor_id = ?');
        values.push(data.contractorId);
      }

      fieldsToUpdate.push('updated_at = ?');
      values.push(now);

      fieldsToUpdate.push('is_synced = ?');
      values.push(0);

      fieldsToUpdate.push('version = ?');
      values.push(newVersion);

      values.push(id);

      await this.db.runAsync(
        `
        UPDATE shifts
        SET ${fieldsToUpdate.join(', ')}
        WHERE id = ?
      `,
        values
      );

      syncManager.queueOperation('update', 'shift', {
        id,
        ...data,
        userId: shift.userId,
        updatedAt: now,
        version: newVersion,
      });

      return true;
    } catch (error) {
      console.error('Erro ao atualizar plantão:', error);
      return false;
    }
  }

  async deleteShift(id: string): Promise<boolean> {
    if (!this.db) return false;

    try {
      const shift = await this.getShiftById(id);
      if (!shift) return false;

      const result = await this.db.getAllAsync(
        'SELECT COUNT(*) as count FROM payments WHERE shift_id = ?',
        [id]
      );

      const hasPayments = result[0]?.count > 0;

      if (hasPayments) {
        throw new Error(
          'Não é possível excluir este plantão porque há pagamentos associados a ele'
        );
      }

      await this.db.runAsync('DELETE FROM shifts WHERE id = ?', [id]);

      syncManager.queueOperation('delete', 'shift', {
        id,
        userId: shift.userId,
      });

      return true;
    } catch (error) {
      console.error('Erro ao excluir plantão:', error);
      throw error;
    }
  }

  async getShiftById(id: string): Promise<Shift | null> {
    if (!this.db) return null;

    try {
      const results = await this.db.getAllAsync(
        `
        SELECT 
          id, date, 
          start_time as startTime, 
          end_time as endTime,
          value, status, notes,
          user_id as userId,
          location_id as locationId,
          contractor_id as contractorId,
          created_at as createdAt, 
          updated_at as updatedAt
        FROM shifts
        WHERE id = ?
      `,
        [id]
      );

      if (results.length > 0) {
        return results[0] as Shift;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar plantão por ID:', error);
      return null;
    }
  }

  private async getShiftVersion(id: string): Promise<number> {
    if (!this.db) return 1;

    try {
      const results = await this.db.getAllAsync('SELECT version FROM shifts WHERE id = ?', [id]);

      return results.length > 0 ? results[0].version || 1 : 1;
    } catch (error) {
      console.error('Erro ao buscar versão do plantão:', error);
      return 1;
    }
  }

  async getShiftsByUserId(userId: string): Promise<Shift[]> {
    if (!this.db) return [];

    try {
      const results = await this.db.getAllAsync(
        `
        SELECT 
          id, date, 
          start_time as startTime, 
          end_time as endTime,
          value, status, notes,
          user_id as userId,
          location_id as locationId,
          contractor_id as contractorId,
          created_at as createdAt, 
          updated_at as updatedAt
        FROM shifts
        WHERE user_id = ?
        ORDER BY date DESC
      `,
        [userId]
      );

      return results as Shift[];
    } catch (error) {
      console.error('Erro ao buscar plantões por usuário:', error);
      return [];
    }
  }

  async getShiftsByDate(userId: string, date: string): Promise<Shift[]> {
    if (!this.db) return [];

    try {
      const results = await this.db.getAllAsync(
        `
        SELECT 
          id, date, 
          start_time as startTime, 
          end_time as endTime,
          value, status, notes,
          user_id as userId,
          location_id as locationId,
          contractor_id as contractorId,
          created_at as createdAt, 
          updated_at as updatedAt
        FROM shifts
        WHERE user_id = ? AND date = ?
        ORDER BY start_time ASC
      `,
        [userId, date]
      );

      return results as Shift[];
    } catch (error) {
      console.error('Erro ao buscar plantões por data:', error);
      return [];
    }
  }

  async getShiftsByMonth(userId: string, year: number, month: number): Promise<Shift[]> {
    if (!this.db) return [];

    try {
      const monthStr = month.toString().padStart(2, '0');
      const datePattern = `${year}-${monthStr}-%`;

      const results = await this.db.getAllAsync(
        `
        SELECT 
          id, date, 
          start_time as startTime, 
          end_time as endTime,
          value, status, notes,
          user_id as userId,
          location_id as locationId,
          contractor_id as contractorId,
          created_at as createdAt, 
          updated_at as updatedAt
        FROM shifts
        WHERE user_id = ? AND date LIKE ?
        ORDER BY date ASC, start_time ASC
      `,
        [userId, datePattern]
      );

      return results as Shift[];
    } catch (error) {
      console.error('Erro ao buscar plantões por mês/ano:', error);
      return [];
    }
  }

  async syncShiftFromRemote(shift: Shift): Promise<boolean> {
    if (!this.db) return false;

    try {
      const now = new Date().toISOString();
      const existingShift = await this.getShiftById(shift.id);

      if (existingShift) {
        const localVersion = await this.getShiftVersion(shift.id);
        const remoteVersion = shift.hasOwnProperty('version') ? (shift as any).version : 0;

        if (localVersion > remoteVersion) {
          syncManager.queueOperation('update', 'shift', {
            ...existingShift,
            version: localVersion,
          });
          return true;
        }

        await this.db.runAsync(
          `
          UPDATE shifts 
          SET 
            date = ?, 
            start_time = ?, 
            end_time = ?, 
            value = ?,
            status = ?,
            notes = ?,
            user_id = ?,
            location_id = ?,
            contractor_id = ?,
            updated_at = ?,
            is_synced = ?,
            last_synced = ?,
            version = ?
          WHERE id = ?
        `,
          [
            shift.date,
            shift.startTime,
            shift.endTime,
            shift.value,
            shift.status,
            shift.notes || null,
            shift.userId,
            shift.locationId || null,
            shift.contractorId || null,
            shift.updatedAt,
            1,
            now,
            remoteVersion,
            shift.id,
          ]
        );
      } else {
        await this.db.runAsync(
          `
          INSERT INTO shifts (
            id, date, start_time, end_time, value, status, notes,
            user_id, location_id, contractor_id,
            created_at, updated_at, is_synced, last_synced, version
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            shift.id,
            shift.date,
            shift.startTime,
            shift.endTime,
            shift.value,
            shift.status,
            shift.notes || null,
            shift.userId,
            shift.locationId || null,
            shift.contractorId || null,
            shift.createdAt,
            shift.updatedAt,
            1,
            now,
            shift.hasOwnProperty('version') ? (shift as any).version : 1,
          ]
        );
      }

      return true;
    } catch (error) {
      console.error('Erro ao sincronizar plantão do remoto:', error);
      return false;
    }
  }

  async getUnsyncedShifts(): Promise<Shift[]> {
    if (!this.db) return [];

    try {
      const results = await this.db.getAllAsync(`
        SELECT 
          id, date, 
          start_time as startTime, 
          end_time as endTime,
          value, status, notes,
          user_id as userId,
          location_id as locationId,
          contractor_id as contractorId,
          created_at as createdAt, 
          updated_at as updatedAt,
          version
        FROM shifts 
        WHERE is_synced = 0
      `);

      return results as Shift[];
    } catch (error) {
      console.error('Erro ao buscar plantões não sincronizados:', error);
      return [];
    }
  }

  async resolveConflict(localShift: Shift, remoteShift: Shift): Promise<Shift> {
    const localVersion = await this.getShiftVersion(localShift.id);
    const remoteVersion = (remoteShift as any).version || 0;

    if (remoteVersion > localVersion) {
      await this.syncShiftFromRemote(remoteShift);
      return remoteShift;
    } else if (localVersion > remoteVersion) {
      syncManager.queueOperation('update', 'shift', {
        ...localShift,
        version: localVersion,
      });
      return localShift;
    } else {
      const localUpdatedAt = new Date(localShift.updatedAt).getTime();
      const remoteUpdatedAt = new Date(remoteShift.updatedAt).getTime();

      if (remoteUpdatedAt >= localUpdatedAt) {
        await this.syncShiftFromRemote(remoteShift);
        return remoteShift;
      } else {
        syncManager.queueOperation('update', 'shift', localShift);
        return localShift;
      }
    }
  }
}

const shiftRepository = new ShiftRepository();
export default shiftRepository;
