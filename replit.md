# Modo - Home Services Marketplace

## Overview

Modo is a mobile-first home services marketplace for Jordan, initially focused on electricians. The platform connects homeowners with verified electricians through a curated matching system rather than customer selection.

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

### Admin Panel

A comprehensive web-based admin panel for internal operations management:
- **Access**: /admin endpoint on the Express server (port 5000)
- **Default Credentials**: admin@modo.jo / admin123
- **Technology**: React + Vite + TanStack React Query, served as static files

**Features**:
- Dashboard with key metrics (active electricians, pending applications, open disputes, revenue)
- Electrician application review with approve/reject workflow (requires reason)
- Electrician management (activate/suspend/deactivate with reasons)
- Job timeline view showing full state history
- Dispute management with status tracking and resolution
- Customer management with balance and credit adjustments
- Marketing leads management from website contact form
- Configuration management with version history
- Complete audit log tracking all admin actions

### Marketing Website

Public-facing marketing pages served at `/marketing/` to capture lead requests:
- **Access**: `/marketing/` endpoint on the Express server (port 5000)
- **Pages**: Home page with contact form, What We Do page
- **Form Fields**: name, phone (required), email (optional), address, issue description
- **Storage**: JSON file-based (data/marketing_leads.json), integrated with admin panel

**Admin Panel Architecture**:
- Frontend: `/admin-panel/` - React SPA with CSS modules
- Backend routes: `/server/admin-routes.ts` - Session-authenticated REST API
- Storage: `/server/admin-storage.ts` - JSON file-based (designed for easy PostgreSQL migration)
- Shared types: `/shared/admin-types.ts` - Zod schemas for validation

## Recent Changes

### December 31, 2025
- **Added public marketing website** at `/marketing/` endpoint:
  - Home page with hero section, features grid, and contact form
  - "What We Do" page with service descriptions
  - Responsive design with dark mode support
  - Contact form submits leads to backend storage
- **Marketing leads management** in admin panel:
  - New "Marketing Leads" navigation item in admin sidebar
  - Leads table with status filtering (pending/contacted/converted/closed)
  - Lead detail modal with contact info and issue description
  - Status update workflow with notes
- **Backend support**:
  - `/marketing/contact` POST endpoint for form submissions
  - `/api/admin/leads` GET endpoint (authenticated)
  - `/api/admin/leads/:id/status` PATCH endpoint for status updates
  - MarketingLead type in shared/admin-types.ts
- Created `feature/marketing-site` branch on GitHub for this work
- GitHub integration script: `scripts/create-branch.ts`

### December 30, 2025
- **Built complete admin panel** with dashboard, application review, electrician/job/dispute/customer management
- Admin authentication with session-based login and bcrypt password hashing
- All admin actions require reasons and are logged to immutable audit trail
- Demo data seeding for testing (2 pending applications, 2 customers, default configs)
- Fixed JobCard touch handling on iOS (removed nested Pressable by using Card's onPress prop directly)
- Improved UX: After submitting a job request, customers are now taken directly to the Activity tab to see their new job
- Fixed navigation using CommonActions.reset for reliable post-submission navigation
- Added job simulation feature for customers to test the full job workflow without real electricians
  - In JobDetailScreen, customers see a "Simulate" button that advances job through all states
  - Simulates: BROADCAST → ACCEPTED → EN_ROUTE → ARRIVED → IN_PROGRESS → COMPLETED
  - Creates mock electrician "Ahmad (Demo)" when job is accepted
- **Added profile settings screens** in `client/screens/profile/`:
  - PaymentMethodsScreen: Shows cash-only notice with "coming soon" for cards
  - SavedAddressesScreen: Manage saved service addresses with default selection
  - NotificationsScreen: Toggle settings for job updates, arrival alerts, promotions
  - HelpSupportScreen: Contact options (phone, email, WhatsApp) and FAQ accordion
  - TermsOfServiceScreen: Full terms with sections on pricing, cancellation, liability
  - PrivacyPolicyScreen: Privacy policy covering data collection, sharing, rights

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