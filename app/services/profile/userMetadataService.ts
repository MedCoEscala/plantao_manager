import { User } from '@/app/types/user';

export class UserMetadataService {
  static async saveUserMetadata(
    user: any,
    userData: {
      name?: string;
      phoneNumber?: string;
      birthDate?: string;
      [key: string]: any;
    }
  ): Promise<boolean> {
    if (!user) return false;

    try {
      const currentMetadata = user.unsafeMetadata || {};

      const newMetadata = {
        ...currentMetadata,
        ...userData,
      };

      await user.update({
        unsafeMetadata: newMetadata,
      });

      console.log('Metadados de usuário atualizados com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao atualizar metadados do usuário:', error);
      return false;
    }
  }

  static getUserMetadata(user: any): Partial<User> {
    if (!user) return {};

    const metadata = user.unsafeMetadata || {};
    const publicMeta = user.publicMetadata || {};

    const combinedMetadata = {
      ...publicMeta,
      ...metadata,
    };

    return {
      id: user.id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      email: user.primaryEmailAddress?.emailAddress || '',
      phoneNumber: user.phoneNumbers?.[0]?.phoneNumber || '',
      birthDate: combinedMetadata.birthDate || '',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      ...combinedMetadata,
    };
  }

  static async updatePhoneNumber(user: any, phoneNumber: string): Promise<boolean> {
    if (!user || !phoneNumber) return false;

    try {
      const existingPhones = user.phoneNumbers || [];

      if (existingPhones.length === 0) {
        await user.createPhoneNumber({
          phoneNumber,
        });
      } else {
        await user.updatePhoneNumber({
          phoneNumberId: existingPhones[0].id,
          phoneNumber,
        });
      }

      console.log('Telefone atualizado com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao atualizar telefone:', error);
      return false;
    }
  }
}

export default UserMetadataService;
