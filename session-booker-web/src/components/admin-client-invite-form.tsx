"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MailPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AdminClientInviteForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy(true); setError(false); setMessage("");
    const { data, error: invokeError } = await createClient().functions.invoke("admin-invite-client", {
      body: { email: String(form.get("email")), full_name: String(form.get("full_name")), phone: String(form.get("phone") || "") },
    });
    if (invokeError || data?.error) {
      setError(true); setMessage(data?.error || invokeError?.message || "Could not send the invitation.");
    } else {
      formElement.reset();
      setMessage("Invitation sent. The new account will become a client after its first booking.");
      router.refresh();
    }
    setBusy(false);
  }

  return <form id="invite-client" className="panel admin-create-form client-invite-form" onSubmit={submit}>
    <div><h2 className="panel-heading">Invite a client</h2><p className="hint">Send a secure sign-up link. New accounts keep the user role until they make their first booking.</p></div>
    <div className="form-grid admin-form-grid">
      <div className="field"><label>Full name</label><input name="full_name" required maxLength={80} /></div>
      <div className="field"><label>Email address</label><input name="email" type="email" required maxLength={254} /></div>
      <div className="field"><label>Phone <span className="hint">(optional)</span></label><input name="phone" maxLength={32} /></div>
    </div>
    <div className="profile-edit-footer"><span className={`form-message${error ? " error" : ""}`} role="status">{message}</span><button className="button button-moss" disabled={busy}>{busy ? "Sending…" : <><MailPlus /> Send invitation</>}</button></div>
  </form>;
}

