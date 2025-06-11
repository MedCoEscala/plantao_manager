import { User } from '@/types/user';

export class UserNameHelper {
  static getDisplayName(profile: User | null | undefined): string {
    if (!profile) return 'Usuário';

    const firstName = profile.firstName?.trim() || '';
    const lastName = profile.lastName?.trim() || '';

    if (firstName || lastName) {
      const fullName = `${firstName} ${lastName}`.trim();
      return fullName;
    }

    if (profile.name && profile.name.trim()) {
      return profile.name.trim();
    }

    if (profile.email) {
      const emailName = profile.email.split('@')[0];
      if (emailName && emailName.trim()) {
        const displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
        return displayName;
      }
    }

    return 'Usuário';
  }

  static getInitials(profile: User | null | undefined): string {
    if (!profile) return '?';

    const firstName = profile.firstName?.trim() || '';
    const lastName = profile.lastName?.trim() || '';

    if (firstName && lastName) {
      const initials = `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
      return initials;
    }

    if (firstName && firstName.length >= 2) {
      const initials = `${firstName.charAt(0).toUpperCase()}${firstName.charAt(1).toUpperCase()}`;
      return initials;
    }

    if (firstName) {
      const initial = firstName.charAt(0).toUpperCase();
      return initial;
    }

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

    const firstInitial = parts[0].charAt(0).toUpperCase();
    const secondInitial = parts[1].charAt(0).toUpperCase();

    return `${firstInitial}${secondInitial}`;
  }

  static getFirstName(profile: User | null | undefined): string {
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

  static hasCompleteName(profile: User | null | undefined): boolean {
    if (!profile) return false;

    const hasFirstOrLast = !!(
      (profile.firstName && profile.firstName.trim()) ||
      (profile.lastName && profile.lastName.trim())
    );

    const hasNameField = !!(profile.name && profile.name.trim() && profile.name.trim().length > 1);

    return hasFirstOrLast || hasNameField;
  }

  static getGreeting(
    profile: User | null | undefined,
    timeOfDay: 'morning' | 'afternoon' | 'evening' = 'morning'
  ): string {
    const firstName = UserNameHelper.getFirstName(profile);

    const greetings = {
      morning: 'Bom dia',
      afternoon: 'Boa tarde',
      evening: 'Boa noite',
    };

    const greeting = greetings[timeOfDay];

    if (firstName && firstName !== 'Usuário' && firstName.length > 1) {
      return `${greeting}, ${firstName}!`;
    }

    return `${greeting}!`;
  }

  static getAutoGreeting(profile: User | null | undefined): string {
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

  static getDebugInfo(profile: User | null | undefined): object {
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
