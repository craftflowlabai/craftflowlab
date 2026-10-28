import { createClient } from "@/lib/supabase/server";
import { AdminUserAccess } from "@/components/admin-user-access";

export default async function AdminClientsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id,full_name,phone,role,account_status,created_at").order("created_at", { ascending: false }).limit(100);
  return <><div className="dashboard-top"><div><span className="eyebrow">People</span><h1 className="page-title">Clients.</h1><p className="page-intro">People who have booked a session and joined the studio.</p></div></div><section className="panel table-panel"><div className="table-wrap"><table className="data-table"><thead><tr><th>Name</th><th>Phone</th><th>Role</th><th>Account</th><th>Joined</th></tr></thead><tbody>{(data || []).filter(p => p.role === "client" || p.role === "user").map(p => <tr key={p.id}><td><strong>{p.full_name || "New member"}</strong></td><td>{p.phone || "—"}</td><td>{p.role}</td><td><AdminUserAccess id={p.id} role={p.role} accountStatus={p.account_status} /></td><td>{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(p.created_at))}</td></tr>)}</tbody></table></div></section></>;
}
