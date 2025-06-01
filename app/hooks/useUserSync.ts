import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useAuthenticatedFetch } from '@/utils/api-client';

export const useUserSync = () => {
  const { isLoaded: isAuthLoaded, userId } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { fetchAuth } = useAuthenticatedFetch();
  const { showToast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFirstSync, setIsFirstSync] = useState(true);

  const syncUser = async () => {
    if (!isAuthLoaded || !isUserLoaded || !userId || !user) return;

    setIsSyncing(true);
    try {
      const result = await fetchAuth('/users/sync');
      console.log('Sincronização concluída:', result);

      if (isFirstSync) {
        showToast('Perfil sincronizado com sucesso', 'success');
        setIsFirstSync(false);
      }

      return result;
    } catch (error) {
      console.error('Erro ao sincronizar usuário:', error);
      showToast('Falha ao sincronizar perfil', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isAuthLoaded && isUserLoaded && userId && user) {
      syncUser();
    }
  }, [isAuthLoaded, isUserLoaded, userId]);

  return { syncUser, isSyncing };
};

// Default export para resolver warning do React Router
const userSyncHook = {
  useUserSync,
};

export default userSyncHook;
