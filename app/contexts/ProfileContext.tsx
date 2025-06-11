import { useAuth } from '@clerk/clerk-expo';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

import { useToast } from '@/components/ui/Toast';
import { fetchWithAuth } from '@/utils/api-client';

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phoneNumber?: string;
  birthDate?: string;
  gender?: string;
  imageUrl?: string;
  clerkId: string;
  createdAt: string;
  updatedAt: string;
}

interface ProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateLocalProfile: (updates: Partial<UserProfile>) => void;
  syncUser: () => Promise<boolean>;
  isInitialized: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const { getToken, isLoaded: isAuthLoaded, userId } = useAuth();
  const { showToast } = useToast();

  const initialized = useRef(false);
  const syncingRef = useRef(false);
  const fetchingRef = useRef(false);

  const syncUserWithRetry = useCallback(
    async (token: string, maxRetries: number = 3): Promise<boolean> => {
      if (syncingRef.current) {
        console.log('🔄 [Profile] Sincronização já em andamento, aguardando...');
        return false;
      }

      syncingRef.current = true;
      let retries = 0;

      try {
        console.log('🔄 [Profile] Iniciando sincronização do usuário...');

        while (retries < maxRetries) {
          try {
            await fetchWithAuth('/users/sync', { method: 'POST' }, async () => token);
            console.log('✅ [Profile] Usuário sincronizado com sucesso');

            await new Promise((resolve) => setTimeout(resolve, 500));
            return true;
          } catch (syncError: any) {
            retries++;
            console.error(
              `❌ [Profile] Erro na sincronização (tentativa ${retries}/${maxRetries}):`,
              syncError.response?.status || syncError.message
            );

            if (retries < maxRetries) {
              const delay = Math.min(1000 * Math.pow(2, retries), 5000);
              console.log(`⏳ [Profile] Aguardando ${delay}ms antes da próxima tentativa...`);
              await new Promise((resolve) => setTimeout(resolve, delay));
            }
          }
        }

        console.error('❌ [Profile] Falha na sincronização após todas as tentativas');
        return false;
      } finally {
        syncingRef.current = false;
      }
    },
    []
  );

  const fetchProfile = useCallback(
    async (forceSync: boolean = false): Promise<void> => {
      if (!isAuthLoaded || !userId || fetchingRef.current) {
        return;
      }

      fetchingRef.current = true;

      try {
        console.log('📱 [Profile] Iniciando busca do perfil...');
        setIsLoading(true);
        setError(null);

        const token = await getToken();
        if (!token) {
          throw new Error('Token de autenticação não disponível');
        }

        let response;
        let needsSync = forceSync;

        try {
          console.log('🔍 [Profile] Buscando perfil do usuário...');
          response = await fetchWithAuth('/users/me', { method: 'GET' }, async () => token);
          console.log('✅ [Profile] Perfil encontrado:', {
            id: response.id,
            name: response.name,
            email: response.email,
            hasFirstName: !!response.firstName,
            hasLastName: !!response.lastName,
          });
        } catch (error: any) {
          if (error.response?.status === 404) {
            console.log('👤 [Profile] Usuário não encontrado, sincronização necessária...');
            needsSync = true;
          } else {
            throw error;
          }
        }

        if (needsSync) {
          console.log('🔄 [Profile] Executando sincronização...');
          const syncSuccess = await syncUserWithRetry(token, 3);

          if (!syncSuccess) {
            throw new Error('Falha na sincronização do usuário após múltiplas tentativas');
          }

          await new Promise((resolve) => setTimeout(resolve, 1000));
          console.log('🔍 [Profile] Buscando perfil após sincronização...');
          response = await fetchWithAuth('/users/me', { method: 'GET' }, async () => token);
          console.log('✅ [Profile] Perfil recuperado após sincronização:', {
            id: response.id,
            name: response.name,
            email: response.email,
          });
        }

        const profileData: UserProfile = {
          id: response.id,
          email: response.email,
          firstName: response.firstName,
          lastName: response.lastName,
          name: response.name,
          phoneNumber: response.phoneNumber,
          birthDate: response.birthDate,
          gender: response.gender,
          imageUrl: response.imageUrl,
          clerkId: response.clerkId,
          createdAt: response.createdAt,
          updatedAt: response.updatedAt,
        };

        setProfile(profileData);
        setIsInitialized(true);
        console.log('🎉 [Profile] ProfileContext inicializado com sucesso');
      } catch (error: any) {
        console.error('❌ [Profile] Erro ao buscar perfil:', error);
        const errorMessage =
          error?.response?.data?.message || error?.message || 'Erro ao carregar perfil do usuário';
        setError(errorMessage);

        if (error?.response?.status !== 404 && !error.message?.includes('sincronização')) {
          showToast('Erro ao carregar perfil. Tente fazer logout e login novamente.', 'error');
        }
      } finally {
        setIsLoading(false);
        fetchingRef.current = false;
      }
    },
    [isAuthLoaded, userId, getToken, showToast, syncUserWithRetry]
  );

  const refreshProfile = useCallback(
    async (forceSync: boolean = false) => {
      if (!fetchingRef.current) {
        await fetchProfile(forceSync);
      }
    },
    [fetchProfile]
  );

  const updateLocalProfile = useCallback(
    (updates: Partial<UserProfile>) => {
      if (profile) {
        const updatedProfile = { ...profile, ...updates };
        setProfile(updatedProfile);
        console.log('📝 [Profile] Perfil atualizado localmente:', {
          updatedFields: Object.keys(updates),
          newName: updatedProfile.name,
        });
      }
    },
    [profile]
  );

  const syncUser = useCallback(async (): Promise<boolean> => {
    if (!getToken) return false;

    try {
      const token = await getToken();
      if (!token) return false;

      const success = await syncUserWithRetry(token, 3);

      if (success) {
        await refreshProfile(false);
      }

      return success;
    } catch (error) {
      console.error('❌ [Profile] Erro na sincronização pública:', error);
      return false;
    }
  }, [getToken, syncUserWithRetry, refreshProfile]);

  useEffect(() => {
    if (!initialized.current && isAuthLoaded && userId) {
      initialized.current = true;
      console.log('🚀 [Profile] Iniciando ProfileContext...');
      fetchProfile(false);
    }
  }, [isAuthLoaded, userId, fetchProfile]);

  useEffect(() => {
    if (isAuthLoaded && !userId) {
      console.log('🔄 [Profile] Usuário deslogado, resetando contexto...');
      setProfile(null);
      setError(null);
      setIsLoading(false);
      setIsInitialized(false);
      initialized.current = false;
      syncingRef.current = false;
      fetchingRef.current = false;
    }
  }, [isAuthLoaded, userId]);

  const value: ProfileContextType = {
    profile,
    isLoading,
    error,
    refreshProfile,
    updateLocalProfile,
    syncUser,
    isInitialized,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfileContext(): ProfileContextType {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfileContext deve ser usado dentro de ProfileProvider');
  }
  return context;
}
