import { useAuth } from '@clerk/clerk-expo';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { useNotificationsApi } from '../services/notifications-api';

// Configurar como as notificações devem ser tratadas quando recebidas
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const useNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const { isLoaded, isSignedIn } = useAuth();

  const { registerDeviceToken } = useNotificationsApi();

  useEffect(() => {
    // Só inicializar notificações se o usuário estiver autenticado
    if (!isLoaded || !isSignedIn) {
      setIsLoading(false);
      return;
    }

    // Tornar notificações completamente opcionais
    registerForPushNotificationsAsync()
      .then((token) => {
        if (token) {
          setExpoPushToken(token);
          registerTokenWithBackend(token);
        } else {
          console.log(
            '⚠️ [Notifications] Token de push não obtido, mas aplicação continua funcionando'
          );
        }
      })
      .catch((error) => {
        console.warn(
          '⚠️ [Notifications] Notificações push não disponíveis (não crítico):',
          error.message
        );
        // NÃO quebrar a aplicação - notificações são opcionais
      })
      .finally(() => setIsLoading(false));

    // Listener para quando uma notificação é recebida
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    // Listener para quando o usuário interage com uma notificação
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;

      // Aqui você pode implementar navegação baseada no tipo de notificação
      if (data?.type === 'daily_reminder') {
        // Navegar para a tela de plantões do dia
      } else if (data?.type === 'before_shift') {
        // Navegar para os detalhes do plantão específico
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

  const registerTokenWithBackend = async (token: string) => {
    if (!expoPushToken) return;

    try {
      const deviceName = (await Device.deviceName) || 'Dispositivo desconhecido';
      const deviceType = Platform.OS;
      const appVersion = Constants.expoConfig?.version || 'unknown';

      await registerDeviceToken({
        token,
        deviceName,
        deviceType,
        appVersion,
      });

      setIsRegistered(true);
    } catch (error) {
      console.error('❌ [Notifications] Erro ao registrar token no backend:', error);
      // Não quebrar a aplicação se o registro falhar
    }
  };

  const sendTestNotification = async () => {
    if (!expoPushToken) {
      alert('Erro: Token de push não disponível');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏥 Teste de Notificação',
        body: 'Esta é uma notificação de teste do seu app de plantões!',
        data: { type: 'test' },
      },
      trigger: null,
    });
  };

  return {
    expoPushToken,
    notification,
    isRegistered,
    isLoading,
    sendTestNotification,
  };
};

async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Falha ao obter permissão para notificações push!');
      return null;
    }

    try {
      // Primeiro, tenta obter o projectId da configuração
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

      if (!projectId) {
        console.log(
          '🔕 [Notifications] Sem projectId - notificações desabilitadas em desenvolvimento'
        );
        return null;
      } else {
        // Se tem projectId, usa ele
        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;
      }
    } catch (error) {
      console.log(
        '🔕 [Notifications] Erro ao obter token (não crítico):',
        error instanceof Error ? error.message : String(error)
      );
      return null;
    }
  } else {
  }

  return token;
}
