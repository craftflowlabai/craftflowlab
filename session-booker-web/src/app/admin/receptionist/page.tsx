import { createClient } from "@/lib/supabase/server";
import { formatSessionDate } from "@/lib/format";
import { Breadcrumbs } from "@/components/breadcrumbs";

type GuestBooking = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  status: string;
  booked_at: string;
  price_snapshot: number | string;
  currency: string;
  sessions: { title: string; starts_at: string; location: string } | { title: string; starts_at: string; location: string }[] | null;
};
type Handoff = { id: string; full_name: string; phone: string; email: string | null; message: string; status: string; created_at: string };

function sessionFor(booking: GuestBooking) {
  return Array.isArray(booking.sessions) ? booking.sessions[0] : booking.sessions;
}

export default async function AdminReceptionistPage() {
  const supabase = await createClient();
  const [{ data: bookings }, { data: handoffs }] = await Promise.all([
    supabase.from("guest_bookings").select("id,full_name,phone,email,status,booked_at,price_snapshot,currency,sessions(title,starts_at,location)").order("booked_at", { ascending: false }).limit(200),
    supabase.from("receptionist_handoffs").select("id,full_name,phone,email,message,status,created_at").order("created_at", { ascending: false }).limit(200),
  ]);
  const guestBookings = (bookings || []) as GuestBooking[];
  const visitorRequests = (handoffs || []) as Handoff[];

  return <>
    <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "AI Receptionist" }]} />
    <div className="dashboard-top"><div><span className="eyebrow">AI Receptionist</span><h1 className="page-title">Visitor inbox.</h1><p className="page-intro">Guest bookings and requests that the assistant passed to the team.</p></div></div>
    <section className="panel table-panel receptionist-admin-panel"><div className="dashboard-top"><div><h2 className="panel-heading">Guest bookings</h2><p className="hint">Confirmed sessions created from the website chat.</p></div><span className="result-count">{guestBookings.length} bookings</span></div>
      {guestBookings.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Visitor</th><th>Phone / email</th><th>Session</th><th>Date</th><th>Price</th><th>Status</th></tr></thead><tbody>{guestBookings.map((booking) => { const session = sessionFor(booking); return <tr key={booking.id}><td><strong>{booking.full_name}</strong></td><td><a href={`tel:${booking.phone}`}>{booking.phone}</a>{booking.email && <small className="admin-secondary-contact"><a href={`mailto:${booking.email}`}>{booking.email}</a></small>}</td><td>{session?.title || "Session"}<small className="admin-secondary-contact">{session?.location || ""}</small></td><td>{session?.starts_at ? formatSessionDate(session.starts_at) : "—"}</td><td>{Number(booking.price_snapshot).toFixed(2)} {booking.currency}</td><td><span className={`status-pill ${booking.status}`}>{booking.status}</span></td></tr>; })}</tbody></table></div> : <div className="empty-state"><h3>No guest bookings yet.</h3><p>Bookings made through the chat will appear here.</p></div>}
    </section>
    <section className="panel table-panel receptionist-admin-panel"><div className="dashboard-top"><div><h2 className="panel-heading">Requests for a person</h2><p className="hint">The visitor approved sharing their contact and latest question with your team.</p></div><span className="result-count">{visitorRequests.length} requests</span></div>
      {visitorRequests.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Visitor</th><th>Phone / email</th><th>Question</th><th>Received</th><th>Status</th></tr></thead><tbody>{visitorRequests.map((handoff) => <tr key={handoff.id}><td><strong>{handoff.full_name}</strong></td><td><a href={`tel:${handoff.phone}`}>{handoff.phone}</a>{handoff.email && <small className="admin-secondary-contact"><a href={`mailto:${handoff.email}`}>{handoff.email}</a></small>}</td><td className="receptionist-question">{handoff.message || "—"}</td><td>{formatSessionDate(handoff.created_at)}</td><td><span className={`status-pill ${handoff.status}`}>{handoff.status.replace("_", " ")}</span></td></tr>)}</tbody></table></div> : <div className="empty-state"><h3>No handoffs yet.</h3><p>When a visitor asks for a person, their approved request will appear here.</p></div>}
    </section>
  </>;
}
