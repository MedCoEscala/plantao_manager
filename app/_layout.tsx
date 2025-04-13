import 'react-native-get-random-values';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';

import { useEffect, useState } from 'react';
import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@/cache';
import { DialogProvider } from '@app/contexts/DialogContext';
import './styles/global.css';
import SyncProvider from './contexts/SyncContext';
import NetworkProvider from './contexts/NetworkContext';
import NetworkStatus from './components/NetworkStatus';
import PrismaProvider from './contexts/PrismaContext';
import { Text, View } from 'react-native';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error('Adicione EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY no seu arquivo .env');
}

// Não esconde a tela de splash automaticamente, vamos controlar isso manualmente
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore error */
});

export default function RootLayout() {
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
    if (appIsReady && (fontsLoaded || fontError)) {
      // As fontes carregaram (ou tiveram erro) e a aplicação está pronta, podemos esconder a Splash Screen
      SplashScreen.hideAsync();
    }
  }, [appIsReady, fontsLoaded, fontError]);

  if (!appIsReady || (!fontsLoaded && !fontError)) {
    return null; // Mantém a SplashScreen visível enquanto carrega
  }

  // Se houve erro no carregamento das fontes, mostra a aplicação mesmo assim
  if (fontError) {
    console.warn('Erro ao carregar fontes:', fontError);
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <DialogProvider>
          <NetworkProvider>
            <PrismaProvider>
              <SyncProvider>
                <NetworkStatus />
                <Stack>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="(root)" options={{ headerShown: false }} />
                </Stack>
              </SyncProvider>
            </PrismaProvider>
          </NetworkProvider>
        </DialogProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
