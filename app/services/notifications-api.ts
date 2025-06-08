import { useAuth } from '@clerk/clerk-expo';

import apiClient from '../lib/axios';

export interface DeviceToken {
  id: string;
  token: string;
  deviceName?: string;
  deviceType?: string;
  appVersion?: string;
  isActive: boolean;
  lastUsedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationConfig {
  id: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface RegisterDeviceTokenData {
  token: string;
  deviceName?: string;
  deviceType?: string;
  appVersion?: string;
}

export interface UpdateNotificationConfigData {
  dailyReminder?: boolean;
  dailyReminderTime?: string;
  beforeShiftReminder?: boolean;
  beforeShiftMinutes?: number;
  weeklyReport?: boolean;
  weeklyReportDay?: number;
  weeklyReportTime?: string;
  monthlyReport?: boolean;
  monthlyReportDay?: number;
  monthlyReportTime?: string;
  shiftConfirmation?: boolean;
  paymentReminder?: boolean;
}

export interface SendNotificationData {
  title: string;
  body: string;
  type?: string;
  data?: Record<string, any>;
}

export const useNotificationsApi = () => {
  const { getToken } = useAuth();

  const registerDeviceToken = async (data: RegisterDeviceTokenData): Promise<DeviceToken> => {
    try {
      const token = await getToken();

      const response = await apiClient.post('/notifications/device-token', data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao registrar token do dispositivo:', error);
      throw error;
    }
  };

  const removeDeviceToken = async (deviceToken: string): Promise<void> => {
    try {
      const token = await getToken();

      await apiClient.delete(`/notifications/device-token/${deviceToken}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Erro ao remover token do dispositivo:', error);
      throw error;
    }
  };

  const getUserDeviceTokens = async (): Promise<DeviceToken[]> => {
    try {
      const token = await getToken();

      const response = await apiClient.get('/notifications/device-tokens', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar tokens do dispositivo:', error);
      throw error;
    }
  };

  const getNotificationConfig = async (): Promise<NotificationConfig> => {
    try {
      const token = await getToken();

      const response = await apiClient.get('/notifications/config', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar configuração de notificações:', error);
      throw error;
    }
  };

  const updateNotificationConfig = async (
    data: UpdateNotificationConfigData
  ): Promise<NotificationConfig> => {
    try {
      const token = await getToken();

      const response = await apiClient.put('/notifications/config', data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar configuração de notificações:', error);
      throw error;
    }
  };

  const sendNotification = async (data: SendNotificationData): Promise<{ message: string }> => {
    try {
      const token = await getToken();

      const response = await apiClient.post('/notifications/send', data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      throw error;
    }
  };

  return {
    registerDeviceToken,
    removeDeviceToken,
    getUserDeviceTokens,
    getNotificationConfig,
    updateNotificationConfig,
    sendNotification,
  };
};

// Default export
const notificationsApi = {
  useNotificationsApi,
};

export default notificationsApi;
