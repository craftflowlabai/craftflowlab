"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function BookSessionButton({ sessionId, full = false }: { sessionId: string; full?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  async function book() {
    setBusy(true); setMessage("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push(`/login?next=${encodeURIComponent("/sessions")}`); return; }
    const { error } = await supabase.rpc("book_for_session", { p_session_id: sessionId });
    if (error) setMessage(error.message);
    else { setMessage("You’re booked. See you there!"); router.refresh(); }
    setBusy(false);
  }
  return <div className="book-action"><button className={`button${full ? " button-moss" : " button-light"}`} onClick={book} disabled={busy || full}>{busy ? <LoaderCircle className="spin" /> : <ArrowRight />}{full ? "Fully booked" : busy ? "Booking…" : "Book this session"}</button>{message && <span className="form-message" role="status">{message}</span>}</div>;
}
