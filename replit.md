# Kahraba - Home Services Marketplace

## Overview

Kahraba is a mobile-first home services marketplace for Jordan, initially focused on electricians. The platform connects homeowners with verified electricians through a curated matching system rather than customer selection.

The app uses a dual-interface approach:
- **Customer App**: Request electrical services, track jobs, manage payments
- **Electrician App**: Receive job broadcasts, manage availability, track earnings

Key business rules:
- Fixed-price jobs only (no hourly billing)
- System-curated job matching (customers don't choose electricians)
- Add-on system for unexpected work requiring customer approval
- Strict job state machine enforced server-side

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React Native with Expo SDK 54
- Uses Expo Router-compatible navigation via React Navigation
- Native stack navigation with bottom tabs per user role
- Supports iOS, Android, and web platforms

**State Management**:
- TanStack React Query for server state
- React Context for auth state (`AuthContext`)
- AsyncStorage for local persistence

**UI Layer**:
- Custom themed components (`ThemedText`, `ThemedView`, `Card`, `Button`)
- Reanimated for animations
- Platform-adaptive blur effects via `expo-blur`
- Dark/light theme support via `useColorScheme`

**Navigation Structure**:
- `RootStackNavigator`: Auth flow + role-based main navigators
- `CustomerTabNavigator`: Home, Activity, Profile tabs
- `ElectricianTabNavigator`: Jobs, Earnings, Profile tabs
- Shared modal screens: JobDetail, RequestJob, AddOnRequest

### Backend Architecture

**Framework**: Express.js with TypeScript
- Single REST API serving both mobile app and future admin panel
- CORS configured for Replit domains
- Routes registered via `registerRoutes()` in `server/routes.ts`

**Data Layer**:
- Drizzle ORM with PostgreSQL
- Schema defined in `shared/schema.ts` using Drizzle's pgTable
- Zod schemas generated via `drizzle-zod` for validation
- Currently using in-memory storage (`MemStorage`) as placeholder

**Job State Machine**:
States flow: `CREATED → BROADCAST → ACCEPTED → EN_ROUTE → ARRIVED → IN_PROGRESS → COMPLETED → SETTLED`
- Transitions must be enforced server-side
- Invalid transitions rejected
- Cancellations move to `CANCELLED` with penalties based on state

### Shared Code

The `shared/` directory contains:
- Database schema definitions
- Type exports used by both client and server
- Validation schemas

Path aliases configured:
- `@/` → `./client/`
- `@shared/` → `./shared/`

## External Dependencies

### Database
- **PostgreSQL** via Drizzle ORM
- Connection URL from `DATABASE_URL` environment variable
- Migrations output to `./migrations`

### Mobile Platform Services
- **Expo SDK 54**: Core mobile framework
- **expo-haptics**: Tactile feedback
- **expo-blur**: Native blur effects
- **expo-image**: Optimized image loading
- **AsyncStorage**: Local data persistence

### Authentication (Planned)
Per design guidelines:
- Apple Sign-In for iOS customers
- Google Sign-In for Android/cross-platform customers
- Email/password + phone verification for electricians
- SMS OTP for phone verification (provider TBD)

### Build & Development
- **tsx**: TypeScript execution for server
- **esbuild**: Server production bundling
- **Babel** with module-resolver for path aliases
- Metro bundler via Expo for client

### API Communication
- REST API over HTTPS
- TanStack React Query for data fetching
- No WebSocket implementation (polling + push notifications planned)

## Recent Changes

### December 29, 2025
- Fixed AuthContext.logout to use clearUser() instead of clearAllData() to preserve marketplace data between sessions
- Added null guards for timeline arrays in getJobs() and getActiveBroadcast() to prevent crashes when reading jobs without initialized timelines
- All storage persistence functions complete and working (setJobs, addJob, updateJob, setActiveBroadcast)
- Date rehydration properly handles ISO strings from JSON serialization

## Known Limitations (MVP)
- Uses AsyncStorage for local persistence (no multi-device sync)
- Job matching is simulated locally (no real electrician matching algorithm)
- No push notifications (polling only)
- No payment integration (cash only for MVP)