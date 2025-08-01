import { useAuth } from '@clerk/clerk-expo';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';

import { useToast } from '../components/ui/Toast';
import { useNotificationsApi } from '../services/notifications-api';

// Configurar como as notificações devem ser tratadas
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationConfig {
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

export interface UseNotificationsReturn {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  isRegistered: boolean;
  isLoading: boolean;
  hasPermissions: boolean;
  config: NotificationConfig | null;
  isConfigLoading: boolean;

  // Métodos
  requestPermissions: () => Promise<boolean>;
  sendTestNotification: () => Promise<void>;
  updateConfig: (config: Partial<NotificationConfig>) => Promise<void>;
  refreshConfig: () => Promise<void>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [config, setConfig] = useState<NotificationConfig | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState(true);

  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { showToast } = useToast();
  const notificationsApi = useNotificationsApi();

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const appStateListener = useRef<any>(null);
  const initializationRef = useRef(false);

  // Solicitar permissões de notificação
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      if (!Device.isDevice) {
        console.log('📱 Notificações não funcionam no simulador');
        return false;
      }

      // Configurar canal Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Notificações Padrão',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#18CB96',
          description: 'Notificações gerais do MedEscala',
        });

        await Notifications.setNotificationChannelAsync('shifts', {
          name: 'Plantões',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#18CB96',
          description: 'Notificações sobre plantões e lembretes',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('🔕 Permissão de notificação negada');
        setHasPermissions(false);
        return false;
      }

      setHasPermissions(true);
      return true;
    } catch (error) {
      console.error('❌ Erro ao solicitar permissões:', error);
      setHasPermissions(false);
      return false;
    }
  }, []);

  // Registrar token de push
  const registerPushToken = useCallback(async (): Promise<string | null> => {
    try {
      if (!Device.isDevice) {
        console.log('📱 Push tokens não funcionam no simulador');
        return null;
      }

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

      if (!projectId) {
        console.log('🔕 ProjectId não configurado - notificações desabilitadas');
        return null;
      }

      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('🔔 Token obtido:', token.substring(0, 20) + '...');

      return token;
    } catch (error) {
      console.error('❌ Erro ao obter push token:', error);
      return null;
    }
  }, []);

  // Registrar token no backend
  const registerTokenWithBackend = useCallback(
    async (token: string): Promise<void> => {
      try {
        const deviceName = (await Device.deviceName) || 'Dispositivo desconhecido';
        const deviceType = Platform.OS;
        const appVersion = Constants.expoConfig?.version || 'unknown';

        await notificationsApi.registerDeviceToken({
          token,
          deviceName,
          deviceType,
          appVersion,
        });

        setIsRegistered(true);
        console.log('✅ Token registrado no backend');
      } catch (error) {
        console.error('❌ Erro ao registrar token no backend:', error);
        setIsRegistered(false);
      }
    },
    [notificationsApi]
  );

  // Carregar configurações de notificação
  const loadNotificationConfig = useCallback(async (): Promise<void> => {
    try {
      setIsConfigLoading(true);
      const notificationConfig = await notificationsApi.getNotificationConfig();
      setConfig(notificationConfig);
    } catch (error) {
      console.error('❌ Erro ao carregar configurações:', error);
      // Configuração padrão
      setConfig({
        dailyReminder: true,
        dailyReminderTime: '08:00',
        beforeShiftReminder: true,
        beforeShiftMinutes: 60,
        weeklyReport: true,
        weeklyReportDay: 1,
        weeklyReportTime: '09:00',
        monthlyReport: true,
        monthlyReportDay: 1,
        monthlyReportTime: '09:00',
        shiftConfirmation: false,
        paymentReminder: true,
      });
    } finally {
      setIsConfigLoading(false);
    }
  }, [notificationsApi]);

  // Atualizar configurações
  const updateConfig = useCallback(
    async (newConfig: Partial<NotificationConfig>): Promise<void> => {
      try {
        const updatedConfig = await notificationsApi.updateNotificationConfig(newConfig);
        setConfig(updatedConfig);
        showToast('Configurações atualizadas com sucesso!', 'success');
      } catch (error) {
        console.error('❌ Erro ao atualizar configurações:', error);
        showToast('Erro ao atualizar configurações', 'error');
        throw error;
      }
    },
    [notificationsApi, showToast]
  );

  const refreshConfig = useCallback(async (): Promise<void> => {
    await loadNotificationConfig();
  }, [loadNotificationConfig]);

  // Enviar notificação de teste
  const sendTestNotification = useCallback(async (): Promise<void> => {
    try {
      await notificationsApi.sendNotification({
        title: '🏥 Teste de Notificação',
        body: 'Se você recebeu esta notificação, o sistema está funcionando perfeitamente!',
        type: 'test',
        data: { timestamp: new Date().toISOString() },
      });
      showToast('Notificação de teste enviada!', 'success');
    } catch (error) {
      console.error('❌ Erro ao enviar notificação de teste:', error);
      showToast('Erro ao enviar notificação de teste', 'error');
    }
  }, [notificationsApi, showToast]);

  // Inicialização principal
  const initializeNotifications = useCallback(async (): Promise<void> => {
    if (!isLoaded || !isSignedIn || initializationRef.current) {
      return;
    }

    initializationRef.current = true;
    setIsLoading(true);

    try {
      console.log('🔔 Inicializando sistema de notificações...');

      // 1. Solicitar permissões
      const hasPerms = await requestPermissions();
      if (!hasPerms) {
        console.log('⚠️ Sem permissões de notificação');
        setIsLoading(false);
        return;
      }

      // 2. Obter token de push
      const token = await registerPushToken();
      if (token) {
        setExpoPushToken(token);
        // 3. Registrar no backend
        await registerTokenWithBackend(token);
      } else {
        console.log('⚠️ Não foi possível obter token de push');
      }

      // 4. Carregar configurações
      await loadNotificationConfig();

      console.log('✅ Sistema de notificações inicializado');
    } catch (error) {
      console.error('❌ Erro na inicialização das notificações:', error);
    } finally {
      setIsLoading(false);
    }
  }, [
    isLoaded,
    isSignedIn,
    requestPermissions,
    registerPushToken,
    registerTokenWithBackend,
    loadNotificationConfig,
  ]);

  // Configurar listeners de notificação
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    // Listener para notificações recebidas
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('📥 Notificação recebida:', notification.request.content.title);
      setNotification(notification);
    });

    // Listener para interações com notificações
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('👆 Notificação tocada:', data);

      // Navegar baseado no tipo de notificação
      if (data?.type === 'daily_reminder') {
        // Navegar para agenda do dia
      } else if (data?.type === 'before_shift') {
        // Navegar para detalhes do plantão
      } else if (data?.shiftId) {
        // Navegar para plantão específico
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [isLoaded, isSignedIn]);

  // Listener para mudanças de estado do app
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && expoPushToken && isRegistered) {
        // Atualizar último uso quando app fica ativo
        registerTokenWithBackend(expoPushToken).catch(console.error);
      }
    };

    appStateListener.current = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (appStateListener.current) {
        appStateListener.current.remove();
      }
    };
  }, [expoPushToken, isRegistered, registerTokenWithBackend]);

  // Inicializar quando usuário estiver autenticado
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      initializeNotifications();
    } else {
      // Reset quando usuário desloga
      setExpoPushToken(null);
      setNotification(null);
      setIsRegistered(false);
      setHasPermissions(false);
      setConfig(null);
      initializationRef.current = false;
    }
  }, [isLoaded, isSignedIn, initializeNotifications]);

  return {
    expoPushToken,
    notification,
    isRegistered,
    isLoading,
    hasPermissions,
    config,
    isConfigLoading,
    requestPermissions,
    sendTestNotification,
    updateConfig,
    refreshConfig,
  };
};
