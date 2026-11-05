import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarClock, Headset, MessageCircleMore, Settings2, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role,account_status").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin" || profile.account_status !== "active") redirect("/");
  return <div className="product-shell workspace-shell"><aside className="product-sidebar"><Link className="product-logo" href="/"><span className="product-logo-mark"><Sparkles /></span><span>reception<span className="logo-ai">.ai</span><small>CLIENT EXPERIENCE</small></span></Link><span className="sidebar-label">РАБОТНО МЯСТО</span><Link className="product-nav" href="/"><MessageCircleMore /> Асистент</Link><Link className="product-nav" href="/workspace"><CalendarClock /> Преглед</Link><Link className="product-nav active" href="/workspace/inbox"><Headset /> Запитвания</Link><div className="sidebar-spacer" /><div className="workspace-card"><span className="workspace-avatar">{(user.email || "SN").slice(0, 2).toUpperCase()}</span><div><strong>Администратор</strong><small>{user.email}</small></div><Settings2 /></div><Link className="sidebar-footnote" href="/">КЪМ ДЕМОТО ↗</Link></aside><main className="product-main"><header className="product-topbar"><div className="breadcrumbs"><span>Работно табло</span><span>/</span><strong>Екип</strong></div><span className="online-pill"><i /> ЗАЩИТЕН ДОСТЪП</span></header>{children}</main></div>;
}
