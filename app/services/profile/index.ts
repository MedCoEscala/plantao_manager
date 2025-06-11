import apiClient from '@/lib/axios';
import { User } from '@/types/user';

interface ApiProfileResponse {
  user: User;
}

export class ApiProfileService {
  static async getProfile(token: string): Promise<User> {
    try {
      const response = await apiClient.get('/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const profileData = response.data;

      if (!profileData) {
        throw new Error('Dados do perfil não encontrados na resposta da API');
      }

      // Mapear response para User interface
      const user: User = {
        id: profileData.id,
        email: profileData.email,
        name: profileData.name || '',
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        phoneNumber: profileData.phoneNumber || '',
        birthDate: profileData.birthDate || '',
        gender: profileData.gender || '',
        imageUrl: profileData.imageUrl || '',
        clerkId: profileData.clerkId,
        createdAt: profileData.createdAt,
        updatedAt: profileData.updatedAt,
      };

      return user;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Perfil não encontrado. Sincronização necessária.');
      }
      throw error;
    }
  }

  static async syncUser(token: string): Promise<User> {
    try {
      await apiClient.post(
        '/users/sync',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const user = await this.getProfile(token);
      return user;
    } catch (error: any) {
      throw error;
    }
  }

  static async updateProfile(token: string, data: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.patch('/users/me', data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const profileData = response.data;

      if (!profileData) {
        throw new Error('Dados atualizados não encontrados na resposta da API');
      }

      // Mapear response para User interface
      const user: User = {
        id: profileData.id,
        email: profileData.email,
        name: profileData.name || '',
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        phoneNumber: profileData.phoneNumber || '',
        birthDate: profileData.birthDate || '',
        gender: profileData.gender || '',
        imageUrl: profileData.imageUrl || '',
        clerkId: profileData.clerkId,
        createdAt: profileData.createdAt,
        updatedAt: profileData.updatedAt,
      };

      return user;
    } catch (error: any) {
      throw error;
    }
  }

  static async resyncProfile(token: string): Promise<User> {
    try {
      return await this.syncUser(token);
    } catch (error: any) {
      throw error;
    }
  }
}

export default ApiProfileService;
