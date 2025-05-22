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
    const displayName = UserNameHelper.getDisplayName(profile);

    if (displayName === 'Usuário') return '?';

    const parts = displayName
      .trim()
      .split(' ')
      .filter((part) => part.length > 0);

    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

    const firstInitial = parts[0].charAt(0).toUpperCase();
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();

    return `${firstInitial}${lastInitial}`;
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
