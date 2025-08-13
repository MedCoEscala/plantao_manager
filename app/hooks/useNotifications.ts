import { useAuth } from '@clerk/clerk-expo';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';

import { useToast } from '../components/ui/Toast';
import { useNotificationsApi } from '../services/notifications-api';
import { ShiftNotificationsManager, NOTIFICATION_TYPES } from '../utils/shiftNotifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
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

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      if (!Device.isDevice) {
        console.log('📱 Notificações não funcionam no simulador');
        return false;
      }

      console.log('🔔 Solicitando permissões...');

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('📋 Status atual das permissões:', existingStatus);

      if (Platform.OS === 'android') {
        console.log('🤖 Configurando canais Android...');

        await Notifications.setNotificationChannelAsync('default', {
          name: 'Notificações Gerais',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#18CB96',
          description: 'Notificações gerais do MedEscala',
          showBadge: true,
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('shifts', {
          name: 'Plantões e Lembretes',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#18CB96',
          description: 'Notificações sobre plantões e lembretes importantes',
          showBadge: true,
          sound: 'default',
        });

        // 🆕 NOVO: Canal específico para relatórios
        await Notifications.setNotificationChannelAsync('reports', {
          name: 'Relatórios e Resumos',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 200, 100, 200],
          lightColor: '#18CB96',
          description: 'Relatórios semanais e mensais de plantões',
          showBadge: true,
          sound: 'default',
        });

        console.log('✅ Canais Android configurados');
      }

      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        console.log('📝 Solicitando novas permissões...');
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
          android: {},
        });
        finalStatus = status;
      }

      console.log('🏁 Status final das permissões:', finalStatus);

      if (finalStatus !== 'granted') {
        console.log('🔕 Permissão de notificação negada');
        setHasPermissions(false);
        showToast(
          'Permissões de notificação negadas. Ative nas configurações do dispositivo.',
          'warning'
        );
        return false;
      }

      setHasPermissions(true);
      console.log('✅ Permissões concedidas');
      return true;
    } catch (error) {
      console.error('❌ Erro ao solicitar permissões:', error);
      setHasPermissions(false);
      showToast('Erro ao configurar notificações', 'error');
      return false;
    }
  }, [showToast]);

  const registerPushToken = useCallback(async (): Promise<string | null> => {
    try {
      if (!Device.isDevice) {
        console.log('📱 Push tokens não funcionam no simulador');
        return null;
      }

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

      console.log('🔑 Project ID:', projectId ? 'encontrado' : 'NÃO ENCONTRADO');

      if (!projectId) {
        console.error('❌ ProjectId não configurado - notificações não funcionarão!');
        showToast('Erro de configuração: Project ID não encontrado', 'error');
        return null;
      }

      console.log('📤 Obtendo token do Expo...');
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
        applicationId: Platform.OS === 'android' ? 'com.lucaserib.medescala' : undefined,
      });

      const token = tokenData.data;
      console.log('🔔 Token obtido:', token.substring(0, 20) + '...');

      return token;
    } catch (error) {
      console.error('❌ Erro ao obter push token:', error);
      showToast(
        `Erro ao configurar notificações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        'error'
      );
      return null;
    }
  }, [showToast]);

  const registerTokenWithBackend = useCallback(
    async (token: string): Promise<void> => {
      try {
        console.log('🌐 Registrando token no backend...');

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
        throw error;
      }
    },
    [notificationsApi]
  );

  const loadNotificationConfig = useCallback(async (): Promise<void> => {
    try {
      setIsConfigLoading(true);
      const notificationConfig = await notificationsApi.getNotificationConfig();
      setConfig(notificationConfig);
      console.log('⚙️ Configurações carregadas');
    } catch (error) {
      console.error('❌ Erro ao carregar configurações:', error);
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

  // 🆕 NOVO: Função para lidar com diferentes tipos de notificação
  const handleNotificationReceived = useCallback(
    (notification: Notifications.Notification) => {
      const data = notification.request.content.data as any;

      console.log('📥 Notificação recebida:', {
        title: notification.request.content.title,
        type: data?.type,
        data: data,
      });

      setNotification(notification);

      // Tratamento específico por tipo de notificação
      switch (data?.type) {
        case NOTIFICATION_TYPES.WEEKLY_REPORT:
          console.log('📊 Relatório semanal recebido');
          ShiftNotificationsManager.handleWeeklyReportNotification(data);
          showToast('Relatório semanal disponível', 'info');
          break;

        case NOTIFICATION_TYPES.DAILY_REMINDER:
          console.log('📅 Lembrete diário recebido');
          break;

        case NOTIFICATION_TYPES.BEFORE_SHIFT:
          console.log('⏰ Lembrete antes do plantão recebido');
          break;

        case NOTIFICATION_TYPES.SHIFT_CONFIRMATION:
          console.log('📋 Confirmação de plantão recebida');
          break;

        default:
          console.log('📨 Notificação genérica recebida');
      }
    },
    [showToast]
  );

  // 🆕 NOVO: Função para lidar com toque na notificação
  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data as any;
    console.log('👆 Notificação tocada:', {
      type: data?.type,
      data: data,
    });

    // Navegação baseada no tipo de notificação
    switch (data?.type) {
      case NOTIFICATION_TYPES.WEEKLY_REPORT:
        console.log('📊 Navegando para relatórios');
        // Aqui você pode navegar para a tela de relatórios
        // router.push('/reports');
        break;

      case NOTIFICATION_TYPES.DAILY_REMINDER:
        console.log('📅 Navegando para agenda do dia');
        // router.push('/');
        break;

      case NOTIFICATION_TYPES.BEFORE_SHIFT:
      case NOTIFICATION_TYPES.SHIFT_CONFIRMATION:
        if (data?.shiftId) {
          console.log(`🏥 Navegando para plantão ${data.shiftId}`);
          // router.push(`/shifts/${data.shiftId}`);
        }
        break;

      default:
        console.log('📱 Navegação padrão');
      // router.push('/');
    }
  }, []);

  const initializeNotifications = useCallback(async (): Promise<void> => {
    if (!isLoaded || !isSignedIn || initializationRef.current) {
      return;
    }

    initializationRef.current = true;
    setIsLoading(true);

    try {
      console.log('🔔 Inicializando sistema de notificações...');
      console.log('📱 Plataforma:', Platform.OS);
      console.log('📱 Dispositivo físico:', Device.isDevice);

      const hasPerms = await requestPermissions();
      if (!hasPerms) {
        console.log('⚠️ Sem permissões de notificação - parando inicialização');
        return;
      }

      const token = await registerPushToken();
      if (token) {
        setExpoPushToken(token);

        try {
          await registerTokenWithBackend(token);
        } catch (backendError) {
          console.error('❌ Falha ao registrar no backend:', backendError);
          showToast('Token obtido, mas erro ao registrar no servidor', 'warning');
        }
      } else {
        console.log('⚠️ Não foi possível obter token de push');
        showToast('Erro ao obter token de notificação', 'error');
      }

      await loadNotificationConfig();

      console.log('✅ Sistema de notificações inicializado');
    } catch (error) {
      console.error('❌ Erro na inicialização das notificações:', error);
      showToast('Erro ao inicializar notificações', 'error');
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
    showToast,
  ]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    notificationListener.current = Notifications.addNotificationReceivedListener(
      handleNotificationReceived
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [isLoaded, isSignedIn, handleNotificationReceived, handleNotificationResponse]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && expoPushToken && isRegistered) {
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

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      initializeNotifications();
    } else {
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
