import { useProfileContext } from '@/contexts/ProfileContext';
import { User } from '@/types/user';

export interface UseProfileResult {
  profile: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateLocalProfile: (updates: Partial<User>) => void;
  syncUser: () => Promise<boolean>;
  isInitialized: boolean;
}

/**
 * @deprecated Use useProfileContext directly
 * This hook is kept for backward compatibility but should be replaced
 */
export function useProfile(): UseProfileResult {
  const { profile, isLoading, error, refreshProfile, updateLocalProfile, syncUser, isInitialized } =
    useProfileContext();

  return {
    profile,
    loading: isLoading,
    error,
    refetch: refreshProfile,
    updateLocalProfile,
    syncUser,
    isInitialized,
  };
}

// Default export para resolver warning do React Router
const profileHook = {
  useProfile,
};

export default profileHook;

// Export do tipo para compatibilidade
export type { User };
