import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, CalendarCheck2, CalendarClock, Check, Headset, MessageCircleMore, ShieldCheck, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ReceptionistDemo } from "@/components/receptionist-demo";
import { Brand } from "@/components/brand";

export const metadata: Metadata = {
  title: "AI Receptionist | Northform",
  description: "Виртуален рецепционист, който отговаря на запитвания и помага на бизнеса да записва часове денонощно.",
};

const capabilities = [
  { icon: MessageCircleMore, number: "01", title: "Отговаря веднага", description: "Посреща запитвания по всяко време и води естествен разговор на езика на вашите клиенти." },
  { icon: Sparkles, number: "02", title: "Насочва към правилната услуга", description: "Изяснява от какво има нужда човекът и представя одобрени услуги и цени." },
  { icon: CalendarClock, number: "03", title: "Намира удобен час", description: "Проверява наличностите и записва посетителя в свързания календар." },
  { icon: CalendarCheck2, number: "04", title: "Потвърждава и напомня", description: "Изпраща потвърждение и напомняне през избрания канал за комуникация." },
  { icon: Headset, number: "05", title: "Предава разговора на човек", description: "При сложен въпрос или изрично желание включва служител с контекста на разговора." },
  { icon: ShieldCheck, number: "06", title: "Следва вашите правила", description: "Работи с одобрена информация и предава към екипа, когато не е сигурен." },
];

const steps = [
  { number: "01", title: "Запитване", text: "Клиентът пише в сайта или предпочитан канал." },
  { number: "02", title: "Насочване", text: "Асистентът уточнява услугата, цената и подходящия час." },
  { number: "03", title: "Записване", text: "Часът се запазва и клиентът получава потвърждение." },
  { number: "04", title: "Напомняне", text: "Преди посещението клиентът получава напомняне." },
];

export default function AiReceptionistPage() {
  return (
    <main className="page-shell receptionist-page" lang="bg">
      <SiteHeader />
      <section className="receptionist-hero">
        <div className="receptionist-hero-copy">
          <span className="eyebrow">AI Receptionist · виртуален рецепционист</span>
          <h1>Нито едно запитване не остава <span>без отговор.</span></h1>
          <p>Вашият дигитален рецепционист отговаря денонощно, помага на клиентите да изберат услуга и записва часове, докато екипът ви се грижи за бизнеса.</p>
          <div className="receptionist-hero-actions"><a className="button button-moss" href="#demo">Пробвайте демото <ArrowDown aria-hidden="true" /></a><a className="text-link" href="#how-it-works">Как работи <ArrowRight aria-hidden="true" /></a></div>
          <div className="receptionist-hero-note"><Check aria-hidden="true" /> Настройва се според услугите, работното време и правилата на конкретния бизнес.</div>
        </div>
        <div className="receptionist-hero-card"><div className="hero-orb"><Sparkles aria-hidden="true" /></div><span className="hero-card-kicker">ВИНАГИ НА ЛИНИЯ</span><strong>Вашето време<br />е за клиентите.</strong><div className="hero-card-status"><span><i /> Онлайн</span><span>24 часа · 7 дни</span></div><div className="hero-card-reply"><span className="mini-avatar"><Sparkles aria-hidden="true" /></span><p>Здравейте! С удоволствие ще помогна да намерим удобен час. <small>отговор след 1 секунда</small></p></div></div>
      </section>

      <div className="receptionist-proof-strip"><strong>Повече запитвания. По-малко пропуснати възможности.</strong><span>ОТГОВОРИ 24/7</span><span>ЗАПИСВАНЕ НА ЧАСОВЕ</span><span>ПРЕДАВАНЕ КЪМ ЧОВЕК</span></div>

      <section className="receptionist-capabilities section" aria-labelledby="capabilities-heading">
        <div className="section-heading"><div><span className="eyebrow">Как помага на бизнеса</span><h2 id="capabilities-heading">От първия въпрос<br />до запазения час.</h2></div><p>Едно свързано преживяване за клиента и по-малко ръчна работа за екипа.</p></div>
        <div className="receptionist-feature-grid">{capabilities.map(({ icon: Icon, number, title, description }) => <article className="receptionist-feature" key={number}><div className="feature-top"><span>{number}</span><Icon aria-hidden="true" /></div><h3>{title}</h3><p>{description}</p></article>)}</div>
      </section>

      <section className="receptionist-flow" id="how-it-works"><div className="flow-heading"><span className="eyebrow">Лесно за клиента. Подредено за екипа.</span><h2>Един разговор.<br />Ясна следваща стъпка.</h2><p>Рецепционистът води клиента до записване и знае кога да включи човек от екипа.</p></div><div className="flow-steps">{steps.map((step) => <article className="flow-step" key={step.number}><span>{step.number}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></article>)}</div></section>

      <ReceptionistDemo />

      <section className="receptionist-offer section" aria-labelledby="offer-heading"><div className="offer-copy"><span className="eyebrow">Готово решение за вашия бизнес</span><h2 id="offer-heading">Рецепционист, настроен за вашия начин на работа.</h2><p>Не е универсален бот с готови отговори. Настройваме разговора, информацията и процеса за записване според начина, по който работи вашият бизнес.</p><a className="text-link" href="#contact">Обсъдете вашия сценарий <ArrowUpRight aria-hidden="true" /></a></div><div className="offer-includes"><h3>Какво получава клиентът</h3><ul><li><Check aria-hidden="true" /> Настройка по услуги, цени и често задавани въпроси</li><li><Check aria-hidden="true" /> Вграждане в сайта и избран канал за запитвания</li><li><Check aria-hidden="true" /> Връзка с календара и записване на часове</li><li><Check aria-hidden="true" /> Потвърждения и напомняния към клиента</li><li><Check aria-hidden="true" /> Правила за предаване към служител</li><li><Check aria-hidden="true" /> Тестване и предаване с кратко обучение</li></ul></div></section>

      <section className="receptionist-contact" id="contact"><div><span className="eyebrow">Подходящ за студиа, салони и услуги с график</span><h2>Нека автоматизираме първото ви впечатление.</h2><p>Покажете ми как клиентите се свързват с вас днес и ще подготвим демонстрация по вашия процес.</p></div><a className="button button-moss" href="#demo">Пробвайте демото <ArrowUpRight aria-hidden="true" /></a></section>
      <footer className="footer home-footer receptionist-footer"><div className="footer-brand"><Brand /><p>Примерен AI продукт от Northform.</p></div><nav className="footer-nav" aria-label="Навигация в долната част"><Link href="/">Начало</Link><Link href="/sessions">Сесии</Link><a href="#demo">Пробвайте демото</a></nav><span className="footer-note">Всеки разговор започва с „Здравейте“ <Check aria-hidden="true" /></span></footer>
      <p className="prototype-note">Прототипът използва примерни услуги и часове. Резервациите, известията и предаването към служител не се изпълняват към реални системи.</p>
    </main>
  );
}
