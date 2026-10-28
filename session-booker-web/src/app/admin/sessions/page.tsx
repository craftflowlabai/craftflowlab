import { AdminSessionForm } from "@/components/admin-session-form";
import { AdminSessionStatus } from "@/components/admin-session-status";
import { createClient } from "@/lib/supabase/server";
import { formatSessionDate } from "@/lib/format";
import Link from "next/link";
import { ArrowRight, CalendarDays, Tags } from "lucide-react";
import { AdminSessionEditor } from "@/components/admin-session-editor";
import { Breadcrumbs } from "@/components/breadcrumbs";

export default async function AdminSessionsPage() {
  const supabase = await createClient();
  const [{ data }, { data: types }] = await Promise.all([
    supabase.from("sessions").select("id,session_type_id,title,description,starts_at,ends_at,max_slots,booked_slots,price,currency,location,status").order("starts_at", { ascending: false }).limit(100),
    supabase.from("session_types").select("id,title,duration_minutes,default_capacity,default_price").eq("is_active", true).order("title"),
  ]);
  return <><Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Sessions" }]} /><div className="dashboard-top"><div><span className="eyebrow">Availability</span><h1 className="page-title">Sessions.</h1><p className="page-intro">Create, edit, publish, cancel, and review bookable sessions.</p></div><div className="header-actions"><Link className="button button-light" href="/admin/sessions/categories"><Tags /> Categories</Link><Link className="button button-light" href="/admin/calendar"><CalendarDays /> Calendar</Link></div></div><AdminSessionForm types={types || []} /><section className="panel table-panel" style={{ marginTop: 20 }}><h2 className="panel-heading">All sessions</h2><div className="table-wrap"><table className="data-table"><thead><tr><th>Session</th><th>Date</th><th>Location</th><th>Capacity</th><th>Price</th><th>Status</th><th>Manage</th></tr></thead><tbody>{(data || []).map(s => <tr key={s.id}><td><strong>{s.title}</strong><small className="table-subtitle">{s.description}</small></td><td>{formatSessionDate(s.starts_at)}</td><td>{s.location}</td><td>{s.booked_slots}/{s.max_slots}</td><td>{Number(s.price).toFixed(0)} {s.currency}</td><td><span className={`status-pill ${s.status}`}>{s.status}</span></td><td><div className="row-actions"><AdminSessionStatus id={s.id} status={s.status} /><AdminSessionEditor session={s} types={types || []} /></div></td></tr>)}</tbody></table>{!data?.length && <p className="empty-inline">No sessions have been created yet.</p>}</div></section></>;
}
