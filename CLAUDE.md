# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MedEscala** is a medical shift management mobile application built with React Native (Expo) and a NestJS backend. The app allows medical professionals to track shifts (plantões), manage payments, locations, contractors, and receive automated notifications.

## Architecture

### Monorepo Structure
- **Root**: React Native (Expo) mobile app with Expo Router
- **`/backend`**: NestJS API server (separate Node.js project)
- Both use the same PostgreSQL database via Prisma ORM

### Frontend Stack
- **React Native** 0.79.5 with **Expo** 53.0.20
- **Expo Router** 5.1.4 for file-based routing
- **NativeWind** 4.1.23 (TailwindCSS for React Native) - configured with `NATIVEWIND_OUTPUT: native` for production builds
- **TypeScript** with strict mode
- **Clerk** for authentication (~2.9.6)
- **SQLite** for local data (expo-sqlite)
- **Zustand** for state management
- **Zod** for validation

### Backend Stack
- **NestJS** 11.0.1
- **Prisma** 6.6.0 with PostgreSQL (NeonDB)
- **Clerk** SDK for auth verification
- **Expo Server SDK** for push notifications
- **@nestjs/schedule** for cron jobs (notifications)

## Development Commands

### Frontend (Root Directory)
```bash
npm start                    # Start Expo dev server
npm run android             # Run on Android device/emulator
npm run ios                 # Run on iOS device/simulator
npm run lint                # ESLint + Prettier fix
npm run build               # Build Android production with EAS
```

### Backend (`/backend` Directory)
```bash
npm run start:dev           # Start NestJS in watch mode
npm run build               # Build NestJS project
npm run start:prod          # Run production build
npm run lint                # ESLint fix
npm run test                # Run Jest tests
npm run test:watch          # Run tests in watch mode
npm run test:cov            # Run tests with coverage

# Database
npx prisma generate         # Generate Prisma client (auto-runs on postinstall)
npx prisma migrate deploy   # Apply migrations (production)
npx prisma migrate dev      # Create and apply migration (development)
```

## Path Aliases

TypeScript path aliases are configured in `tsconfig.json`:
- `@/*` or `@app/*` → `app/*` (frontend code)
- `~/*` → `src/*` (used in some contexts)

Use these aliases consistently for imports within the mobile app.

## Key Architecture Patterns

### Frontend Routing (Expo Router)
- `app/(auth)/` - Unauthenticated routes (login, register)
- `app/(root)/` - Authenticated routes, protected by Clerk
- `app/(root)/(tabs)/` - Main tab navigation:
  - `index.tsx` - Shifts calendar
  - `locations.tsx` - Manage locations
  - `payments.tsx` - Payment tracking
  - `cnpj.tsx` - Tax/company data
  - `templates.tsx` - Shift templates
  - `profile.tsx` - User profile

### State Management Strategy
1. **Contexts** (`app/contexts/`) for global state:
   - `LocationsContext` - Location CRUD
   - `ContractorsContext` - Contractor CRUD
   - `ShiftTemplatesContext` - Template CRUD
   - `ProfileContext` - User profile
   - `NotificationContext` - Notification config
   - `ShiftsSyncContext` - Shift sync status

2. **Local SQLite** for offline-first shifts data
3. **API Services** (`app/services/`) for backend communication
4. **Sync Service** handles SQLite ↔ PostgreSQL synchronization

### Database Architecture

**Frontend**: SQLite (expo-sqlite) in `app/database/`
- Schema defined in `schema.ts`
- Migrations in `migrations.ts`
- Used for offline-first shift management

**Backend**: PostgreSQL via Prisma
- Schema: `backend/prisma/schema.prisma`
- Main models: `User`, `Plantao` (Shift), `Location`, `Contractor`, `Payment`, `ShiftTemplate`, `NotificationConfig`, `DeviceToken`

### Authentication Flow
1. Clerk handles auth on mobile (tokens stored in SecureStore)
2. Frontend sends Clerk token in `Authorization` header
3. Backend validates with Clerk SDK (`@clerk/clerk-sdk-node`)
4. User data synced to PostgreSQL via webhooks or API

### Notifications System
- **Push**: Expo Notifications + expo-server-sdk
- **Cron Jobs** in backend:
  - Daily reminders (8:00 AM)
  - Before-shift reminders (configurable, default 60 min)
  - Weekly/monthly reports
- Device tokens stored in `DeviceToken` model
- User preferences in `NotificationConfig` model
- All notifications logged in `NotificationLog`

## Important Configuration Notes

### NativeWind Production
- **MUST** set `NATIVEWIND_OUTPUT: "native"` in production builds (see `eas.json`)
- See `NATIVEWIND_PRODUCTION_FIX.md` for troubleshooting
- Scripts in `/scripts` handle NativeWind setup/verification

### Environment Variables

**Frontend (.env)**:
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx
EXPO_PUBLIC_API_URL=https://www.medescalaapp.com.br
```

**Backend (backend/.env)**:
```
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_xxx
NODE_ENV=production
```

### Build & Deploy

**Mobile App**:
- Uses EAS (Expo Application Services)
- Production builds: `npm run build` (configured in `package.json` and `eas.json`)
- Builds configured in `eas.json` with channels: development, preview, production
- Both iOS and Android use Hermes engine

**Backend**:
- Deployed to Railway (production)
- Vercel compatibility configured but Railway is primary
- Auto-deploy on push to master (GitHub Actions in `.github/`)
- Runs migrations automatically: `prisma migrate deploy`

## Testing

**Frontend**: No test framework currently configured

**Backend**:
- Jest configured
- Run with `npm run test` in `/backend`
- E2E tests: `npm run test:e2e`

## Key Files to Reference

- **Authentication**: `.instructions` has detailed auth patterns
- **Notifications**: `NOTIFICACOES.md` for push notification architecture
- **Deployment**: `DEPLOY_GUIDE.md` for production setup
- **Design System**: `app/styles/README.md` for UI components
- **Forms**: `app/components/form/README.md` for form components

## Common Development Tasks

### Adding a New API Endpoint
1. Create controller/service in `backend/src/<module>/`
2. Update Prisma schema if needed: `backend/prisma/schema.prisma`
3. Run migration: `cd backend && npx prisma migrate dev --name description`
4. Create API service in `app/services/<name>-api.ts`
5. Update context or create hook if needed

### Adding a New Screen
1. Create file in appropriate route group (e.g., `app/(root)/new-screen.tsx`)
2. Follow Expo Router conventions
3. Use NativeWind classes for styling
4. Wrap with SafeAreaView if needed

### Working with Offline Data
- Shifts use SQLite for offline-first
- Sync happens via `ShiftsSyncContext` and services in `app/services/sync/`
- Other entities (locations, contractors) use direct API calls

## Code Style Guidelines (from .instructions)

- **Functional components** with TypeScript interfaces (no classes)
- **Strict TypeScript**: prefer interfaces over types, no enums
- Use **function** keyword for pure functions
- **Descriptive variable names** with auxiliary verbs (isLoading, hasError)
- File structure: exported component → subcomponents → helpers → static → types
- Use Prettier for formatting (config in `prettier.config.js`)
- Follow universe/native ESLint config

## Important Constraints

- **No '+' prefix** in route filenames (Expo Router incompatibility)
- Always use `SafeAreaView` from `react-native-safe-area-context` for proper screen insets
- Test on both iOS and Android (different notification behaviors)
- Handle offline state gracefully (shifts work offline)
- Validate all inputs with Zod
- Use Clerk tokens for all authenticated API requests
