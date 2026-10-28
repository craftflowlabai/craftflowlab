"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AdminSessionForm() {
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
    const { error } = await createClient().from("sessions").insert({ title: String(form.get("title")), description: String(form.get("description")), starts_at: start.toISOString(), ends_at: end.toISOString(), max_slots: Number(form.get("max_slots")), price: Number(form.get("price")), currency: "EUR", location: String(form.get("location")), status: "published" });
    if (error) setMessage(error.message); else { formElement.reset(); setMessage("Session published."); router.refresh(); }
    setBusy(false);
  }
  return <form className="panel admin-create-form" onSubmit={submit}><h2 className="panel-heading">Add a session</h2><p className="hint">New sessions appear on the public booking page right away.</p><div className="form-grid admin-form-grid"><div className="field"><label>Session title</label><input name="title" required maxLength={120} placeholder="Strength Foundations" /></div><div className="field"><label>Location</label><input name="location" required defaultValue="Studio North" /></div><div className="field"><label>Starts</label><input name="starts_at" type="datetime-local" required /></div><div className="field"><label>Ends</label><input name="ends_at" type="datetime-local" required /></div><div className="field"><label>Capacity</label><input name="max_slots" type="number" min="1" max="100" defaultValue="8" required /></div><div className="field"><label>Price (EUR)</label><input name="price" type="number" min="0" step="0.01" defaultValue="24" required /></div><div className="field full-field"><label>Description</label><textarea name="description" rows={3} maxLength={1000} /></div></div><div className="profile-edit-footer"><span className="form-message" role="status">{message}</span><button className="button button-moss" disabled={busy}>{busy ? <LoaderCircle className="spin" /> : <Plus />}{busy ? "Publishing…" : "Publish session"}</button></div></form>;
}
