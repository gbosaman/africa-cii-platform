import type { MetadataRoute } from "next";

// Web app manifest — lets the site be installed to a home screen and controls
// how it looks when launched standalone.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Africa CII — Creative Industries Intelligence",
    short_name: "Africa CII",
    description:
      "Verified, decision-ready intelligence on Africa's games, esports and animation economy.",
    start_url: "/",
    display: "standalone",
    background_color: "#070a12",
    theme_color: "#070a12",
    // SVG only: it scales to every size cleanly, and generating a PNG at
    // build time via ImageResponse proved unreliable for a purely decorative
    // asset. Modern browsers and iOS 16+ honour the SVG.
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
