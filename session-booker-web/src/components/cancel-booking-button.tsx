"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function cancel() {
    if (!window.confirm("Cancel this booking?")) return;
    setBusy(true);
    const { error } = await createClient().rpc("cancel_own_booking", { p_booking_id: bookingId, p_reason: "Cancelled by client" });
    if (error) window.alert(error.message); else router.refresh();
    setBusy(false);
  }
  return <button className="table-action" onClick={cancel} disabled={busy}>{busy ? "Cancelling…" : "Cancel"}</button>;
}
