import Link from "next/link";
import { Brand } from "@/components/brand";
import { SignupForm } from "@/app/signup/signup-form";

export default function SignupPage() {
  return <main className="page-shell"><header className="site-header"><Brand /><Link className="text-link" href="/sessions">Browse sessions</Link></header><section className="auth-wrap"><div className="panel auth-card"><span className="eyebrow">Your first step</span><h1>Make room for progress.</h1><p>Create an account to book sessions and keep your training details in one place.</p><SignupForm /></div></section></main>;
}
