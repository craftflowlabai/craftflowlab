import Link from "next/link";
import { Activity } from "lucide-react";

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Northform home">
      <span className="brand-mark"><Activity aria-hidden="true" /></span>
      <span>NORTHFORM</span>
    </Link>
  );
}
