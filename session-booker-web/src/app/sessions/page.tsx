import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Users } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SessionCard, type SessionCardData } from "@/components/session-card";
import { BookSessionButton } from "@/components/book-session-button";
import { createClient } from "@/lib/supabase/server";

export default async function SessionsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("sessions").select("id, title, description, starts_at, ends_at, max_slots, booked_slots, price, currency, location").eq("status", "published").gt("starts_at", new Date().toISOString()).order("starts_at");
  const sessions = (data || []) as SessionCardData[];

  return (
    <main className="page-shell sessions-page-shell">
      <SiteHeader />
      <section className="content-page sessions-page">
        <div className="sessions-hero">
          <div className="sessions-hero-copy">
            <span className="eyebrow">The Studio North schedule</span>
            <h1 className="page-title">Find a session that feels like <em>your start.</em></h1>
            <p className="page-intro">See what’s coming up, compare the details, and choose a time that works for your week.</p>
            <div className="session-promises"><span><CalendarDays aria-hidden="true" /> Clear times</span><span><Users aria-hidden="true" /> Small groups</span><span><MapPin aria-hidden="true" /> Sofia studio</span></div>
          </div>
          <figure className="sessions-hero-photo"><Image src="/images/northform-coach-hero.jpg" alt="Personal coaching in a bright, welcoming training studio" fill loading="eager" sizes="(max-width: 760px) 100vw, 35vw" /><figcaption>Come as you are. Start where you are.</figcaption></figure>
        </div>

        <div className="sessions-list-heading"><div><span className="eyebrow">Upcoming sessions</span><h2>Choose your next step.</h2></div><p>Time, location, open spots, and price are shown with every session.</p></div>
        {sessions.length ? <div className="session-grid">{sessions.map((session) => <div className="bookable-session" key={session.id}><SessionCard session={session} /><BookSessionButton sessionId={session.id} full={session.booked_slots >= session.max_slots} /></div>)}</div> : <div className="panel empty-state"><h3>New sessions are on the way.</h3><p>There are no upcoming sessions available to book right now.</p><Link className="text-link" href="/">Back to Northform <ArrowRight aria-hidden="true" /></Link></div>}
      </section>
    </main>
  );
}
