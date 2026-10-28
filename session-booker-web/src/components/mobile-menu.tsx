"use client";

import Link from "next/link";
import { useState } from "react";
import { LayoutDashboard, LogOut, Menu, ShieldCheck, UserRound, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function MobileMenu({ role }: { role: string | null }) {
  const [open, setOpen] = useState(false);
  const destination = role === "admin" ? "/admin" : "/dashboard";
  const title = role === "admin" ? "Admin" : "Dashboard";
  async function logout() { await createClient().auth.signOut(); window.location.assign("/"); }
  return <div className="mobile-nav"><button className="mobile-menu-button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} onClick={() => setOpen(v => !v)}>{open ? <X /> : <Menu />}</button>{open && <nav className="mobile-nav-panel" aria-label="Mobile navigation"><Link href="/sessions" onClick={() => setOpen(false)}>Sessions</Link><a href="/#approach" onClick={() => setOpen(false)}>Approach</a><a href="/#studio" onClick={() => setOpen(false)}>The studio</a>{role ? <><Link href={destination} onClick={() => setOpen(false)}>{role === "admin" ? <ShieldCheck /> : <LayoutDashboard />}{title}</Link><Link href="/profile" onClick={() => setOpen(false)}><UserRound />Profile</Link><button className="mobile-logout" onClick={() => void logout()}><LogOut />Log out</button></> : <Link href="/login" onClick={() => setOpen(false)}>Log in</Link>}</nav>}</div>;
}
