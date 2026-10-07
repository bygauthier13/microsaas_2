import { describe, expect, it } from "vitest";
import { jaroWinkler, nameSimilarity, scoreCandidate } from "@/lib/screening/matcher";

describe("name matching", () => {
  it("scores identical names as 1", () => {
    expect(jaroWinkler("orlansky", "orlansky")).toBe(1);
    expect(nameSimilarity("Claire Fontaine", "claire fontaine")).toBeCloseTo(1, 2);
  });

  it("matches transliteration variants and ignores patronymics", () => {
    expect(nameSimilarity("Dmitry Orlanski", "Dmitri Valerievich Orlansky")).toBeGreaterThan(0.85);
  });

  it("ignores word order and honorifics", () => {
    expect(nameSimilarity("Mr Orlansky Dmitri", "Dmitri Orlansky")).toBeGreaterThan(0.9);
  });

  it("does not match unrelated names", () => {
    expect(nameSimilarity("Claire Fontaine", "Dmitri Valerievich Orlansky")).toBeLessThan(0.6);
    expect(nameSimilarity("Aleksander Varga", "Arkady Semyonovich Belozersky")).toBeLessThan(0.75);
  });

  it("strips legal suffixes for entities", () => {
    expect(nameSimilarity("Novaya Zarya Holding Ltd", "Novaya Zarya Holding Limited", "entity")).toBeGreaterThan(0.95);
  });

  it("penalises conflicting birth years", () => {
    const same = scoreCandidate({ name: "Dmitri Orlansky", kind: "person", birthDate: "1968-03-14" }, { name: "Dmitri Valerievich Orlansky", birthDate: "1968-03-14" });
    const diff = scoreCandidate({ name: "Dmitri Orlansky", kind: "person", birthDate: "1991-05-02" }, { name: "Dmitri Valerievich Orlansky", birthDate: "1968-03-14" });
    expect(same.score).toBeGreaterThan(0.9);
    expect(diff.score).toBeLessThan(0.75);
  });
});
