import { config } from "@/lib/config";
import type { ScreeningMatch } from "@/lib/db/schema";
import { DEMO_DATASETS, DEMO_WATCHLIST } from "./demo-watchlist";
import { scoreCandidate } from "./matcher";

export type ScreeningQuery = {
  name: string;
  kind: "person" | "entity";
  birthDate?: string | null;
  nationality?: string | null;
  country?: string | null;
};

export type ScreeningOutcome = {
  provider: "opensanctions" | "demo";
  datasets: string[];
  matches: ScreeningMatch[];
  status: "clear" | "potential_match" | "error";
  error?: string;
};

const PERSON_THRESHOLD = 0.85;
const ENTITY_THRESHOLD = 0.88;

export function screeningProvider(opts: { isDemoOrg?: boolean } = {}): "opensanctions" | "demo" {
  if (opts.isDemoOrg) return "demo";
  return config.openSanctions.apiKey ? "opensanctions" : "demo";
}

export async function screen(q: ScreeningQuery, opts: { isDemoOrg?: boolean } = {}): Promise<ScreeningOutcome> {
  return screeningProvider(opts) === "opensanctions" ? screenOpenSanctions(q) : screenDemo(q);
}

function screenDemo(q: ScreeningQuery): ScreeningOutcome {
  const threshold = q.kind === "person" ? PERSON_THRESHOLD : ENTITY_THRESHOLD;
  const schema = q.kind === "person" ? "Person" : "Company";
  const matches: ScreeningMatch[] = [];
  for (const entry of DEMO_WATCHLIST) {
    if (entry.schema !== schema) continue;
    const { score, explanation } = scoreCandidate(
      { name: q.name, kind: q.kind, birthDate: q.birthDate, countries: [q.nationality, q.country] },
      { name: entry.name, aliases: entry.aliases, birthDate: entry.birthDate, countries: entry.countries },
    );
    if (score >= threshold) {
      matches.push({
        id: entry.id,
        name: entry.name,
        score: Math.round(score * 100) / 100,
        schema: entry.schema,
        datasets: entry.datasets.map((d) => DEMO_DATASETS[d]),
        topics: entry.topics,
        birthDate: entry.birthDate,
        countries: entry.countries,
        explanation: `${explanation}. ${entry.note}`,
      });
    }
  }
  matches.sort((a, b) => b.score - a.score);
  return {
    provider: "demo",
    datasets: Object.values(DEMO_DATASETS),
    matches,
    status: matches.length ? "potential_match" : "clear",
  };
}

type OSResult = {
  id: string;
  caption: string;
  schema: string;
  score: number;
  match: boolean;
  datasets: string[];
  properties?: Record<string, string[]>;
};

async function screenOpenSanctions(q: ScreeningQuery): Promise<ScreeningOutcome> {
  const dataset = config.openSanctions.dataset;
  const properties: Record<string, string[]> = { name: [q.name] };
  if (q.kind === "person") {
    if (q.birthDate) properties.birthDate = [q.birthDate];
    if (q.nationality) properties.nationality = [q.nationality.toLowerCase()];
    if (q.country) properties.country = [q.country.toLowerCase()];
  } else if (q.country) {
    properties.jurisdiction = [q.country.toLowerCase()];
  }
  const body = {
    queries: { q: { schema: q.kind === "person" ? "Person" : "LegalEntity", properties } },
  };
  const datasets = [`OpenSanctions “${dataset}” collection (sanctions, PEPs, crime & debarment lists)`];
  try {
    const res = await fetch(`https://api.opensanctions.org/match/${encodeURIComponent(dataset)}?limit=5&threshold=0.7`, {
      method: "POST",
      headers: { authorization: `ApiKey ${config.openSanctions.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`OpenSanctions responded ${res.status}`);
    const json = (await res.json()) as { responses?: Record<string, { results?: OSResult[] }> };
    const results = json.responses?.q?.results ?? [];
    const matches: ScreeningMatch[] = results
      .filter((r) => r.match || r.score >= 0.7)
      .map((r) => ({
        id: r.id,
        name: r.caption,
        score: Math.round(r.score * 100) / 100,
        schema: r.schema,
        datasets: r.datasets ?? [],
        topics: r.properties?.topics ?? [],
        birthDate: r.properties?.birthDate?.[0],
        countries: [...(r.properties?.country ?? []), ...(r.properties?.nationality ?? [])].map((c) => c.toUpperCase()),
        url: `https://www.opensanctions.org/entities/${encodeURIComponent(r.id)}/`,
      }));
    return { provider: "opensanctions", datasets, matches, status: matches.length ? "potential_match" : "clear" };
  } catch (err) {
    return {
      provider: "opensanctions",
      datasets,
      matches: [],
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function isSanctionsTopic(topics: string[]): boolean {
  return topics.some((t) => t.startsWith("sanction") || t === "crime" || t.startsWith("crime") || t === "wanted" || t === "debarment");
}
