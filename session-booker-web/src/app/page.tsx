import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, MapPin } from "lucide-react";
import { Brand } from "@/components/brand";
import { SiteHeader } from "@/components/site-header";
import { SessionCard, type SessionCardData } from "@/components/session-card";
import { createClient } from "@/lib/supabase/server";

const trainingPaths = [
  {
    number: "01",
    title: "One-to-one coaching",
    description: "Focused time, personal guidance, and a session shaped around where you are today.",
    tag: "PERSONAL TRAINING",
  },
  {
    number: "02",
    title: "Small-group strength",
    description: "A little shared energy, plenty of coaching, and room to move at your own pace.",
    tag: "TRAIN TOGETHER",
  },
  {
    number: "03",
    title: "Mobility & recovery",
    description: "Build control, range, and confidence with movement that supports the rest of your week.",
    tag: "MOVE WELL",
  },
];

const faqs = [
  {
    question: "Is this a good fit if I’m new to training?",
    answer: "Yes. Sessions can be adapted to your experience and comfort level. You can read the details for each session before choosing a time.",
  },
  {
    question: "How do I book a session?",
    answer: "Open the sessions page, choose an upcoming time that suits you, then sign in or create an account to reserve your spot.",
  },
  {
    question: "Where does training take place?",
    answer: "Sessions take place at Studio North in Sofia. The exact location is shown with each session before you book.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.from("sessions")
    .select("id, title, description, starts_at, ends_at, max_slots, booked_slots, price, currency, location")
    .eq("status", "published").gt("starts_at", new Date().toISOString()).order("starts_at").limit(3);
  const sessions = (data || []) as SessionCardData[];

  return (
    <main className="page-shell home-page">
      <SiteHeader />
      <section className="hero" aria-labelledby="home-title">
        <div className="hero-copy">
          <span className="eyebrow">Personal coaching · Sofia</span>
          <h1 id="home-title">A stronger way to <span>feel like you.</span></h1>
          <p>Good training should meet you where you are, give you a reason to keep showing up, and fit into the life you already have.</p>
          <div className="hero-actions">
            <Link className="button button-moss" href="/sessions">Find your first session <ArrowRight aria-hidden="true" /></Link>
            <a className="text-link" href="#approach">Discover the approach <ArrowUpRight aria-hidden="true" /></a>
          </div>
          <div className="hero-note"><span className="hero-note-mark"><Check aria-hidden="true" /></span><span>Personal coaching, small groups, and a welcoming studio.</span></div>
        </div>
        <figure className="hero-visual">
          <Image
            className="hero-photo"
            src="/images/northform-coach-hero.jpg"
            alt="A coach guiding a client through a strength exercise in a bright studio"
            fill
            priority
            sizes="(max-width: 680px) 100vw, 52vw"
          />
          <span className="visual-label"><MapPin aria-hidden="true" /> STUDIO NORTH · SOFIA</span>
          <figcaption className="visual-stat"><span>YOUR PACE. YOUR PLAN.</span><strong>Start where you are.</strong><small>Build strength, one session at a time.</small></figcaption>
        </figure>
      </section>

      <div className="trust-strip" id="studio">
        <strong>Training with room to be yourself.</strong>
        <span>ONE-TO-ONE COACHING</span>
        <span>SMALL GROUPS</span>
        <span>STUDIO NORTH · SOFIA</span>
      </div>

      <section className="section offerings-section" id="approach">
        <div className="section-heading">
          <div><span className="eyebrow">Find your starting point</span><h2>Training that fits your life.</h2></div>
          <p>Choose the kind of support you want today. We’ll take it one good session at a time.</p>
        </div>
        <div className="offerings-grid">
          {trainingPaths.map((path) => (
            <article className="offering-card" key={path.number}>
              <div className="offering-card-top"><span>{path.number}</span><span className="offering-orbit" aria-hidden="true" /></div>
              <span className="offering-tag">{path.tag}</span>
              <h3>{path.title}</h3>
              <p>{path.description}</p>
              <Link href="/sessions" className="arrow-link">Explore sessions <ArrowUpRight aria-hidden="true" /></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section sessions-section" id="sessions">
        <div className="section-heading">
          <div><span className="eyebrow">A good next step</span><h2>Upcoming at the studio.</h2></div>
          <p>Small-group sessions and personal coaching, with the details you need before you book.</p>
        </div>
        {sessions.length ? <div className="session-grid">{sessions.map((session) => <SessionCard key={session.id} session={session} />)}</div> : <div className="panel empty-state"><h3>Our next sessions are being scheduled.</h3><p>Check back soon or create an account to be ready when booking opens.</p><Link className="button button-light" href="/signup">Create an account <ArrowUpRight aria-hidden="true" /></Link></div>}
        <div className="section-link-row"><Link className="text-link" href="/sessions">See all sessions <ArrowRight aria-hidden="true" /></Link></div>
      </section>

      <section className="section method-section">
        <div className="method-copy"><span className="eyebrow">A calmer kind of progress</span><h2 id="approach-title">Consistency grows from feeling good here.</h2><p>No all-or-nothing promises. Just thoughtful coaching, clear next steps, and a space where you can build confidence at your own pace.</p><Link className="button button-moss" href="/sessions">Explore the schedule <ArrowRight aria-hidden="true" /></Link></div>
        <div className="method-list" aria-label="What to expect">
          <div className="method-item"><span className="method-number">01</span><div><h3>Arrive as you are</h3><p>Start with your goals, experience, and the time you have.</p></div></div>
          <div className="method-item"><span className="method-number">02</span><div><h3>Get coaching that listens</h3><p>Move through sessions with clear guidance and room to adjust.</p></div></div>
          <div className="method-item"><span className="method-number">03</span><div><h3>Keep the rhythm going</h3><p>Find a pace that feels sustainable and celebrate the small wins.</p></div></div>
        </div>
      </section>

      <section className="section faq-section">
        <div className="faq-intro"><span className="eyebrow">The practical bits</span><h2>A few things you might be wondering.</h2><p>Find the format, location, and booking details before you reserve a place.</p><Link className="text-link" href="/sessions">Browse the schedule <ArrowUpRight aria-hidden="true" /></Link></div>
        <div className="faq-list">{faqs.map((faq) => <details className="faq-item" key={faq.question}><summary>{faq.question}<span aria-hidden="true">+</span></summary><p>{faq.answer}</p></details>)}</div>
      </section>

      <section className="closing-cta"><div><span className="eyebrow">Make a little space for yourself</span><h2>Your next good session is closer than you think.</h2></div><Link className="button button-moss" href="/sessions">View upcoming sessions <ArrowRight aria-hidden="true" /></Link></section>

      <footer className="footer home-footer">
        <div className="footer-brand"><Brand /><p>Personal training at Studio North, Sofia.</p></div>
        <nav className="footer-nav" aria-label="Footer navigation"><Link href="/sessions">Sessions</Link><a href="#approach">Our approach</a><Link href="/login">Your account</Link></nav>
        <span className="footer-note">Move at your own pace <Check aria-hidden="true" /></span>
      </footer>
    </main>
  );
}
