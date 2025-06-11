/**
 * Helper para gerar sugestões de senhas seguras
 * e verificar se uma senha é comum/vazada
 */

// Lista de palavras comuns que devem ser evitadas
const COMMON_WEAK_PASSWORDS = [
  'password',
  'senha',
  '123456',
  'admin',
  'user',
  'test',
  'qwerty',
  'abc123',
  'password123',
  '12345678',
  'letmein',
  'welcome',
  'monkey',
  'dragon',
  'master',
  'login',
];

// Prefixos e sufixos seguros para gerar sugestões
const SAFE_PREFIXES = [
  'minha',
  'meu',
  'super',
  'ultra',
  'mega',
  'app',
  'sistema',
  'trabalho',
  'projeto',
  'equipe',
  'time',
  'grupo',
];

const SAFE_SUFFIXES = [
  'seguro',
  'forte',
  'protegido',
  'privado',
  'unico',
  '2024',
  '2025',
  'app',
  'pro',
  'plus',
];

const SPECIAL_CHARS = ['!', '@', '#', '$', '%', '&', '*'];

/**
 * Gera sugestões de senhas seguras baseadas em contexto
 */
export function generatePasswordSuggestions(): string[] {
  const suggestions: string[] = [];

  // Gerar algumas combinações seguras
  for (let i = 0; i < 5; i++) {
    const prefix = SAFE_PREFIXES[Math.floor(Math.random() * SAFE_PREFIXES.length)];
    const suffix = SAFE_SUFFIXES[Math.floor(Math.random() * SAFE_SUFFIXES.length)];
    const special = SPECIAL_CHARS[Math.floor(Math.random() * SPECIAL_CHARS.length)];
    const number = Math.floor(Math.random() * 99) + 10; // 10-99

    suggestions.push(`${prefix}${suffix}${number}${special}`);
  }

  return suggestions;
}

/**
 * Verifica se uma senha contém padrões comuns que podem ser rejeitados
 */
export function isLikelyCommonPassword(password: string): boolean {
  const lowerPassword = password.toLowerCase();

  // Verifica se contém palavras comuns
  for (const weak of COMMON_WEAK_PASSWORDS) {
    if (lowerPassword.includes(weak)) {
      return true;
    }
  }

  // Verifica padrões sequenciais
  if (/123456|abcdef|qwerty/.test(lowerPassword)) {
    return true;
  }

  // Verifica se é só números
  if (/^\d+$/.test(password)) {
    return true;
  }

  // Verifica se é só letras
  if (/^[a-zA-Z]+$/.test(password)) {
    return true;
  }

  return false;
}

/**
 * Calcula a força de uma senha (0-100)
 */
export function calculatePasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Comprimento
  if (password.length >= 8) {
    score += 25;
  } else if (password.length >= 6) {
    score += 15;
    feedback.push('Senha poderia ser mais longa');
  } else {
    feedback.push('Senha muito curta');
  }

  // Minúsculas
  if (/[a-z]/.test(password)) {
    score += 15;
  } else {
    feedback.push('Adicione letras minúsculas');
  }

  // Maiúsculas
  if (/[A-Z]/.test(password)) {
    score += 15;
  } else {
    feedback.push('Considere adicionar maiúsculas');
  }

  // Números
  if (/\d/.test(password)) {
    score += 15;
  } else {
    feedback.push('Considere adicionar números');
  }

  // Caracteres especiais
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    score += 20;
  } else {
    feedback.push('Adicione caracteres especiais');
  }

  // Variedade de caracteres
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= password.length * 0.7) {
    score += 10;
  }

  // Penalização por padrões comuns
  if (isLikelyCommonPassword(password)) {
    score = Math.max(0, score - 30);
    feedback.push('Evite palavras comuns');
  }

  return { score: Math.min(100, score), feedback };
}

/**
 * Gera uma única senha segura com base em parâmetros
 */
export function generateSecurePassword(
  includeUppercase = true,
  includeNumbers = true,
  length = 12
): string {
  const prefix = SAFE_PREFIXES[Math.floor(Math.random() * SAFE_PREFIXES.length)];
  const suffix = SAFE_SUFFIXES[Math.floor(Math.random() * SAFE_SUFFIXES.length)];
  const special = SPECIAL_CHARS[Math.floor(Math.random() * SPECIAL_CHARS.length)];

  let password = prefix + suffix;

  if (includeNumbers) {
    const number = Math.floor(Math.random() * 999) + 100; // 100-999
    password += number;
  }

  password += special;

  if (includeUppercase) {
    // Capitalizar primeira letra
    password = password.charAt(0).toUpperCase() + password.slice(1);
  }

  // Ajustar comprimento se necessário
  while (password.length < length) {
    password += Math.floor(Math.random() * 10);
  }

  return password.substring(0, length);
}
