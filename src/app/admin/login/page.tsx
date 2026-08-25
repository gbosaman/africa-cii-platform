import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/admin/actions";
import { adminConfigured, isAdmin } from "@/lib/admin/auth";
import { Logo } from "@/components/layout/Logo";

export const metadata: Metadata = { title: "Admin sign-in", robots: { index: false } };

export default function AdminLogin({ searchParams }: { searchParams: { e?: string } }) {
  if (isAdmin()) redirect("/admin");
  const configured = adminConfigured();

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      <div className="panel p-8">
        <div className="mb-6"><Logo /></div>
        <h1 className="display text-2xl text-white">Admin console</h1>
        <p className="mt-2 text-sm text-slate-400">
          Restricted. Writes are audited and persisted via the Supabase service role.
        </p>

        {!configured ? (
          <div className="mt-6 rounded-lg border border-orange-500/30 bg-orange-500/10 p-4 text-sm text-orange-300">
            The console is <span className="font-semibold">locked</span>. Set{" "}
            <code className="figure">ADMIN_ACCESS_KEY</code> in the server environment to enable it.
            No write access is exposed until it is configured.
          </div>
        ) : (
          <form action={loginAction} className="mt-6 space-y-3">
            {searchParams.e && (
              <p className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs text-orange-300">
                Incorrect passphrase.
              </p>
            )}
            <input
              type="password"
              name="key"
              autoComplete="off"
              placeholder="Admin passphrase"
              className="w-full rounded-lg border border-line bg-ink-850 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-gold-500/40 focus:outline-none"
            />
            <button className="clip-slant w-full bg-gold-500 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-ink-900 hover:bg-gold-400">
              Sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
