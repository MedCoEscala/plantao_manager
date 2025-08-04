import * as Notifications from 'expo-notifications';
import { isAfter, startOfDay } from 'date-fns';

import { ShiftNotificationsManager } from '../utils/shiftNotifications';
import { Shift } from './shifts-api';

export class NotificationCleanupService {
  static async cleanupExpiredNotifications(): Promise<void> {
    try {
      console.log('🧹 Iniciando limpeza de notificações expiradas');

      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const now = new Date();
      const today = startOfDay(now);

      const expiredNotificationIds: string[] = [];

      for (const notification of scheduledNotifications) {
        const data = notification.content.data as any;

        if (data?.shiftDate && data?.type) {
          try {
            const shiftDate = new Date(data.shiftDate);

            if (!isAfter(shiftDate, today)) {
              expiredNotificationIds.push(notification.identifier);
              console.log(`🗑️ Marcando notificação expirada: ${notification.identifier}`);
            }
          } catch (error) {
            expiredNotificationIds.push(notification.identifier);
            console.warn(`⚠️ Notificação com data inválida removida: ${notification.identifier}`);
          }
        }
      }

      if (expiredNotificationIds.length > 0) {
        for (const id of expiredNotificationIds) {
          await Notifications.cancelScheduledNotificationAsync(id);
        }
        console.log(`✅ ${expiredNotificationIds.length} notificações expiradas removidas`);
      } else {
        console.log('✅ Nenhuma notificação expirada encontrada');
      }
    } catch (error) {
      console.error('❌ Erro na limpeza de notificações expiradas:', error);
    }
  }

  static async syncNotificationsWithActiveShifts(activeShifts: Shift[]): Promise<void> {
    try {
      console.log('🔄 Sincronizando notificações com plantões ativos');

      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const activeShiftIds = new Set(activeShifts.map((shift) => shift.id));

      const orphanedNotificationIds: string[] = [];

      for (const notification of scheduledNotifications) {
        const data = notification.content.data as any;

        if (data?.shiftId && data?.type && data.type !== 'daily_reminder') {
          const shiftId = data.shiftId;

          if (!activeShiftIds.has(shiftId)) {
            orphanedNotificationIds.push(notification.identifier);
            console.log(
              `🗑️ Notificação órfã encontrada para plantão ${shiftId}: ${notification.identifier}`
            );
          }
        }
      }

      if (orphanedNotificationIds.length > 0) {
        for (const id of orphanedNotificationIds) {
          await Notifications.cancelScheduledNotificationAsync(id);
        }
        console.log(`✅ ${orphanedNotificationIds.length} notificações órfãs removidas`);
      } else {
        console.log('✅ Nenhuma notificação órfã encontrada');
      }
    } catch (error) {
      console.error('❌ Erro na sincronização de notificações:', error);
    }
  }

  static async performMaintenance(activeShifts?: Shift[]): Promise<void> {
    console.log('🔧 Executando manutenção de notificações');

    try {
      await this.cleanupExpiredNotifications();

      if (activeShifts && activeShifts.length > 0) {
        await this.syncNotificationsWithActiveShifts(activeShifts);
      }

      console.log('✅ Manutenção de notificações concluída');
    } catch (error) {
      console.error('❌ Erro na manutenção de notificações:', error);
    }
  }

  static async clearAllShiftNotifications(): Promise<void> {
    try {
      console.log('🧹 Removendo TODAS as notificações de plantões');

      await ShiftNotificationsManager.cancelAllShiftNotifications();

      console.log('✅ Todas as notificações de plantões foram removidas');
    } catch (error) {
      console.error('❌ Erro ao remover todas as notificações:', error);
    }
  }

  static async getNotificationStats(): Promise<{
    total: number;
    shiftNotifications: number;
    dailyReminders: number;
    expiredCount: number;
  }> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const now = new Date();
      const today = startOfDay(now);

      let shiftNotifications = 0;
      let dailyReminders = 0;
      let expiredCount = 0;

      for (const notification of scheduledNotifications) {
        const data = notification.content.data as any;

        if (data?.type === 'daily_reminder') {
          dailyReminders++;
        } else if (data?.type && data?.shiftDate) {
          shiftNotifications++;

          try {
            const shiftDate = new Date(data.shiftDate);
            if (!isAfter(shiftDate, today)) {
              expiredCount++;
            }
          } catch {
            expiredCount++;
          }
        }
      }

      return {
        total: scheduledNotifications.length,
        shiftNotifications,
        dailyReminders,
        expiredCount,
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas de notificações:', error);
      return {
        total: 0,
        shiftNotifications: 0,
        dailyReminders: 0,
        expiredCount: 0,
      };
    }
  }
}

export function useNotificationCleanup() {
  const cleanupExpired = async () => {
    await NotificationCleanupService.cleanupExpiredNotifications();
  };

  const syncWithShifts = async (shifts: Shift[]) => {
    await NotificationCleanupService.syncNotificationsWithActiveShifts(shifts);
  };

  const performMaintenance = async (shifts?: Shift[]) => {
    await NotificationCleanupService.performMaintenance(shifts);
  };

  const clearAll = async () => {
    await NotificationCleanupService.clearAllShiftNotifications();
  };

  const getStats = async () => {
    return await NotificationCleanupService.getNotificationStats();
  };

  return {
    cleanupExpired,
    syncWithShifts,
    performMaintenance,
    clearAll,
    getStats,
  };
}

export default NotificationCleanupService;
