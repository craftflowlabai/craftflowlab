import { createClient } from "@/lib/supabase/server";
import { formatSessionDate } from "@/lib/format";
import { AdminBookingStatus } from "@/components/admin-booking-status";

export default async function AdminBookingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("bookings").select("id,status,booked_at,price_snapshot,currency,profiles(full_name),sessions(title,starts_at,location)").order("booked_at", { ascending: false }).limit(100);
  return <><div className="dashboard-top"><div><span className="eyebrow">Client activity</span><h1 className="page-title">Bookings.</h1><p className="page-intro">Recent reservations and booking history.</p></div></div><section className="panel table-panel"><div className="table-wrap"><table className="data-table"><thead><tr><th>Client</th><th>Session</th><th>Date</th><th>Location</th><th>Price</th><th>Status</th><th>Manage</th></tr></thead><tbody>{(data || []).map((b: any) => { const s = Array.isArray(b.sessions) ? b.sessions[0] : b.sessions; const p = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles; return <tr key={b.id}><td><strong>{p?.full_name || "Member"}</strong></td><td>{s?.title || "Session"}</td><td>{s?.starts_at ? formatSessionDate(s.starts_at) : "—"}</td><td>{s?.location || "—"}</td><td>{Number(b.price_snapshot).toFixed(0)} {b.currency}</td><td><span className={`status-pill ${b.status}`}>{b.status}</span></td><td><AdminBookingStatus id={b.id} status={b.status} /></td></tr>; })}</tbody></table>{!data?.length && <p className="empty-inline">No bookings yet.</p>}</div></section></>;
}
