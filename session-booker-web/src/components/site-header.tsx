import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Brand } from "@/components/brand";
import { UserMenu } from "@/components/user-menu";
import { MobileMenu } from "@/components/mobile-menu";
import { NotificationCenter, type NotificationRow } from "@/components/notification-center";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let profile: { full_name: string | null; avatar_path: string | null; role: string } | null = null;
  let notifications: NotificationRow[] = [];
  if (user) {
    const { data } = await supabase.from("profiles").select("full_name, avatar_path, role").eq("id", user.id).maybeSingle();
    profile = data;
    const { data: notificationRows } = await supabase.from("notifications").select("id,recipient_id,notification_type,title,message,href,read_at,created_at").eq("recipient_id", user.id).order("created_at", { ascending: false }).limit(15);
    notifications = (notificationRows || []) as NotificationRow[];
  }
  return (
    <header className="site-header">
      <Brand />
      <nav className="header-links" aria-label="Main navigation"><Link href="/sessions">Sessions</Link><a href="/#approach">Approach</a><a href="/#studio">The studio</a></nav>
      <div className="header-actions">
        {user ? <><NotificationCenter userId={user.id} initialItems={notifications} /><UserMenu name={profile?.full_name || null} email={user.email || ""} avatarPath={profile?.avatar_path || null} role={profile?.role || "user"} /></> : <><Link className="text-link desktop-login" href="/login">Log in</Link><Link className="button desktop-book" href="/sessions">Book a session <ArrowUpRight aria-hidden="true" /></Link></>}
        <MobileMenu role={profile?.role || null} />
      </div>
    </header>
  );
}
