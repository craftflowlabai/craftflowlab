"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, UserRound, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatSessionDate } from "@/lib/format";

type Client = { id: string; full_name: string; phone: string | null; role: string; account_status: string; created_at: string };
type Booking = { id: string; user_id: string; status: string; price_snapshot: number | string; currency: string; sessions: any };
const one = (value: any) => Array.isArray(value) ? value[0] : value;

export function AdminClientTable({ clients, bookings }: { clients: Client[]; bookings: Booking[] }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [selected, setSelected] = useState<Client | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const filtered = useMemo(() => clients.filter(client => {
    const matches = `${client.full_name || ""} ${client.phone || ""}`.toLowerCase().includes(query.toLowerCase());
    return matches && (role === "all" || client.role === role);
  }), [clients, query, role]);
  function openClient(client: Client) { setSelected(client); setMessage(""); dialog.current?.showModal(); }
  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return;
    setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const { error } = await createClient().rpc("admin_update_client_profile", { p_user_id: selected.id, p_full_name: String(form.get("full_name")), p_phone: String(form.get("phone") || "") || null });
    if (error) setMessage(error.message); else { setMessage("Client details saved."); dialog.current?.close(); router.refresh(); }
    setBusy(false);
  }
  async function changeAccess(field: "role" | "account_status", value: string) {
    if (!selected) return;
    const nextRole = field === "role" ? value : selected.role;
    const nextStatus = field === "account_status" ? value : selected.account_status;
    const reason = window.prompt(`Reason for changing this account to ${nextRole} / ${nextStatus}:`)?.trim();
    if (!reason) return;
    setBusy(true);
    const { error } = await createClient().rpc("admin_set_user_access", { p_user_id: selected.id, p_role: nextRole, p_account_status: nextStatus, p_reason: reason });
    if (error) { setMessage(error.message); setBusy(false); return; }
    setSelected({ ...selected, role: nextRole, account_status: nextStatus }); setMessage("Access updated."); setBusy(false); router.refresh();
  }
  const clientBookings = selected ? bookings.filter(booking => booking.user_id === selected.id) : [];

  return <><section className="panel table-panel"><div className="table-toolbar"><label className="search-field"><Search /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name or phone" aria-label="Search clients" /></label><label className="filter-field"><span>Role</span><select value={role} onChange={e => setRole(e.target.value)}><option value="all">All people</option><option value="client">Clients</option><option value="user">Members</option></select></label><span className="result-count">{filtered.length} people</span></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Name</th><th>Phone</th><th>Role</th><th>Account</th><th>Bookings</th><th>Joined</th><th></th></tr></thead><tbody>{filtered.map(client => <tr key={client.id}><td><strong>{client.full_name || "New member"}</strong></td><td>{client.phone || "—"}</td><td>{client.role}</td><td><span className={`status-pill ${client.account_status}`}>{client.account_status.replace("_", " ")}</span></td><td>{bookings.filter(b => b.user_id === client.id).length}</td><td>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(client.created_at))}</td><td><button className="table-action" onClick={() => openClient(client)}><UserRound /> Details</button></td></tr>)}</tbody></table>{!filtered.length && <p className="empty-inline">No clients match this search.</p>}</div></section>
    <dialog className="editor-dialog client-dialog" ref={dialog} onClose={() => setSelected(null)}><section className="panel editor-card"><div className="dialog-head"><div><span className="eyebrow">Client profile</span><h2 className="panel-heading">{selected?.full_name || "Client details"}</h2></div><button className="icon-button" aria-label="Close" onClick={() => dialog.current?.close()}><X /></button></div>{selected && <><form className="form-grid admin-form-grid" onSubmit={saveProfile}><div className="field"><label>Full name</label><input name="full_name" defaultValue={selected.full_name} maxLength={80} required /></div><div className="field"><label>Phone</label><input name="phone" defaultValue={selected.phone || ""} maxLength={32} /></div><div className="field"><label>Role</label><select value={selected.role} onChange={e => void changeAccess("role", e.target.value)} disabled={busy}><option value="user">User</option><option value="client">Client</option><option value="admin">Admin</option></select></div><div className="field"><label>Account status</label><select value={selected.account_status} onChange={e => void changeAccess("account_status", e.target.value)} disabled={busy}><option value="active">Active</option><option value="pending_review">Pending review</option><option value="rejected">Rejected</option><option value="banned">Banned</option></select></div><div className="profile-edit-footer full-field"><span className="form-message" role="status">{message}</span><button className="button button-moss" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button></div></form><section className="client-history"><h3>Booking history <span>{clientBookings.length}</span></h3>{clientBookings.length ? clientBookings.map(booking => { const session = one(booking.sessions); return <div className="client-history-row" key={booking.id}><span><strong>{session?.title || "Session"}</strong><small>{session?.starts_at ? formatSessionDate(session.starts_at) : "Date unavailable"}</small></span><span className={`status-pill ${booking.status}`}>{booking.status.replace("_", " ")}</span></div>; }) : <p className="hint">No bookings recorded for this person yet.</p>}</section></>}</section></dialog>
  </>;
}
