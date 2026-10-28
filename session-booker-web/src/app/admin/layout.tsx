import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { AdminSidebar } from "@/components/admin-sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Fadmin");
  const { data: profile } = await supabase.from("profiles").select("role,account_status").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin" || profile.account_status !== "active") redirect("/client");
  return <main className="page-shell"><SiteHeader /><div className="dashboard-frame"><AdminSidebar /><section className="dashboard-main">{children}</section></div></main>;
}
