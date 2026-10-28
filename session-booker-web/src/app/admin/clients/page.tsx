import { createClient } from "@/lib/supabase/server";
import { AdminClientTable } from "@/components/admin-client-table";
import { Breadcrumbs } from "@/components/breadcrumbs";

export default async function AdminClientsPage() {
  const supabase = await createClient();
  const [{ data: clients }, { data: bookings }] = await Promise.all([
    supabase.from("profiles").select("id,full_name,phone,role,account_status,created_at").in("role", ["client", "user"]).order("created_at", { ascending: false }).limit(500),
    supabase.from("bookings").select("id,user_id,status,price_snapshot,currency,sessions(title,starts_at)").order("booked_at", { ascending: false }).limit(1000),
  ]);
  return <><Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Clients" }]} /><div className="dashboard-top"><div><span className="eyebrow">People</span><h1 className="page-title">Clients.</h1><p className="page-intro">Search member profiles, review booking history, edit details, and manage roles or access.</p></div></div><AdminClientTable clients={clients || []} bookings={(bookings || []) as any} /></>;
}
