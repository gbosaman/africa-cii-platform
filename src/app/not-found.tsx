import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="display text-7xl text-gold-500">404</p>
      <h1 className="mt-3 text-xl font-semibold text-white">Nothing tracked here</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-400">
        That country, studio or page isn&apos;t in the dataset. Data unavailable is not the same as
        zero — this route simply doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="clip-slant mt-6 bg-gold-500 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-ink-900 hover:bg-gold-400"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
