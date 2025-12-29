# Design Guidelines: Home Services Marketplace

## Authentication Architecture

**Auth Required** - Multi-role system with SSO:
- **Customer Flow**: Apple Sign-In (iOS) + Google Sign-In (Android/cross-platform)
- **Electrician Flow**: Email/password + phone verification (for identity verification requirements)
- Both flows include mandatory phone verification via SMS OTP
- Privacy policy & terms of service links on signup
- Account screens include: logout (with confirmation), profile management, delete account (nested under Settings > Account > Delete with double confirmation)

**Onboarding**:
- Customers: 2-screen flow (location permission → service area confirmation)
- Electricians: Multi-step application (identity upload, trade certification, availability setup, payment setup)

---

## Navigation Architecture

### Customer App
**Tab Navigation** (3 tabs):
1. **Home** - Browse/create service requests
2. **Activity** - Active and past jobs
3. **Profile** - Settings, payment methods, support

### Electrician App  
**Tab Navigation** (3 tabs):
1. **Jobs** - Incoming broadcasts and active jobs
2. **Earnings** - Balance, settlements, transaction history
3. **Profile** - Availability toggle, verification status, settings

**Shared Modal Screens** (both apps):
- Job Detail (full-screen modal)
- Add-on Selection (electrician only)
- Dispute Resolution
- Payment Method Management
- Support/Help

---

## Screen Specifications

### Customer: Home Screen
- **Header**: Transparent, location indicator (left), support button (right)
- **Layout**: Scrollable root view
  - Hero section with "Request Electrician" CTA
  - Service description card (what's included)
  - Safety & trust signals
  - How it works section
- **Safe Area**: Top: headerHeight + Spacing.xl, Bottom: tabBarHeight + Spacing.xl
- **Components**: Large primary button (floating at bottom), info cards, trust badges

### Customer: Activity Screen
- **Header**: Default navigation header, title "My Jobs"
- **Layout**: List view with pull-to-refresh
  - Segmented control: "Active" / "Past"
  - Job cards showing status, date, price, electrician info (when assigned)
  - Empty state for no jobs
- **Safe Area**: Top: Spacing.xl (non-transparent header), Bottom: tabBarHeight + Spacing.xl

### Electrician: Jobs Screen (Critical)
- **Header**: Custom header with availability toggle (large, prominent) and notification bell (right)
- **Layout**: Single job broadcast view OR list of historical jobs
  - When broadcast active: Full-screen takeover with countdown timer
  - Broadcast card: Job details, location, price, distance, accept/decline buttons
  - When no broadcast: List of upcoming scheduled jobs
- **Safe Area**: Top: headerHeight + Spacing.xl, Bottom: tabBarHeight + Spacing.xl
- **Special**: Countdown timer must be highly visible, accept button must be green with haptic feedback

### Electrician: Earnings Screen
- **Header**: Default navigation header, title "Earnings"
- **Layout**: Scrollable root view
  - Balance card at top (current balance, credit limit indicator if negative)
  - Quick stats: This week, This month
  - Transaction list (settlements, deductions, bonuses)
- **Safe Area**: Top: Spacing.xl, Bottom: tabBarHeight + Spacing.xl

### Job Detail Modal (Both User Types)
- **Header**: Close button (left), job ID (center), support (right)
- **Layout**: Scrollable form-like view
  - Status timeline (visual progress tracker)
  - Job details section
  - Price breakdown (base + add-ons)
  - Electrician info (customer view) / Customer info (electrician view)
  - Action buttons at bottom (context-dependent: Cancel, Arrive, Complete, etc.)
- **Safe Area**: Top: headerHeight + Spacing.xl, Bottom: insets.bottom + Spacing.xl
- **Buttons**: In fixed footer above safe area, not in scrollable content

### Add-on Request Screen (Electrician Only)
- **Header**: Cancel (left), "Request Add-on" (center), confirm in header (right, disabled until selection)
- **Layout**: Scrollable list of predefined add-on options
  - Each add-on shows: name, description, fixed price
  - Single or multi-select based on job context
  - Warning text about approval requirement
- **Safe Area**: Top: Spacing.xl, Bottom: insets.bottom + Spacing.xl
- **Submit**: Header button (not below form)

---

## Visual Design System

### Color Palette
**Primary Colors**:
- Primary: #1E40AF (trust blue - used for main actions)
- Success: #10B981 (accept, complete, verified)
- Warning: #F59E0B (pending, en route)
- Error: #EF4444 (cancel, declined, issues)
- Neutral: #64748B (secondary text, borders)

**Background**:
- Light mode: #F8FAFC (app background), #FFFFFF (cards)
- Dark mode support required

**State Colors**:
- BROADCAST: #F59E0B (amber)
- ACCEPTED: #3B82F6 (blue)
- EN_ROUTE: #8B5CF6 (purple)
- ARRIVED: #06B6D4 (cyan)
- IN_PROGRESS: #6366F1 (indigo)
- COMPLETED: #10B981 (green)

### Typography
- **Headings**: SF Pro Display (iOS) / Roboto (Android)
  - H1: 28pt, Bold
  - H2: 22pt, Semibold
  - H3: 18pt, Semibold
- **Body**: SF Pro Text / Roboto
  - Body: 16pt, Regular
  - Caption: 14pt, Regular
  - Small: 12pt, Regular
- **Emphasis**: Price displays use tabular numbers, Bold weight

### Spacing Scale
- xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32

### Components

**Job Broadcast Card** (Electrician):
- Prominent countdown timer (60s, circular progress indicator)
- White background with subtle shadow (shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.10, shadowRadius: 2)
- Accept button: Full-width, green (#10B981), 56pt height
- Decline: Text-only button below, red text

**Status Timeline** (Job Detail):
- Horizontal progress bar with labeled stages
- Completed stages: green checkmark icon
- Current stage: animated pulse
- Future stages: gray outline

**Touchable Feedback**:
- All buttons: Scale down to 0.95 on press
- List items: Background overlay (#000000, opacity: 0.05) on press
- Primary buttons: Slight brightness shift on press

**Floating Action Button** (if needed):
- 56x56pt circle, primary color
- Shadow: {width: 0, height: 2}, opacity: 0.10, radius: 2
- Icon: 24pt, white

**Trust Badges**:
- Small pills with icon + text
- "Verified" (green checkmark), "Top Performer" (star icon)
- Subtle background tint, no heavy borders

---

## Critical Assets

**Generated Assets Required**:
1. **Customer Avatars** (3-5 presets): Simple, friendly human silhouettes in neutral colors
2. **Electrician Avatars** (3-5 presets): Professional illustrations with tool/hard hat theme
3. **Service Icon**: Electrician-specific (lightning bolt + wrench combination)
4. **Empty State Illustrations**:
   - No jobs yet (customer)
   - Waiting for jobs (electrician)
   - No transaction history

**System Icons**: Use @expo/vector-icons (Feather icon set)
- Navigation: home, activity, user, settings, bell
- Actions: check, x, clock, map-pin, credit-card
- Status: alert-circle, check-circle, info

**No emojis** - Use standard icons only

---

## Accessibility & Localization

- Minimum touch target: 44x44pt
- Color contrast ratio: WCAG AA (4.5:1 for text)
- Screen reader labels for all interactive elements
- Countdown timer must have both visual and haptic feedback
- Support RTL layouts (Arabic potential for Jordan market)
- Phone numbers formatted for Jordanian standard (+962)

---

## Interaction Patterns

**Job Acceptance** (Critical):
- Haptic feedback on accept button press
- Immediate optimistic UI update
- Loading state with spinner
- Error handling with retry option

**Cancellation Confirmations**:
- Alert dialog with fee display (if applicable)
- Reason selection required
- Destructive action styling (red)

**Real-time Updates**:
- Pull-to-refresh on all list screens
- Optimistic updates for state changes
- Toast notifications for background updates
- Auto-refresh job detail when returning from background