import { useAuth } from '@clerk/clerk-expo';
import { useState, useEffect, useCallback, useRef } from 'react';

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
}

export function useProfile(): UseProfileResult {
  const { getToken, isLoaded: isAuthLoaded, userId } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Referência para controle de montagem do componente
  const mountedRef = useRef(true);

  // Cache simples baseado no userId
  const profileCacheRef = useRef<Map<string, UserProfile>>(new Map());

  // Função para sincronizar usuário com retry
  const syncUserWithRetry = useCallback(
    async (token: string, maxRetries: number = 2): Promise<boolean> => {
      let retries = 0;
      while (retries < maxRetries && mountedRef.current) {
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
    async (userId: string): Promise<UserProfile | null> => {
      if (!mountedRef.current) return null;

      const cacheKey = userId;
      const cachedProfile = profileCacheRef.current.get(cacheKey);

      // Se existe cache e tem menos de 5 minutos, usar cache
      if (cachedProfile && mountedRef.current) {
        console.log('📋 [useProfile] Usando perfil do cache');
        return cachedProfile;
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
          if (!token || !mountedRef.current) {
            throw new Error('Token de autenticação não disponível');
          }

          console.log('🔍 [useProfile] Buscando perfil do usuário...');

          let response;
          try {
            response = await fetchWithAuth('/users/me', { method: 'GET' }, async () => token);
          } catch (error: any) {
            // Se usuário não encontrado, tenta sincronizar UMA ÚNICA VEZ
            if (error.response?.status === 404 && mountedRef.current) {
              console.log('👤 [useProfile] Usuário não encontrado, tentando sincronizar...');

              const syncSuccess = await syncUserWithRetry(token, 1); // Apenas 1 retry
              if (!syncSuccess || !mountedRef.current) {
                throw new Error('Falha na sincronização do usuário');
              }

              // Tenta buscar novamente após sincronização
              response = await fetchWithAuth('/users/me', { method: 'GET' }, async () => token);
            } else {
              throw error;
            }
          }

          if (!mountedRef.current) return null;

          const profile: UserProfile = {
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

          // Salvar no cache
          profileCacheRef.current.set(cacheKey, profile);

          console.log('✅ [useProfile] Perfil carregado com sucesso:', profile);
          return profile;
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
  const fetchProfile = useCallback(async () => {
    if (!mountedRef.current || !isAuthLoaded || !userId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const profileData = await fetchProfileInternal(userId);
      if (mountedRef.current) {
        setProfile(profileData);
      }
    } catch (error: any) {
      console.error('❌ [useProfile] Erro final ao buscar perfil:', error);
      if (mountedRef.current) {
        const errorMessage =
          error?.response?.data?.message || error?.message || 'Erro ao carregar perfil do usuário';
        setError(errorMessage);
        showToast('Erro ao carregar perfil. Tente novamente.', 'error');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [isAuthLoaded, userId, fetchProfileInternal, showToast]);

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
      // Limpar cache
      profileCacheRef.current.delete(userId);
      await fetchProfile();
    }
  }, [userId, fetchProfile]);

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

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    profile,
    loading,
    error,
    refetch,
    syncUser,
  };
}

// Função para limpar cache (útil para testes ou logout completo)
export const clearProfileCache = () => {
  // Implementação para limpar cache global se necessário
  console.log('Cache de perfil limpo');
};

// Default export para resolver warning do React Router
const profileHook = {
  useProfile,
  clearProfileCache,
};

export default profileHook;
