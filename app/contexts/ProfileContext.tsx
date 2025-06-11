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

  // Função para sincronizar usuário com retry limitado
  const syncUserWithRetry = useCallback(
    async (token: string, maxRetries: number = 1): Promise<boolean> => {
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
            return true;
          } catch (syncError: any) {
            retries++;
            console.error(
              `❌ [Profile] Erro na sincronização (tentativa ${retries}/${maxRetries}):`,
              syncError
            );

            if (retries < maxRetries) {
              console.log('⏳ [Profile] Aguardando antes de tentar novamente...');
              await new Promise((resolve) => setTimeout(resolve, 2000));
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

  // Função para buscar perfil com controle de estado
  const fetchProfile = useCallback(async (): Promise<void> => {
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
      try {
        console.log('🔍 [Profile] Buscando perfil do usuário...');
        response = await fetchWithAuth('/users/me', { method: 'GET' }, async () => token);
        console.log('✅ [Profile] Perfil encontrado');
      } catch (error: any) {
        // Se usuário não encontrado (404), tenta sincronizar
        if (error.response?.status === 404) {
          console.log('👤 [Profile] Usuário não encontrado, iniciando sincronização...');

          const syncSuccess = await syncUserWithRetry(token, 1);
          if (!syncSuccess) {
            throw new Error('Falha na sincronização inicial do usuário');
          }

          // Aguarda um pouco e tenta buscar novamente
          await new Promise((resolve) => setTimeout(resolve, 1000));
          console.log('🔍 [Profile] Tentando buscar perfil após sincronização...');
          response = await fetchWithAuth('/users/me', { method: 'GET' }, async () => token);
          console.log('✅ [Profile] Perfil criado e recuperado com sucesso');
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
      setIsInitialized(true);
      console.log('✅ [Profile] ProfileContext inicializado com sucesso');
    } catch (error: any) {
      console.error('❌ [Profile] Erro ao buscar perfil:', error);
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Erro ao carregar perfil do usuário';
      setError(errorMessage);

      // Não mostrar toast em caso de erro 404 (usuário novo)
      if (error?.response?.status !== 404) {
        showToast('Erro ao carregar perfil. Tente novamente.', 'error');
      }
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [isAuthLoaded, userId, getToken, showToast, syncUserWithRetry]);

  const refreshProfile = useCallback(async () => {
    if (!fetchingRef.current) {
      await fetchProfile();
    }
  }, [fetchProfile]);

  const updateLocalProfile = useCallback(
    (updates: Partial<UserProfile>) => {
      if (profile) {
        const updatedProfile = { ...profile, ...updates };
        setProfile(updatedProfile);
        console.log('📝 [Profile] Perfil atualizado localmente');
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
      console.error('❌ [Profile] Erro na sincronização pública:', error);
      return false;
    }
  }, [getToken, syncUserWithRetry]);

  // Inicialização única e controlada
  useEffect(() => {
    if (!initialized.current && isAuthLoaded && userId) {
      initialized.current = true;
      console.log('🚀 [Profile] Iniciando ProfileContext...');
      fetchProfile();
    }
  }, [isAuthLoaded, userId, fetchProfile]);

  // Reset quando usuário muda
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
