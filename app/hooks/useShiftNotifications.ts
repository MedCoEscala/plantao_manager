import { useCallback, useEffect, useRef } from 'react';

import { useNotificationsContext } from '../contexts/NotificationContext';
import { Shift } from '../services/shifts-api';
import { ShiftNotificationsManager } from '../utils/shiftNotifications';

export function useShiftNotifications() {
  const { config, hasPermissions, isRegistered } = useNotificationsContext();
  const configRef = useRef(config);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const canScheduleNotifications = useCallback((): boolean => {
    return !!(hasPermissions && isRegistered && configRef.current);
  }, [hasPermissions, isRegistered]);

  const scheduleNotificationsForShift = useCallback(
    async (shift: Shift): Promise<void> => {
      if (!canScheduleNotifications()) {
        console.log('📵 Notificações não disponíveis - pulando agendamento');
        return;
      }

      if (!configRef.current) {
        console.warn('⚠️ Configuração de notificações não disponível');
        return;
      }

      try {
        await ShiftNotificationsManager.scheduleShiftNotifications(shift, configRef.current);
      } catch (error) {
        console.error('❌ Erro ao agendar notificações para plantão:', error);
      }
    },
    [canScheduleNotifications]
  );

  const scheduleNotificationsForMultipleShifts = useCallback(
    async (shifts: Shift[]): Promise<void> => {
      if (!canScheduleNotifications() || shifts.length === 0) {
        console.log('📵 Notificações não disponíveis ou nenhum plantão - pulando agendamento');
        return;
      }

      if (!configRef.current) {
        console.warn('⚠️ Configuração de notificações não disponível');
        return;
      }

      try {
        await ShiftNotificationsManager.scheduleMultipleShiftNotifications(
          shifts,
          configRef.current
        );
      } catch (error) {
        console.error('❌ Erro ao agendar notificações para múltiplos plantões:', error);
      }
    },
    [canScheduleNotifications]
  );

  const cancelNotificationsForShift = useCallback(async (shiftId: string): Promise<void> => {
    try {
      await ShiftNotificationsManager.cancelShiftNotifications(shiftId);
    } catch (error) {
      console.error('❌ Erro ao cancelar notificações do plantão:', error);
    }
  }, []);

  const updateNotificationsForShift = useCallback(
    async (updatedShift: Shift): Promise<void> => {
      if (!canScheduleNotifications()) {
        console.log('📵 Notificações não disponíveis - pulando atualização');
        return;
      }

      try {
        await cancelNotificationsForShift(updatedShift.id);

        await scheduleNotificationsForShift(updatedShift);

        console.log(`🔄 Notificações atualizadas para plantão ${updatedShift.id}`);
      } catch (error) {
        console.error('❌ Erro ao atualizar notificações do plantão:', error);
      }
    },
    [canScheduleNotifications, cancelNotificationsForShift, scheduleNotificationsForShift]
  );

  const rescheduleMaintainAllNotifications = useCallback(
    async (activeShifts: Shift[]): Promise<void> => {
      if (!canScheduleNotifications()) {
        console.log('📵 Notificações não disponíveis - cancelando todas');
        await ShiftNotificationsManager.cancelAllShiftNotifications();
        return;
      }

      if (!configRef.current) {
        console.warn('⚠️ Configuração não disponível para reagendamento');
        return;
      }

      try {
        await ShiftNotificationsManager.rescheduleMaintainActiveShiftNotifications(
          activeShifts,
          configRef.current
        );
      } catch (error) {
        console.error('❌ Erro ao reagendar todas as notificações:', error);
      }
    },
    [canScheduleNotifications]
  );

  const scheduleDailyReminder = useCallback(async (): Promise<void> => {
    if (!canScheduleNotifications() || !configRef.current) {
      console.log('📵 Não é possível agendar lembrete diário');
      return;
    }

    try {
      await ShiftNotificationsManager.scheduleDailyReminder(configRef.current);
    } catch (error) {
      console.error('❌ Erro ao agendar lembrete diário:', error);
    }
  }, [canScheduleNotifications]);

  const getScheduledNotificationsInfo = useCallback(async () => {
    return await ShiftNotificationsManager.getScheduledShiftNotifications();
  }, []);

  useEffect(() => {
    if (config && hasPermissions && isRegistered) {
      scheduleDailyReminder();
    }
  }, [config, hasPermissions, isRegistered, scheduleDailyReminder]);

  return {
    canScheduleNotifications: canScheduleNotifications(),
    hasPermissions,
    isRegistered,
    config: configRef.current,

    scheduleNotificationsForShift,
    cancelNotificationsForShift,
    updateNotificationsForShift,

    // Métodos para múltiplos plantões
    scheduleNotificationsForMultipleShifts,
    rescheduleMaintainAllNotifications,

    // Lembrete diário
    scheduleDailyReminder,

    // Debug
    getScheduledNotificationsInfo,
  };
}

export default useShiftNotifications;
