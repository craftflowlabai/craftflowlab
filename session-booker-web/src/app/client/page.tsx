import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, LayoutDashboard, UserRound } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import { formatSessionDate } from "@/lib/format";
import { CancelBookingButton } from "@/components/cancel-booking-button";

export default async function ClientDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Fclient");
  const { data: profile } = await supabase.from("profiles").select("full_name, role, account_status").eq("id", user.id).maybeSingle();
  if (profile?.role === "admin") redirect("/admin");
  if (profile?.account_status !== "active") redirect("/profile");
  const { data: bookings } = await supabase.from("bookings").select("id,status,booked_at,price_snapshot,currency,sessions(id,title,starts_at,ends_at,location)").eq("user_id", user.id).order("booked_at", { ascending: false });
  const rows = bookings || [];
  const upcoming = rows.filter(b => ["pending", "confirmed"].includes(b.status));
  return <main className="page-shell"><SiteHeader /><div className="dashboard-frame"><aside className="dashboard-sidebar"><span className="sidebar-label">YOUR SPACE</span><Link className="side-link active" href="/client"><LayoutDashboard /> Overview</Link><Link className="side-link" href="/sessions"><CalendarDays /> Book a session</Link><Link className="side-link" href="/profile"><UserRound /> Profile</Link><span className="sidebar-bottom">NORTHFORM · SOFIA</span></aside><section className="dashboard-main"><div className="dashboard-top"><div><span className="eyebrow">Your training</span><h1 className="page-title">Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : " back"}.</h1><p className="page-intro">Keep your momentum going, one session at a time.</p></div><Link className="button button-moss" href="/sessions">Explore sessions</Link></div><div className="stats-grid"><div className="stat-card"><span>UPCOMING BOOKINGS</span><strong>{upcoming.length}</strong><small>Your next steps are right here.</small></div><div className="stat-card"><span>ACCOUNT</span><strong className="stat-word">{profile?.role === "client" ? "Client" : "Member"}</strong><small>Profile details are always editable.</small></div><div className="stat-card"><span>TRAINING AT</span><strong className="stat-word">Studio North</strong><small>Sofia · Personal coaching</small></div></div><section className="panel table-panel"><div className="dashboard-top"><div><h2 className="panel-heading">Your bookings</h2><p className="hint">Manage upcoming sessions and review your history.</p></div></div>{rows.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Session</th><th>Date</th><th>Location</th><th>Price</th><th>Status</th><th></th></tr></thead><tbody>{rows.map((b: any) => { const s = Array.isArray(b.sessions) ? b.sessions[0] : b.sessions; return <tr key={b.id}><td><strong>{s?.title || "Session"}</strong></td><td>{s?.starts_at ? formatSessionDate(s.starts_at) : "—"}</td><td>{s?.location || "—"}</td><td>{Number(b.price_snapshot).toFixed(0)} {b.currency}</td><td><span className={`status-pill ${b.status}`}>{b.status}</span></td><td>{["pending", "confirmed"].includes(b.status) && s?.starts_at && new Date(s.starts_at) > new Date() ? <CancelBookingButton bookingId={b.id} /> : ""}</td></tr>; })}</tbody></table></div> : <div className="empty-state"><h3>Your first session is waiting.</h3><p>Browse upcoming coaching sessions and book a spot online.</p><Link className="button button-moss" href="/sessions">Browse sessions</Link></div>}</section></section></div></main>;
}
