# Cloudflare Deployment Guide

## Overview

This project is set up for deployment to Cloudflare Pages (static files) and Cloudflare Workers (API routes).

## Architecture

- **Cloudflare Pages**: Serves static files (marketing HTML, admin panel, CSS)
- **Cloudflare Workers**: Handles API routes (`/api/admin/*`, `/marketing/contact`, `/marketing/electrician-application`)

## Prerequisites

1. **Cloudflare Account** with `modohq.app` domain configured
2. **Supabase Project** with `DATABASE_URL` connection string
3. **Wrangler CLI** installed: `npm install -g wrangler` (or use `npx wrangler`)

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Set secrets in Cloudflare (via Wrangler CLI or Dashboard):

```bash
# Set DATABASE_URL
wrangler secret put DATABASE_URL
# Paste your Supabase connection string when prompted

# Set SESSION_SECRET (for encrypted cookies)
wrangler secret put SESSION_SECRET
# Generate a random string (32+ characters) or use: openssl rand -hex 32

# Optional: Set ADMIN_BASIC_AUTH_PASSWORD (if keeping Basic Auth)
wrangler secret put ADMIN_BASIC_AUTH_PASSWORD
```

### 3. Run Database Migrations

```bash
# Set DATABASE_URL locally
export DATABASE_URL="your-supabase-connection-string"

# Generate and run migrations
npm run db:push
```

### 4. Build Admin Panel

```bash
cd admin-panel
npm install
npm run build
cd ..
```

### 5. Deploy to Cloudflare

#### Option A: Via Wrangler CLI

```bash
# Deploy Pages (static files)
wrangler pages deploy admin-panel/dist --project-name=modo-app

# Deploy Workers Functions
wrangler deploy
```

#### Option B: Via GitHub Integration (Recommended)

1. Connect your GitHub repository to Cloudflare Pages
2. Configure build settings:
   - **Build command**: `cd admin-panel && npm install && npm run build`
   - **Output directory**: `admin-panel/dist`
   - **Root directory**: `/`
3. Add environment variables in Cloudflare Dashboard:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `ADMIN_BASIC_AUTH_PASSWORD` (optional)
4. Cloudflare will automatically deploy on git push

### 6. Configure Routing

In Cloudflare Dashboard:
- Set up Workers Routes to handle `/api/admin/*` and `/marketing/*` (API endpoints)
- Pages will serve static files automatically
- Marketing HTML pages should be copied to Pages output directory or served via Workers

## File Structure

```
functions/
  api/
    admin/
      [[path]].ts      # Handles /api/admin/* routes
  marketing/
    [[path]].ts        # Handles /marketing/* API routes

server/
  services/
    admin-service.ts   # Shared business logic (used by Express and Workers)
  admin-routes.ts      # Express routes (local dev)
  marketing-routes.ts  # Express routes (local dev, uses shared services)
  admin-storage.ts     # Database operations
  db.ts                # Database connection

wrangler.toml          # Cloudflare configuration
```

## Local Development

For local development, use the Express server:

```bash
# Set DATABASE_URL
export DATABASE_URL="your-supabase-connection-string"

# Run Express server
npm run server:dev
```

The Express server will:
- Serve marketing pages at `/marketing/*`
- Serve admin panel at `/admin/*`
- Handle API routes at `/api/admin/*` and `/marketing/*`

## Production Deployment

In production (Cloudflare):
- **Marketing HTML pages**: Served by Cloudflare Pages
- **Admin Panel**: Served by Cloudflare Pages (from `admin-panel/dist`)
- **API Routes**: Handled by Cloudflare Workers Functions

## Notes

- The Workers Functions currently implement a subset of routes (auth, applications)
- Remaining admin routes can be added incrementally to `functions/api/admin/[[path]].ts`
- Express routes continue to work for local development
- Both Express and Workers use the same shared service layer (`server/services/admin-service.ts`)

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is set correctly
- Check Supabase connection pooling settings
- Ensure database tables exist (run migrations)

### Workers Function Errors
- Check Cloudflare Workers logs in Dashboard
- Verify environment variables are set
- Check that `functions/` directory structure matches routes

### Static Files Not Serving
- Verify files are in correct directories for Pages
- Check `wrangler.toml` build configuration
- Ensure Pages project is connected to correct branch

