import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const authorization = request.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!authorization?.startsWith("Bearer ") || !supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: "Authentication or server configuration is missing." }, 401);
  }

  const token = authorization.slice("Bearer ".length);
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: authError } = await authClient.auth.getUser(token);
  if (authError || !user) return json({ error: "Sign in again to continue." }, 401);

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: actor, error: actorError } = await adminClient
    .from("profiles").select("role,account_status").eq("id", user.id).maybeSingle();
  if (actorError || actor?.role !== "admin" || actor.account_status !== "active") {
    return json({ error: "Active admin access is required." }, 403);
  }

  let input: { email?: unknown; full_name?: unknown; phone?: unknown };
  try { input = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const fullName = typeof input.full_name === "string" ? input.full_name.trim().slice(0, 80) : "";
  const phone = typeof input.phone === "string" ? input.phone.trim().slice(0, 32) : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !fullName) {
    return json({ error: "Enter a valid email address and full name." }, 400);
  }

  const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
  });
  if (inviteError || !invited.user) {
    return json({ error: inviteError?.message || "Could not send the invitation." }, 400);
  }

  const { error: profileError } = await adminClient.from("profiles").upsert({
    id: invited.user.id,
    full_name: fullName,
    phone: phone || null,
    role: "user",
    account_status: "active",
  }, { onConflict: "id" });
  if (profileError) return json({ error: "Invitation was sent, but the profile could not be prepared. Contact the admin." }, 500);
  await adminClient.from("admin_audit_log").insert({
    actor_id: user.id,
    action: "client_invited",
    target_type: "profile",
    target_id: invited.user.id,
    reason: "Admin invited a new client to the portfolio booking app.",
    details: { email, full_name: fullName },
  });

  return json({ user_id: invited.user.id, message: "Invitation sent. The account will keep the user role until the first booking." }, 201);
});

