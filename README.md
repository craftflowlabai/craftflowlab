# Session Booker Pro

A portfolio demo for a personal training studio: public session discovery, Supabase Auth, editable member profiles, booking management, and role-scoped admin dashboards. It uses Supabase for Postgres, authentication, row-level security, and avatar storage; Vercel hosts the Next.js app. Payments are offline only.

## Run locally

1. Install Node.js 24 or newer.
2. Open `session-booker-web` and run `npm ci`.
3. Copy `.env.example` to `.env.local` and add the Supabase project URL and publishable key.
4. Run `npm run dev` inside `session-booker-web`.

The database migration is in `supabase/migrations`. It has already been applied to the connected Supabase project. Three sample sessions are seeded for the portfolio demo.

## First admin account

Sign up through the app first, then in the Supabase SQL Editor promote that account by email:

```sql
update public.profiles p
set role = 'admin'
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('YOUR_SIGNUP_EMAIL');
```

Replace the email with the account you created. The demo never allows a user to promote their own account from the website.

## Routes

- `/` — studio landing page and upcoming sessions
- `/signup`, `/login` — account creation and sign-in
- `/profile` — editable account details and profile photo
- `/sessions` — upcoming sessions and booking
- `/client` — personal bookings and cancellation
- `/admin` — studio dashboard
- `/admin/sessions`, `/admin/bookings`, `/admin/clients`, `/admin/settings` — admin tools

## Security and limits

Public and signed-in access is enforced by Supabase RLS. Booking and cancellation go through database functions that check account state and capacity atomically. Role changes are limited to the admin function, and the service-role secret is not used in the browser. This is a learning/portfolio demo, not a production booking service; it does not take payments or send transactional email.
