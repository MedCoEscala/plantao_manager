import { useAuth } from '@clerk/clerk-expo';
import { useState, useEffect, useCallback, useRef } from 'react';

import { useToast } from '@/components/ui/Toast';
import apiClient from '@/lib/axios';

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

interface ProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  lastFetchTime: number | null;
}

// Cache em memória para evitar múltiplas requisições
const profileCache = new Map<string, { profile: UserProfile; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export function useProfile() {
  const [state, setState] = useState<ProfileState>({
    profile: null,
    isLoading: true,
    error: null,
    lastFetchTime: null,
  });

  const { getToken, isSignedIn, userId } = useAuth();
  const { showToast } = useToast();

  // Controle de requisições ativas - uma por userId
  const activeRequestRef = useRef<Map<string, Promise<UserProfile | null>>>(new Map());
  const mountedRef = useRef(true);
  const initializedRef = useRef(false);

  const getCachedProfile = useCallback((cacheKey: string): UserProfile | null => {
    const cached = profileCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.profile;
    }
    return null;
  }, []);

  const setCachedProfile = useCallback((cacheKey: string, profile: UserProfile) => {
    profileCache.set(cacheKey, { profile, timestamp: Date.now() });
  }, []);

  const syncUserWithRetry = useCallback(async (token: string, maxRetries = 2): Promise<boolean> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Tentativa ${attempt + 1}/${maxRetries + 1} de sincronização...`);
        await apiClient.post(
          '/users/sync',
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000, // 10 segundos timeout
          }
        );
        console.log('✅ Sincronização realizada com sucesso');
        return true;
      } catch (error: any) {
        console.error(`❌ Erro na tentativa ${attempt + 1} de sincronização:`, error);

        // Se for o último attempt ou erro não for recuperável, falha
        if (attempt === maxRetries || error.response?.status === 401) {
          return false;
        }

        // Aguarda antes da próxima tentativa (backoff exponencial)
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
    return false;
  }, []);

  const fetchProfileInternal = useCallback(
    async (userId: string): Promise<UserProfile | null> => {
      if (!isSignedIn || !userId || !mountedRef.current) {
        return null;
      }

      const cacheKey = `profile_${userId}`;

      // Verifica se já tem uma requisição ativa para este usuário
      if (activeRequestRef.current.has(userId)) {
        console.log('📞 Reutilizando requisição ativa existente');
        return activeRequestRef.current.get(userId)!;
      }

      // Verifica cache primeiro
      const cachedProfile = getCachedProfile(cacheKey);
      if (cachedProfile) {
        console.log('📦 Usando perfil do cache');
        return cachedProfile;
      }

      // Inicia nova requisição
      const requestPromise = (async (): Promise<UserProfile | null> => {
        try {
          const token = await getToken();
          if (!token || !mountedRef.current) {
            throw new Error('Token de autenticação não disponível');
          }

          console.log('🔍 Buscando perfil do usuário...');

          let response;
          try {
            response = await apiClient.get('/users/me', {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 10000, // 10 segundos timeout
            });
          } catch (error: any) {
            // Se usuário não encontrado, tenta sincronizar UMA ÚNICA VEZ
            if (error.response?.status === 404 && mountedRef.current) {
              console.log('👤 Usuário não encontrado, tentando sincronizar...');

              const syncSuccess = await syncUserWithRetry(token, 1); // Apenas 1 retry
              if (!syncSuccess || !mountedRef.current) {
                throw new Error('Falha na sincronização do usuário');
              }

              // Tenta buscar novamente após sincronização
              response = await apiClient.get('/users/me', {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 10000,
              });
            } else {
              throw error;
            }
          }

          if (!mountedRef.current) return null;

          const profile: UserProfile = {
            id: response.data.id,
            email: response.data.email,
            firstName: response.data.firstName,
            lastName: response.data.lastName,
            name: response.data.name,
            phoneNumber: response.data.phoneNumber,
            birthDate: response.data.birthDate,
            gender: response.data.gender,
            imageUrl: response.data.imageUrl,
            clerkId: response.data.clerkId,
            createdAt: response.data.createdAt,
            updatedAt: response.data.updatedAt,
          };

          setCachedProfile(cacheKey, profile);
          return profile;
        } catch (error: any) {
          console.error('❌ Erro ao buscar perfil:', error);
          throw error;
        } finally {
          // Remove a requisição ativa do controle
          activeRequestRef.current.delete(userId);
        }
      })();

      // Adiciona ao controle de requisições ativas
      activeRequestRef.current.set(userId, requestPromise);
      return requestPromise;
    },
    [isSignedIn, getToken, getCachedProfile, setCachedProfile, syncUserWithRetry]
  );

  const fetchProfile = useCallback(
    async (force = false) => {
      if (!isSignedIn || !userId || !mountedRef.current) {
        return;
      }

      // Evita múltiplas chamadas desnecessárias
      if (!force && state.isLoading && activeRequestRef.current.has(userId)) {
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const profile = await fetchProfileInternal(userId);
        if (mountedRef.current) {
          setState({
            profile,
            isLoading: false,
            error: null,
            lastFetchTime: Date.now(),
          });
        }
      } catch (error: any) {
        if (mountedRef.current) {
          const errorMessage =
            error.response?.data?.message || error.message || 'Erro ao buscar dados do perfil';
          setState((prev) => ({
            ...prev,
            profile: null,
            isLoading: false,
            error: errorMessage,
          }));

          // Só mostra toast se não for primeira carga ou se for um retry
          if (state.lastFetchTime || force) {
            showToast('Erro ao carregar dados do perfil', 'error');
          }
        }
      }
    },
    [isSignedIn, userId, state.isLoading, state.lastFetchTime, fetchProfileInternal, showToast]
  );

  const updateProfile = useCallback(
    async (data: Partial<UserProfile>): Promise<UserProfile | null> => {
      if (!isSignedIn || !userId || !mountedRef.current) {
        throw new Error('Usuário não autenticado');
      }

      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Token de autenticação não disponível');
        }

        console.log('🔄 Atualizando perfil...', data);
        const response = await apiClient.patch('/users/me', data, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });

        if (!mountedRef.current) return null;

        const updatedProfile: UserProfile = {
          id: response.data.id,
          email: response.data.email,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          name: response.data.name,
          phoneNumber: response.data.phoneNumber,
          birthDate: response.data.birthDate,
          gender: response.data.gender,
          imageUrl: response.data.imageUrl,
          clerkId: response.data.clerkId,
          createdAt: response.data.createdAt,
          updatedAt: response.data.updatedAt,
        };

        // Atualiza cache e estado
        const cacheKey = `profile_${userId}`;
        setCachedProfile(cacheKey, updatedProfile);
        setState((prev) => ({ ...prev, profile: updatedProfile }));

        showToast('Perfil atualizado com sucesso', 'success');
        return updatedProfile;
      } catch (error: any) {
        console.error('❌ Erro ao atualizar perfil:', error);
        const errorMessage =
          error.response?.data?.message || error.message || 'Erro ao atualizar perfil';
        showToast(errorMessage, 'error');
        throw error;
      }
    },
    [isSignedIn, userId, getToken, setCachedProfile, showToast]
  );

  // Efeito para carregar perfil quando usuário faz login
  useEffect(() => {
    if (isSignedIn && userId && !initializedRef.current) {
      initializedRef.current = true;
      fetchProfile();
    } else if (!isSignedIn) {
      // Limpa dados quando usuário faz logout
      initializedRef.current = false;
      setState({
        profile: null,
        isLoading: false,
        error: null,
        lastFetchTime: null,
      });
      if (userId) {
        profileCache.delete(`profile_${userId}`);
        activeRequestRef.current.delete(userId);
      }
    }
  }, [isSignedIn, userId, fetchProfile]);

  // Limpa recursos quando hook é desmontado
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Limpa todas as requisições ativas
      activeRequestRef.current.clear();
    };
  }, []);

  return {
    profile: state.profile,
    isLoading: state.isLoading,
    error: state.error,
    fetchProfile,
    updateProfile,
    refetch: () => fetchProfile(true),
  };
}

// Função para limpar cache (útil para testes ou logout completo)
export const clearProfileCache = () => {
  profileCache.clear();
};

// Default export para resolver warning do React Router
const profileHook = {
  useProfile,
  clearProfileCache,
};

export default profileHook;
