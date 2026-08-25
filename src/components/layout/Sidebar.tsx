"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { NAV_GROUPS, NAV_LINKS } from "./nav";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/layout/Logo";

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed left-3 top-3.5 z-50 flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-ink-800 text-slate-200 lg:hidden"
        aria-label="Toggle navigation"
        aria-expanded={open}
      >
        <Icon name={open ? "close" : "grid"} className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-line bg-ink-900/95 backdrop-blur transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-line px-5">
          <Logo />
        </div>

        <nav className="flex h-[calc(100vh-4rem)] flex-col gap-5 overflow-y-auto px-3 py-5">
          {NAV_GROUPS.map((group) => (
            <div key={group}>
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {group}
              </p>
              <div className="space-y-0.5">
                {NAV_LINKS.filter((l) => l.group === group).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={clsx("nav-item", isActive(link.href) && "nav-item-active")}
                  >
                    <Icon name={link.icon} className="h-[18px] w-[18px] shrink-0" />
                    <span className="flex-1">{link.label}</span>
                    {link.phase && link.phase > 1 && (
                      <span className="rounded bg-ink-600 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">
                        P{link.phase}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
