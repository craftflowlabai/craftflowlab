# Reception AI

Standalone product application for a 24/7 virtual receptionist. It contains the customer chat, live service and availability tools, guest booking and human handoff APIs, plus a role-protected team workspace.

## Local development

1. Use Node.js 24 or later.
2. Run `npm install` in this folder.
3. Copy `.env.example` to `.env.local` and set the public Supabase URL and publishable key. A local `.env.local` is already prepared from the existing workspace's **public** Supabase settings.
4. Set `AI_GATEWAY_API_KEY` for local AI chat. Keep the key in `.env.local` or a secret manager; never commit it.
5. Run `npm run dev` and open `http://localhost:3000`.

The app uses the current demo database and its `sessions`, `session_types`, `guest_bookings`, and `receptionist_handoffs` tables. The guest-booking migrations live in `../supabase/migrations` and have already been applied to that database.

## Routes

- `/` — product workspace and interactive customer-facing assistant
- `/login` — team sign-in
- `/workspace` — protected operational overview
- `/workspace/inbox` — protected guest-booking and human-handoff inbox
- `/api/receptionist/chat` — AI Gateway conversation and catalog/calendar tools
- `/api/receptionist/book` — guest appointment booking
- `/api/receptionist/handoff` — transfer a request to the team

Admin routes require a signed-in Supabase user with an active `admin` profile. The public chat never receives privileged database credentials. Email and SMS reminders are not configured yet; the demo only confirms bookings in chat and sends the existing internal team notification.

## Deploy

Create a separate Vercel project with this folder as its root directory. Configure the two public Supabase environment variables and enable Vercel AI Gateway authentication for the deployment. Add the custom domain only after the app deployment is ready. Do not point the apex `craftflowlab.com` here; it hosts the portfolio website.
