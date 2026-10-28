"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { getAvatarUrl, initials } from "@/lib/format";

type UserMenuProps = { name: string | null; email: string; avatarPath: string | null; role: string };

export function UserMenu({ name, email, avatarPath, role }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const avatarUrl = getAvatarUrl(avatarPath);
  return (
    <div className="user-menu">
      <button
        className="profile-trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onBlur={(event) => {
          if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node)) setOpen(false);
        }}
      >
        <span className="profile-avatar" style={avatarUrl ? { backgroundImage: `url("${avatarUrl}")` } : undefined}>
          {!avatarUrl && initials(name, email)}
        </span>
        <span>{name?.trim() || "My profile"}</span><ChevronDown aria-hidden="true" />
      </button>
      {open && (
        <div className="dropdown-panel" role="menu">
          <div className="dropdown-user"><strong>{name?.trim() || "Northform member"}</strong><span>{role} · {email}</span></div>
          <Link className="dropdown-link" href="/profile" role="menuitem" onClick={() => setOpen(false)}><UserRound aria-hidden="true" /> Profile</Link>
          <form action="/auth/signout" method="post"><button className="dropdown-link danger" type="submit" role="menuitem"><LogOut aria-hidden="true" /> Log Out</button></form>
        </div>
      )}
    </div>
  );
}
