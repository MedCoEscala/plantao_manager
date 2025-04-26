import 'react-native-get-random-values';
import { useFonts } from 'expo-font';
import { Redirect, SplashScreen, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ClerkLoaded, ClerkProvider, SignedIn, SignedOut, useAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { DialogProvider } from '@/contexts/DialogContext';
import './styles/global.css';
import { Text, View } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform, LogBox } from 'react-native';

LogBox.ignoreLogs(['Constants.platform.ios.model has been deprecated in favor of expo-device']);

const tokenCache = {
  async getToken(key: string): Promise<string | null> {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      console.error('SecureStore.getItemAsync error:', err);
      return null;
    }
  },
  async saveToken(key: string, value: string): Promise<void> {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.error('SecureStore.setItemAsync error:', err);
      return;
    }
  },
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

if (!publishableKey) {
  throw new Error('Adicione EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY no seu arquivo .env');
}

if (!backendUrl) {
  throw new Error(
    'Adicione EXPO_PUBLIC_BACKEND_URL no seu arquivo .env (ex: http://SEU_IP_LOCAL:3000)'
  );
}

// Não esconde a tela de splash automaticamente, vamos controlar isso manualmente
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore error */
});

function InitialLayout() {
  const { isLoaded, isSignedIn, getToken, userId } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [appIsReady, setAppIsReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    'Jakarta-Bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'Jakarta-ExtraBold': require('../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
    'Jakarta-ExtraLight': require('../assets/fonts/PlusJakartaSans-ExtraLight.ttf'),
    'Jakarta-Light': require('../assets/fonts/PlusJakartaSans-Light.ttf'),
    'Jakarta-Medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'Jakarta-Regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'Jakarta-SemiBold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Aguarda as fontes carregarem e qualquer outro recurso de inicialização
        await Promise.all([]);
      } catch (e) {
        console.warn('Erro ao carregar recursos:', e);
      } finally {
        // Indica que a aplicação está pronta para ser exibida
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady && isLoaded && (fontsLoaded || fontError)) {
      // As fontes carregaram (ou tiveram erro) e a aplicação está pronta, podemos esconder a Splash Screen
      SplashScreen.hideAsync();
    }
  }, [appIsReady, isLoaded, fontsLoaded, fontError]);

  useEffect(() => {
    if (!isLoaded) return;
    const inTabsGroup = segments[0] === '(root)';
    if (isSignedIn && !inTabsGroup) {
      router.replace('/(root)');
    } else if (!isSignedIn && inTabsGroup) {
      router.replace('/(auth)/login');
    }
  }, [isLoaded, isSignedIn, segments, router]);

  useEffect(() => {
    if (isLoaded && isSignedIn && userId) {
      console.log('[SYNC] Usuário logado, tentando sincronizar com backend...');

      const syncUserBackend = async () => {
        let token: string | null = null;
        try {
          token = await getToken();
          if (!token) {
            console.warn('[SYNC] Não foi possível obter o token de sessão para sincronizar.');
            return;
          }

          const syncEndpoint = `${backendUrl}/api/users/sync`;
          console.log(`[SYNC] Enviando requisição para: ${syncEndpoint}`);

          const response = await fetch(syncEndpoint, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const syncedUser = await response.json();
            console.log('[SYNC] Sincronização com backend bem-sucedida! Usuário:', syncedUser?.id);
          } else {
            let errorBody = 'Erro desconhecido';
            try {
              errorBody = await response.text();
            } catch (e) {
              /* ignore */
            }
            console.error(
              `[SYNC] Falha na sincronização: ${response.status} ${response.statusText}`,
              errorBody
            );
          }
        } catch (error) {
          console.error('[SYNC] Erro durante a requisição de sincronização:', error);
          if (error instanceof TypeError && error.message.includes('Network request failed')) {
            console.warn(
              `[SYNC] Hint: Falha na requisição de rede. Verifique se a URL do backend (${backendUrl}) está correta, acessível do seu dispositivo/emulador (Expo Go), e se o servidor backend está rodando.`
            );
          }
        }
      };

      syncUserBackend();
    }
  }, [isLoaded, isSignedIn, userId, getToken, backendUrl]);

  if (!appIsReady || !isLoaded || (!fontsLoaded && !fontError)) {
    return null; // Mantém a SplashScreen visível enquanto carrega fontes e Clerk
  }

  // Se houve erro no carregamento das fontes, mostra a aplicação mesmo assim
  if (fontError) {
    console.warn('Erro ao carregar fontes:', fontError);
  }

  return (
    <DialogProvider>
      <SignedIn>
        <Stack>
          <Stack.Screen name="(root)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
      </SignedIn>
      <SignedOut>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
      </SignedOut>
    </DialogProvider>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <InitialLayout />
    </ClerkProvider>
  );
}
