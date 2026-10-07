/**
 * Name matching used by the local (demo) screening provider. OpenSanctions does its own
 * matching in production; this keeps demo behaviour realistic: transliteration variants,
 * patronymics and word-order changes still match, DOB conflicts reduce the score.
 */

const HONORIFICS = new Set(["mr", "mrs", "ms", "miss", "dr", "prof", "hon", "sir", "dame", "he", "his", "her", "excellency", "the", "lord", "lady"]);
const LEGAL_SUFFIXES = new Set([
  "ltd", "limited", "llc", "inc", "incorporated", "corp", "corporation", "co", "company", "sa", "sas", "sarl", "srl", "spa",
  "gmbh", "ag", "bv", "nv", "plc", "lp", "llp", "fze", "fzco", "fzc", "sl", "oy", "ab", "as", "aps", "kft", "doo", "ooo", "pte", "pty", "sal",
]);

export function nameTokens(name: string, kind: "person" | "entity" = "person"): string[] {
  const base = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return base
    .split(" ")
    .filter(Boolean)
    .filter((t) => !HONORIFICS.has(t))
    .filter((t) => (kind === "entity" ? !LEGAL_SUFFIXES.has(t) : true));
}

export function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  const range = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1);
  const aMatch = new Array<boolean>(a.length).fill(false);
  const bMatch = new Array<boolean>(b.length).fill(false);
  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    const lo = Math.max(0, i - range);
    const hi = Math.min(i + range + 1, b.length);
    for (let j = lo; j < hi; j++) {
      if (bMatch[j] || a[i] !== b[j]) continue;
      aMatch[i] = bMatch[j] = true;
      matches++;
      break;
    }
  }
  if (!matches) return 0;
  let t = 0;
  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatch[i]) continue;
    while (!bMatch[k]) k++;
    if (a[i] !== b[k]) t++;
    k++;
  }
  const jaro = (matches / a.length + matches / b.length + (matches - t / 2) / matches) / 3;
  let prefix = 0;
  while (prefix < 4 && a[prefix] === b[prefix]) prefix++;
  return jaro + prefix * 0.1 * (1 - jaro);
}

/** 0..1 similarity between two names, tolerant of extra (middle/patronymic) tokens and order. */
export function nameSimilarity(a: string, b: string, kind: "person" | "entity" = "person"): number {
  const ta = nameTokens(a, kind);
  const tb = nameTokens(b, kind);
  if (!ta.length || !tb.length) return 0;
  const [short, long] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  const used = new Set<number>();
  let total = 0;
  let weight = 0;
  for (const s of short) {
    let best = 0;
    let bestIdx = -1;
    long.forEach((l, idx) => {
      if (used.has(idx)) return;
      const sim = jaroWinkler(s, l);
      if (sim > best) {
        best = sim;
        bestIdx = idx;
      }
    });
    if (bestIdx >= 0) used.add(bestIdx);
    const w = Math.max(2, s.length);
    total += best * w;
    weight += w;
  }
  const tokenScore = (total / weight) * (0.9 + (0.1 * short.length) / long.length);
  const joined = jaroWinkler([...ta].sort().join(" "), [...tb].sort().join(" "));
  return Math.max(tokenScore, joined * 0.95);
}

export type MatchCandidate = { name: string; aliases?: string[]; birthDate?: string; countries?: string[] };

export function scoreCandidate(
  query: { name: string; kind: "person" | "entity"; birthDate?: string | null; countries?: (string | null | undefined)[] },
  candidate: MatchCandidate,
): { score: number; explanation: string } {
  const names = [candidate.name, ...(candidate.aliases ?? [])];
  let best = 0;
  let bestName = candidate.name;
  for (const n of names) {
    const s = nameSimilarity(query.name, n, query.kind);
    if (s > best) {
      best = s;
      bestName = n;
    }
  }
  const notes = [`name similarity ${(best * 100).toFixed(0)}% with “${bestName}”`];
  let score = best;
  if (query.birthDate && candidate.birthDate) {
    if (query.birthDate.slice(0, 4) === candidate.birthDate.slice(0, 4)) {
      score += 0.05;
      notes.push("birth year matches");
    } else {
      score -= 0.25;
      notes.push("birth year differs");
    }
  } else if (query.kind === "person") {
    notes.push("no date of birth to compare");
  }
  const qc = (query.countries ?? []).filter(Boolean) as string[];
  if (qc.length && candidate.countries?.length) {
    if (qc.some((c) => candidate.countries!.includes(c))) {
      score += 0.02;
      notes.push("country overlaps");
    }
  }
  return { score: Math.max(0, Math.min(1, score)), explanation: notes.join(" · ") };
}
