import Link from "next/link";

/**
 * Wordmark: a rounded gradient tile carrying an angular "A", matching the
 * reference's emerald→blue mark. The tagline states the product's job.
 */
export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-gradient-to-br from-accent-400 via-accent-500 to-info-500 shadow-[0_6px_18px_-6px_rgba(34,197,94,0.6)]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 4 L20 20 H16.2 L12 11 L7.8 20 H4 Z"
            fill="#05140b"
            stroke="#05140b"
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="leading-none">
        <span className="block text-[15px] font-bold tracking-tight text-white">
          AFRICA<span className="text-accent-400"> CII</span>
        </span>
        <span className="mt-1 block text-[10px] font-medium text-slate-500">
          Creative Intelligence
        </span>
      </span>
    </Link>
  );
}
