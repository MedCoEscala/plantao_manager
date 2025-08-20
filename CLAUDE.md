# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (React Native/Expo)
- **Development**: `npm start` - Start Expo development server
- **Build**: `eas build --platform android --profile production` - Build Android production APK
- **Linting**: `npm run lint` - Run ESLint and Prettier with fixes
- **iOS**: `npm run ios` - Run on iOS simulator
- **Android**: `npm run android` - Run on Android emulator
- **Web**: `npm run web` - Run as web application

### Backend (NestJS)
- **Development**: `npm run start:dev` - Start backend in development mode with hot reload
- **Build**: `npm run build` - Build the NestJS application
- **Linting**: `npm run lint` - Run ESLint with fixes on backend code
- **Testing**: `npm run test` - Run Jest unit tests
- **Production**: `npm run start:prod` - Start built application in production mode

## Architecture Overview

### Project Structure
This is a full-stack React Native (Expo) application for managing medical shifts ("plantões"). The project consists of:

**Frontend** (`/app`): React Native with Expo Router v4
- `/app/(auth)` - Authentication screens (login, signup, password reset)
- `/app/(root)` - Protected routes requiring authentication
- `/app/components` - Reusable UI components organized by feature
- `/app/contexts` - React Context providers for state management
- `/app/services` - API client services and data fetching logic
- `/app/database` - Local SQLite database with Expo SQLite
- `/app/hooks` - Custom React hooks

**Backend** (`/backend`): NestJS API with PostgreSQL
- `/backend/src` - NestJS modules organized by feature (shifts, contractors, locations, etc.)
- `/backend/prisma` - Database schema and migrations using Prisma ORM

### Key Technologies
- **Frontend**: React Native, Expo Router, NativeWind (TailwindCSS), Zustand, Expo SQLite, Clerk Auth
- **Backend**: NestJS, Prisma, PostgreSQL (NeonDB), Clerk webhooks, Expo push notifications
- **Styling**: NativeWind v4 (TailwindCSS for React Native) with custom design system
- **Authentication**: Clerk for both frontend and backend with webhook sync
- **Database**: PostgreSQL (production) + SQLite (local offline sync)

### Data Flow Architecture
The app implements a hybrid online/offline architecture:
1. **Local-first**: Primary data stored in local SQLite database
2. **API sync**: Background sync with NestJS backend
3. **Conflict resolution**: Automatic conflict resolution for offline changes
4. **Real-time notifications**: Push notifications via Expo notifications

### Database Models (Prisma Schema)
- **User**: User profiles synced from Clerk
- **Location**: Medical facilities/hospitals where shifts occur
- **Contractor**: Companies/entities that hire medical professionals
- **Plantao**: Individual medical shifts with start/end times, payment info
- **Payment**: Payment tracking for completed shifts
- **ShiftTemplate**: Reusable shift templates for quick shift creation
- **NotificationConfig**: User notification preferences
- **DeviceToken**: Push notification device tokens

## Key Development Patterns

### Component Organization
- UI components in `/app/components/ui` with consistent design system
- Feature-specific components in appropriate feature folders
- All components use TypeScript with proper typing

### State Management
- React Context for global state (auth, locations, contractors)
- Zustand for complex state management when needed
- Local SQLite database as single source of truth for offline-first approach

### API Integration
- Services in `/app/services` handle API communication
- Automatic retry logic and offline queue for failed requests
- Clerk authentication tokens automatically included in requests

### Styling Approach
- NativeWind v4 for all styling (TailwindCSS classes)
- Custom color palette defined in `tailwind.config.js`
- Consistent spacing, typography, and component variants
- Design system documented in `/app/styles/README.md`

### Form Handling
- Comprehensive form components with validation in `/app/components/form`
- Support for recurring shifts with batch creation
- Real-time validation and error handling

### Notification System
- Push notifications via Expo notifications
- Backend scheduler for daily/weekly reports
- User-configurable notification preferences
- Notification logs for debugging and analytics

## Development Workflow

### Environment Setup
1. Frontend requires Expo CLI and proper `.env` configuration for Clerk keys
2. Backend requires PostgreSQL database URL and Clerk webhook secrets
3. Both frontend and backend have separate `package.json` files

### Database Management
- Frontend: SQLite migrations in `/app/database/migrations.ts`
- Backend: Prisma migrations in `/backend/prisma/migrations`
- Always run `prisma generate` after schema changes

### Testing Approach
- Backend has Jest setup for unit testing
- Frontend testing should use Expo testing tools
- Always test offline/online scenarios for data sync

### Build and Deployment
- Frontend: EAS Build for mobile app distribution
- Backend: Deployed on Fly.io with automatic migration on deploy
- Vercel deployment also configured for API hosting

## Common Issues and Solutions

### NativeWind Production Issues
- Production builds may require specific NativeWind configuration
- Scripts in `/scripts` directory handle production build fixes
- Always test production builds before release

### Offline Sync Conflicts
- Conflict resolution logic in `/app/services/sync`
- Local changes always take precedence over server data
- Failed syncs are queued and retried automatically

### Authentication Flow
- Clerk handles authentication with automatic token refresh
- Backend validates Clerk tokens on all protected endpoints
- User data automatically synced via Clerk webhooks