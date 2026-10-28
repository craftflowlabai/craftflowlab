"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Users } from "lucide-react";
import { formatSessionDate } from "@/lib/format";

type EventBooking = { id: string; status: string; profiles: any };
type CalendarEvent = { id: string; title: string; starts_at: string; ends_at: string; location: string; status: string; booked_slots: number; max_slots: number; bookings: EventBooking[] };
const dayKey = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
const dateKey = (year: number, month: number, day: number) => `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
const moveMonth = (value: string, delta: number) => { const [year, month] = value.split("-").map(Number); const date = new Date(year, month - 1 + delta, 1); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; };
const one = (value: any) => Array.isArray(value) ? value[0] : value;

export function AdminCalendar({ month, events }: { month: string; events: CalendarEvent[] }) {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState(() => month === new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Sofia" }).slice(0, 7) ? dayKey(new Date()) : `${month}-01`);
  useEffect(() => { setSelectedDay(month === new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Sofia" }).slice(0, 7) ? dayKey(new Date()) : `${month}-01`); }, [month]);
  const [year, monthNumber] = month.split("-").map(Number);
  const firstDayOffset = (new Date(year, monthNumber - 1, 1).getDay() + 6) % 7;
  const dayCount = new Date(year, monthNumber, 0).getDate();
  const cells = [...Array(firstDayOffset).fill(null), ...Array.from({ length: dayCount }, (_, i) => dateKey(year, monthNumber, i + 1))];
  while (cells.length % 7) cells.push(null);
  const byDate = useMemo(() => events.reduce<Record<string, CalendarEvent[]>>((group, event) => { const key = dayKey(new Date(event.starts_at)); (group[key] ||= []).push(event); return group; }, {}), [events]);
  const currentEvents = byDate[selectedDay] || [];
  const title = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "Europe/Sofia" }).format(new Date(`${month}-01T12:00:00+02:00`));
  function go(next: string) { router.push(`/admin/calendar?month=${next}`); }
  return <div className="calendar-layout"><section className="panel calendar-panel"><div className="calendar-toolbar"><button className="icon-button" aria-label="Previous month" onClick={() => go(moveMonth(month, -1))}><ArrowLeft /></button><h2>{title}</h2><button className="icon-button" aria-label="Next month" onClick={() => go(moveMonth(month, 1))}><ArrowRight /></button><button className="button button-light calendar-today" onClick={() => go(new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Sofia" }).slice(0, 7))}>Today</button></div><div className="calendar-grid calendar-weekdays">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => <span key={day}>{day}</span>)}</div><div className="calendar-grid">{cells.map((key, index) => { const items = key ? byDate[key] || [] : []; return <button key={key || `blank-${index}`} className={`calendar-day${key === selectedDay ? " selected" : ""}${key === dayKey(new Date()) ? " today" : ""}${!key ? " blank" : ""}`} disabled={!key} onClick={() => key && setSelectedDay(key)}><span className="calendar-day-number">{key?.slice(-2).replace(/^0/, "")}</span>{items.slice(0, 2).map(event => <span className={`calendar-event-chip ${event.status}`} key={event.id}>{formatSessionDate(event.starts_at, { weekday: undefined, day: undefined, month: undefined })} · {event.title}</span>)}{items.length > 2 && <small className="calendar-more">+{items.length - 2} more</small>}</button>; })}</div></section><aside className="panel calendar-agenda"><div className="calendar-agenda-head"><span className="eyebrow">Selected day</span><h2>{new Intl.DateTimeFormat("en", { dateStyle: "full", timeZone: "Europe/Sofia" }).format(new Date(`${selectedDay}T12:00:00+02:00`))}</h2><span className="hint">{currentEvents.length} sessions · {currentEvents.reduce((sum, event) => sum + event.booked_slots, 0)} bookings</span></div>{currentEvents.length ? currentEvents.map(event => <article className="agenda-event" key={event.id}><div className="agenda-event-time">{formatSessionDate(event.starts_at, { weekday: undefined, day: undefined, month: undefined })}<span className={`status-pill ${event.status}`}>{event.status}</span></div><h3>{event.title}</h3><p><MapPin />{event.location}</p><p><Users />{event.booked_slots}/{event.max_slots} spots booked</p><div className="agenda-attendees">{event.bookings.filter(booking => ["pending", "confirmed"].includes(booking.status)).map(booking => { const profile = one(booking.profiles); return <span key={booking.id}>{profile?.full_name || "Member"} <small>{booking.status}</small></span>; })}{!event.booked_slots && <span className="hint">No bookings yet</span>}</div><Link className="text-link" href="/admin/bookings">Manage bookings <ArrowRight /></Link></article>) : <div className="calendar-empty"><CalendarDays /><strong>No sessions this day</strong><Link className="button button-moss" href="/admin/sessions#add-session">Add a session</Link></div>}</aside></div>;
}
