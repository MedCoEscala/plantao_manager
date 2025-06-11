export interface PasswordValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Valida senha seguindo os novos critérios simplificados:
 * - Mínimo 6 caracteres
 * - Pelo menos 1 letra minúscula
 * - Pelo menos 1 caractere especial
 */
export function validatePassword(password: string): PasswordValidationResult {
  if (!password || password.trim().length === 0) {
    return { isValid: false, message: 'Senha é obrigatória' };
  }

  const trimmedPassword = password.trim();

  // Mínimo 6 caracteres
  if (trimmedPassword.length < 6) {
    return {
      isValid: false,
      message: 'Senha deve ter pelo menos 6 caracteres',
    };
  }

  // Pelo menos 1 letra minúscula
  if (!/[a-z]/.test(trimmedPassword)) {
    return {
      isValid: false,
      message: 'Senha deve conter pelo menos 1 letra minúscula',
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
