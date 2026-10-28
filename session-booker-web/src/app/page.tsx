import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, HeartPulse } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SessionCard, type SessionCardData } from "@/components/session-card";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.from("sessions")
    .select("id, title, description, starts_at, ends_at, max_slots, booked_slots, price, currency, location")
    .eq("status", "published").gt("starts_at", new Date().toISOString()).order("starts_at").limit(3);
  const sessions = (data || []) as SessionCardData[];
  return (
    <main className="page-shell">
      <SiteHeader />
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Personal training, with a plan</span>
          <h1>Stronger days start with <span>one session.</span></h1>
          <p>Thoughtful coaching, small groups, and a training rhythm built around your life — not the other way around.</p>
          <div className="hero-actions"><Link className="button button-moss" href="/sessions">Explore sessions <ArrowRight aria-hidden="true" /></Link><a className="text-link" href="#approach">Meet your new routine</a></div>
          <div className="hero-note"><span className="avatar-stack" aria-hidden="true"><i>A</i><i>M</i><i>J</i></span><span>Coaching that meets you where you are.</span></div>
        </div>
        <div className="hero-visual" aria-label="Abstract illustration of a training studio"><div className="visual-lines" /><span className="visual-label">STUDIO NORTH · SOFIA</span><div className="visual-orbit" /><div className="visual-stat"><span>Progress, at your pace</span><strong>01 → 100</strong><small>Build the habit. Keep the momentum.</small></div></div>
      </section>
      <div className="trust-strip" id="studio"><strong>Move well. Get stronger. Feel at home.</strong><span>PERSONAL COACHING</span><span>SMALL GROUPS</span><span>NO PRESSURE</span></div>
      <section className="section" id="sessions">
        <div className="section-heading"><div><span className="eyebrow">Make your next move</span><h2>Find your kind of session.</h2></div><p>Choose a starting point. We’ll help you make it a routine that feels good and keeps getting better.</p></div>
        {sessions.length ? <div className="session-grid">{sessions.map((session) => <SessionCard key={session.id} session={session} />)}</div> : <div className="panel empty-state"><h3>Our next sessions are being scheduled.</h3><p>Check back soon or create an account to be ready when booking opens.</p><Link className="button button-light" href="/signup">Create an account <ArrowUpRight aria-hidden="true" /></Link></div>}
        <div style={{ marginTop: 24, textAlign: "center" }}><Link className="text-link" href="/sessions">See all sessions <ArrowRight aria-hidden="true" style={{ width: 15, verticalAlign: "middle", marginLeft: 4 }} /></Link></div>
      </section>
      <section className="section method-section" id="approach">
        <div><span className="eyebrow">A better way to train</span><h2>Good coaching is personal. So is your progress.</h2><p>No all-or-nothing promises. Just skilled coaching, a welcoming space, and a plan you can actually stick with.</p><Link className="button button-moss" href="/sessions" style={{ marginTop: 15 }}>Find your first session <ArrowRight aria-hidden="true" /></Link></div>
        <div className="method-list"><div className="method-item"><span className="method-number">01</span><div><h3>Start where you are</h3><p>Every session is adaptable, whether you’re new to training or ready for the next challenge.</p></div></div><div className="method-item"><span className="method-number">02</span><div><h3>Build a real rhythm</h3><p>Book one session or find a weekly slot that gives your goals room to grow.</p></div></div><div className="method-item"><span className="method-number">03</span><div><h3>Notice what changes</h3><p>Small wins count. We keep the focus on how you move and feel, not on perfection.</p></div></div></div>
      </section>
      <footer className="footer"><span className="brand"><span className="brand-mark"><HeartPulse aria-hidden="true" /></span>NORTHFORM</span><span>Personal training at Studio North · Sofia</span><span>Move at your own pace <Check aria-hidden="true" style={{ width: 13, verticalAlign: "middle" }} /></span></footer>
    </main>
  );
}
