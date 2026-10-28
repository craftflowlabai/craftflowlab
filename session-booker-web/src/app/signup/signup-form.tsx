"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { LoaderCircle, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(), password,
      options: { data: { full_name: name.trim() }, emailRedirectTo: `${window.location.origin}/auth/callback?next=/profile` },
    });
    if (signUpError) { setError(signUpError.message); setBusy(false); return; }
    if (data.session) window.location.assign("/profile");
    else { setNotice("Your account is ready. Check your email to confirm your address, then log in."); setBusy(false); }
  }
  return (
    <form className="form-grid" onSubmit={submit}>
      {error && <div className="auth-alert error" role="alert">{error}</div>}{notice && <div className="auth-alert" role="status">{notice}</div>}
      <div className="field"><label htmlFor="signup-name">Full name</label><input id="signup-name" autoComplete="name" required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} /></div>
      <div className="field"><label htmlFor="signup-email">Email address</label><input id="signup-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
      <div className="field"><label htmlFor="signup-password">Password</label><input id="signup-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /><span className="hint">At least 8 characters.</span></div>
      <button className="button" type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" aria-hidden="true" /> : <UserPlus aria-hidden="true" />}{busy ? "Creating account…" : "Create account"}</button>
      <div className="auth-foot">Already have an account? <Link href="/login">Log in</Link></div>
    </form>
  );
}
