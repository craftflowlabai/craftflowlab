"use client";

import { FormEvent, useState } from "react";
import { Camera, Check, LoaderCircle, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ProfileFormProps = {
  userId: string;
  email: string;
  initialName: string;
  initialPhone: string;
  initialAvatarPath: string | null;
  initialAvatarUrl: string | null;
};

export function ProfileForm({ userId, email, initialName, initialPhone, initialAvatarPath, initialAvatarUrl }: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [avatarPath, setAvatarPath] = useState(initialAvatarPath);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const supabase = createClient();

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage(""); setError("");
    const { error: saveError } = await supabase.from("profiles").update({ full_name: name.trim(), phone: phone.trim() || null }).eq("id", userId);
    if (saveError) setError(saveError.message);
    else setMessage("Your profile has been saved.");
    setBusy(false);
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Choose an image smaller than 5 MB."); return; }
    setBusy(true); setMessage(""); setError("");
    const nextPath = `${userId}/${crypto.randomUUID()}.${file.name.split(".").pop()?.toLowerCase() || "jpg"}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(nextPath, file, { upsert: false, contentType: file.type, cacheControl: "3600" });
    if (uploadError) { setError(uploadError.message); setBusy(false); return; }
    const { error: updateError } = await supabase.from("profiles").update({ avatar_path: nextPath }).eq("id", userId);
    if (updateError) { setError(updateError.message); setBusy(false); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(nextPath);
    setAvatarPath(nextPath); setAvatarUrl(data.publicUrl); setMessage("Profile photo updated."); setBusy(false);
  }

  const fallback = (name.trim() || email.split("@")[0] || "M").split(/[\s._-]+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");

  return (
    <div className="profile-layout">
      <aside className="panel profile-summary">
        <span className="profile-avatar large" style={avatarUrl ? { backgroundImage: `url("${avatarUrl}")` } : undefined}>{!avatarUrl && fallback}</span>
        <h2>{name.trim() || "Your profile"}</h2>
        <p>{email}</p>
        <label className="button button-light" style={{ width: "max-content", minHeight: 38, padding: "0 13px", fontSize: 11, cursor: "pointer" }}>
          <Camera aria-hidden="true" style={{ width: 14 }} /> Change photo
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadAvatar} disabled={busy} style={{ display: "none" }} />
        </label>
        <div style={{ gridColumn: "2", marginTop: 10 }}><span className="hint">JPG, PNG, or WebP · up to 5 MB</span></div>
      </aside>
      <section className="panel profile-edit">
        <h2 className="panel-heading">Personal details</h2>
        <form onSubmit={saveProfile}>
          <div className="form-grid">
            <div className="field"><label htmlFor="profile-name">Full name</label><input id="profile-name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required /></div>
            <div className="field"><label htmlFor="profile-email">Email address</label><input id="profile-email" type="email" value={email} disabled readOnly /><span className="hint">Email changes are managed through your account sign-in settings.</span></div>
            <div className="field"><label htmlFor="profile-phone">Phone number <span className="hint">(optional)</span></label><input id="profile-phone" type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={32} /></div>
          </div>
          <div className="profile-edit-footer"><span className={`form-message${error ? " error" : ""}`} aria-live="polite">{error || message}</span><button className="button" type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" aria-hidden="true" /> : message ? <Check aria-hidden="true" /> : <Save aria-hidden="true" />}{busy ? "Saving…" : "Save changes"}</button></div>
        </form>
        {avatarPath && <span className="hint" style={{ display: "none" }}>{avatarPath}</span>}
      </section>
    </div>
  );
}
