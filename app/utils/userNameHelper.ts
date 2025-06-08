import { UserProfile } from '@/hooks/useProfile';

export class UserNameHelper {
  static getDisplayName(profile: UserProfile | null | undefined): string {
    if (!profile) return 'Usuário';

    if (profile.name && profile.name.trim()) {
      return profile.name.trim();
    }

    const firstName = profile.firstName?.trim() || '';
    const lastName = profile.lastName?.trim() || '';

    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }

    if (profile.email) {
      const emailName = profile.email.split('@')[0];
      if (emailName && emailName.trim()) {
        return emailName.trim();
      }
    }

    return 'Usuário';
  }

  static getInitials(profile: UserProfile | null | undefined): string {
    if (!profile) return '?';

    // Priorizar firstName e lastName se disponíveis
    const firstName = profile.firstName?.trim() || '';
    const lastName = profile.lastName?.trim() || '';

    if (firstName && lastName) {
      // Se tem firstName e lastName, pega a inicial de cada
      return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
    }

    if (firstName && firstName.length >= 2) {
      // Se só tem firstName com 2+ caracteres, pega as duas primeiras letras
      return `${firstName.charAt(0).toUpperCase()}${firstName.charAt(1).toUpperCase()}`;
    }

    if (firstName) {
      // Se só tem firstName com 1 caractere
      return firstName.charAt(0).toUpperCase();
    }

    // Fallback para o nome completo (campo name)
    const displayName = UserNameHelper.getDisplayName(profile);

    if (displayName === 'Usuário') return '?';

    const parts = displayName
      .trim()
      .split(' ')
      .filter((part) => part.length > 0);

    if (parts.length === 0) return '?';
    if (parts.length === 1) {
      const word = parts[0];
      if (word.length >= 2) {
        return `${word.charAt(0).toUpperCase()}${word.charAt(1).toUpperCase()}`;
      }
      return word.charAt(0).toUpperCase();
    }

    // Para múltiplas palavras, pega as iniciais das duas primeiras
    const firstInitial = parts[0].charAt(0).toUpperCase();
    const secondInitial = parts[1].charAt(0).toUpperCase();

    return `${firstInitial}${secondInitial}`;
  }

  static getFirstName(profile: UserProfile | null | undefined): string {
    if (!profile) return '';

    if (profile.firstName && profile.firstName.trim()) {
      return profile.firstName.trim();
    }

    if (profile.name && profile.name.trim()) {
      const parts = profile.name.trim().split(' ');
      return parts[0] || '';
    }

    if (profile.email) {
      const emailName = profile.email.split('@')[0];
      return emailName || '';
    }

    return '';
  }

  static hasCompleteName(profile: UserProfile | null | undefined): boolean {
    if (!profile) return false;

    const hasNameField = !!(profile.name && profile.name.trim());
    const hasFirstAndLast = !!(
      (profile.firstName && profile.firstName.trim()) ||
      (profile.lastName && profile.lastName.trim())
    );

    return hasNameField || hasFirstAndLast;
  }

  static getGreeting(
    profile: UserProfile | null | undefined,
    timeOfDay: 'morning' | 'afternoon' | 'evening' = 'morning'
  ): string {
    const firstName = UserNameHelper.getFirstName(profile);

    const greetings = {
      morning: 'Bom dia',
      afternoon: 'Boa tarde',
      evening: 'Boa noite',
    };

    const greeting = greetings[timeOfDay];

    if (firstName && firstName !== 'Usuário') {
      return `${greeting}, ${firstName}!`;
    }

    return `${greeting}!`;
  }

  static getAutoGreeting(profile: UserProfile | null | undefined): string {
    const hour = new Date().getHours();

    let timeOfDay: 'morning' | 'afternoon' | 'evening';
    if (hour < 12) {
      timeOfDay = 'morning';
    } else if (hour < 18) {
      timeOfDay = 'afternoon';
    } else {
      timeOfDay = 'evening';
    }

    return UserNameHelper.getGreeting(profile, timeOfDay);
  }

  static getDebugInfo(profile: UserProfile | null | undefined): object {
    return {
      profile: profile
        ? {
            name: profile.name,
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
          }
        : null,
      computed: {
        displayName: UserNameHelper.getDisplayName(profile),
        initials: UserNameHelper.getInitials(profile),
        firstName: UserNameHelper.getFirstName(profile),
        hasCompleteName: UserNameHelper.hasCompleteName(profile),
        greeting: UserNameHelper.getAutoGreeting(profile),
      },
    };
  }
}

export const getDisplayName = UserNameHelper.getDisplayName;
export const getInitials = UserNameHelper.getInitials;
export const getFirstName = UserNameHelper.getFirstName;
export const hasCompleteName = UserNameHelper.hasCompleteName;
export const getGreeting = UserNameHelper.getGreeting;
export const getAutoGreeting = UserNameHelper.getAutoGreeting;

export default UserNameHelper;
