import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { TokenCache } from '@clerk/clerk-expo/dist/cache';
import * as AuthSession from 'expo-auth-session';
import { fetchAPI } from './app/lib/fetch';

const createTokenCache = (): TokenCache => {
  return {
    getToken: async (key: string) => {
      try {
        const item = await SecureStore.getItemAsync(key);
        if (item) {
          console.log(`${key} was used 🔐 \n`);
        } else {
          console.log('No values stored under key: ' + key);
        }
        return item;
      } catch (error) {
        console.error('secure store get item error: ', error);
        await SecureStore.deleteItemAsync(key);
        return null;
      }
    },
    saveToken: (key: string, token: string) => {
      return SecureStore.setItemAsync(key, token);
    },
  };
};

export const googleOAuth = async (startSSOFlow: any) => {
  try {
    const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
      strategy: 'oauth_google',
      redirectUrl: AuthSession.makeRedirectUri(),
    });

    if (createdSessionId) {
      if (setActive) {
        await setActive!({ session: createdSessionId });

        if (signUp.createdUserId) {
          await fetchAPI('/(api)/user', {
            method: 'POST',
            body: JSON.stringify({
              name: `${signUp.firstName} ${signUp.lastName}`,
              email: signUp.emailAddress,
              clerkId: signUp.createdUserId,
            }),
          });
        }
        return {
          success: true,
          code: 'success',
          message: 'Atenticação concluída com sucesso',
        };
      }
    }
    return {
      success: false,
      message: 'Ocorreu um erro',
    };
  } catch (error: any) {
    console.log(error);
    return {
      success: false,
      message: error?.errors[0]?.longMessage || 'Erro na autenticação',
    };
  }
};

export const tokenCache = Platform.OS !== 'web' ? createTokenCache() : undefined;
