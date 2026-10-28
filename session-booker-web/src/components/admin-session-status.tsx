"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AdminSessionStatus({ id, status }: { id: string; status: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function change(next: string) {
    if (next === status) return;
    let reason: string | null = null;
    if (next === "cancelled") {
      reason = window.prompt("Reason for cancelling this session:")?.trim() || null;
      if (!reason) return;
    }
    setBusy(true);
    const { error } = await createClient().from("sessions").update({ status: next, cancelled_at: next === "cancelled" ? new Date().toISOString() : null, cancel_reason: reason }).eq("id", id);
    if (error) window.alert(error.message); else router.refresh();
    setBusy(false);
  }
  return <select aria-label="Change session status" value={status} disabled={busy} onChange={event => change(event.target.value)}><option value="draft">Draft</option><option value="published">Published</option><option value="cancelled">Cancelled</option><option value="completed">Completed</option></select>;
}
