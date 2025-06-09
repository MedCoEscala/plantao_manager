import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
  clerkId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ProfileContextData {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => void;
  clearProfile: () => void;
}

const ProfileContext = createContext<ProfileContextData>({} as ProfileContextData);

export const useProfileContext = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfileContext must be used within a ProfileProvider');
  }
  return context;
};

interface ProfileProviderProps {
  children: React.ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken, isLoaded: isAuthLoaded, userId } = useAuth();
  const { showToast } = useToast();
  const mountedRef = useRef(true);

  // Função para buscar perfil
  const fetchProfile = async () => {
    if (!isAuthLoaded || !userId || !getToken) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token || !mountedRef.current) return;

      console.log('🔍 [ProfileContext] Buscando perfil do usuário...');

      const response = await fetchWithAuth('/users/me', { method: 'GET' }, async () => token);

      if (!mountedRef.current) return;

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
      console.log('✅ [ProfileContext] Perfil carregado com sucesso');
    } catch (error: any) {
      console.error('❌ [ProfileContext] Erro ao buscar perfil:', error);
      if (mountedRef.current) {
        const errorMessage = error?.response?.data?.message || 'Erro ao carregar perfil';
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Função para atualizar perfil local (otimista)
  const updateProfile = (data: Partial<UserProfile>) => {
    if (profile) {
      setProfile({ ...profile, ...data });
      console.log('📝 [ProfileContext] Perfil atualizado localmente');
    }
  };

  // Função para limpar perfil
  const clearProfile = () => {
    setProfile(null);
    setError(null);
    console.log('🧹 [ProfileContext] Perfil limpo');
  };

  // Carregar perfil quando autenticação estiver pronta
  useEffect(() => {
    if (isAuthLoaded && userId) {
      fetchProfile();
    } else if (isAuthLoaded && !userId) {
      clearProfile();
      setLoading(false);
    }
  }, [isAuthLoaded, userId]);

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const contextValue: ProfileContextData = {
    profile,
    loading,
    error,
    refreshProfile: fetchProfile,
    updateProfile,
    clearProfile,
  };

  return <ProfileContext.Provider value={contextValue}>{children}</ProfileContext.Provider>;
};
