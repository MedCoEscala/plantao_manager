import { User } from '../../types/user';

export interface ProfileUpdateData {
  name?: string;
  email?: string;
  phoneNumber?: string;
  birthDate?: string;
  [key: string]: any;
}

export interface ProfileResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export interface ProfileService {
  getUserProfile: () => Promise<User | null>;
  updateUserProfile: (data: ProfileUpdateData) => Promise<ProfileResponse>;
  uploadProfilePicture?: (uri: string) => Promise<ProfileResponse>;
}
