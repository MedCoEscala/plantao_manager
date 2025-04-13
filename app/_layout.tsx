import 'react-native-get-random-values';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';

import { useEffect } from 'react';
import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@/cache';
import { DialogProvider } from '@app/contexts/DialogContext';
import { SQLiteProvider } from '@app/contexts/SQLiteContext';
import './styles/global.css';
import SyncProvider from './contexts/SyncContext';
import NetworkProvider from './contexts/NetworkContext';
import NetworkStatus from './components/NetworkStatus';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error('Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env');
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Jakarta-Bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'Jakarta-ExtraBold': require('../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
    'Jakarta-ExtraLight': require('../assets/fonts/PlusJakartaSans-ExtraLight.ttf'),
    'Jakarta-Light': require('../assets/fonts/PlusJakartaSans-Light.ttf'),
    'Jakarta-Medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'Jackarta-Regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'Jakarta-SemiBold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <SQLiteProvider>
          <DialogProvider>
            <SyncProvider>
              <NetworkProvider>
                <NetworkStatus />
                <Stack>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="(root)" options={{ headerShown: false }} />
                </Stack>
              </NetworkProvider>
            </SyncProvider>
          </DialogProvider>
        </SQLiteProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
