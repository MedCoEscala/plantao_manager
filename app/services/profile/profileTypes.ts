import { User, UserUpdateInput } from '@/types/user';

export interface ProfileResponse {
  success: boolean;
  error?: string;
  user?: User;
}

export interface ProfileService {
  getUserProfile(): Promise<User | null>;
  updateUserProfile(data: UserUpdateInput): Promise<ProfileResponse>;
}

// Exportação padrão para evitar avisos de rotas no React Native
export default function ProfileTypes() {
  return null;
}
