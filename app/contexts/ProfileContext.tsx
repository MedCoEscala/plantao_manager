import { useAuth } from '@clerk/clerk-expo';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

import { useToast } from '@/components/ui/Toast';
import { fetchWithAuth } from '@/utils/api-client';
import { User } from '@/types/user';

interface ProfileContextType {
  profile: User | null;
  isLoading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateLocalProfile: (updates: Partial<User>) => void;
  syncUser: () => Promise<boolean>;
  isInitialized: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const { getToken, isLoaded: isAuthLoaded, userId } = useAuth();
  const { showToast } = useToast();

  const initialized = useRef(false);
  const syncingRef = useRef(false);
  const fetchingRef = useRef(false);

  // Função para sincronizar usuário com retry mais robusto
  const syncUserWithRetry = useCallback(
    async (token: string, maxRetries: number = 3): Promise<boolean> => {
      if (syncingRef.current) {
        return false;
      }

      syncingRef.current = true;
      let retries = 0;

      try {
        while (retries < maxRetries) {
          try {
            await fetchWithAuth('/users/sync', { method: 'POST' }, async () => token);
            await new Promise((resolve) => setTimeout(resolve, 500));
            return true;
          } catch (syncError: any) {
            retries++;
            console.error(
              `Erro na sincronização (tentativa ${retries}/${maxRetries}):`,
              syncError.response?.status || syncError.message
            );

            if (retries < maxRetries) {
              const delay = Math.min(1000 * Math.pow(2, retries), 5000);
              await new Promise((resolve) => setTimeout(resolve, delay));
            }
          }
        }

        console.error('Falha na sincronização após todas as tentativas');
        return false;
      } finally {
        syncingRef.current = false;
      }
    },
    []
  );

  // Função para buscar perfil com melhor controle de estado
  const fetchProfile = useCallback(
    async (forceSync: boolean = false): Promise<void> => {
      if (!isAuthLoaded || !userId || fetchingRef.current) {
        return;
      }

      fetchingRef.current = true;

      try {
        setIsLoading(true);
        setError(null);

        const token = await getToken();
        if (!token) {
          // PROTEÇÃO: Não crashar se Clerk não estiver configurado
          console.warn('Token de autenticação não disponível - possível problema de configuração');
          setError('Erro de configuração. Entre em contato com o suporte.');
          return;
        }

        let response;
        let needsSync = forceSync;

        try {
          response = await fetchWithAuth('/users/me', { method: 'GET' }, async () => token);
        } catch (error: any) {
          if (error.response?.status === 404) {
            needsSync = true;
          } else {
            throw error;
          }
        }

        // Se precisa sincronizar
        if (needsSync) {
          const syncSuccess = await syncUserWithRetry(token, 3);

          if (!syncSuccess) {
            console.error('Falha na sincronização do usuário após múltiplas tentativas');
            setError('Erro na sincronização. Tente fazer logout e login novamente.');
            return;
          }

          await new Promise((resolve) => setTimeout(resolve, 1000));
          response = await fetchWithAuth('/users/me', { method: 'GET' }, async () => token);
        }

        // Mapear response para User interface
        const profileData: User = {
          id: response.id,
          email: response.email,
          name: response.name,
          firstName: response.firstName,
          lastName: response.lastName,
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
      } catch (error: any) {
        console.error('Erro ao buscar perfil:', error);
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
      // Resetar flag de fetching para permitir novo fetch
      fetchingRef.current = false;
      await fetchProfile(forceSync);
    },
    [fetchProfile]
  );

  const updateLocalProfile = useCallback(
    (updates: Partial<User>) => {
      // Se profile é null mas temos dados completos, criar o profile
      if (!profile && updates.id && updates.email && updates.clerkId) {
        setProfile(updates as User);
        setIsInitialized(true);

        // IMPEDIR novos fetches por um tempo para evitar sobrescrever dados
        fetchingRef.current = true;

        setTimeout(() => {
          fetchingRef.current = false;
        }, 5000);

        return;
      }

      // Se profile existe, fazer merge
      if (profile) {
        const updatedProfile = { ...profile, ...updates };
        setProfile(updatedProfile);

        // IMPEDIR novos fetches por um tempo para evitar sobrescrever dados
        fetchingRef.current = true;

        setTimeout(() => {
          fetchingRef.current = false;
        }, 5000);
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
      console.error('Erro na sincronização pública:', error);
      return false;
    }
  }, [getToken, syncUserWithRetry, refreshProfile]);

  // Inicialização controlada e única
  useEffect(() => {
    if (!initialized.current && isAuthLoaded && userId) {
      initialized.current = true;
      fetchProfile(false);
    }
  }, [isAuthLoaded, userId, fetchProfile]);

  // Reset quando usuário muda ou faz logout
  useEffect(() => {
    if (isAuthLoaded && !userId) {
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
