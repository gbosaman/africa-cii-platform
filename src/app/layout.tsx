import type { Metadata, Viewport } from "next";
import { Inter, Archivo, JetBrains_Mono, Anton, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MetricDrawerProvider } from "@/components/metric/MetricDrawerProvider";
import { resolveSiteUrl } from "@/lib/site-url";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

// Heavy condensed pair for the hero forecast figures. Anton carries the
// numerals, Barlow Condensed the uppercase labels beneath them. Both are
// self-hosted by next/font — no external stylesheet, no CDN request.
const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-poster",
  display: "swap",
});
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-poster-label",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Africa CII — Creative Industries Intelligence",
    template: "%s · Africa CII",
  },
  description:
    "Verified, decision-ready intelligence on Africa's games, esports and animation economy — country, market, studio and game level.",
  metadataBase: resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  // Tints the browser chrome on mobile to match the app background.
  themeColor: "#070a12",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${archivo.variable} ${mono.variable} ${anton.variable} ${barlowCondensed.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <MetricDrawerProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
              <Topbar />
              <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
                {children}
              </main>
              <footer className="border-t border-line px-6 py-6 text-xs text-slate-500">
                <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3">
                  <span>
                    Africa Creative Industries Intelligence · Phase 1 MVP · Data is
                    verified & source-traced. Estimates are labelled.
                  </span>
                  <span className="figure">ISO 3166-1 · World Bank WDI (CC BY-4.0)</span>
                </div>
              </footer>
            </div>
          </div>
        </MetricDrawerProvider>
      </body>
    </html>
  );
}
