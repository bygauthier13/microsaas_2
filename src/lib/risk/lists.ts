/**
 * Reference risk lists. These are CONFIGURATION, not law: every firm must keep its
 * own business-wide risk assessment and verify the lists on the "as of" dates below.
 * Firms can add countries in Settings → Risk lists.
 */

export const LISTS_AS_OF = {
  euHighRisk: "29 January 2026 (Delegated Regulation (EU) 2016/1675 as amended by 2025/1184, 2026/46 and 2026/83)",
  fatf: "FATF plenary of 17–19 June 2026",
};

/** EU list of high-risk third countries (AMLR Art. 29 / Delegated Reg. 2016/1675). 26 jurisdictions. */
export const EU_HIGH_RISK = new Set([
  "AF", "DZ", "AO", "BO", "VG", "CM", "CI", "KP", "CD", "HT", "IR", "KE", "LA",
  "LB", "MC", "MM", "NA", "NP", "RU", "SS", "SY", "TT", "VU", "VE", "VN", "YE",
]);

/** FATF "black list" — high-risk jurisdictions subject to a call for action. */
export const FATF_CALL_FOR_ACTION = new Set(["IR", "KP", "MM"]);

/** FATF "grey list" — jurisdictions under increased monitoring (22). */
export const FATF_GREY = new Set([
  "AO", "BO", "BA", "BG", "CM", "CI", "CD", "HT", "IQ", "KE", "KW",
  "LA", "LB", "MC", "NP", "PG", "SS", "SY", "VE", "VN", "VG", "YE",
]);

/** EU luxury-goods sales bans: Reg. (EU) 833/2014 Art. 3h (Russia) and Reg. (EC) 765/2006 (Belarus). */
export const LUXURY_GOODS_EMBARGO = new Set(["RU", "BY"]);

/** Comprehensive-sanctions / countermeasure jurisdictions treated as prohibited by default. */
export const PROHIBITED_JURISDICTIONS = new Set(["IR", "KP"]);

/** Offshore holding jurisdictions commonly used for yacht / aircraft SPVs (heuristic, configurable). */
export const OFFSHORE_HOLDING = new Set([
  "VG", "KY", "MH", "SC", "PA", "BZ", "KN", "WS", "VU", "LR", "BS", "BM",
  "AI", "TC", "JE", "GG", "IM", "GI", "LI", "CK", "MU",
]);

/** Financial Intelligence Units that receive Article 74 threshold reports (verify locally). */
export const FIU_BY_COUNTRY: Record<string, string> = {
  AT: "A-FIU (Geldwäschemeldestelle, Bundeskriminalamt)",
  BE: "CTIF-CFI",
  BG: "Financial Intelligence Directorate (SANS)",
  HR: "Anti-Money Laundering Office (Ured za sprječavanje pranja novca)",
  CY: "MOKAS",
  CZ: "Finanční analytický úřad (FAU)",
  DK: "Hvidvasksekretariatet (Danish FIU)",
  EE: "Rahapesu Andmebüroo (FIU Estonia)",
  FI: "Rahanpesun selvittelykeskus (FIU Finland)",
  FR: "TRACFIN",
  DE: "FIU (Zentralstelle für Finanztransaktionsuntersuchungen)",
  GR: "Hellenic FIU (Anti-Money Laundering Authority)",
  HU: "Hungarian FIU (NAV)",
  IE: "FIU Ireland (An Garda Síochána)",
  IT: "UIF — Unità di Informazione Finanziaria (Banca d'Italia)",
  LV: "Finanšu izlūkošanas dienests (FIU Latvia)",
  LT: "FNTT (FIU Lithuania)",
  LU: "Cellule de renseignement financier (CRF)",
  MT: "FIAU",
  NL: "FIU-Nederland",
  PL: "GIIF",
  PT: "UIF (Polícia Judiciária)",
  RO: "ONPCSB",
  SK: "Finančná spravodajská jednotka (FSJ)",
  SI: "Urad RS za preprečevanje pranja denarja",
  ES: "SEPBLAC",
  SE: "Finanspolisen (FIU Sweden)",
};
