"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type SessionType = { id: string; slug: string; title: string; description: string; duration_minutes: number; default_capacity: number; default_price: number | string; category: string; is_active: boolean };

export function SessionTypeManager({ types }: { types: SessionType[] }) {
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const router = useRouter();
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const title = String(form.get("title")).trim();
    const slug = String(form.get("slug")).trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
    const { error } = await createClient().from("session_types").insert({ slug, title, description: String(form.get("description")), duration_minutes: Number(form.get("duration_minutes")), default_capacity: Number(form.get("default_capacity")), default_price: Number(form.get("default_price")), category: String(form.get("category")) || "Training" });
    if (error) setMessage(error.message); else { formElement.reset(); setMessage("Category created."); router.refresh(); }
  }
  async function update(type: SessionType, form: FormData) {
    setBusyId(type.id); setMessage("");
    const { error } = await createClient().from("session_types").update({ title: String(form.get("title")).trim(), description: String(form.get("description")), duration_minutes: Number(form.get("duration_minutes")), default_capacity: Number(form.get("default_capacity")), default_price: Number(form.get("default_price")), category: String(form.get("category")), is_active: form.get("is_active") === "on" }).eq("id", type.id);
    if (error) setMessage(error.message); else { setMessage(`${type.title} saved.`); router.refresh(); }
    setBusyId("");
  }
  async function remove(type: SessionType) {
    if (!window.confirm(`Delete category “${type.title}”? Existing sessions will keep their saved details.`)) return;
    setBusyId(type.id);
    const { error } = await createClient().from("session_types").delete().eq("id", type.id);
    if (error) setMessage(error.message); else router.refresh();
    setBusyId("");
  }
  return <div className="catalog-manager"><form className="panel admin-create-form" onSubmit={create}><h2 className="panel-heading">Add a category / type</h2><p className="hint">Categories provide reusable duration and capacity defaults for sessions.</p><div className="form-grid admin-form-grid"><div className="field"><label>Title</label><input name="title" required maxLength={90} /></div><div className="field"><label>URL key</label><input name="slug" required placeholder="strength-foundations" /></div><div className="field"><label>Category group</label><input name="category" defaultValue="Training" /></div><div className="field"><label>Duration (minutes)</label><input name="duration_minutes" type="number" min="1" defaultValue="60" required /></div><div className="field"><label>Default capacity</label><input name="default_capacity" type="number" min="1" defaultValue="8" required /></div><div className="field"><label>Default price (EUR)</label><input name="default_price" type="number" min="0" step="0.01" defaultValue="24" required /></div><div className="field full-field"><label>Description</label><textarea name="description" rows={2} /></div></div><div className="profile-edit-footer"><span className="form-message error" role="status">{message}</span><button className="button button-moss"><Plus />Create category</button></div></form><section className="catalog-type-list">{types.map(type => <form key={type.id} className="panel catalog-type-card" onSubmit={event => { event.preventDefault(); void update(type, new FormData(event.currentTarget)); }}><div className="catalog-type-head"><div><span className="eyebrow">{type.category} · {type.duration_minutes} min</span><h3>{type.title}</h3></div><div className="row-actions"><label className="active-toggle"><input name="is_active" type="checkbox" defaultChecked={type.is_active} /> Active</label><button className="icon-button danger-icon" type="button" aria-label={`Delete ${type.title}`} onClick={() => void remove(type)} disabled={busyId === type.id}><Trash2 /></button></div></div><div className="form-grid admin-form-grid"><div className="field"><label>Title</label><input name="title" defaultValue={type.title} maxLength={90} required /></div><div className="field"><label>Category group</label><input name="category" defaultValue={type.category} /></div><div className="field"><label>Duration (minutes)</label><input name="duration_minutes" type="number" min="1" defaultValue={type.duration_minutes} required /></div><div className="field"><label>Default capacity</label><input name="default_capacity" type="number" min="1" defaultValue={type.default_capacity} required /></div><div className="field"><label>Default price (EUR)</label><input name="default_price" type="number" min="0" step="0.01" defaultValue={type.default_price} required /></div><div className="field full-field"><label>Description</label><textarea name="description" rows={2} defaultValue={type.description} /></div></div><div className="profile-edit-footer"><span className="hint">{type.slug}</span><button className="button button-light" disabled={busyId === type.id}><Save />{busyId === type.id ? "Saving…" : "Save changes"}</button></div></form>)}</section></div>;
}
