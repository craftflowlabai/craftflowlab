"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AdminSessionForm({ types = [] }: { types?: Array<{ id: string; title: string; duration_minutes: number; default_capacity: number; default_price: number | string }> }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const start = new Date(String(form.get("starts_at")));
    const end = new Date(String(form.get("ends_at")));
    if (end <= start) { setMessage("End time must be after start time."); setBusy(false); return; }
    const typeId = String(form.get("session_type_id") || "") || null;
    const { error } = await createClient().from("sessions").insert({ session_type_id: typeId, title: String(form.get("title")), description: String(form.get("description")), starts_at: start.toISOString(), ends_at: end.toISOString(), timezone: "Europe/Sofia", max_slots: Number(form.get("max_slots")), price: Number(form.get("price")), currency: "EUR", location: String(form.get("location")), status: "published" });
    if (error) setMessage(error.message); else { formElement.reset(); setMessage("Session published."); router.refresh(); }
    setBusy(false);
  }
  return <form id="add-session" className="panel admin-create-form" onSubmit={submit}><h2 className="panel-heading">Add a session</h2><p className="hint">New sessions appear on the public booking page right away.</p><div className="form-grid admin-form-grid"><div className="field"><label>Session title</label><input name="title" required maxLength={120} placeholder="Strength Foundations" /></div><div className="field"><label>Category / type</label><select name="session_type_id" onChange={event => { const type = types.find(item => item.id === event.target.value); if (!type) return; const form = event.currentTarget.form; if (form) { (form.elements.namedItem("max_slots") as HTMLInputElement).value = String(type.default_capacity); (form.elements.namedItem("price") as HTMLInputElement).value = String(type.default_price); const endInput = form.elements.namedItem("ends_at") as HTMLInputElement; const startInput = form.elements.namedItem("starts_at") as HTMLInputElement; if (startInput.value) { const date = new Date(startInput.value); date.setMinutes(date.getMinutes() + type.duration_minutes); const offset = date.getTimezoneOffset(); endInput.value = new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16); } } }}><option value="">Choose a type</option>{types.map(type => <option key={type.id} value={type.id}>{type.title}</option>)}</select></div><div className="field"><label>Location</label><input name="location" required defaultValue="Studio North" /></div><div className="field"><label>Starts</label><input name="starts_at" type="datetime-local" required /></div><div className="field"><label>Ends</label><input name="ends_at" type="datetime-local" required /></div><div className="field"><label>Capacity</label><input name="max_slots" type="number" min="1" max="100" defaultValue="8" required /></div><div className="field"><label>Price (EUR)</label><input name="price" type="number" min="0" step="0.01" defaultValue="24" required /></div><div className="field full-field"><label>Description</label><textarea name="description" rows={3} maxLength={1000} /></div></div><div className="profile-edit-footer"><span className="form-message" role="status">{message}</span><button className="button button-moss" disabled={busy}>{busy ? <LoaderCircle className="spin" /> : <Plus />}{busy ? "Publishing…" : "Publish session"}</button></div></form>;
}
