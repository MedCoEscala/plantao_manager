import { PrismaClient } from '@prisma/client';
import { ProfileResponse, ProfileService, ProfileUpdateData } from './profileTypes';
import { User } from '../../types/user';
import { formatUserFromClerk } from '../auth/utils';

// Inicialização do cliente Prisma (singleton)
let prismaInstance: PrismaClient | null = null;

const getPrismaClient = () => {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
};

class ClerkProfileService implements ProfileService {
  /**
   * Obtém os dados do perfil do usuário atual
   */
  async getUserProfile(): Promise<User | null> {
    try {
      // Verificar se o usuário está logado
      const clerk = globalThis.Clerk;
      if (!clerk || !clerk.session) {
        return null;
      }

      const user = await clerk.user;
      if (!user) {
        return null;
      }

      const userId = user.id;

      // Buscar os dados do usuário do banco de dados
      const prisma = getPrismaClient();
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      // Se o usuário não existir no banco, vamos criá-lo com os dados do Clerk
      if (!dbUser) {
        const userData = formatUserFromClerk(user, user.primaryEmailAddress?.emailAddress || '');

        await prisma.user.create({
          data: {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            phoneNumber: userData.phoneNumber,
            birthDate: userData.birthDate,
          },
        });

        return userData;
      }

      // Converter o formato do banco para o formato User
      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        createdAt: dbUser.createdAt.toISOString(),
        updatedAt: dbUser.updatedAt.toISOString(),
        phoneNumber: dbUser.phoneNumber || '',
        birthDate: dbUser.birthDate || '',
      };
    } catch (error) {
      console.error('Erro ao obter perfil do usuário:', error);
      return null;
    }
  }

  /**
   * Atualiza os dados do perfil do usuário
   */
  async updateUserProfile(data: ProfileUpdateData): Promise<ProfileResponse> {
    try {
      // Verificar se o usuário está logado
      const clerk = globalThis.Clerk;
      if (!clerk || !clerk.user) {
        return {
          success: false,
          error: 'Usuário não autenticado',
        };
      }

      const user = clerk.user;
      const userId = user.id;
      const updateData: any = {};
      const publicMetadata: any = {};

      // Preparar dados a serem atualizados no Clerk
      if (data.name) {
        const nameParts = data.name.split(' ');
        updateData.firstName = nameParts[0];
        updateData.lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      }

      if (data.phoneNumber) {
        try {
          // Verificar se já tem um telefone cadastrado
          const existingPhones = user.phoneNumbers || [];

          if (existingPhones.length === 0) {
            // Criar novo telefone
            await user.createPhoneNumber({ phoneNumber: data.phoneNumber });
          } else {
            // Atualizar telefone existente
            await user.updatePhoneNumber({
              phoneNumberId: existingPhones[0].id,
              phoneNumber: data.phoneNumber,
            });
          }
        } catch (phoneError) {
          console.error('Erro ao atualizar telefone:', phoneError);
        }
      }

      if (data.birthDate) {
        publicMetadata.birthDate = data.birthDate;
      }

      // Se houver metadados, atualizar
      if (Object.keys(publicMetadata).length > 0) {
        updateData.publicMetadata = publicMetadata;
      }

      // Atualizar dados no Clerk
      if (Object.keys(updateData).length > 0) {
        await user.update(updateData);
      }

      // Atualizar dados no banco de dados
      const prisma = getPrismaClient();
      await prisma.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          email: data.email,
          phoneNumber: data.phoneNumber,
          birthDate: data.birthDate,
        },
      });

      // Obter dados atualizados
      const updatedUser = await this.getUserProfile();
      if (!updatedUser) {
        return {
          success: false,
          error: 'Não foi possível obter os dados atualizados',
        };
      }

      return {
        success: true,
        user: updatedUser,
      };
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar perfil',
      };
    }
  }
}

export default new ClerkProfileService();
