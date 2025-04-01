import { User } from '../../types/user';

export function formatUserFromClerk(clerkUser: any, email: string): User {
  return {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || email,
    name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
    createdAt: clerkUser.createdAt || new Date().toISOString(),
    updatedAt: clerkUser.updatedAt || new Date().toISOString(),
    phoneNumber: clerkUser.phoneNumbers?.[0]?.phoneNumber || '',
    birthDate: (clerkUser.publicMetadata?.birthDate as string) || '',
  };
}
