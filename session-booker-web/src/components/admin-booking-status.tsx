"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const statuses = ["pending", "confirmed", "cancelled", "rejected", "completed", "no_show"];

export function AdminBookingStatus({ id, status }: { id: string; status: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function change(next: string) {
    if (next === status) return;
    const reason = ["cancelled", "rejected"].includes(next) ? window.prompt(`Reason for marking this booking ${next}:`)?.trim() : null;
    if (["cancelled", "rejected"].includes(next) && !reason) return;
    setBusy(true);
    const { error } = await createClient().rpc("admin_set_booking_status", { p_booking_id: id, p_new_status: next, p_reason: reason || null });
    if (error) window.alert(error.message); else router.refresh();
    setBusy(false);
  }
  return <select aria-label="Change booking status" value={status} disabled={busy} onChange={event => change(event.target.value)}>{statuses.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select>;
}
