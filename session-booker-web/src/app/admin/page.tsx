import Link from "next/link";
import { ArrowRight, CalendarDays, ClipboardList, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const [{ count: sessionCount }, { count: bookingCount }, { count: clientCount }] = await Promise.all([
    supabase.from("sessions").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("bookings").select("id", { count: "exact", head: true }).in("status", ["pending", "confirmed"]),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "client"),
  ]);
  return <><div className="dashboard-top"><div><span className="eyebrow">Studio management</span><h1 className="page-title">Your dashboard.</h1><p className="page-intro">A clear view of what’s happening at Studio North.</p></div><Link className="button button-moss" href="/admin/sessions">Add a session <ArrowRight /></Link></div><div className="stats-grid"><Link href="/admin/sessions" className="stat-card"><span><CalendarDays /> PUBLISHED SESSIONS</span><strong>{sessionCount ?? 0}</strong><small>View and publish session times.</small></Link><Link href="/admin/bookings" className="stat-card"><span><ClipboardList /> ACTIVE BOOKINGS</span><strong>{bookingCount ?? 0}</strong><small>Manage client reservations.</small></Link><Link href="/admin/clients" className="stat-card"><span><Users /> CLIENTS</span><strong>{clientCount ?? 0}</strong><small>Review client accounts.</small></Link></div><section className="panel table-panel"><h2 className="panel-heading">Quick actions</h2><div className="quick-actions"><Link className="quick-action" href="/admin/sessions"><CalendarDays /><span><strong>Manage sessions</strong><small>Create or update availability</small></span><ArrowRight /></Link><Link className="quick-action" href="/admin/bookings"><ClipboardList /><span><strong>Review bookings</strong><small>See the latest client activity</small></span><ArrowRight /></Link></div></section></>;
}
