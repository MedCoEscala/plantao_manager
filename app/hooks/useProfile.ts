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
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken, isSignedIn } = useAuth();
  const { showToast } = useToast();

  const fetchProfile = async () => {
    if (!isSignedIn) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Não foi possível obter o token de autenticação');
      }

      const response = await apiClient.get('/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProfile(response.data);
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

      setProfile(response.data);
      showToast('Perfil atualizado com sucesso', 'success');
      return response.data;
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
