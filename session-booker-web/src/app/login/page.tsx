import Link from "next/link";
import { Suspense } from "react";
import { Brand } from "@/components/brand";
import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return <main className="page-shell"><header className="site-header"><Brand /><Link className="text-link" href="/sessions">Browse sessions</Link></header><section className="auth-wrap"><div className="panel auth-card"><span className="eyebrow">Welcome back</span><h1>Good to see you.</h1><p>Log in to manage your profile and pick up where your training left off.</p><Suspense fallback={<div className="hint">Loading sign-in…</div>}><LoginForm /></Suspense></div></section></main>;
}
