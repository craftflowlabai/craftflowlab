import { AdminSessionForm } from "@/components/admin-session-form";
import { AdminSessionStatus } from "@/components/admin-session-status";
import { createClient } from "@/lib/supabase/server";
import { formatSessionDate } from "@/lib/format";

export default async function AdminSessionsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("sessions").select("id,title,starts_at,ends_at,max_slots,booked_slots,price,currency,location,status").order("starts_at", { ascending: false }).limit(50);
  return <><div className="dashboard-top"><div><span className="eyebrow">Availability</span><h1 className="page-title">Sessions.</h1><p className="page-intro">Publish upcoming coaching times and track capacity.</p></div></div><AdminSessionForm /><section className="panel table-panel" style={{ marginTop: 20 }}><h2 className="panel-heading">All sessions</h2><div className="table-wrap"><table className="data-table"><thead><tr><th>Session</th><th>Date</th><th>Location</th><th>Capacity</th><th>Price</th><th>Status</th><th>Manage</th></tr></thead><tbody>{(data || []).map(s => <tr key={s.id}><td><strong>{s.title}</strong></td><td>{formatSessionDate(s.starts_at)}</td><td>{s.location}</td><td>{s.booked_slots}/{s.max_slots}</td><td>{Number(s.price).toFixed(0)} {s.currency}</td><td><span className={`status-pill ${s.status}`}>{s.status}</span></td><td><AdminSessionStatus id={s.id} status={s.status} /></td></tr>)}</tbody></table>{!data?.length && <p className="empty-inline">No sessions have been created yet.</p>}</div></section></>;
}
