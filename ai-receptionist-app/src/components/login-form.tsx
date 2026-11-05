"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const { error: signInError } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) {
      setError("Входът не беше успешен. Проверете имейла и паролата си.");
      setBusy(false);
      return;
    }
    router.replace("/workspace");
    router.refresh();
  }
  return <form className="login-form" onSubmit={submit}>
    <label>Имейл<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@business.com" /></label>
    <label>Парола<input type="password" autoComplete="current-password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Въведете паролата си" /></label>
    {error && <p className="login-error" role="alert">{error}</p>}
    <button type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" /> : null}{busy ? "Влизане…" : "Влез в работното табло"}<ArrowRight /></button>
  </form>;
}
