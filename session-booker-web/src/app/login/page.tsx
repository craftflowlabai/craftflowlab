import Link from "next/link";
import { Suspense } from "react";
import { Brand } from "@/components/brand";
import { AuthShowcase } from "@/components/auth-showcase";
import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return <main className="page-shell"><header className="site-header"><Brand /><Link className="text-link" href="/sessions">Browse sessions</Link></header><section className="auth-wrap"><div className="auth-layout"><AuthShowcase title="A little time for you goes a long way." note="Come back to your profile, your plans, and the sessions you’ve saved." /><div className="panel auth-card"><span className="eyebrow">Welcome back</span><h1>Good to see you.</h1><p>Log in to manage your profile and pick up where your training left off.</p><Suspense fallback={<div className="hint">Loading sign-in…</div>}><LoginForm /></Suspense></div></div></section></main>;
}
