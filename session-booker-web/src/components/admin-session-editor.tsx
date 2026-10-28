"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit3, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Session = { id: string; title: string; description: string; starts_at: string; ends_at: string; max_slots: number; price: number | string; location: string; session_type_id: string | null };
type SessionType = { id: string; title: string };
const localDateTime = (value: string) => { const date = new Date(value); const offset = date.getTimezoneOffset(); return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16); };

export function AdminSessionEditor({ session, types }: { session: Session; types: SessionType[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const starts = new Date(String(form.get("starts_at")));
    const ends = new Date(String(form.get("ends_at")));
    if (ends <= starts) { setMessage("End time must be after start time."); setBusy(false); return; }
    const { error } = await createClient().from("sessions").update({
      title: String(form.get("title")).trim(), description: String(form.get("description")).trim(),
      starts_at: starts.toISOString(), ends_at: ends.toISOString(), max_slots: Number(form.get("max_slots")),
      price: Number(form.get("price")), location: String(form.get("location")).trim(),
      session_type_id: String(form.get("session_type_id") || "") || null,
    }).eq("id", session.id);
    if (error) setMessage(error.message); else { dialog.current?.close(); router.refresh(); }
    setBusy(false);
  }
  async function remove() {
    if (!window.confirm(`Delete “${session.title}”? Existing booking history is retained, so sessions with bookings cannot be deleted.`)) return;
    setBusy(true);
    const supabase = createClient();
    const { count, error: countError } = await supabase.from("bookings").select("id", { count: "exact", head: true }).eq("session_id", session.id);
    if (countError) { window.alert(countError.message); setBusy(false); return; }
    if ((count || 0) > 0) { window.alert("This session has booking history. Change its status to Cancelled or Completed to retain that history."); setBusy(false); return; }
    const { error } = await supabase.from("sessions").delete().eq("id", session.id);
    if (error) window.alert(error.message); else router.refresh();
    setBusy(false);
  }
  return <div className="row-actions"><button className="icon-button" title="Edit session" aria-label={`Edit ${session.title}`} onClick={() => dialog.current?.showModal()} disabled={busy}><Edit3 /></button><button className="icon-button danger-icon" title="Delete session" aria-label={`Delete ${session.title}`} onClick={remove} disabled={busy}><Trash2 /></button><dialog className="editor-dialog" ref={dialog}><form className="panel editor-card" onSubmit={save}><div className="dialog-head"><div><span className="eyebrow">Session details</span><h2 className="panel-heading">Edit session</h2></div><button type="button" className="icon-button" aria-label="Close" onClick={() => dialog.current?.close()}>×</button></div><div className="form-grid admin-form-grid"><div className="field"><label>Title</label><input name="title" defaultValue={session.title} required maxLength={120} /></div><div className="field"><label>Category / type</label><select name="session_type_id" defaultValue={session.session_type_id || ""}><option value="">No category</option>{types.map(type => <option key={type.id} value={type.id}>{type.title}</option>)}</select></div><div className="field"><label>Starts</label><input name="starts_at" type="datetime-local" defaultValue={localDateTime(session.starts_at)} required /></div><div className="field"><label>Ends</label><input name="ends_at" type="datetime-local" defaultValue={localDateTime(session.ends_at)} required /></div><div className="field"><label>Capacity</label><input name="max_slots" type="number" min={Math.max(1, Number((session as any).booked_slots || 0))} max="100" defaultValue={session.max_slots} required /></div><div className="field"><label>Price (EUR)</label><input name="price" type="number" min="0" step="0.01" defaultValue={session.price} required /></div><div className="field full-field"><label>Location</label><input name="location" defaultValue={session.location} required /></div><div className="field full-field"><label>Description</label><textarea name="description" rows={3} defaultValue={session.description} maxLength={1000} /></div></div><div className="dialog-actions"><span className="form-message error" role="alert">{message}</span><button type="button" className="button button-light" onClick={() => dialog.current?.close()}>Close</button><button className="button button-moss" disabled={busy}>{busy ? "Saving…" : "Save session"}</button></div></form></dialog></div>;
}
