import { User } from '../../types/user';

export interface SyncResponse {
  success: boolean;
  error?: string;
}

export interface SyncService {
  syncUserData: () => Promise<SyncResponse>;

  hasPendingSync: () => Promise<boolean>;

  getUserFromLocal: () => Promise<User | null>;

  updateUserInLocal: (user: User) => Promise<boolean>;
}

export default {
  SyncService: null as any,
};
