import 'react-native-get-random-values';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { useFonts } from 'expo-font';
import { Redirect, SplashScreen, Stack, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { Platform, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { DialogProvider } from '@/contexts/DialogContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import './styles/global.css';

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
    }
  },
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
const backendUrl = process.env.EXPO_PUBLIC_API_URL;

if (!publishableKey) {
  throw new Error('Adicione EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY no seu arquivo .env');
}

if (!backendUrl) {
  throw new Error(
    'Adicione EXPO_PUBLIC_API_URL no seu arquivo .env (ex: http://SEU_IP_LOCAL:3000)'
  );
}

SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore error */
});

function RootLayoutNav() {
  const { isLoaded, isSignedIn } = useAuth();
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
        await Promise.all([]);
      } catch (e) {
        console.warn('Erro ao carregar recursos:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady && (fontsLoaded || fontError)) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady, fontsLoaded, fontError]);

  useEffect(() => {
    if (!isLoaded || !appIsReady || (!fontsLoaded && fontError)) {
      return;
    }

    if (isSignedIn) {
      router.replace('/(root)/');
    } else {
      router.replace('/(auth)/sign-in');
    }
  }, [isLoaded, isSignedIn, appIsReady, fontsLoaded, fontError, router]);

  if (!isLoaded || !appIsReady || (!fontsLoaded && !fontError)) {
    return null;
  }

  return (
    <NotificationProvider>
      <DialogProvider>
        <Stack>
          <Stack.Screen name="(root)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
      </DialogProvider>
    </NotificationProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <RootLayoutNav />
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}
