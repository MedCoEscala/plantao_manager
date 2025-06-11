import { User } from '../../types/user';

// Nova função para validar senha com os requisitos corretos (8 caracteres mínimos)
export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (!password || password.trim().length === 0) {
    return { isValid: false, message: 'Senha é obrigatória' };
  }

  const trimmedPassword = password.trim();

  // Mínimo 8 caracteres (conforme solicitado pelo usuário)
  if (trimmedPassword.length < 8) {
    return { isValid: false, message: 'Senha deve ter pelo menos 8 caracteres' };
  }

  // Pelo menos 1 letra minúscula
  if (!/[a-z]/.test(trimmedPassword)) {
    return { isValid: false, message: 'Senha deve conter pelo menos 1 letra minúscula' };
  }

  // Pelo menos 1 letra maiúscula
  if (!/[A-Z]/.test(trimmedPassword)) {
    return { isValid: false, message: 'Senha deve conter pelo menos 1 letra maiúscula' };
  }

  // Pelo menos 1 número
  if (!/[0-9]/.test(trimmedPassword)) {
    return { isValid: false, message: 'Senha deve conter pelo menos 1 número' };
  }

  // Pelo menos 1 caractere especial
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

  const formattedUser = {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || email,
    name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
    createdAt: clerkUser.createdAt || new Date().toISOString(),
    updatedAt: clerkUser.updatedAt || new Date().toISOString(),
    phoneNumber: clerkUser.phoneNumbers?.[0]?.phoneNumber || '',
    birthDate: metadata.birthDate || '',
  };

  return formattedUser;
}

// Exportação padrão para evitar avisos de rota em React Native
export default function AuthUtils() {
  return null;
}
