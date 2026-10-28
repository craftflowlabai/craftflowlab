import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ProfileForm } from "@/app/profile/profile-form";
import { getAvatarUrl } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Fprofile");
  const { data: profile } = await supabase.from("profiles").select("full_name, phone, avatar_path, role, account_status, created_at").eq("id", user.id).maybeSingle();
  const role = profile?.role || "user";
  return (
    <main className="page-shell"><SiteHeader /><section className="content-page">
      <Link className="text-link" href="/" style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><ArrowLeft aria-hidden="true" style={{ width: 15 }} /> Back to home</Link>
      <div style={{ marginTop: 28 }}><span className="eyebrow">Your account</span><h1 className="page-title">Profile</h1><p className="page-intro">Keep your details up to date. Your profile works the same way across your account, whatever your role.</p></div>
      <ProfileForm userId={user.id} email={user.email || ""} initialName={profile?.full_name || user.user_metadata?.full_name || ""} initialPhone={profile?.phone || ""} initialAvatarUrl={getAvatarUrl(profile?.avatar_path)} />
      <div className="profile-status-row"><div><span className="hint">ACCOUNT ROLE</span><div style={{ marginTop: 7 }}><span className="role-pill">{role}</span></div></div><div><span className="hint">ACCOUNT STATUS</span><div style={{ marginTop: 7 }}><span className="status-pill">{profile?.account_status || "active"}</span></div></div><div className="profile-next"><Link className="text-link" href={role === "admin" ? "/admin" : "/client"}>{role === "admin" ? "Open admin area" : "Open my bookings"} →</Link></div></div>
    </section></main>
  );
}

