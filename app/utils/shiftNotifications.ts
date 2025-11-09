import { format, addMinutes, subMinutes, startOfDay, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as Notifications from 'expo-notifications';

import { formatShiftDate, formatTime } from './formatters';
import { Shift } from '../services/shifts-api';

export const NOTIFICATION_TYPES = {
  DAILY_REMINDER: 'daily_reminder',
  BEFORE_SHIFT: 'before_shift',
  SHIFT_CONFIRMATION: 'shift_confirmation',
  WEEKLY_REPORT: 'weekly_report', // 🆕 NOVO: Adicionado tipo para relatório semanal
  MONTHLY_REPORT: 'monthly_report', // 🆕 NOVO: Preparado para futuro uso
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

interface ShiftNotificationData extends Record<string, unknown> {
  shiftId: string;
  type: NotificationType;
  shiftDate: string;
  locationName?: string;
  startTime?: string;
  endTime?: string;
}

// 🆕 NOVO: Interface específica para dados de relatório semanal
interface WeeklyReportNotificationData extends Record<string, unknown> {
  type: 'weekly_report';
  weekStart: string;
  weekEnd: string;
  shiftsCount: number;
  totalValue: number;
  totalHours: number;
  uniqueLocations?: number;
}

interface SimpleNotificationConfig {
  dailyReminder: boolean;
  dailyReminderTime: string;
  beforeShiftReminder: boolean;
  beforeShiftMinutes: number;
  weeklyReport: boolean;
  weeklyReportDay: number;
  weeklyReportTime: string;
  monthlyReport: boolean;
  monthlyReportDay: number;
  monthlyReportTime: string;
  shiftConfirmation: boolean;
  paymentReminder: boolean;
}

export class ShiftNotificationsManager {
  static async scheduleShiftNotifications(
    shift: Shift,
    config: SimpleNotificationConfig
  ): Promise<void> {
    try {
      console.log(`📅 Agendando notificações para plantão ${shift.id}`);

      await this.cancelShiftNotifications(shift.id);

      const shiftDate = new Date(shift.date);
      const now = new Date();

      if (isBefore(shiftDate, startOfDay(now))) {
        console.log(`⏰ Plantão ${shift.id} já passou, não agendando notificações`);
        return;
      }

      const notifications: {
        identifier: string;
        trigger: Date;
        content: Notifications.NotificationContentInput;
      }[] = [];

      if (config.beforeShiftReminder && shift.startTime) {
        const shiftDateTime = this.createShiftDateTime(shift.date, shift.startTime);
        const reminderTime = subMinutes(shiftDateTime, config.beforeShiftMinutes);

        if (isAfter(reminderTime, now)) {
          notifications.push({
            identifier: `${NOTIFICATION_TYPES.BEFORE_SHIFT}_${shift.id}`,
            trigger: reminderTime,
            content: {
              title: '⏰ Lembrete de Plantão',
              body: `Seu plantão em ${shift.location?.name || 'Local não definido'} começa em ${config.beforeShiftMinutes} minutos (${formatTime(shift.startTime)})`,
              data: {
                type: NOTIFICATION_TYPES.BEFORE_SHIFT,
                shiftId: shift.id,
                shiftDate: shift.date,
                locationName: shift.location?.name,
                startTime: shift.startTime,
              } as ShiftNotificationData,
              sound: 'default',
              priority: 'high',
              categoryIdentifier: 'SHIFT_REMINDER',
            },
          });
        }
      }

      if (config.shiftConfirmation) {
        const morningReminder = new Date(shiftDate);
        morningReminder.setHours(8, 0, 0, 0); // 8:00 AM

        if (isAfter(morningReminder, now)) {
          notifications.push({
            identifier: `${NOTIFICATION_TYPES.SHIFT_CONFIRMATION}_${shift.id}`,
            trigger: morningReminder,
            content: {
              title: '📋 Plantão Hoje',
              body: `Você tem plantão hoje em ${shift.location?.name || 'Local não definido'}${shift.startTime ? ` às ${formatTime(shift.startTime)}` : ''}`,
              data: {
                type: NOTIFICATION_TYPES.SHIFT_CONFIRMATION,
                shiftId: shift.id,
                shiftDate: shift.date,
                locationName: shift.location?.name,
                startTime: shift.startTime,
              } as ShiftNotificationData,
              sound: 'default',
              priority: 'normal',
              categoryIdentifier: 'SHIFT_CONFIRMATION',
            },
          });
        }
      }

      for (const notification of notifications) {
        try {
          await Notifications.scheduleNotificationAsync({
            identifier: notification.identifier,
            content: notification.content,
            trigger: { date: notification.trigger } as Notifications.DateTriggerInput,
          });

          console.log(
            `✅ Notificação agendada: ${notification.identifier} para ${notification.trigger.toLocaleString()}`
          );
        } catch (error) {
          console.error(`❌ Erro ao agendar notificação ${notification.identifier}:`, error);
        }
      }

      console.log(`📅 ${notifications.length} notificações agendadas para plantão ${shift.id}`);
    } catch (error) {
      console.error(`❌ Erro ao agendar notificações para plantão ${shift.id}:`, error);
    }
  }

  static async scheduleMultipleShiftNotifications(
    shifts: Shift[],
    config: SimpleNotificationConfig
  ): Promise<void> {
    console.log(`📅 Agendando notificações para ${shifts.length} plantões`);

    for (const shift of shifts) {
      await this.scheduleShiftNotifications(shift, config);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  static async cancelShiftNotifications(shiftId: string): Promise<void> {
    try {
      const identifiers = [
        `${NOTIFICATION_TYPES.BEFORE_SHIFT}_${shiftId}`,
        `${NOTIFICATION_TYPES.SHIFT_CONFIRMATION}_${shiftId}`,
      ];

      for (const identifier of identifiers) {
        await Notifications.cancelScheduledNotificationAsync(identifier);
      }

      console.log(`🗑️ Notificações canceladas para plantão ${shiftId}`);
    } catch (error) {
      console.error(`❌ Erro ao cancelar notificações do plantão ${shiftId}:`, error);
    }
  }

  static async cancelAllShiftNotifications(): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

      const shiftNotificationIds = scheduledNotifications
        .filter(
          (notification) =>
            notification.identifier.includes(NOTIFICATION_TYPES.BEFORE_SHIFT) ||
            notification.identifier.includes(NOTIFICATION_TYPES.SHIFT_CONFIRMATION)
        )
        .map((notification) => notification.identifier);

      if (shiftNotificationIds.length > 0) {
        for (const id of shiftNotificationIds) {
          await Notifications.cancelScheduledNotificationAsync(id);
        }
        console.log(`🗑️ ${shiftNotificationIds.length} notificações de plantões canceladas`);
      }
    } catch (error) {
      console.error('❌ Erro ao cancelar todas as notificações de plantões:', error);
    }
  }

  static async rescheduleMaintainActiveShiftNotifications(
    activeShifts: Shift[],
    config: SimpleNotificationConfig
  ): Promise<void> {
    console.log('🔄 Reagendando notificações devido a mudança de configuração');

    await this.cancelAllShiftNotifications();

    const futureShifts = activeShifts.filter((shift) =>
      isAfter(new Date(shift.date), startOfDay(new Date()))
    );

    await this.scheduleMultipleShiftNotifications(futureShifts, config);
  }

  static async scheduleDailyReminder(config: SimpleNotificationConfig): Promise<void> {
    if (!config.dailyReminder) return;

    try {
      await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_TYPES.DAILY_REMINDER);

      const [hours, minutes] = config.dailyReminderTime.split(':').map(Number);

      await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_TYPES.DAILY_REMINDER,
        content: {
          title: '📅 Lembrete Diário',
          body: 'Não esqueça de verificar seus plantões de hoje!',
          data: {
            type: NOTIFICATION_TYPES.DAILY_REMINDER,
          } as Record<string, unknown>,
          sound: 'default',
          priority: 'normal',
        },
        trigger: {
          type: 'daily',
          hour: hours,
          minute: minutes,
          repeats: true,
        } as Notifications.DailyTriggerInput,
      });

      console.log(`✅ Lembrete diário agendado para ${config.dailyReminderTime}`);
    } catch (error) {
      console.error('❌ Erro ao agendar lembrete diário:', error);
    }
  }

  // 🆕 NOVO: Método para lidar com notificações de relatório semanal recebidas
  static handleWeeklyReportNotification(data: WeeklyReportNotificationData): void {
    console.log('📊 Notificação de relatório semanal recebida:', {
      weekStart: data.weekStart,
      weekEnd: data.weekEnd,
      shiftsCount: data.shiftsCount,
      totalHours: data.totalHours,
      totalValue: data.totalValue,
    });

    // Aqui você pode adicionar lógica adicional para lidar com a notificação
    // Por exemplo, navegar para uma tela específica, mostrar um modal, etc.
  }

  // 🆕 NOVO: Método para verificar se uma notificação é de relatório semanal
  static isWeeklyReportNotification(data: any): data is WeeklyReportNotificationData {
    return data && data.type === NOTIFICATION_TYPES.WEEKLY_REPORT;
  }

  // 🆕 NOVO: Método para obter estatísticas de notificações agendadas
  static async getNotificationStats(): Promise<{
    total: number;
    byType: Record<string, number>;
  }> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

      const stats = {
        total: scheduledNotifications.length,
        byType: {} as Record<string, number>,
      };

      for (const notification of scheduledNotifications) {
        const data = notification.content.data as any;
        const type = data?.type || 'unknown';
        stats.byType[type] = (stats.byType[type] || 0) + 1;
      }

      return stats;
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas de notificações:', error);
      return { total: 0, byType: {} };
    }
  }

  private static createShiftDateTime(date: string, time: string): Date {
    const shiftDate = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);

    const shiftDateTime = new Date(shiftDate);
    shiftDateTime.setHours(hours, minutes, 0, 0);

    return shiftDateTime;
  }

  static async getScheduledShiftNotifications(): Promise<{
    count: number;
    notifications: Notifications.NotificationRequest[];
  }> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

      const shiftNotifications = scheduledNotifications.filter(
        (notification) =>
          notification.identifier.includes(NOTIFICATION_TYPES.BEFORE_SHIFT) ||
          notification.identifier.includes(NOTIFICATION_TYPES.SHIFT_CONFIRMATION)
      );

      return {
        count: shiftNotifications.length,
        notifications: shiftNotifications,
      };
    } catch (error) {
      console.error('❌ Erro ao listar notificações agendadas:', error);
      return { count: 0, notifications: [] };
    }
  }
}

export default ShiftNotificationsManager;
