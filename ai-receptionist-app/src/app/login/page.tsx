import Link from "next/link";
import { Sparkles } from "lucide-react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return <main className="login-page"><section className="login-card"><Link href="/" className="login-brand"><span><Sparkles /></span> Reception AI</Link><span className="eyebrow">ЗА ЕКИПА</span><h1>Влезте в<br />работното табло.</h1><p>Прегледайте записванията и клиентските запитвания, предадени от асистента.</p><LoginForm /><Link className="login-back" href="/">← Обратно към демото</Link></section><aside className="login-aside"><div className="login-glow"><Sparkles /></div><span>КЛИЕНТИТЕ ПОЛУЧАВАТ ОТГОВОР</span><strong>И след<br />работно време.</strong><small>Reception AI · 24/7 виртуален рецепционист</small></aside></main>;
}
