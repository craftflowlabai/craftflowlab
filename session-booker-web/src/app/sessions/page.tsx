import { SiteHeader } from "@/components/site-header";
import { SessionCard, type SessionCardData } from "@/components/session-card";
import { BookSessionButton } from "@/components/book-session-button";
import { createClient } from "@/lib/supabase/server";

export default async function SessionsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("sessions").select("id, title, description, starts_at, ends_at, max_slots, booked_slots, price, currency, location").eq("status", "published").gt("starts_at", new Date().toISOString()).order("starts_at");
  const sessions = (data || []) as SessionCardData[];
  return <main className="page-shell"><SiteHeader /><section className="content-page"><span className="eyebrow">Find your next session</span><h1 className="page-title">A good place to start.</h1><p className="page-intro">Small groups and one-to-one coaching, with a spot saved just for you when you book.</p>{sessions.length ? <div className="session-grid">{sessions.map(s => <div key={s.id}><SessionCard session={s} /><BookSessionButton sessionId={s.id} full={s.booked_slots >= s.max_slots} /></div>)}</div> : <div className="panel empty-state"><h3>New sessions are on the way.</h3><p>There are no upcoming sessions available to book right now.</p></div>}</section></main>;
}
