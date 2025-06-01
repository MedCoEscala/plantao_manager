import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
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

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken, isSignedIn } = useAuth();
  const { showToast } = useToast();

  const fetchProfile = async () => {
    if (!isSignedIn) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Não foi possível obter o token de autenticação');
      }

      console.log('buscando perfil de usuario');
      const response = await apiClient.get('/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userData = response.data;

      const processedProfile: UserProfile = {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        name: userData.name,
        phoneNumber: userData.phoneNumber,
        birthDate: userData.birthDate,
        gender: userData.gender,
        imageUrl: userData.imageUrl,
        clerkId: userData.clerkId,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      };

      setProfile(processedProfile);
      console.log('perfil processado e definido: ', userData);
    } catch (err: any) {
      console.error('Erro ao buscar perfil:', err);
      setError(err.message || 'Erro ao buscar dados do perfil');
      showToast('Erro ao carregar dados do perfil', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchProfile();
    } else {
      setProfile(null);
      setIsLoading(false);
    }
  }, [isSignedIn]);

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!isSignedIn) return null;

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Não foi possível obter o token de autenticação');
      }

      const response = await apiClient.patch('/users/me', data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const updatedData = response.data;

      const processedProfile: UserProfile = {
        id: updatedData.id,
        email: updatedData.email,
        firstName: updatedData.firstName,
        lastName: updatedData.lastName,
        name: updatedData.name,
        phoneNumber: updatedData.phoneNumber,
        birthDate: updatedData.birthDate,
        gender: updatedData.gender,
        imageUrl: updatedData.imageUrl,
        clerkId: updatedData.clerkId,
        createdAt: updatedData.createdAt,
        updatedAt: updatedData.updatedAt,
      };

      setProfile(processedProfile);
      showToast('Perfil atualizado com sucesso', 'success');
      return processedProfile;
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err);
      showToast('Erro ao atualizar perfil', 'error');
      return null;
    }
  };

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
  };
}

// Default export para resolver warning do React Router
const profileHook = {
  useProfile,
};

export default profileHook;
