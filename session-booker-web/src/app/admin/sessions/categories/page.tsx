import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SessionTypeManager } from "@/components/session-type-manager";
import { SessionCategoryManager } from "@/components/session-category-manager";

export default async function SessionCategoriesPage() {
  const supabase = await createClient();
  const [{ data: types }, { data: categories }] = await Promise.all([
    supabase.from("session_types").select("id,slug,title,description,duration_minutes,default_capacity,default_price,category,category_id,is_active").order("title"),
    supabase.from("session_categories").select("id,slug,name,description,is_active,sort_order").order("sort_order").order("name"),
  ]);
  return <><Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Sessions", href: "/admin/sessions" }, { label: "Categories & types" }]} /><div className="dashboard-top"><div><span className="eyebrow">Session catalog</span><h1 className="page-title">Categories & types.</h1><p className="page-intro">Manage categories and reusable session templates.</p></div><Link className="text-link" href="/admin/sessions"><ArrowLeft /> Back to sessions</Link></div><SessionCategoryManager categories={categories || []} /><SessionTypeManager types={types || []} categories={categories || []} /></>;
}

