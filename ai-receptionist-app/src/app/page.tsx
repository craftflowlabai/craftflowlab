import Link from "next/link";
import { ArrowUpRight, CalendarClock, Check, Headset, MessageCircleMore, Settings2, ShieldCheck, Sparkles } from "lucide-react";
import { ReceptionistDemo } from "@/components/receptionist-demo";

const highlights = [
  { icon: MessageCircleMore, value: "24/7", label: "Отговори към клиенти" },
  { icon: CalendarClock, value: "На живо", label: "Проверка на графика" },
  { icon: Headset, value: "С човек", label: "Предаване при нужда" },
];

const modules = [
  { icon: Sparkles, title: "Асистентът", text: "Разговаря на естествен език и отговаря по одобрена информация." },
  { icon: CalendarClock, title: "Записвания", text: "Проверява реалните свободни часове и приема заявка за резервация." },
  { icon: ShieldCheck, title: "Контрол от екипа", text: "Предава сложните разговори към човек и показва заявките в защитения панел." },
];

export default function Home() {
  return <div className="product-shell">
    <aside className="product-sidebar">
      <Link className="product-logo" href="/"><span className="product-logo-mark"><Sparkles /></span><span>reception<span className="logo-ai">.ai</span><small>CLIENT EXPERIENCE</small></span></Link>
      <span className="sidebar-label">РАБОТНО МЯСТО</span>
      <a className="product-nav active" href="#assistant"><MessageCircleMore /> Асистент</a>
      <Link className="product-nav" href="/workspace"><CalendarClock /> Работно табло</Link>
      <Link className="product-nav" href="/workspace/inbox"><Headset /> Запитвания <span className="nav-dot" /></Link>
      <div className="sidebar-spacer" />
      <div className="workspace-card"><span className="workspace-avatar">SN</span><div><strong>Studio North</strong><small>Демо работно място</small></div><Settings2 /></div>
      <p className="sidebar-footnote">ПРОТОТИП · ПОРТФОЛИО</p>
    </aside>

    <main className="product-main">
      <header className="product-topbar"><div className="breadcrumbs"><span>Studio North</span><span>/</span><strong>Асистент</strong></div><div className="topbar-right"><span className="online-pill"><i /> DEMO ONLINE</span><Link className="topbar-link" href="/workspace">Влез като администратор <ArrowUpRight /></Link></div></header>
      <section className="product-intro"><div><span className="eyebrow">AI Receptionist · виртуален рецепционист</span><h1>Всяко запитване<br /><span>намира отговор.</span></h1><p>Едно място за клиентски разговори, информация за услуги, свободни часове и предаване към екипа.</p><div className="intro-checks"><span><Check /> Разбира заявката</span><span><Check /> Проверява графика</span><span><Check /> Записва и потвърждава</span></div></div><div className="intro-card"><span className="intro-orbit"><Sparkles /></span><small>АСИСТЕНТЪТ Е НА ЛИНИЯ</small><strong>Дори когато<br />екипът почива.</strong><div className="intro-card-bottom"><span><i /> Активен</span><span>24 часа · 7 дни</span></div></div></section>

      <section className="metrics-row" aria-label="Възможности на продукта">{highlights.map(({ icon: Icon, value, label }) => <article className="metric-card" key={label}><span className="metric-icon"><Icon /></span><div><strong>{value}</strong><small>{label}</small></div><span className="metric-arrow"><ArrowUpRight /></span></article>)}</section>

      <section className="assistant-section" id="assistant"><div className="section-heading"><div><span className="eyebrow">Жива демонстрация</span><h2>Поговорете с асистента.</h2></div><p>Опитайте въпрос за услуги, цени или свободни часове. Можете и да направите тестово записване.</p></div><ReceptionistDemo /></section>

      <section className="modules-section"><div className="section-heading"><div><span className="eyebrow">Един разговор · няколко задачи</span><h2>От въпрос до следваща стъпка.</h2></div></div><div className="module-grid">{modules.map(({ icon: Icon, title, text }) => <article className="module-card" key={title}><span><Icon /></span><h3>{title}</h3><p>{text}</p></article>)}</div></section>

      <footer className="product-footer"><span>Reception AI · Продуктова демонстрация на CraftflowLab</span><span>Заявките се обработват от примерния график на Studio North.</span></footer>
    </main>
  </div>;
}
