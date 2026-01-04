# Migration Plan: Replit to Cloudflare Pages/Workers

## Current Architecture Analysis

Your codebase contains **three distinct components**:

1. **Mobile App** (`client/`): React Native/Expo app
   - Currently uses **local storage only** (AsyncStorage) - no backend API calls yet
   - Has API client setup but not actively using it
   - **Deployment**: Compiles to native apps, distributed via App Store/Play Store (NOT deployed to web)
   - Only needs backend API URL configured via `EXPO_PUBLIC_DOMAIN` environment variable

2. **Admin Panel** (`admin-panel/`): React SPA built with Vite
   - Uses `/api/admin/*` backend routes
   - Served as static files from Express `/admin` route
   - **Deployment**: Static files served via web server

3. **Marketing Website** (`server/templates/marketing/`): Static HTML pages
   - Forms submit to `/marketing/contact` and `/marketing/electrician-application`
   - CSS served from `/marketing/styles.css`
   - **Deployment**: Static HTML files served via web server

4. **Backend API** (`server/`): Express.js server
   - Routes: `/api/admin/*`, `/marketing/*`, `/admin/*` (static files)
   - **Currently NO mobile app routes** (`server/routes.ts` is empty)
   - Serves static files for admin panel and marketing pages
   - Uses file-based storage for admin data (JSON files)

## Deployment Architecture Options

### Option 1: Monorepo - Single Project, Multiple Deployments (Recommended)

**Keep everything in one GitHub repo, but deploy separately:**

- **Cloudflare Pages**: 
  - Marketing HTML templates (`server/templates/marketing/`)
  - Admin Panel build output (`admin-panel/dist/`)
  - CSS and static assets
  - Configured via `wrangler.toml` to serve static files

- **Cloudflare Workers**: 
  - All API routes (`/api/admin/*`, `/marketing/contact`, `/marketing/electrician-application`)
  - Workers Functions in `functions/` directory
  - Same domain as Pages (via Workers Routes)

- **Mobile App**: 
  - Remains in repo, but **not deployed via Cloudflare**
  - Compiled locally or via CI/CD, uploaded to app stores
  - Points to Cloudflare Workers API URL via `EXPO_PUBLIC_DOMAIN`

**Pros:**
- ✅ Shared codebase (types, schemas in `shared/`)
- ✅ Single repo for version control
- ✅ Easier to keep types in sync
- ✅ Simpler development workflow
- ✅ No need to split code

**Cons:**
- ⚠️ Slightly more complex deployment configuration
- ⚠️ Pages and Workers must be on same domain (can use Cloudflare routing)

---

### Option 2: Split into Separate Repos/Projects

**Split into three separate projects:**

1. **Backend API Repo** (Cloudflare Workers)
   - `server/` directory
   - `shared/` directory (database schemas, types)
   - Workers Functions
   - Deployed to Cloudflare Workers

2. **Web Frontend Repo** (Cloudflare Pages)
   - Marketing HTML templates
   - Admin Panel React app
   - Static assets
   - Deployed to Cloudflare Pages
   - API calls to Workers domain

3. **Mobile App Repo** (GitHub only, no web deployment)
   - `client/` directory
   - Remains in Git, compiled for app stores
   - API calls to Workers domain

**Pros:**
- ✅ Clear separation of concerns
- ✅ Independent deployments
- ✅ Different teams can work independently
- ✅ Cleaner project structure

**Cons:**
- ❌ Shared types/schemas need to be duplicated or published as packages
- ❌ More complex dependency management
- ❌ Harder to keep types in sync between projects
- ❌ More repositories to manage
- ❌ Requires significant refactoring

---

### Option 3: Hybrid - Keep Mobile Separate, Web Together

**Mobile app stays in separate repo, but Marketing + Admin Panel + Backend stay together:**

- **Repo 1**: Mobile App (client/)
- **Repo 2**: Web Backend + Frontend (server/, admin-panel/, marketing templates)

**Pros:**
- ✅ Mobile app can be managed independently
- ✅ Web components share codebase

**Cons:**
- ❌ Still need to manage shared types between repos
- ❌ Partial split complexity

---

## Recommendation: Option 1 (Monorepo)

**Keep everything in one repo, deploy separately to Cloudflare.**

### Why This Makes Sense:

1. **Mobile app doesn't need web deployment** - it's a native app that gets compiled and distributed via app stores. It just needs the backend API URL.

2. **Shared code benefits** - Your `shared/` directory with database schemas and types is used by:
   - Backend (database operations)
   - Admin Panel (TypeScript types for API responses)
   - Potentially Mobile App (in the future)

3. **Simpler development** - One repo, one clone, easier local development

4. **Cloudflare supports this** - You can deploy both Pages and Workers from the same repo using Cloudflare's build system

### Deployment Strategy:

```
GitHub Repo (single)
├── client/                    (Mobile app - stays in repo, not deployed to Cloudflare)
├── admin-panel/              (Build output → Cloudflare Pages)
├── server/
│   ├── templates/marketing/  (HTML files → Cloudflare Pages)
│   ├── public/               (CSS files → Cloudflare Pages)
│   └── (API routes → Cloudflare Workers Functions)
└── shared/                   (Shared types/schemas)
```

**Cloudflare Configuration:**
- **Pages**: Serves `admin-panel/dist/` and `server/templates/marketing/`
- **Workers**: Handles API routes, same domain via Workers Routes
- **Mobile App**: Points to Workers domain via `EXPO_PUBLIC_DOMAIN`

---

## Implementation Changes Required

### 1. File-Based Storage Migration (Critical)

**Current State**: Admin data stored in JSON files:
- `admin_users.json`
- `applications.json`  
- `electricians.json`
- `jobs.json`
- `disputes.json`
- `audit_logs.json`
- `customers.json`
- `balance_transactions.json`
- `configs.json`

**Why this must change**: Cloudflare Workers has no filesystem. All data must be in PostgreSQL database tables.

**Migration Approach**: 
- Create database tables for all admin entities in `shared/schema.ts`
- Update `server/admin-storage.ts` to use Drizzle ORM instead of file I/O
- Run migration script to move any existing JSON data to database

### 2. Database Connection Update

**Current**: Node.js `pg` library
**New**: `@neondatabase/serverless` or similar serverless-compatible PostgreSQL driver

### 3. Session Management Replacement

**Current**: `express-session` (in-memory)
**New**: Encrypted cookies with Cloudflare Workers

### 4. Static File Serving Migration

**Marketing Pages**: Move HTML templates to Cloudflare Pages
**Admin Panel**: Build output already goes to `admin-panel/dist/` → Pages
**CSS**: Move `server/public/marketing.css` to Pages-accessible location

### 5. Code Structure Changes

**New Files:**
- `functions/` directory for Cloudflare Workers Functions
- `wrangler.toml` for Cloudflare configuration
- Migration scripts for database schema

**Modified Files:**
- `server/db.ts` - Use serverless driver
- `server/admin-storage.ts` - Replace file I/O with database
- `server/admin-routes.ts` - Replace express-session with encrypted cookies
- `server/marketing-routes.ts` - Convert to Workers Functions format
- `shared/schema.ts` - Add admin entity tables
- `package.json` - Update dependencies

---

## Next Steps

1. **Confirm deployment approach** (recommend Option 1: Monorepo)
2. **Plan database schema migration** (create tables for all admin entities)
3. **Set up Cloudflare account and projects** (Pages + Workers)
4. **Begin implementation** following the steps above

