"use client";

import { useState, type FormEvent } from "react";
import { ArrowUpRight, CalendarDays, Check, Clock3, MessageCircle, Send, Sparkles } from "lucide-react";

type Message = { role: "assistant" | "visitor"; text: string };
type SessionOption = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  price: number | string;
  currency: string;
  location: string;
  session_type_id: string | null;
  booked_slots: number;
  max_slots: number;
};
type ContactMode = "booking" | "handoff" | null;

const initialMessage: Message = {
  role: "assistant",
  text: "Здравейте! Аз съм виртуалният рецепционист на Studio North. Мога да разкажа за услугите и цените, да проверя свободните сесии или да ви помогна със записване. Какво търсите?",
};
const suggestedQuestions = ["Покажи ми услугите и цените", "Какви часове са свободни?", "Искам да запазя час"];

function formatSessionDate(value: string) {
  return new Intl.DateTimeFormat("bg-BG", {
    timeZone: "Europe/Sofia",
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatPrice(value: number | string, currency: string) {
  return new Intl.NumberFormat("bg-BG", { style: "currency", currency }).format(Number(value));
}

export function ReceptionistDemo() {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState("");
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [busy, setBusy] = useState(false);
  const [contactMode, setContactMode] = useState<ContactMode>(null);
  const [selectedSession, setSelectedSession] = useState<SessionOption | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [formError, setFormError] = useState("");

  async function sendMessage(rawText: string) {
    const text = rawText.trim();
    if (!text || busy) return;
    const nextMessages = [...messages, { role: "visitor" as const, text }];
    setMessages(nextMessages);
    setInput("");
    setSessions([]);
    setBusy(true);
    try {
      const response = await fetch("/api/receptionist/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.map((message) => ({ role: message.role === "visitor" ? "user" : "assistant", content: message.text })) }),
      });
      const data = await response.json() as { reply?: string; error?: string; sessions?: SessionOption[] };
      if (!response.ok) throw new Error(data.error || "Съобщението не беше изпратено.");
      setMessages((current) => [...current, { role: "assistant", text: data.reply || "Мога да помогна с услугите и часовете." }]);
      setSessions(data.sessions || []);
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", text: error instanceof Error ? error.message : "Не успях да отговоря. Опитайте отново." }]);
    } finally {
      setBusy(false);
    }
  }

  function openBooking(session: SessionOption) {
    setSelectedSession(session);
    setContactMode("booking");
    setConsent(false);
    setFormError("");
  }

  function openHandoff() {
    setSelectedSession(null);
    setContactMode("handoff");
    setConsent(false);
    setFormError("");
  }

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consent) {
      setFormError("Моля, потвърдете съгласието за обработка на данните.");
      return;
    }
    if (contactMode === "booking" && !selectedSession) return;
    setBusy(true);
    setFormError("");
    const endpoint = contactMode === "booking" ? "/api/receptionist/book" : "/api/receptionist/handoff";
    const body = contactMode === "booking"
      ? { sessionId: selectedSession?.id, fullName: contactName, phone: contactPhone, email: contactEmail, consent: true }
      : { fullName: contactName, phone: contactPhone, email: contactEmail, message: [...messages].reverse().find((message) => message.role === "visitor")?.text || "Посетителят поиска разговор с екипа.", consent: true };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json() as { error?: string; confirmed?: boolean; submitted?: boolean };
      if (!response.ok) throw new Error(data.error || "Заявката не беше изпратена.");

      if (contactMode === "booking" && selectedSession) {
        setSessions((current) => current.filter((session) => session.id !== selectedSession.id));
        setMessages((current) => [...current, {
          role: "assistant",
          text: `Готово, ${contactName.trim()}! Запазихме ${selectedSession.title} за ${formatSessionDate(selectedSession.starts_at)}. Екипът получи известие в админ панела. Потвърждението е тук в разговора; имейл/SMS напомнянията се включват след настройка на изпращача.`,
        }]);
      } else {
        setMessages((current) => [...current, { role: "assistant", text: `Благодаря, ${contactName.trim()}! Предадох запитването към екипа. Те ще се свържат с вас на посочения телефон.` }]);
      }
      setContactMode(null);
      setSelectedSession(null);
      setContactName("");
      setContactPhone("");
      setContactEmail("");
      setConsent(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Не успях да изпратя заявката.");
    } finally {
      setBusy(false);
    }
  }

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <section className="receptionist-demo" id="demo" aria-labelledby="demo-title">
      <div className="demo-intro"><span className="eyebrow">Свързан с календара на Studio North</span><h2 id="demo-title">Пробвайте живия рецепционист.</h2><p>Задайте въпрос на български. Отговорите, услугите, цените и свободните сесии се зареждат от сайта и актуалната му база данни.</p><div className="demo-assurances"><span><Check aria-hidden="true" /> Истински каталог и график</span><span><Check aria-hidden="true" /> Записване без регистрация</span><span><Check aria-hidden="true" /> Известие към екипа</span></div></div>
      <div className="chat-window" aria-label="Разговор с виртуален рецепционист">
        <div className="chat-topbar"><div className="chat-brand-mark"><Sparkles aria-hidden="true" /></div><div className="chat-business"><strong>Studio North</strong><span><i /> Виртуален рецепционист · онлайн</span></div><span className="chat-demo-badge">LIVE</span></div>
        <div className="chat-context"><span><CalendarDays aria-hidden="true" /> Сесии и записвания</span><span><Clock3 aria-hidden="true" /> Отговаря 24/7</span></div>
        <div className="chat-messages" aria-live="polite" aria-busy={busy}>
          {messages.map((message, index) => <div className={`chat-message-row ${message.role === "visitor" ? "visitor-row" : "assistant-row"}`} key={`${index}-${message.text.slice(0, 14)}`}>
            {message.role === "assistant" && <span className="chat-avatar"><Sparkles aria-hidden="true" /></span>}
            <div className={`chat-bubble ${message.role === "visitor" ? "visitor-bubble" : "assistant-bubble"}`}><p>{message.text}</p>{index === 0 && <div className="chat-choices">{suggestedQuestions.map((question) => <button key={question} type="button" onClick={() => void sendMessage(question)} disabled={busy}>{question}<ArrowUpRight aria-hidden="true" /></button>)}</div>}</div>
          </div>)}
          {busy && <div className="chat-message-row assistant-row"><span className="chat-avatar"><Sparkles aria-hidden="true" /></span><div className="chat-bubble assistant-bubble"><p>Проверявам информацията…</p></div></div>}
          {sessions.length > 0 && <div className="chat-session-options"><strong>Свободни сесии от календара</strong>{sessions.map((session) => <article className="chat-session-option" key={session.id}><div><strong>{session.title}</strong><span>{formatSessionDate(session.starts_at)}</span><small>{formatPrice(session.price, session.currency)} · {session.max_slots - session.booked_slots} свободни места · {session.location}</small></div><button type="button" className="chat-book-option" onClick={() => openBooking(session)}>Избери часа</button></article>)}</div>}
          {contactMode && <form className="chat-contact-form" onSubmit={(event) => void submitContact(event)}>
            <div className="chat-form-heading"><strong>{contactMode === "booking" ? "Потвърдете записването" : "Заявка към екипа"}</strong><button type="button" onClick={() => setContactMode(null)} aria-label="Затвори формата">×</button></div>
            {contactMode === "booking" && selectedSession && <p className="chat-selected-session">{selectedSession.title} · {formatSessionDate(selectedSession.starts_at)} · {formatPrice(selectedSession.price, selectedSession.currency)}</p>}
            <label>Име<input required minLength={2} maxLength={100} autoComplete="name" value={contactName} onChange={(event) => setContactName(event.target.value)} placeholder="Вашето име" /></label>
            <label>Телефон<input required type="tel" autoComplete="tel" value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} placeholder="+359…" /></label>
            <label>Имейл <span>(по желание)</span><input type="email" autoComplete="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} placeholder="name@example.com" /></label>
            <label className="chat-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />{contactMode === "booking" ? "Съгласен/на съм данните ми да се използват за управление на записването." : "Съгласен/на съм контактите и запитването ми да бъдат предадени на екипа."}</label>
            {formError && <p className="chat-form-error" role="alert">{formError}</p>}
            <button className="button button-moss chat-submit" type="submit" disabled={busy || !consent}>{busy ? "Изпращане…" : contactMode === "booking" ? "Потвърди часа" : "Изпрати към екипа"}<ArrowUpRight aria-hidden="true" /></button>
          </form>}
        </div>
        <form className="chat-composer" onSubmit={submitMessage}><label className="sr-only" htmlFor="receptionist-message">Съобщение до рецепциониста</label><input id="receptionist-message" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Напишете съобщение…" disabled={busy || Boolean(contactMode)} /><button type="submit" aria-label="Изпрати съобщение" disabled={busy || Boolean(contactMode)}><Send aria-hidden="true" /></button></form>
        <div className="chat-footer-actions"><button type="button" onClick={openHandoff} disabled={busy || Boolean(contactMode)}><MessageCircle aria-hidden="true" /> Свържи ме с човек</button><span>Историята не се пази в базата на сайта</span></div>
        <div className="chat-footnote"><MessageCircle aria-hidden="true" /> Съобщенията се обработват от AI доставчик и не се пазят в базата на сайта; записванията се потвърждават в календара.</div>
      </div>
    </section>
  );
}
