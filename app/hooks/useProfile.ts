import { useAuth } from '@clerk/clerk-expo';
import { useState, useEffect, useCallback } from 'react';

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
  clerkId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UseProfileResult {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  syncUser: () => Promise<boolean>;
  updateLocalProfile: (updates: Partial<UserProfile>) => void;
}

// Sistema global de notificação para sincronização entre telas
class ProfileNotificationSystem {
  private listeners: Set<() => void> = new Set();
  private cache: Map<string, { profile: UserProfile; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  addListener(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyUpdate() {
    console.log('🔄 [ProfileNotification] Notificando atualização para todas as telas');
    this.listeners.forEach((listener) => listener());
  }

  getCache(userId: string): UserProfile | null {
    const cached = this.cache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('📋 [ProfileNotification] Usando perfil do cache global');
      return cached.profile;
    }
    return null;
  }

  setCache(userId: string, profile: UserProfile) {
    this.cache.set(userId, { profile, timestamp: Date.now() });
  }

  clearCache(userId?: string) {
    if (userId) {
      this.cache.delete(userId);
    } else {
      this.cache.clear();
    }
    this.notifyUpdate();
  }

  updateCache(userId: string, updates: Partial<UserProfile>) {
    const cached = this.cache.get(userId);
    if (cached) {
      const updatedProfile = { ...cached.profile, ...updates };
      this.setCache(userId, updatedProfile);
      this.notifyUpdate();
      console.log('📝 [ProfileNotification] Cache atualizado localmente');
    }
  }
}

// Instância global do sistema de notificação
const profileNotificationSystem = new ProfileNotificationSystem();

export function useProfile(): UseProfileResult {
  const { getToken, isLoaded: isAuthLoaded, userId } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para sincronizar usuário com retry
  const syncUserWithRetry = useCallback(
    async (token: string, maxRetries: number = 2): Promise<boolean> => {
      let retries = 0;
      while (retries < maxRetries) {
        try {
          console.log(`👤 [useProfile] Tentativa ${retries + 1} de sincronização...`);

          await fetchWithAuth('/users/sync', { method: 'POST' }, async () => token);

          console.log('✅ [useProfile] Usuário sincronizado com sucesso');
          return true;
        } catch (syncError: any) {
          retries++;
          console.error(`❌ [useProfile] Erro na sincronização (tentativa ${retries}):`, syncError);

          if (retries < maxRetries) {
            // Aguardar um pouco antes de tentar novamente
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }
      return false;
    },
    []
  );

  // Função interna para buscar perfil
  const fetchProfileInternal = useCallback(
    async (userId: string, useCache: boolean = true): Promise<UserProfile | null> => {
      // Verificar cache global primeiro
      if (useCache) {
        const cachedProfile = profileNotificationSystem.getCache(userId);
        if (cachedProfile) {
          return cachedProfile;
        }
      }

      // Previne múltiplas requisições simultâneas
      const requestKey = `fetch_profile_${userId}`;
      if ((window as any)[requestKey]) {
        console.log('⏳ [useProfile] Aguardando requisição em andamento...');
        return (window as any)[requestKey];
      }

      const requestPromise = (async (): Promise<UserProfile | null> => {
        try {
          const token = await getToken();
          if (!token) {
            throw new Error('Token de autenticação não disponível');
          }

          console.log('🔍 [useProfile] Buscando perfil do usuário...');

          let response;
          try {
            response = await fetchWithAuth('/users/me', { method: 'GET' }, async () => token);
          } catch (error: any) {
            // Se usuário não encontrado, tenta sincronizar UMA ÚNICA VEZ
            if (error.response?.status === 404) {
              console.log('👤 [useProfile] Usuário não encontrado, tentando sincronizar...');

              const syncSuccess = await syncUserWithRetry(token, 1); // Apenas 1 retry
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

          // Salvar no cache global
          profileNotificationSystem.setCache(userId, profileData);

          console.log('✅ [useProfile] Perfil carregado com sucesso:', profileData);
          return profileData;
        } catch (error: any) {
          console.error('❌ [useProfile] Erro ao buscar perfil:', error);
          throw error;
        } finally {
          // Limpar a requisição em andamento
          delete (window as any)[requestKey];
        }
      })();

      // Salvar a promise para evitar requisições duplicadas
      (window as any)[requestKey] = requestPromise;

      return requestPromise;
    },
    [getToken, syncUserWithRetry]
  );

  // Função para buscar perfil
  const fetchProfile = useCallback(
    async (useCache: boolean = true) => {
      if (!isAuthLoaded || !userId) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const profileData = await fetchProfileInternal(userId, useCache);
        setProfile(profileData);
      } catch (error: any) {
        console.error('❌ [useProfile] Erro final ao buscar perfil:', error);
        const errorMessage =
          error?.response?.data?.message || error?.message || 'Erro ao carregar perfil do usuário';
        setError(errorMessage);
        showToast('Erro ao carregar perfil. Tente novamente.', 'error');
      } finally {
        setLoading(false);
      }
    },
    [isAuthLoaded, userId, fetchProfileInternal]
  );

  // Função pública para sincronizar usuário
  const syncUser = useCallback(async (): Promise<boolean> => {
    if (!getToken) return false;

    try {
      const token = await getToken();
      if (!token) return false;

      return await syncUserWithRetry(token, 2);
    } catch (error) {
      console.error('❌ [useProfile] Erro na sincronização pública:', error);
      return false;
    }
  }, [getToken, syncUserWithRetry]);

  // Função para forçar nova busca
  const refetch = useCallback(async () => {
    if (userId) {
      // Primeiro verifica se há cache atualizado
      const cachedProfile = profileNotificationSystem.getCache(userId);
      if (cachedProfile) {
        setProfile(cachedProfile);
        console.log('🔄 [useProfile] Perfil atualizado via cache');
        return;
      }

      // Se não há cache, limpa e busca novamente
      profileNotificationSystem.clearCache(userId);
      await fetchProfile(false); // Forçar busca sem cache
    }
  }, [userId, fetchProfile]);

  // Função para atualizar perfil localmente
  const updateLocalProfile = useCallback(
    (updates: Partial<UserProfile>) => {
      if (userId && profile) {
        const updatedProfile = { ...profile, ...updates };
        setProfile(updatedProfile);
        profileNotificationSystem.updateCache(userId, updates);
      }
    },
    [userId, profile]
  );

  // Listener para notificações globais
  useEffect(() => {
    const removeListener = profileNotificationSystem.addListener(() => {
      if (userId) {
        const cachedProfile = profileNotificationSystem.getCache(userId);
        if (cachedProfile) {
          setProfile(cachedProfile);
          console.log('🔄 [useProfile] Perfil atualizado via notificação global');
        }
      }
    });

    return () => {
      removeListener();
    };
  }, [userId]);

  // Efeito para buscar perfil quando disponível
  useEffect(() => {
    if (isAuthLoaded && userId) {
      fetchProfile();
    } else if (isAuthLoaded && !userId) {
      // Usuário não autenticado
      setProfile(null);
      setLoading(false);
      setError(null);
    }
  }, [isAuthLoaded, userId, fetchProfile]);

  return {
    profile,
    loading,
    error,
    refetch,
    syncUser,
    updateLocalProfile,
  };
}

// Função para limpar cache (útil para testes ou logout completo)
export const clearProfileCache = () => {
  profileNotificationSystem.clearCache();
  console.log('🧹 Cache de perfil global limpo');
};

// Default export para resolver warning do React Router
const profileHook = {
  useProfile,
  clearProfileCache,
};

export default profileHook;
