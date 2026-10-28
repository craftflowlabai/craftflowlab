"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { formatSessionDate } from "@/lib/format";
import { AdminBookingStatus } from "@/components/admin-booking-status";

type Booking = { id: string; status: string; booked_at: string; price_snapshot: number | string; currency: string; profiles: any; sessions: any };
const one = (value: any) => Array.isArray(value) ? value[0] : value;

export function AdminBookingsTable({ bookings }: { bookings: Booking[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = useMemo(() => bookings.filter(booking => {
    const client = one(booking.profiles); const session = one(booking.sessions);
    const matches = `${client?.full_name || ""} ${session?.title || ""} ${session?.location || ""}`.toLowerCase().includes(query.toLowerCase());
    return matches && (status === "all" || booking.status === status);
  }), [bookings, query, status]);
  return <section className="panel table-panel"><div className="table-toolbar"><label className="search-field"><Search /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search clients, sessions, locations" aria-label="Search bookings" /></label><label className="filter-field"><span>Status</span><select value={status} onChange={e => setStatus(e.target.value)}><option value="all">All statuses</option>{["pending", "confirmed", "cancelled", "rejected", "completed", "no_show"].map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select></label><span className="result-count">{filtered.length} bookings</span></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Client</th><th>Session</th><th>Date</th><th>Location</th><th>Price</th><th>Status</th><th>Manage</th></tr></thead><tbody>{filtered.map(booking => { const session = one(booking.sessions); const client = one(booking.profiles); return <tr key={booking.id}><td><strong>{client?.full_name || "Member"}</strong></td><td>{session?.title || "Session"}</td><td>{session?.starts_at ? formatSessionDate(session.starts_at) : "—"}</td><td>{session?.location || "—"}</td><td>{Number(booking.price_snapshot).toFixed(0)} {booking.currency}</td><td><span className={`status-pill ${booking.status}`}>{booking.status.replace("_", " ")}</span></td><td><AdminBookingStatus id={booking.id} status={booking.status} /></td></tr>; })}</tbody></table>{!filtered.length && <p className="empty-inline">No bookings match these filters.</p>}</div></section>;
}
