import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SessionTypeManager } from "@/components/session-type-manager";

export default async function SessionCategoriesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("session_types").select("id,slug,title,description,duration_minutes,default_capacity,default_price,category,is_active").order("title");
  return <><Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Sessions", href: "/admin/sessions" }, { label: "Categories & types" }]} /><div className="dashboard-top"><div><span className="eyebrow">Session catalog</span><h1 className="page-title">Categories & types.</h1><p className="page-intro">Manage reusable formats and default booking details.</p></div><Link className="text-link" href="/admin/sessions"><ArrowLeft /> Back to sessions</Link></div><SessionTypeManager types={data || []} /></>;
}
