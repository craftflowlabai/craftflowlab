import Link from "next/link";

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Northform home">
      <span className="brand-mark"><svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M9 23V9l14 14V9" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.8" /></svg></span>
      <span>NORTHFORM</span>
    </Link>
  );
}
