// ---------------------------------------------------------------------------
// Creative software catalogue + hardware specification tiers for the advisor.
//
// PRICING IS INDICATIVE PUBLISHED LIST PRICE, researched and dated — not a
// quote. Vendors change prices, run regional pricing, and gate cheaper tiers
// behind eligibility (Autodesk's Indie licence, education pricing, revenue
// thresholds). Every entry carries its official pricing page so the user can
// confirm, and the UI says so plainly.
//
// The most decision-relevant fact here is that a fully capable pipeline can be
// assembled for $0 in licence fees — Blender, Krita and DaVinci Resolve are
// free, and both major engines are free until you are earning real money. For a
// small African studio that difference is often larger than its hardware
// budget, so the advisor surfaces it explicitly rather than burying it.
// ---------------------------------------------------------------------------

export type SoftwareCategory = "3D" | "2D/Art" | "Engine" | "Animation" | "Video" | "Texturing";
export type LicenceModel = "free" | "subscription" | "perpetual" | "royalty" | "freemium";

export interface SoftwareTool {
  id: string;
  name: string;
  category: SoftwareCategory;
  licence: LicenceModel;
  /** Indicative annual cost per seat in USD. 0 = genuinely free. */
  annualUsd: number;
  /** Cheaper eligible tier (e.g. Autodesk Indie), when one exists. */
  indieAnnualUsd?: number;
  indieNote?: string;
  /** Official pricing/product page. */
  url: string;
  priceNote: string;
  checkedAt: string;
  /** A free tool that covers a similar role, for the savings calculation. */
  freeAlternativeId?: string;
}

const CHECKED = "2026-08-25";

export const SOFTWARE_TOOLS: SoftwareTool[] = [
  // ---- Free / open source ----
  {
    id: "blender",
    name: "Blender",
    category: "3D",
    licence: "free",
    annualUsd: 0,
    url: "https://www.blender.org/",
    priceNote: "Free and open source (GPL). Full 3D pipeline: modelling, sculpting, animation, rendering, video edit.",
    checkedAt: CHECKED,
  },
  {
    id: "krita",
    name: "Krita",
    category: "2D/Art",
    licence: "free",
    annualUsd: 0,
    url: "https://krita.org/",
    priceNote: "Free and open source (GPL). Digital painting and 2D animation.",
    checkedAt: CHECKED,
  },
  {
    id: "davinci-resolve",
    name: "DaVinci Resolve",
    category: "Video",
    licence: "freemium",
    annualUsd: 0,
    url: "https://www.blackmagicdesign.com/products/davinciresolve",
    priceNote: "Free version is fully capable for most work; Studio is a one-off perpetual purchase, not a subscription.",
    checkedAt: CHECKED,
  },
  {
    id: "capcut",
    name: "CapCut",
    category: "Video",
    licence: "freemium",
    annualUsd: 0,
    url: "https://www.capcut.com/",
    priceNote: "Free tier covers short-form editing; Pro is subscription.",
    checkedAt: CHECKED,
  },

  // ---- Engines ----
  {
    id: "unreal",
    name: "Unreal Engine",
    category: "Engine",
    licence: "royalty",
    annualUsd: 0,
    url: "https://www.unrealengine.com/en-US/license",
    priceNote:
      "No licence fee to develop or ship. A royalty applies only after the product passes a lifetime gross revenue threshold — cost arrives with success, not before it.",
    checkedAt: CHECKED,
  },
  {
    id: "unity",
    name: "Unity",
    category: "Engine",
    licence: "freemium",
    annualUsd: 0,
    url: "https://unity.com/pricing",
    priceNote:
      "Free tier for studios under Unity's revenue/funding threshold; paid tiers above it. Check the current threshold before assuming you qualify.",
    checkedAt: CHECKED,
  },

  // ---- Autodesk ----
  {
    id: "maya",
    name: "Autodesk Maya",
    category: "3D",
    licence: "subscription",
    annualUsd: 1785,
    indieAnnualUsd: 250,
    indieNote:
      "Autodesk Indie licence is dramatically cheaper for qualifying small studios and freelancers under a revenue cap — check eligibility, it is often the single largest saving available.",
    url: "https://www.autodesk.com/products/maya/overview",
    priceNote: "~$1,785/yr standard subscription (~$225/month rolling).",
    checkedAt: CHECKED,
    freeAlternativeId: "blender",
  },
  {
    id: "3ds-max",
    name: "Autodesk 3ds Max",
    category: "3D",
    licence: "subscription",
    annualUsd: 1785,
    indieAnnualUsd: 250,
    indieNote: "Autodesk Indie licence available for qualifying small studios and freelancers.",
    url: "https://www.autodesk.com/products/3ds-max/overview",
    priceNote: "Standard subscription is in the same band as Maya; Indie tier is far lower.",
    checkedAt: CHECKED,
    freeAlternativeId: "blender",
  },

  // ---- Maxon ----
  {
    id: "cinema4d",
    name: "Cinema 4D",
    category: "3D",
    licence: "subscription",
    annualUsd: 839,
    url: "https://www.maxon.net/en/cinema-4d",
    priceNote: "~$69.91/month billed annually (~$839/yr); higher on a rolling monthly plan.",
    checkedAt: CHECKED,
    freeAlternativeId: "blender",
  },
  {
    id: "zbrush",
    name: "ZBrush",
    category: "3D",
    licence: "subscription",
    annualUsd: 1265,
    url: "https://www.maxon.net/en/zbrush",
    priceNote:
      "Commonly bought inside the Maxon One bundle (~$105/month billed annually), which also includes Cinema 4D and Redshift — bundle first if you need more than one Maxon tool.",
    checkedAt: CHECKED,
    freeAlternativeId: "blender",
  },

  // ---- Adobe ----
  {
    id: "photoshop",
    name: "Photoshop",
    category: "2D/Art",
    licence: "subscription",
    annualUsd: 276,
    url: "https://www.adobe.com/creativecloud/plans.html",
    priceNote: "~$22.99/month single-app on an annual plan (~$276/yr).",
    checkedAt: CHECKED,
    freeAlternativeId: "krita",
  },
  {
    id: "after-effects",
    name: "After Effects",
    category: "Video",
    licence: "subscription",
    annualUsd: 276,
    url: "https://www.adobe.com/creativecloud/plans.html",
    priceNote: "~$22.99/month single-app on an annual plan (~$276/yr).",
    checkedAt: CHECKED,
  },
  {
    id: "premiere-pro",
    name: "Premiere Pro",
    category: "Video",
    licence: "subscription",
    annualUsd: 276,
    url: "https://www.adobe.com/creativecloud/plans.html",
    priceNote: "~$22.99/month single-app on an annual plan (~$276/yr).",
    checkedAt: CHECKED,
    freeAlternativeId: "davinci-resolve",
  },
  {
    id: "substance-painter",
    name: "Substance 3D Painter",
    category: "Texturing",
    licence: "perpetual",
    annualUsd: 200,
    url: "https://www.adobe.com/products/substance3d/apps/painter.html",
    priceNote:
      "~$200 perpetual licence via Steam, or included in the Substance 3D subscription. Perpetual suits studios that cannot carry recurring cost.",
    checkedAt: CHECKED,
    freeAlternativeId: "blender",
  },

  // ---- 2D animation ----
  {
    id: "toon-boom",
    name: "Toon Boom Harmony",
    category: "Animation",
    licence: "subscription",
    annualUsd: 752,
    url: "https://shop.toonboom.com/en",
    priceNote:
      "Tiered: Essentials ~$588/yr, Advanced ~$752/yr, Premium ~$1,128/yr. Modelled at the Advanced tier — pick the tier you actually need.",
    checkedAt: CHECKED,
    freeAlternativeId: "krita",
  },
  {
    id: "moho",
    name: "Moho Pro",
    category: "Animation",
    licence: "perpetual",
    annualUsd: 400,
    url: "https://moho.lostmarble.com/",
    priceNote:
      "~$400 perpetual licence (not a subscription), with cheaper upgrade pricing between versions.",
    checkedAt: CHECKED,
    freeAlternativeId: "krita",
  },
];

export const SOFTWARE_BY_ID: Record<string, SoftwareTool> = Object.fromEntries(
  SOFTWARE_TOOLS.map((t) => [t.id, t]),
);

// ---------------------------------------------------------------------------
// Hardware specification tiers.
//
// Prices are ASSUMPTIONS the user can change, for the same reason the hardware
// page carries no price data: no free licensable source publishes African
// retail hardware pricing. The advisor applies the country's real applied
// tariff on top of whichever tier is chosen.
// ---------------------------------------------------------------------------

export interface HardwareTier {
  id: string;
  label: string;
  spec: string;
  priceUsd: number;
  suitedTo: string;
}

export const HARDWARE_TIERS: HardwareTier[] = [
  {
    id: "entry-2d",
    label: "Entry — 2D / design",
    spec: "Integrated or entry GPU · 16 GB RAM · 512 GB SSD",
    priceUsd: 700,
    suitedTo: "2D art, comics, design, light editing, mobile game development.",
  },
  {
    id: "mid-3d",
    label: "Mid — 3D & game dev",
    spec: "Dedicated GPU ~8 GB VRAM · 32 GB RAM · 1 TB NVMe",
    priceUsd: 1500,
    suitedTo: "Real-time 3D, Unity/Unreal development, moderate sculpting and texturing.",
  },
  {
    id: "high-3d",
    label: "High — heavy 3D / animation",
    spec: "GPU ~16 GB VRAM · 64 GB RAM · 2 TB NVMe",
    priceUsd: 3000,
    suitedTo: "Complex scenes, GPU rendering, film-quality animation, VFX compositing.",
  },
  {
    id: "workstation",
    label: "Workstation — render / studio",
    spec: "GPU 24 GB+ VRAM · 128 GB RAM · 4 TB NVMe",
    priceUsd: 5500,
    suitedTo: "Render nodes, large animation pipelines, simulation-heavy work.",
  },
];

export const HARDWARE_BY_ID: Record<string, HardwareTier> = Object.fromEntries(
  HARDWARE_TIERS.map((t) => [t.id, t]),
);

/** Annual licence cost for a selection, honouring the Indie tier when chosen. */
export function softwareAnnualCost(ids: string[], useIndie: boolean): number {
  return ids.reduce((sum, id) => {
    const t = SOFTWARE_BY_ID[id];
    if (!t) return sum;
    const price = useIndie && t.indieAnnualUsd !== undefined ? t.indieAnnualUsd : t.annualUsd;
    return sum + price;
  }, 0);
}

/**
 * What the studio would save per seat per year by swapping each paid tool for
 * its free counterpart. Returned so the UI can show the trade-off honestly —
 * free tools are capable, not identical, and switching has a learning cost.
 */
export function freeAlternativeSaving(
  ids: string[],
  useIndie: boolean,
): { savingUsd: number; swaps: { from: string; to: string; saves: number }[] } {
  const swaps: { from: string; to: string; saves: number }[] = [];
  let savingUsd = 0;
  for (const id of ids) {
    const t = SOFTWARE_BY_ID[id];
    if (!t?.freeAlternativeId) continue;
    const alt = SOFTWARE_BY_ID[t.freeAlternativeId];
    if (!alt) continue;
    const price = useIndie && t.indieAnnualUsd !== undefined ? t.indieAnnualUsd : t.annualUsd;
    if (price <= 0) continue;
    swaps.push({ from: t.name, to: alt.name, saves: price });
    savingUsd += price;
  }
  return { savingUsd, swaps };
}
