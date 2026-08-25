import type { Country } from "@/lib/types";

// ---------------------------------------------------------------------------
// The 54 UN-recognised African member states.
// ISO 3166-1 codes, capitals and UN sub-regions are verifiable facts, not
// estimates. This is the geographic backbone every other dataset joins to.
// Source: ISO 3166 / UN Statistics Division geographic regions (M49).
// ---------------------------------------------------------------------------

export const COUNTRIES: Country[] = [
  // Northern Africa
  { iso3: "DZA", iso2: "DZ", name: "Algeria", region: "Northern Africa", capital: "Algiers" },
  { iso3: "EGY", iso2: "EG", name: "Egypt", region: "Northern Africa", capital: "Cairo" },
  { iso3: "LBY", iso2: "LY", name: "Libya", region: "Northern Africa", capital: "Tripoli" },
  { iso3: "MAR", iso2: "MA", name: "Morocco", region: "Northern Africa", capital: "Rabat" },
  { iso3: "SDN", iso2: "SD", name: "Sudan", region: "Northern Africa", capital: "Khartoum" },
  { iso3: "TUN", iso2: "TN", name: "Tunisia", region: "Northern Africa", capital: "Tunis" },

  // Western Africa
  { iso3: "BEN", iso2: "BJ", name: "Benin", region: "Western Africa", capital: "Porto-Novo" },
  { iso3: "BFA", iso2: "BF", name: "Burkina Faso", region: "Western Africa", capital: "Ouagadougou" },
  { iso3: "CPV", iso2: "CV", name: "Cabo Verde", region: "Western Africa", capital: "Praia" },
  { iso3: "CIV", iso2: "CI", name: "Côte d'Ivoire", region: "Western Africa", capital: "Yamoussoukro" },
  { iso3: "GMB", iso2: "GM", name: "Gambia", region: "Western Africa", capital: "Banjul" },
  { iso3: "GHA", iso2: "GH", name: "Ghana", region: "Western Africa", capital: "Accra" },
  { iso3: "GIN", iso2: "GN", name: "Guinea", region: "Western Africa", capital: "Conakry" },
  { iso3: "GNB", iso2: "GW", name: "Guinea-Bissau", region: "Western Africa", capital: "Bissau" },
  { iso3: "LBR", iso2: "LR", name: "Liberia", region: "Western Africa", capital: "Monrovia" },
  { iso3: "MLI", iso2: "ML", name: "Mali", region: "Western Africa", capital: "Bamako" },
  { iso3: "MRT", iso2: "MR", name: "Mauritania", region: "Western Africa", capital: "Nouakchott" },
  { iso3: "NER", iso2: "NE", name: "Niger", region: "Western Africa", capital: "Niamey" },
  { iso3: "NGA", iso2: "NG", name: "Nigeria", region: "Western Africa", capital: "Abuja" },
  { iso3: "SEN", iso2: "SN", name: "Senegal", region: "Western Africa", capital: "Dakar" },
  { iso3: "SLE", iso2: "SL", name: "Sierra Leone", region: "Western Africa", capital: "Freetown" },
  { iso3: "TGO", iso2: "TG", name: "Togo", region: "Western Africa", capital: "Lomé" },

  // Eastern Africa
  { iso3: "BDI", iso2: "BI", name: "Burundi", region: "Eastern Africa", capital: "Gitega" },
  { iso3: "COM", iso2: "KM", name: "Comoros", region: "Eastern Africa", capital: "Moroni" },
  { iso3: "DJI", iso2: "DJ", name: "Djibouti", region: "Eastern Africa", capital: "Djibouti" },
  { iso3: "ERI", iso2: "ER", name: "Eritrea", region: "Eastern Africa", capital: "Asmara" },
  { iso3: "ETH", iso2: "ET", name: "Ethiopia", region: "Eastern Africa", capital: "Addis Ababa" },
  { iso3: "KEN", iso2: "KE", name: "Kenya", region: "Eastern Africa", capital: "Nairobi" },
  { iso3: "MDG", iso2: "MG", name: "Madagascar", region: "Eastern Africa", capital: "Antananarivo" },
  { iso3: "MWI", iso2: "MW", name: "Malawi", region: "Eastern Africa", capital: "Lilongwe" },
  { iso3: "MUS", iso2: "MU", name: "Mauritius", region: "Eastern Africa", capital: "Port Louis" },
  { iso3: "MOZ", iso2: "MZ", name: "Mozambique", region: "Eastern Africa", capital: "Maputo" },
  { iso3: "RWA", iso2: "RW", name: "Rwanda", region: "Eastern Africa", capital: "Kigali" },
  { iso3: "SYC", iso2: "SC", name: "Seychelles", region: "Eastern Africa", capital: "Victoria" },
  { iso3: "SOM", iso2: "SO", name: "Somalia", region: "Eastern Africa", capital: "Mogadishu" },
  { iso3: "SSD", iso2: "SS", name: "South Sudan", region: "Eastern Africa", capital: "Juba" },
  { iso3: "TZA", iso2: "TZ", name: "Tanzania", region: "Eastern Africa", capital: "Dodoma" },
  { iso3: "UGA", iso2: "UG", name: "Uganda", region: "Eastern Africa", capital: "Kampala" },
  { iso3: "ZMB", iso2: "ZM", name: "Zambia", region: "Eastern Africa", capital: "Lusaka" },
  { iso3: "ZWE", iso2: "ZW", name: "Zimbabwe", region: "Eastern Africa", capital: "Harare" },

  // Middle Africa
  { iso3: "AGO", iso2: "AO", name: "Angola", region: "Middle Africa", capital: "Luanda" },
  { iso3: "CMR", iso2: "CM", name: "Cameroon", region: "Middle Africa", capital: "Yaoundé" },
  { iso3: "CAF", iso2: "CF", name: "Central African Republic", region: "Middle Africa", capital: "Bangui" },
  { iso3: "TCD", iso2: "TD", name: "Chad", region: "Middle Africa", capital: "N'Djamena" },
  { iso3: "COG", iso2: "CG", name: "Congo (Republic)", region: "Middle Africa", capital: "Brazzaville" },
  { iso3: "COD", iso2: "CD", name: "Congo (DR)", region: "Middle Africa", capital: "Kinshasa" },
  { iso3: "GNQ", iso2: "GQ", name: "Equatorial Guinea", region: "Middle Africa", capital: "Malabo" },
  { iso3: "GAB", iso2: "GA", name: "Gabon", region: "Middle Africa", capital: "Libreville" },
  { iso3: "STP", iso2: "ST", name: "São Tomé and Príncipe", region: "Middle Africa", capital: "São Tomé" },

  // Southern Africa
  { iso3: "BWA", iso2: "BW", name: "Botswana", region: "Southern Africa", capital: "Gaborone" },
  { iso3: "SWZ", iso2: "SZ", name: "Eswatini", region: "Southern Africa", capital: "Mbabane" },
  { iso3: "LSO", iso2: "LS", name: "Lesotho", region: "Southern Africa", capital: "Maseru" },
  { iso3: "NAM", iso2: "NA", name: "Namibia", region: "Southern Africa", capital: "Windhoek" },
  { iso3: "ZAF", iso2: "ZA", name: "South Africa", region: "Southern Africa", capital: "Pretoria" },
];

export const COUNTRY_BY_ISO3: Record<string, Country> = Object.fromEntries(
  COUNTRIES.map((c) => [c.iso3, c]),
);

export function getCountry(iso3: string): Country | undefined {
  return COUNTRY_BY_ISO3[iso3.toUpperCase()];
}

/** Regional-indicator flag emoji from the ISO2 code. */
export function flagEmoji(iso2: string): string {
  return iso2
    .toUpperCase()
    .replace(/./g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)));
}

export const REGIONS = [
  "Northern Africa",
  "Western Africa",
  "Eastern Africa",
  "Middle Africa",
  "Southern Africa",
] as const;
