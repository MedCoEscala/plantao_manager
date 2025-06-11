export interface PasswordValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Valida senha seguindo os critérios atualizados:
 * - Mínimo 8 caracteres
 * - Pelo menos 1 letra minúscula
 * - Pelo menos 1 letra maiúscula
 * - Pelo menos 1 número
 * - Pelo menos 1 caractere especial
 */
export function validatePassword(password: string): PasswordValidationResult {
  if (!password || password.trim().length === 0) {
    return { isValid: false, message: 'Senha é obrigatória' };
  }

  const trimmedPassword = password.trim();

  // Mínimo 8 caracteres
  if (trimmedPassword.length < 8) {
    return {
      isValid: false,
      message: 'Senha deve ter pelo menos 8 caracteres',
    };
  }

  // Pelo menos 1 letra minúscula
  if (!/[a-z]/.test(trimmedPassword)) {
    return {
      isValid: false,
      message: 'Senha deve conter pelo menos 1 letra minúscula',
    };
  }

  // Pelo menos 1 letra maiúscula
  if (!/[A-Z]/.test(trimmedPassword)) {
    return {
      isValid: false,
      message: 'Senha deve conter pelo menos 1 letra maiúscula',
    };
  }

  // Pelo menos 1 número
  if (!/[0-9]/.test(trimmedPassword)) {
    return {
      isValid: false,
      message: 'Senha deve conter pelo menos 1 número',
    };
  }

  // Pelo menos 1 caractere especial
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(trimmedPassword)) {
    return {
      isValid: false,
      message:
        'Senha deve conter pelo menos 1 caractere especial (!@#$%^&*...)',
    };
  }

  return { isValid: true };
}
