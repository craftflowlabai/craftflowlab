"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Radio, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type NotificationRow = {
  id: string; recipient_id: string; notification_type: string; title: string;
  message: string; href: string; read_at: string | null; created_at: string;
};

export function NotificationCenter({ userId, initialItems }: { userId: string; initialItems: NotificationRow[] }) {
  const [items, setItems] = useState(initialItems);
  const [open, setOpen] = useState(false);
  const [live, setLive] = useState(false);
  const unread = useMemo(() => items.filter(item => !item.read_at).length, [items]);

  useEffect(() => { setLive(window.localStorage.getItem("northform-live-notifications") === "on"); }, []);

  useEffect(() => {
    if (!live) return;
    const supabase = createClient();
    const channel = supabase.channel(`notifications:${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` }, payload => {
        const row = payload.new as NotificationRow;
        setItems(current => [row, ...current.filter(item => item.id !== row.id)].slice(0, 30));
        if (document.hidden && "Notification" in window && Notification.permission === "granted") {
          new Notification(row.title, { body: row.message });
        }
      }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [live, userId]);

  function setLiveMode(value: boolean) {
    setLive(value);
    window.localStorage.setItem("northform-live-notifications", value ? "on" : "off");
  }

  async function markRead(item: NotificationRow) {
    if (!item.read_at) {
      const now = new Date().toISOString();
      setItems(current => current.map(row => row.id === item.id ? { ...row, read_at: now } : row));
      await createClient().from("notifications").update({ read_at: now }).eq("id", item.id);
    }
  }

  async function markAllRead() {
    const now = new Date().toISOString();
    setItems(current => current.map(row => ({ ...row, read_at: row.read_at || now })));
    await createClient().from("notifications").update({ read_at: now }).eq("recipient_id", userId).is("read_at", null);
  }

  async function allowDesktopAlerts() {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
      setLiveMode(true);
    }
  }

  return <div className="notification-wrap">
    <button className="notification-trigger" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} aria-expanded={open} onClick={() => setOpen(v => !v)}>
      <Bell aria-hidden="true" />{unread > 0 && <span className="notification-count">{unread > 9 ? "9+" : unread}</span>}
    </button>
    {open && <section className="notification-panel" aria-label="Notification center">
      <header><div><strong>Notifications</strong><span>{unread ? `${unread} unread` : "You're all caught up"}</span></div><button className="icon-button" aria-label="Close notifications" onClick={() => setOpen(false)}><X /></button></header>
      <div className="notification-controls"><button className={`live-toggle${live ? " enabled" : ""}`} onClick={() => setLiveMode(!live)}><Radio />Live updates {live ? "On" : "Off"}</button>{unread > 0 && <button className="mark-read" onClick={markAllRead}><CheckCheck />Mark all read</button>}</div>
      {typeof Notification !== "undefined" && Notification.permission !== "granted" && <button className="desktop-alert-link" onClick={allowDesktopAlerts}>Allow optional desktop alerts</button>}
      <div className="notification-list">{items.length ? items.map(item => <Link key={item.id} href={item.href} className={`notification-item${item.read_at ? " read" : ""}`} onClick={() => { void markRead(item); setOpen(false); }}><span className="notification-dot" /><span><strong>{item.title}</strong><small>{item.message}</small><time>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))}</time></span></Link>) : <div className="notification-empty"><Bell /><strong>No notifications yet</strong><span>Booking updates will appear here.</span></div>}</div>
    </section>}
  </div>;
}
