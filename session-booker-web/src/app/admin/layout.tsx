import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, LayoutDashboard, Settings, Users, ClipboardList } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Fadmin");
  const { data: profile } = await supabase.from("profiles").select("role,account_status").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin" || profile.account_status !== "active") redirect("/client");
  return <main className="page-shell"><SiteHeader /><div className="dashboard-frame"><aside className="dashboard-sidebar"><span className="sidebar-label">ADMINISTRATION</span><Link className="side-link" href="/admin"><LayoutDashboard /> Overview</Link><Link className="side-link" href="/admin/sessions"><CalendarDays /> Sessions</Link><Link className="side-link" href="/admin/bookings"><ClipboardList /> Bookings</Link><Link className="side-link" href="/admin/clients"><Users /> Clients</Link><Link className="side-link" href="/admin/settings"><Settings /> Settings</Link><span className="sidebar-bottom">NORTHFORM · ADMIN</span></aside><section className="dashboard-main">{children}</section></div></main>;
}
