import { createClient } from "@/lib/supabase/server";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { AdminBookingsTable } from "@/components/admin-bookings-table";
import { AdminBookingCreateForm } from "@/components/admin-booking-create-form";

export default async function AdminBookingsPage() {
  const supabase = await createClient();
  const [{ data: bookings }, { data: clients }, { data: sessions }] = await Promise.all([
    supabase.from("bookings").select("id,status,booked_at,price_snapshot,currency,profiles(full_name),sessions(title,starts_at,location)").order("booked_at", { ascending: false }).limit(500),
    supabase.from("profiles").select("id,full_name").in("role", ["client", "user"]).eq("account_status", "active").order("full_name"),
    supabase.from("sessions").select("id,title,starts_at,booked_slots,max_slots").eq("status", "published").gt("starts_at", new Date().toISOString()).order("starts_at").limit(100),
  ]);
  return <><Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Bookings" }]} /><div className="dashboard-top"><div><span className="eyebrow">Client activity</span><h1 className="page-title">Bookings.</h1><p className="page-intro">Create and manage appointments, with a preserved status history.</p></div></div><AdminBookingCreateForm clients={clients || []} sessions={sessions || []} /><div style={{ height: 20 }} /><AdminBookingsTable bookings={(bookings || []) as any} /></>;
}
