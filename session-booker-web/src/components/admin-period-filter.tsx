"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarRange } from "lucide-react";

export function AdminPeriodFilter({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  function change(period: string) {
    const next = new URLSearchParams(params.toString());
    next.set("period", period);
    router.replace(`${pathname}?${next.toString()}`);
  }
  return <label className="period-filter"><CalendarRange aria-hidden="true" /><span>Reporting period</span><select value={value} onChange={event => change(event.target.value)}><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option></select></label>;
}
