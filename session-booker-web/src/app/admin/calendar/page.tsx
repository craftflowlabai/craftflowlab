import { createClient } from "@/lib/supabase/server";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { AdminCalendar } from "@/components/admin-calendar";

export default async function AdminCalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const params = await searchParams;
  const currentMonth = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Sofia" }).slice(0, 7);
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.month || "") ? params.month! : currentMonth;
  const [year, monthNumber] = month.split("-").map(Number);
  const offsetMinutes = (at: Date) => {
    const part = new Intl.DateTimeFormat("en", { timeZone: "Europe/Sofia", timeZoneName: "shortOffset" }).formatToParts(at).find(item => item.type === "timeZoneName")?.value || "GMT+2";
    const match = part.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!match) return 120;
    return (match[1] === "+" ? 1 : -1) * (Number(match[2]) * 60 + Number(match[3] || 0));
  };
  const startLocal = new Date(Date.UTC(year, monthNumber - 1, 1));
  const endLocal = new Date(Date.UTC(year, monthNumber, 1));
  const start = new Date(startLocal.getTime() - offsetMinutes(startLocal) * 60_000).toISOString();
  const end = new Date(endLocal.getTime() - offsetMinutes(endLocal) * 60_000).toISOString();
  const supabase = await createClient();
  const { data } = await supabase.from("sessions").select("id,title,starts_at,ends_at,location,status,booked_slots,max_slots,bookings(id,status,profiles(full_name))").gte("starts_at", start).lt("starts_at", end).order("starts_at");
  return <><Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Calendar" }]} /><div className="dashboard-top"><div><span className="eyebrow">Schedule</span><h1 className="page-title">Calendar.</h1><p className="page-intro">Sessions, attendees, and capacity at a glance.</p></div></div><AdminCalendar month={month} events={(data || []) as any} /></>;
}
