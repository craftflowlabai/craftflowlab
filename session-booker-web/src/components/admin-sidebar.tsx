"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ClipboardList, LayoutDashboard, Tags, Users } from "lucide-react";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/sessions", label: "Sessions", icon: CalendarDays, exact: true },
  { href: "/admin/sessions/categories", label: "Categories & types", icon: Tags },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/bookings", label: "Bookings", icon: ClipboardList },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return <aside className="dashboard-sidebar"><span className="sidebar-label">ADMINISTRATION</span>{links.map(({ href, label, icon: Icon, exact }) => {
    const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
    return <Link key={href} className={`side-link${active ? " active" : ""}`} href={href}><Icon aria-hidden="true" />{label}</Link>;
  })}<span className="sidebar-bottom">NORTHFORM · ADMIN</span></aside>;
}
