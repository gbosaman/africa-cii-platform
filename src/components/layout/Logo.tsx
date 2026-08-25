import Link from "next/link";

// Wordmark echoing the reference: an angular "A" glyph split gold/emerald,
// with a tight condensed lockup. The tagline states the product's job.
export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M16 3 L28 27 H21 L16 15 L11 27 H4 Z" fill="#F5C518" />
        <path d="M16 3 L28 27 H21 L16 15 Z" fill="#16E07A" />
        <circle cx="16" cy="24" r="2.4" fill="#0a1020" />
      </svg>
      <div className="leading-none">
        <div className="display text-[17px] tracking-tight text-white">
          AFRICA<span className="text-gold-500"> CII</span>
        </div>
        <div className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.18em] text-slate-500">
          Creative Intelligence
        </div>
      </div>
    </Link>
  );
}
