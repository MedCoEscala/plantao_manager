import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-expo';
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
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken, isLoaded: isAuthLoaded, userId } = useAuth();
  const { showToast } = useToast();
  const initialized = useRef(false);
  const syncingRef = useRef(false);

  // Função para sincronizar usuário com retry
  const syncUserWithRetry = useCallback(
    async (token: string, maxRetries: number = 2): Promise<boolean> => {
      if (syncingRef.current) {
        return false;
      }

      syncingRef.current = true;
      let retries = 0;

      try {
        while (retries < maxRetries) {
          try {
            await fetchWithAuth('/users/sync', { method: 'POST' }, async () => token);
            return true;
          } catch (syncError: any) {
            retries++;
            console.error(`Erro na sincronização (tentativa ${retries}):`, syncError);

            if (retries < maxRetries) {
              // Aguardar um pouco antes de tentar novamente
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }
        }
        return false;
      } finally {
        syncingRef.current = false;
      }
    },
    []
  );

  // Função para buscar perfil
  const fetchProfile = useCallback(async (): Promise<void> => {
    if (!isAuthLoaded || !userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('Token de autenticação não disponível');
      }

      let response;
      try {
        response = await fetchWithAuth('/users/me', { method: 'GET' }, async () => token);
      } catch (error: any) {
        // Se usuário não encontrado, tenta sincronizar UMA ÚNICA VEZ
        if (error.response?.status === 404) {
          const syncSuccess = await syncUserWithRetry(token, 1);
          if (!syncSuccess) {
            throw new Error('Falha na sincronização do usuário');
          }

          // Tenta buscar novamente após sincronização
          response = await fetchWithAuth('/users/me', { method: 'GET' }, async () => token);
        } else {
          throw error;
        }
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
    } catch (error: any) {
      console.error('Erro ao buscar perfil:', error);
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Erro ao carregar perfil do usuário';
      setError(errorMessage);
      showToast('Erro ao carregar perfil. Tente novamente.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthLoaded, userId, getToken, showToast, syncUserWithRetry]);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  const updateLocalProfile = useCallback(
    (updates: Partial<UserProfile>) => {
      if (profile) {
        const updatedProfile = { ...profile, ...updates };
        setProfile(updatedProfile);
      }
    },
    [profile]
  );

  const syncUser = useCallback(async (): Promise<boolean> => {
    if (!getToken) return false;

    try {
      const token = await getToken();
      if (!token) return false;

      return await syncUserWithRetry(token, 2);
    } catch (error) {
      console.error('Erro na sincronização pública:', error);
      return false;
    }
  }, [getToken, syncUserWithRetry]);

  // Carregar perfil apenas uma vez na inicialização
  useEffect(() => {
    if (!initialized.current && isAuthLoaded && userId) {
      initialized.current = true;
      fetchProfile();
    }
  }, [isAuthLoaded, userId, fetchProfile]);

  const value: ProfileContextType = {
    profile,
    isLoading,
    error,
    refreshProfile,
    updateLocalProfile,
    syncUser,
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
