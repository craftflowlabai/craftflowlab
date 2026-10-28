"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Category = { id: string; slug: string; name: string; description: string; is_active: boolean; sort_order: number };

export function SessionCategoryManager({ categories }: { categories: Category[] }) {
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const router = useRouter();

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("name")).trim();
    const slug = String(form.get("slug")).trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
    setMessage("");
    const { error } = await createClient().from("session_categories").insert({ name, slug, description: String(form.get("description")), sort_order: Number(form.get("sort_order")) });
    if (error) setMessage(error.message); else { formElement.reset(); setMessage(`${name} category created.`); router.refresh(); }
  }

  async function update(category: Category, form: FormData) {
    setBusyId(category.id); setMessage("");
    const { error } = await createClient().from("session_categories").update({
      name: String(form.get("name")).trim(), description: String(form.get("description")),
      is_active: form.get("is_active") === "on", sort_order: Number(form.get("sort_order")),
    }).eq("id", category.id);
    if (error) setMessage(error.message); else { setMessage(`${category.name} saved.`); router.refresh(); }
    setBusyId("");
  }

  async function remove(category: Category) {
    if (!window.confirm(`Delete “${category.name}”? Linked session templates will remain, without a category.`)) return;
    setBusyId(category.id);
    const { error } = await createClient().from("session_categories").delete().eq("id", category.id);
    if (error) setMessage(error.message); else { setMessage(`${category.name} deleted.`); router.refresh(); }
    setBusyId("");
  }

  return <section className="session-category-section">
    <div className="section-heading admin-section-heading"><div><span className="eyebrow">Service taxonomy</span><h2>Categories.</h2></div><p>Group your training offerings so clients can quickly find the right kind of session.</p></div>
    <form className="panel admin-create-form category-create-form" onSubmit={create}>
      <h3 className="panel-heading">Add a category</h3>
      <div className="form-grid admin-form-grid"><div className="field"><label>Name</label><input name="name" required maxLength={80} /></div><div className="field"><label>URL key</label><input name="slug" required placeholder="strength-training" /></div><div className="field"><label>Sort order</label><input name="sort_order" type="number" defaultValue="50" /></div><div className="field full-field"><label>Description</label><textarea name="description" rows={2} /></div></div>
      <div className="profile-edit-footer"><span className="form-message" role="status">{message}</span><button className="button button-moss"><Plus />Add category</button></div>
    </form>
    <div className="session-category-list">{categories.map(category => <form key={category.id} className="panel session-category-card" onSubmit={event => { event.preventDefault(); void update(category, new FormData(event.currentTarget)); }}>
      <div className="session-category-card-head"><div><span className="eyebrow">{category.slug}</span><span className={`status-pill ${category.is_active ? "published" : "draft"}`}>{category.is_active ? "Active" : "Hidden"}</span></div><div className="row-actions"><label className="active-toggle"><input type="checkbox" name="is_active" defaultChecked={category.is_active} /> Active</label><button type="button" className="icon-button danger-icon" aria-label={`Delete ${category.name}`} disabled={busyId === category.id} onClick={() => void remove(category)}><Trash2 /></button></div></div>
      <div className="form-grid admin-form-grid"><div className="field"><label>Name</label><input name="name" defaultValue={category.name} required maxLength={80} /></div><div className="field"><label>Sort order</label><input name="sort_order" type="number" defaultValue={category.sort_order} /></div><div className="field full-field"><label>Description</label><textarea name="description" rows={2} defaultValue={category.description} /></div></div>
      <div className="profile-edit-footer"><span className="hint">Stable category key</span><button className="button button-light" disabled={busyId === category.id}><Save />{busyId === category.id ? "Saving…" : "Save category"}</button></div>
    </form>)}</div>
  </section>;
}

