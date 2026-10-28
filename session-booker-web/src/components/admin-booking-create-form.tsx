"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Client = { id: string; full_name: string };
type Session = { id: string; title: string; starts_at: string; booked_slots: number; max_slots: number };

export function AdminBookingCreateForm({ clients, sessions }: { clients: Client[]; sessions: Session[] }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(""); setError(false);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const { error: rpcError } = await createClient().rpc("admin_create_booking", { p_user_id: String(form.get("client_id")), p_session_id: String(form.get("session_id")), p_admin_note: String(form.get("admin_note") || "") || null });
    if (rpcError) { setMessage(rpcError.message); setError(true); }
    else { setMessage("Booking created and client notified."); formElement.reset(); router.refresh(); }
    setBusy(false);
  }
  return <form id="add-booking" className="panel admin-create-form booking-create-form" onSubmit={submit}><h2 className="panel-heading">Add a booking</h2><p className="hint">Reserve a spot for an active client. Capacity is checked before the booking is saved.</p>{!clients.length || !sessions.length ? <p className="empty-inline">Add an active client and publish an upcoming session before creating a booking.</p> : <><div className="form-grid admin-form-grid"><div className="field"><label>Client</label><select name="client_id" required defaultValue=""><option value="" disabled>Select a client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.full_name || "New member"}</option>)}</select></div><div className="field"><label>Session</label><select name="session_id" required defaultValue=""><option value="" disabled>Select a session</option>{sessions.map(s => <option key={s.id} value={s.id} disabled={s.booked_slots >= s.max_slots}>{s.title} · {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(s.starts_at))} · {s.max_slots - s.booked_slots} spots</option>)}</select></div><div className="field full-field"><label>Admin note <span className="hint">(optional)</span></label><input name="admin_note" maxLength={500} placeholder="Booking arranged by phone" /></div></div><div className="profile-edit-footer"><span className={`form-message${error ? " error" : ""}`} role="status">{message}</span><button className="button button-moss" disabled={busy}>{busy ? <LoaderCircle className="spin" /> : <Plus />}{busy ? "Creating…" : "Create booking"}</button></div></>}</form>;
}
