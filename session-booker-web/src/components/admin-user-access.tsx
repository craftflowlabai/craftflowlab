"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AdminUserAccess({ id, role, accountStatus }: { id: string; role: string; accountStatus: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function change(nextStatus: string) {
    if (nextStatus === accountStatus) return;
    const reason = window.prompt(`Reason for changing access to ${nextStatus}:`)?.trim();
    if (!reason) return;
    setBusy(true);
    const { error } = await createClient().rpc("admin_set_user_access", { p_user_id: id, p_role: role, p_account_status: nextStatus, p_reason: reason });
    if (error) window.alert(error.message); else router.refresh();
    setBusy(false);
  }
  return <select aria-label="Change account access" value={accountStatus} disabled={busy} onChange={event => change(event.target.value)}><option value="active">Active</option><option value="pending_review">Pending review</option><option value="rejected">Rejected</option><option value="banned">Banned</option></select>;
}
