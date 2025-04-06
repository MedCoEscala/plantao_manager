import { SQLiteDatabase } from 'expo-sqlite';
import { v4 as uuidv4 } from 'uuid';
import syncManager from '../services/sync/syncManager';

export interface Payment {
  id: string;
  shiftId: string;
  paymentDate?: string;
  grossValue: number;
  netValue: number;
  paid: boolean;
  notes?: string;
  method?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentCreateInput {
  shiftId: string;
  paymentDate?: string;
  grossValue: number;
  netValue: number;
  paid: boolean;
  notes?: string;
  method?: string;
}

export interface PaymentUpdateInput {
  paymentDate?: string;
  grossValue?: number;
  netValue?: number;
  paid?: boolean;
  notes?: string;
  method?: string;
}

export class PaymentRepository {
  private db: SQLiteDatabase | null = null;

  initialize(database: SQLiteDatabase) {
    this.db = database;
    this.setupDatabase();
  }

  private async setupDatabase() {
    if (!this.db) return;

    try {
      await this.db.runAsync(`
        CREATE TABLE IF NOT EXISTS payments (
          id TEXT PRIMARY KEY,
          shift_id TEXT NOT NULL,
          payment_date TEXT,
          gross_value REAL NOT NULL,
          net_value REAL NOT NULL,
          paid INTEGER NOT NULL,
          notes TEXT,
          method TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          is_synced INTEGER DEFAULT 0,
          last_synced TEXT,
          FOREIGN KEY (shift_id) REFERENCES shifts(id)
        );
      `);
    } catch (error) {
      console.error('Erro ao criar tabela de pagamentos:', error);
    }
  }

  async createPayment(data: PaymentCreateInput, id?: string): Promise<Payment | null> {
    if (!this.db) return null;

    try {
      const paymentId = id || uuidv4();
      const now = new Date().toISOString();

      await this.db.runAsync(
        `
        INSERT INTO payments (
          id, shift_id, payment_date, gross_value, net_value, paid,
          notes, method, created_at, updated_at, is_synced
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          paymentId,
          data.shiftId,
          data.paymentDate || null,
          data.grossValue,
          data.netValue,
          data.paid ? 1 : 0,
          data.notes || null,
          data.method || null,
          now,
          now,
          0,
        ]
      );

      syncManager.queueOperation('create', 'payment', {
        id: paymentId,
        ...data,
        createdAt: now,
        updatedAt: now,
      });

      return {
        id: paymentId,
        shiftId: data.shiftId,
        paymentDate: data.paymentDate,
        grossValue: data.grossValue,
        netValue: data.netValue,
        paid: data.paid,
        notes: data.notes,
        method: data.method,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      return null;
    }
  }

  async updatePayment(id: string, data: PaymentUpdateInput): Promise<boolean> {
    if (!this.db) return false;

    try {
      const now = new Date().toISOString();

      const payment = await this.getPaymentById(id);
      if (!payment) return false;

      const fieldsToUpdate: string[] = [];
      const values: any[] = [];

      if (data.paymentDate !== undefined) {
        fieldsToUpdate.push('payment_date = ?');
        values.push(data.paymentDate);
      }

      if (data.grossValue !== undefined) {
        fieldsToUpdate.push('gross_value = ?');
        values.push(data.grossValue);
      }

      if (data.netValue !== undefined) {
        fieldsToUpdate.push('net_value = ?');
        values.push(data.netValue);
      }

      if (data.paid !== undefined) {
        fieldsToUpdate.push('paid = ?');
        values.push(data.paid ? 1 : 0);
      }

      if (data.notes !== undefined) {
        fieldsToUpdate.push('notes = ?');
        values.push(data.notes);
      }

      if (data.method !== undefined) {
        fieldsToUpdate.push('method = ?');
        values.push(data.method);
      }

      fieldsToUpdate.push('updated_at = ?');
      values.push(now);

      fieldsToUpdate.push('is_synced = ?');
      values.push(0);

      values.push(id);

      await this.db.runAsync(
        `
        UPDATE payments
        SET ${fieldsToUpdate.join(', ')}
        WHERE id = ?
      `,
        values
      );

      syncManager.queueOperation('update', 'payment', {
        id,
        ...data,
        shiftId: payment.shiftId,
        updatedAt: now,
      });

      return true;
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error);
      return false;
    }
  }

  async deletePayment(id: string): Promise<boolean> {
    if (!this.db) return false;

    try {
      const payment = await this.getPaymentById(id);
      if (!payment) return false;

      await this.db.runAsync('DELETE FROM payments WHERE id = ?', [id]);

      syncManager.queueOperation('delete', 'payment', {
        id,
        shiftId: payment.shiftId,
      });

      return true;
    } catch (error) {
      console.error('Erro ao excluir pagamento:', error);
      return false;
    }
  }

  async getPaymentById(id: string): Promise<Payment | null> {
    if (!this.db) return null;

    try {
      const results = await this.db.getAllAsync(
        `
        SELECT 
          id, 
          shift_id as shiftId,
          payment_date as paymentDate,
          gross_value as grossValue,
          net_value as netValue,
          paid,
          notes,
          method,
          created_at as createdAt,
          updated_at as updatedAt
        FROM payments
        WHERE id = ?
      `,
        [id]
      );

      if (results.length > 0) {
        const payment = results[0] as any;
        return {
          ...payment,
          paid: !!payment.paid,
        } as Payment;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar pagamento por ID:', error);
      return null;
    }
  }

  async getPaymentsByShiftId(shiftId: string): Promise<Payment[]> {
    if (!this.db) return [];

    try {
      const results = await this.db.getAllAsync(
        `
        SELECT 
          id, 
          shift_id as shiftId,
          payment_date as paymentDate,
          gross_value as grossValue,
          net_value as netValue,
          paid,
          notes,
          method,
          created_at as createdAt,
          updated_at as updatedAt
        FROM payments
        WHERE shift_id = ?
        ORDER BY payment_date DESC
      `,
        [shiftId]
      );

      return results.map((payment) => ({
        ...payment,
        paid: !!payment.paid,
      })) as Payment[];
    } catch (error) {
      console.error('Erro ao buscar pagamentos por plantão:', error);
      return [];
    }
  }

  async getPaymentsByPeriod(startDate: string, endDate: string): Promise<Payment[]> {
    if (!this.db) return [];

    try {
      const results = await this.db.getAllAsync(
        `
        SELECT 
          id, 
          shift_id as shiftId,
          payment_date as paymentDate,
          gross_value as grossValue,
          net_value as netValue,
          paid,
          notes,
          method,
          created_at as createdAt,
          updated_at as updatedAt
        FROM payments
        WHERE payment_date >= ? AND payment_date <= ?
        ORDER BY payment_date DESC
      `,
        [startDate, endDate]
      );

      return results.map((payment) => ({
        ...payment,
        paid: !!payment.paid,
      })) as Payment[];
    } catch (error) {
      console.error('Erro ao buscar pagamentos por período:', error);
      return [];
    }
  }

  async getPaymentsByUserId(userId: string): Promise<Payment[]> {
    if (!this.db) return [];

    try {
      const results = await this.db.getAllAsync(
        `
        SELECT 
          p.id, 
          p.shift_id as shiftId,
          p.payment_date as paymentDate,
          p.gross_value as grossValue,
          p.net_value as netValue,
          p.paid,
          p.notes,
          p.method,
          p.created_at as createdAt,
          p.updated_at as updatedAt
        FROM payments p
        JOIN shifts s ON p.shift_id = s.id
        WHERE s.user_id = ?
        ORDER BY p.payment_date DESC, p.created_at DESC
      `,
        [userId]
      );

      return results.map((payment) => ({
        ...payment,
        paid: !!payment.paid,
      })) as Payment[];
    } catch (error) {
      console.error('Erro ao buscar pagamentos por usuário:', error);
      return [];
    }
  }

  async syncPaymentFromRemote(payment: Payment): Promise<boolean> {
    if (!this.db) return false;

    try {
      const now = new Date().toISOString();
      const existingPayment = await this.getPaymentById(payment.id);

      if (existingPayment) {
        const localUpdatedAt = new Date(existingPayment.updatedAt).getTime();
        const remoteUpdatedAt = new Date(payment.updatedAt).getTime();

        if (localUpdatedAt > remoteUpdatedAt) {
          syncManager.queueOperation('update', 'payment', existingPayment);
          return true;
        }

        await this.db.runAsync(
          `
          UPDATE payments 
          SET 
            shift_id = ?, 
            payment_date = ?, 
            gross_value = ?, 
            net_value = ?,
            paid = ?,
            notes = ?,
            method = ?,
            updated_at = ?,
            is_synced = ?,
            last_synced = ?
          WHERE id = ?
        `,
          [
            payment.shiftId,
            payment.paymentDate || null,
            payment.grossValue,
            payment.netValue,
            payment.paid ? 1 : 0,
            payment.notes || null,
            payment.method || null,
            payment.updatedAt,
            1,
            now,
            payment.id,
          ]
        );
      } else {
        await this.db.runAsync(
          `
          INSERT INTO payments (
            id, shift_id, payment_date, gross_value, net_value, paid,
            notes, method, created_at, updated_at, is_synced, last_synced
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            payment.id,
            payment.shiftId,
            payment.paymentDate || null,
            payment.grossValue,
            payment.netValue,
            payment.paid ? 1 : 0,
            payment.notes || null,
            payment.method || null,
            payment.createdAt,
            payment.updatedAt,
            1,
            now,
          ]
        );
      }

      return true;
    } catch (error) {
      console.error('Erro ao sincronizar pagamento do remoto:', error);
      return false;
    }
  }

  async getUnsyncedPayments(): Promise<Payment[]> {
    if (!this.db) return [];

    try {
      const results = await this.db.getAllAsync(`
        SELECT 
          id, 
          shift_id as shiftId,
          payment_date as paymentDate,
          gross_value as grossValue,
          net_value as netValue,
          paid,
          notes,
          method,
          created_at as createdAt,
          updated_at as updatedAt
        FROM payments 
        WHERE is_synced = 0
      `);
      return results.map((payment) => ({
        ...payment,
        paid: !!payment.paid,
      })) as Payment[];
    } catch (error) {
      console.error('Erro ao buscar pagamentos não sincronizados:', error);
      return [];
    }
  }

  async resolveConflict(localPayment: Payment, remotePayment: Payment): Promise<Payment> {
    const localUpdatedAt = new Date(localPayment.updatedAt).getTime();
    const remoteUpdatedAt = new Date(remotePayment.updatedAt).getTime();

    if (remoteUpdatedAt >= localUpdatedAt) {
      await this.syncPaymentFromRemote(remotePayment);
      return remotePayment;
    } else {
      syncManager.queueOperation('update', 'payment', localPayment);
      return localPayment;
    }
  }
}

const paymentRepository = new PaymentRepository();
export default paymentRepository;
