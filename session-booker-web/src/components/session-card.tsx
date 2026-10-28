import Link from "next/link";
import { ArrowUpRight, Clock3, MapPin, Users } from "lucide-react";
import { formatSessionDate } from "@/lib/format";

export type SessionCardData = {
  id: string; title: string; description: string; starts_at: string; ends_at: string;
  max_slots: number; booked_slots: number; price: number | string; currency: string; location: string;
};

export function SessionCard({ session }: { session: SessionCardData }) {
  const remaining = Math.max(0, session.max_slots - session.booked_slots);
  return (
    <article className="session-card" id={session.id}>
      <div className="session-art" aria-hidden="true"><div className="visual-lines" /></div>
      <span className="eyebrow">{formatSessionDate(session.starts_at, { weekday: "long", hour: undefined, minute: undefined })}</span>
      <h3>{session.title}</h3><p>{session.description}</p>
      <div className="session-meta">
        <span><Clock3 aria-hidden="true" /> {formatSessionDate(session.starts_at, { weekday: undefined, day: undefined, month: undefined })}</span>
        <span><Users aria-hidden="true" /> {remaining} {remaining === 1 ? "spot" : "spots"}</span>
        <span><MapPin aria-hidden="true" /> {session.location}</span>
      </div>
      <div className="session-card-footer"><span className="price">{Number(session.price).toFixed(0)} <small>{session.currency} / session</small></span><Link className="arrow-link" href={`/sessions#${session.id}`}>Details <ArrowUpRight aria-hidden="true" /></Link></div>
    </article>
  );
}
