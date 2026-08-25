export interface NavLink {
  href: string;
  label: string;
  icon: string; // inline SVG path id (see Icon component)
  group: "Intelligence" | "Directories" | "Analysis" | "Trust" | "Admin";
  phase?: 1 | 2 | 3 | 4;
}

export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Dashboard", icon: "grid", group: "Intelligence" },
  { href: "/executive", label: "Executive Dashboard", icon: "grid", group: "Intelligence" },
  { href: "/map", label: "Africa Map", icon: "globe", group: "Intelligence" },
  { href: "/countries", label: "Countries", icon: "globe", group: "Intelligence" },
  { href: "/rankings", label: "Rankings", icon: "bars", group: "Intelligence" },
  { href: "/markets", label: "Markets", icon: "pulse", group: "Intelligence" },
  { href: "/demographics", label: "Demographics", icon: "users", group: "Intelligence" },
  { href: "/hardware", label: "Hardware", icon: "chip", group: "Intelligence" },

  { href: "/studios", label: "Studios", icon: "building", group: "Directories" },
  { href: "/games", label: "Games", icon: "controller", group: "Directories" },
  { href: "/steam", label: "Steam Intelligence", icon: "controller", group: "Directories" },
  { href: "/animation", label: "Animation", icon: "film", group: "Directories" },
  { href: "/esports", label: "Esports", icon: "trophy", group: "Directories" },

  { href: "/compare", label: "Compare", icon: "compare", group: "Analysis" },
  { href: "/explorer", label: "Data Explorer", icon: "table", group: "Analysis" },
  { href: "/trends", label: "Trends", icon: "pulse", group: "Analysis" },
  { href: "/advisor", label: "Studio Advisor", icon: "compass", group: "Analysis" },
  { href: "/investors", label: "Investor Mode", icon: "target", group: "Analysis" },
  { href: "/watchlist", label: "Watchlist", icon: "star", group: "Analysis" },

  { href: "/sources", label: "Sources", icon: "shield", group: "Trust" },
  { href: "/methodology", label: "Methodology", icon: "book", group: "Trust" },

  { href: "/admin", label: "Admin", icon: "lock", group: "Admin" },
];

export const NAV_GROUPS = ["Intelligence", "Directories", "Analysis", "Trust", "Admin"] as const;
