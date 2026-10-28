# Session Booker Pro — Backend and Dashboard Implementation Plan

## 1. Goal and scope

Add a secure Supabase backend and role-specific dashboards to the existing personal-trainer booking web app. The work includes authentication, profiles and account moderation, session catalog and availability, booking workflows, admin management and reports, media storage, audit history, notifications, and a visual system derived from the existing landing page.

This plan excludes online payments. Session prices are stored and shown for reference or offline collection. Stripe can be added later without changing the booking model fundamentally.

## 2. Starting assumptions and discovery gate

The supplied workspace currently contains only a short README, `.gitignore`, `mcp_config.json`, and an empty temporary file; it does not contain the described web app or landing-page source. The GitHub repository `craftflowlabai/craftflowlab` was also found to be empty when checked. Therefore, the plan below is a product and technical blueprint based on the request, not a codebase-specific migration plan.

Before implementation:

1. Put the current web app source in this workspace or identify the correct repository and branch.
2. Inventory the framework, routes, existing booking/session data, current styles, deployment target, and any existing auth provider.
3. Capture the landing page's actual colors, typography, spacing, imagery, icon style, and button/card treatments. Use those observations in the branding tokens; do not invent a replacement brand palette.
4. Confirm whether a booking becomes a client when a booking is created, when it is confirmed, or only when the first session is completed. Default recommendation: promote to `client` when the first booking is successfully created, even if it is pending approval, because the account has entered the client booking workflow.
5. Confirm whether admin approval is required for new bookings and whether clients may cancel within a cutoff window. Use configurable defaults until decided.

## 3. Proposed application areas and routes

Use distinct full pages for user-specific work, with persistent sidebars on dashboard areas. Use dialogs only for confirmation and small edits.

### Public and account routes

- `/` — existing marketing landing page, retained and used as the visual source of truth.
- `/sessions` — public session calendar/list with filters and availability indicators.
- `/sessions/:id` — session details and booking call to action.
- `/signup`, `/login`, `/logout` — account lifecycle.
- `/forgot-password`, `/reset-password` — password recovery.
- `/auth/callback` — Supabase email/OAuth callback if required by the chosen auth setup.
- `/profile` — personal details, contact information, preferences, and account status.
- `/privacy`, `/terms` — add or link to required policy pages once final copy is supplied.

### Client area

- `/client` — client dashboard: upcoming booking, next steps, and recent activity.
- `/client/bookings` — upcoming, past, cancelled, and waitlisted bookings.
- `/client/bookings/:id` — booking details, cancellation request/action, and status history.
- `/client/profile` — profile and communication preferences; may reuse `/profile` if the app already has a unified profile route.

### Admin area

- `/admin` — dashboard summary and operational alerts.
- `/admin/sessions` and `/admin/sessions/new`, `/admin/sessions/:id` — session occurrence management.
- `/admin/session-types` and `/admin/session-types/:id` — reusable session definitions.
- `/admin/availability` — recurring availability rules, date windows, exceptions, and calendar preview.
- `/admin/bookings` and `/admin/bookings/:id` — booking queue, filters, detail, status changes, cancellation reasons, and history.
- `/admin/clients` and `/admin/clients/:id` — client directory, profile, booking history, and account moderation.
- `/admin/reports` — bookings, attendance, capacity, cancellations, and revenue estimates.
- `/admin/settings` — business profile, timezone, booking/cancellation rules, notification defaults, and media settings.
- `/admin/audit-log` — administrative and key user-facing activity history.

Add standard loading, empty, access-denied, not-found, and error states. Preserve the current app's routing conventions if they differ.

## 4. Supabase data model

Use UUID primary keys, `timestamptz` for instants, explicit business timezone settings, foreign keys, check constraints, and indexes for common filters. Keep Supabase `auth.users` as the identity source; do not duplicate passwords or auth tokens.

### Identity, roles, and moderation

1. **`profiles`** — `id` references `auth.users.id`; display name, phone, avatar path, timezone, communication preferences, `account_status` (`active`, `pending_review`, `rejected`, `banned`), `role` (`user`, `client`, `admin`), created/updated timestamps, and moderation metadata (`moderated_at`, `moderated_by`, `moderation_reason`). New signups get `role=user` and `account_status=active`. Promote to `client` on the agreed first-booking event. Keep role and account status separate: a banned account may still have a client history, and rejection/ban must not erase bookings or audit history.
2. **`user_roles` (optional)** — use instead of a single profile role if users may have multiple roles. For the initial product, a protected role field or role table is sufficient; choose one model and enforce it consistently.
3. **`auth_events`** — append-only records for login success, logout request, password recovery, and other useful auth lifecycle events: user ID when known, event type, timestamp, request/correlation ID, and safe metadata such as user-agent. Never store passwords, access/refresh tokens, or raw authentication payloads. Treat logout events as best-effort because a browser can close before reporting logout; use Supabase Auth logs for provider-level diagnostics where available.
4. **`admin_audit_log`** — append-only record of sensitive admin actions: actor, action, target type/ID, timestamp, reason, and redacted before/after fields where appropriate. Do not log secrets or unnecessary client data.

Admin role assignment and moderation must be performed only by a trusted server-side path (Edge Function/RPC with authorization) or a controlled SQL migration. Never allow a user to set their own role or account status through profile updates.

### Session catalog and availability

5. **`session_types`** — reusable definition/template: title, description, duration, default capacity, default price/currency, default location, category, active flag, optional media path, and timestamps.
6. **`sessions`** — bookable occurrence: session type ID, title/description snapshots if needed, `starts_at`, `ends_at`, IANA timezone for display/rule interpretation, `max_slots`, `price_amount`, `currency`, location, status (`draft`, `published`, `cancelled`, `completed`), publication window, cancellation timestamp/reason/actor, and created/updated metadata. Store occurrence price/capacity snapshots so later template edits do not rewrite historical facts.
7. **`availability_rules`** — optional schedule generator: session type, recurrence definition (for example weekday/local start time), effective start/end dates or ongoing flag, local timezone, default capacity/location/price overrides, and active state. Validate recurrence input and define how daylight-saving transitions are resolved.
8. **`availability_exceptions`** — date-specific override for a rule: closed date, changed hours/capacity/location, or added opening. Include reason and actor. A unique rule/date key prevents duplicate exceptions.
9. **`session_audit_log`** — append-only session changes with actor, action, timestamp, and safe before/after snapshots. This preserves title/time/capacity/price changes and cancellations.

Generate concrete `sessions` occurrences from rules through a scheduled Edge Function or an explicit admin action. Make generation idempotent with a unique key derived from rule and occurrence start time. Rules define future availability; occurrences remain the canonical objects clients book.

### Bookings and history

10. **`bookings`** — client ID, session ID, status (`pending`, `confirmed`, `rejected`, `cancelled_by_client`, `cancelled_by_admin`, `waitlisted`, `completed`, `no_show`), booking timestamp, price/currency snapshot, notes, cancellation timestamp/reason/actor, decision timestamp/actor, and timestamps. Add a uniqueness constraint preventing duplicate active bookings for the same client/session. Define active statuses centrally so capacity calculations stay consistent.
11. **`booking_events`** — append-only status and detail history: booking ID, prior/new status, actor, event time, reason, and safe metadata. Insert through server-side booking workflows, not arbitrary client writes.
12. **`attendance_records` (recommended)** — attendance outcome and staff notes for completed sessions. This gives reporting a clear source of truth instead of inferring attendance from booking status alone.
13. **`notifications` (recommended)** — in-app message records with recipient, type, related booking/session, read timestamp, and delivery metadata. Email delivery can be layered onto this later.

Store cancellation reason and datetime on the current booking/session row for convenient display, and also write the change to the corresponding event/audit log so history is not lost when the row changes again.

### Media and settings

14. **Supabase Storage buckets** — public bucket for approved landing/session imagery if public delivery is intended; private bucket for client-only files. Use generated paths, restrictive upload types/size limits, and signed URLs for private media. Do not put sensitive client documents in a public bucket.
15. **`business_settings`** — one protected settings row for business name/contact, IANA timezone, default currency, booking approval mode, cancellation cutoff, and notification defaults. Store provider secrets only in Supabase secrets, never in this table or the frontend.

## 5. Security and backend behavior

1. Enable Row Level Security on every exposed table. Start with deny-by-default policies.
2. Clients may read/update only their allowed profile fields, read public published sessions, create bookings for themselves through the booking operation, and read/cancel only their own eligible bookings.
3. Admin access is based on a trusted role lookup, not user-editable metadata. Protect admin routes in the UI and repeat authorization in every server-side operation.
4. Use database constraints and a transactional RPC/Edge Function for booking creation. The operation must re-check session status, booking window, account status, duplicate booking, and capacity atomically to prevent overbooking under concurrent requests.
5. Centralize booking status transitions and allowed transition rules. Require a reason for admin rejection/cancellation and client cancellation where configured.
6. Ban/reject behavior: block new booking/authenticated actions according to policy, revoke active sessions where feasible, retain audit and booking history, and provide an admin-only unban/restore path. Avoid hard-deleting users with business history.
7. Add rate limits or abuse controls for signup, password recovery, and booking endpoints. Configure Supabase Auth email verification and redirect URLs for local, preview, and production environments.
8. Keep service-role keys and third-party credentials server-side. Validate all Edge Function input and return user-safe errors.
9. Keep retention rules for auth and audit logs configurable; collect only data needed to operate and investigate the service.

## 6. Booking and account workflows

### Signup and first booking

1. User signs up; Supabase creates the identity and a trusted trigger creates `profiles(role=user, account_status=active)`.
2. Email verification and profile completion happen according to the chosen auth settings.
3. User browses published sessions without needing an admin dashboard account.
4. On first successful booking creation, the booking RPC/Edge Function checks eligibility and capacity, creates the booking plus `booking_events`, and promotes `role` from `user` to `client` in the same transaction or a reliable server-side follow-up. Repeated booking requests must not duplicate the promotion or booking.
5. Subsequent sessions appear in the client dashboard. A failed or abandoned booking leaves the user role as `user`.

### Admin booking management

1. Admin filters bookings by date, session, status, and client.
2. Admin opens a full booking detail page, reviews profile/history, and confirms, rejects, cancels, or completes the booking as allowed.
3. Every transition writes a booking event and admin audit event; notifications are queued after the database transaction succeeds.
4. Capacity changes and session cancellations recalculate availability; affected clients receive clear notifications and retained history.

### Availability lifecycle

1. Admin creates a one-time session or an availability rule with a defined date range or ongoing end condition.
2. Admin previews generated occurrences, edits exceptions, then publishes.
3. A scheduled generator creates upcoming occurrences idempotently within a rolling horizon; cancelled or manually edited occurrences are not silently overwritten by regeneration.
4. Expired rules stop generating sessions. Published occurrences remain available or hidden according to their own status and booking cutoff.

## 7. Dashboards, reporting, and UI/UX

### Admin dashboard

- Summary cards: bookings today/upcoming, pending approvals, capacity utilization, cancellations, and attendance.
- Action queue for bookings requiring a decision and sessions with low capacity or schedule conflicts.
- Date-range and timezone-aware reporting filters.

### Client dashboard

- Next booking, session location/time, status, and clear cancellation or rescheduling guidance.
- Upcoming/past booking lists, empty states, and a visible path to discover sessions.

### Reporting

- Booking counts by status and period; attendance/no-show rates; session utilization; cancellation rate and reasons; new users converted to clients; and offline revenue estimates from booked/completed session price snapshots.
- Label money metrics as recorded/estimated because payment is offline and no payment verification exists.
- Use indexed queries or protected aggregate views/RPCs; expose only aggregated information to admins who need it.

### Interaction patterns

- Use persistent left sidebars for admin/client areas, with active route state and compact mobile navigation.
- Give sessions, bookings, clients, availability, and settings their own pages with breadcrumbs and clear page titles.
- Use modals for destructive-action confirmation and small, focused edits only. Use full pages for multi-field forms and user-specific detail.
- Show screen toasts at the top-left, with success/error/info variants, readable text, timeout plus dismiss control, and accessible announcements.
- Include loading skeletons, empty states with a next action, inline validation, disabled/loading submit states, and clear permission/error states.
- Support keyboard navigation, visible focus, semantic forms, contrast, responsive layouts, and non-color status labels.

### Branding guide derived from the landing page

During discovery, document the existing page's actual values and create reusable design tokens for:

- Brand and accent colors, neutral/background/surface colors, borders, and semantic success/warning/error states.
- Font families, heading/body scale, weights, line heights, and link treatment.
- Spacing scale, content widths, sidebar dimensions, radii, shadows, and button/input heights.
- Existing photography/illustration treatment, icon family, and motion style.

Preserve the landing page's visual identity across dashboards. Reuse existing components where available; add tokens and components instead of copying one-off styles. Do not guess brand colors until the real landing page source is available.

## 8. Step-by-step implementation sequence

### Phase 0 — Bring the actual app into the workspace

1. Identify the correct source repository/branch and populate the workspace.
2. Confirm the app runs locally using its existing setup instructions.
3. Inventory existing pages, state management, styling, environment variables, and any persisted sample data.
4. Record current route and component conventions; note baseline visual screenshots of landing and booking flow.
5. Resolve the open product decisions in Sections 2 and 10 before locking workflow rules.

**Deliverable:** codebase map, route inventory, branding notes, and confirmed decisions.

### Phase 1 — Supabase foundation

1. Create or select Supabase projects for development and production; document environment setup.
2. Configure Auth providers, email verification, redirect URLs, and local/preview/production callback URLs.
3. Add versioned SQL migrations for enums/check constraints, core tables, foreign keys, indexes, triggers, and seed data.
4. Add profile creation on signup and protected role-management operations.
5. Enable RLS on all tables and write explicit policies for anonymous, user, client, and admin access.
6. Configure storage buckets, file policies, Edge Function secrets, and database backups/retention.

**Deliverable:** repeatable Supabase schema and secure development environment.

### Phase 2 — Authentication and profiles

1. Implement signup, login, logout, email verification, password reset, and auth callback flows using the existing frontend conventions.
2. Add profile viewing/editing with a server-side allowlist of editable fields.
3. Add account status handling for active, pending review, rejected, and banned states.
4. Record safe auth lifecycle events and add an admin-only account moderation path with reason and audit history.
5. Add role-based route guards for public, client, and admin pages, backed by server-side authorization.

**Deliverable:** functional account system with protected profiles and admin access.

### Phase 3 — Session catalog and availability

1. Implement session type CRUD for admins.
2. Implement one-time session CRUD with capacity, price, currency, location, time, publication, and cancellation fields.
3. Implement availability rules and exceptions with timezone-aware preview and recurrence validation.
4. Add idempotent occurrence generation and conflict checks.
5. Implement public session list/detail pages and admin calendar/list pages.
6. Add session audit history and safe media upload/display.

**Deliverable:** admins can publish bookable sessions and users can browse accurate availability.

### Phase 4 — Booking engine and client dashboard

1. Implement atomic booking creation with eligibility, duplicate, cutoff, and capacity checks.
2. Implement status transitions, cancellation reasons/timestamps, booking events, and first-booking role promotion.
3. Implement waitlist only if confirmed as an initial requirement; otherwise keep the status/model option documented for a later phase.
4. Build client dashboard, booking list, detail, cancellation flow, and profile access.
5. Build admin booking queue/detail and client history views.
6. Add notification records and email notifications for booking created/confirmed/rejected/cancelled; use an outbox/retry approach so email failure does not roll back a valid booking.

**Deliverable:** end-to-end booking lifecycle with capacity protection and history.

### Phase 5 — Admin dashboard, reports, and settings

1. Build admin dashboard with action queues and operational summaries.
2. Add indexed report queries or secured aggregate views for bookings, capacity, attendance, cancellations, and estimates.
3. Add attendance management and completion/no-show transitions.
4. Build business settings for timezone, currency, booking approval, cancellation policy, and communication defaults.
5. Build audit-log search/filtering with safe detail display.

**Deliverable:** usable administrative control plane and traceable reporting.

### Phase 6 — Visual integration and release readiness

1. Apply design tokens derived from the existing landing page to auth and dashboard pages.
2. Check responsive sidebars, tables, calendars, forms, toast placement, and long/empty/error states.
3. Review accessibility and permission/error messaging.
4. Review RLS policies, booking concurrency behavior, storage access, secrets, and moderation paths.
5. Prepare migration/seed instructions, environment variable documentation, and deployment configuration.
6. Roll out in stages: schema and auth first, then sessions, then booking workflows, then reports; preserve the existing landing page throughout.

**Deliverable:** coherent release with operational runbook and a path to add Stripe later.

## 9. Suggested acceptance criteria

- A new signup gets a profile with `role=user`; without a successful booking it remains a user.
- The first successful booking creates exactly one booking/history event and promotes the account to `client` according to the agreed policy.
- Concurrent attempts cannot exceed session capacity or create duplicate active bookings.
- Clients can access only their profile and bookings; admins can manage resources only through verified admin authorization.
- A user cannot grant themselves a role, unban themselves, or alter booking/session audit history.
- Admin session and booking edits retain actor, timestamp, and cancellation/rejection reason where applicable.
- Availability rules generate the correct sessions across timezone and daylight-saving boundaries, without duplicate occurrences.
- Reports use stored session/booking snapshots and label offline revenue as an estimate.
- Dashboard pages use the existing brand system, sidebars, accessible top-left toasts, and responsive empty/loading/error states.
- No payment collection or Stripe dependency is introduced in this phase.

## 10. Decisions to confirm before implementation

1. Which source repository/branch contains the current app? The current workspace and connected GitHub repository did not contain the app source at planning time.
2. Does first booking mean booking requested, admin-confirmed, or first attended session for role promotion?
3. Should bookings be instantly confirmed or require admin approval? Should a waitlist be included in the first release?
4. What are the cancellation/rescheduling cutoff and refund/offline-payment policies to display? No online payment will be processed.
5. Which timezone and currency should be defaults, and can sessions use more than one location?
6. Which notification channels are required for the first release (email only, in-app, or both), and which provider is already configured?
7. What privacy/retention period should apply to login and audit history?
8. What is the visual reference URL or source branch for the landing page, so the brand tokens can be extracted accurately?

## 11. Later enhancements (outside initial scope)

- Stripe Checkout, payment status, refunds, invoices, and webhook-driven reconciliation.
- Automated waitlist promotion, calendar invitations, and richer rescheduling flows.
- Trainer/team accounts, multiple staff calendars, and role-specific permissions beyond a single admin role.
- Client progress notes, workout plans, and secure document uploads.
- Analytics exports and recurring operational email reports.

## 12. Implementation update — admin workspace preview

The first runnable portfolio implementation now includes the core admin and client workspace surfaces. Use the current app routes as the source of truth; planned routes above that do not exist yet remain future work.

- Admin navigation is a persistent sidebar on desktop and a horizontally scrollable navigation row on small screens, with breadcrumbs on admin pages.
- `/admin` shows period-filtered summary cards, common quick actions, and recent bookings.
- `/admin/sessions` supports creating, editing, publishing/cancelling, and deleting sessions when no booking history exists; `/admin/sessions/categories` manages session categories/types and defaults.
- `/admin/calendar` shows month navigation, session capacity, and booking attendees by day.
- `/admin/bookings` supports creating a booking for a client, searching/filtering records, and updating booking status. Database RPC checks capacity atomically and records booking/audit events.
- `/admin/clients` supports searching/filtering people, viewing booking history, editing name/phone, and changing role/account access with an audit reason.
- `/admin/settings` shows the initial studio defaults. User profile and booking pages remain available through role-aware navigation.
- In-app booking notifications are persisted and can be enabled as live Realtime updates. Browser desktop alerts are optional and require the user's consent.

### Brand implementation notes

Continue to follow the existing Northform landing page rather than introducing a second visual identity. Keep the warm off-white surfaces, deep green ink, muted sage accents, fine gray-green borders, rounded cards, compact uppercase eyebrow labels, and restrained motion already used by the landing page. The admin area reuses these colors and the same profile dropdown/header. Use lucide icons, consistent button hierarchy, and top-left toast placement. On small screens, preserve access to profile/dashboard/admin navigation and let wide data tables scroll horizontally. Use dialogs for confirmation and compact edits; keep primary workflows on dedicated pages. Avoid skeleton loaders for this phase; favor stable empty states and native short loading feedback while data requests are pending.

### Implemented now / next

- [x] Responsive admin sidebar, header profile access, role-aware Dashboard/Admin menu entries, and breadcrumbs.
- [x] Session and session-type create/read/update/delete flows with history-preserving deletion constraints.
- [x] Booking create/status management, capacity-safe admin booking RPC, in-app notifications, and notification audit trail.
- [x] Client search, profile details, booking history, and audited role/account moderation.
- [x] Calendar, dashboard period filter, quick actions, responsive table/filter states.
- [ ] Recurring availability rules and exception management; the current calendar displays concrete session instances.
- [ ] Reporting exports, editable studio settings, email notifications, and storage/media policy UI.
- [ ] Full browser/device accessibility review and deployment smoke check after publishing.
