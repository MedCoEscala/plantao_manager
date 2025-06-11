import { User } from '@/types/user';

export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (!password || password.trim().length === 0) {
    return { isValid: false, message: 'Senha é obrigatória' };
  }

  const trimmedPassword = password.trim();

  if (trimmedPassword.length < 8) {
    return { isValid: false, message: 'Senha deve ter pelo menos 8 caracteres' };
  }

  if (!/[a-z]/.test(trimmedPassword)) {
    return { isValid: false, message: 'Senha deve conter pelo menos 1 letra minúscula' };
  }

  if (!/[A-Z]/.test(trimmedPassword)) {
    return { isValid: false, message: 'Senha deve conter pelo menos 1 letra maiúscula' };
  }

  if (!/[0-9]/.test(trimmedPassword)) {
    return { isValid: false, message: 'Senha deve conter pelo menos 1 número' };
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(trimmedPassword)) {
    return {
      isValid: false,
      message: 'Senha deve conter pelo menos 1 caractere especial (!@#$%^&*...)',
    };
  }

  return { isValid: true };
}

export function formatUserFromClerk(clerkUser: any, email: string): User {
  const metadata = clerkUser.publicMetadata || {};

  const firstName = clerkUser.firstName || '';
  const lastName = clerkUser.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Usuário';

  const formattedUser: User = {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || email,
    name: fullName,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    phoneNumber: clerkUser.phoneNumbers?.[0]?.phoneNumber || undefined,
    birthDate: metadata.birthDate || undefined,
    gender: metadata.gender || undefined,
    imageUrl: clerkUser.imageUrl || undefined,
    clerkId: clerkUser.id,
    createdAt: clerkUser.createdAt || new Date().toISOString(),
    updatedAt: clerkUser.updatedAt || new Date().toISOString(),
  };

  return formattedUser;
}

export default function AuthUtils() {
  return null;
}
