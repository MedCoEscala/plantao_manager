import '../global.css';

import 'react-native-get-random-values';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { useFonts } from 'expo-font';
import { Redirect, SplashScreen, Stack, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { Platform, LogBox, View, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ContractorsProvider } from './contexts/ContractorsContext';
import { DialogProvider } from './contexts/DialogContext';
import { LocationsProvider } from './contexts/LocationsContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProfileProvider } from './contexts/ProfileContext';
import { useNotifications } from './hooks/useNotifications';
import { StatusBar } from 'expo-status-bar';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';

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

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

function ClerkKeyMissingError() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, textAlign: 'center', marginBottom: 20 }}>
        Configuração do App Incompleta
      </Text>
      <Text style={{ fontSize: 14, textAlign: 'center', color: '#666' }}>
        A chave de autenticação não foi encontrada. Entre em contato com o suporte.
      </Text>
      <Text style={{ fontSize: 12, textAlign: 'center', color: '#999', marginTop: 10 }}>
        Erro: EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ausente
      </Text>
    </View>
  );
}

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutNav() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [appIsReady, setAppIsReady] = useState(false);

  useNotifications();
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

    try {
      if (isSignedIn) {
        router.replace('/(root)/');
      } else {
        router.replace('/(auth)/sign-in');
      }
    } catch (error) {
      console.error('Erro na navegação:', error);
      // Fallback navegação segura
    }
  }, [isLoaded, isSignedIn, appIsReady, fontsLoaded, fontError, router]);

  if (!isLoaded || !appIsReady || (!fontsLoaded && !fontError)) {
    return null;
  }

  return (
    <>
      <StatusBar
        style="dark"
        backgroundColor={Platform.OS === 'android' ? '#f8fafc' : 'transparent'}
        translucent={Platform.OS === 'android'}
      />
      <NotificationProvider>
        <DialogProvider>
          <ProfileProvider>
            <LocationsProvider>
              <ContractorsProvider>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: '#f8fafc' },
                    animation: 'fade_from_bottom',
                  }}>
                  <Stack.Screen name="(root)" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="(auth)"
                    options={{ presentation: 'modal', headerShown: false }}
                  />
                </Stack>
              </ContractorsProvider>
            </LocationsProvider>
          </ProfileProvider>
        </DialogProvider>
      </NotificationProvider>
    </>
  );
}

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <ClerkKeyMissingError />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
          <RootLayoutNav />
        </ClerkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
