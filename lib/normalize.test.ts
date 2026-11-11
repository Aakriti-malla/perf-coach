import { describe, expect, it } from "vitest";
import fixture from "./__fixtures__/psi.json";
import { normalize } from "./normalize";

describe("normalize", () => {
  const digest = normalize(fixture);

  it("reduces category scores to 0-100", () => {
    expect(digest.scores.performance).toBe(66);
  });

  it("extracts lab metrics", () => {
    expect(digest.lab.lcpMs).toBeCloseTo(2552, 0);
    expect(digest.lab.tbtMs).toBeCloseTo(1241, 0);
  });

  it("extracts field data including INP and rescales CLS", () => {
    expect(digest.field?.inpMs).toBe(235);
    expect(digest.field?.cls).toBeLessThan(1);
  });

  it("returns at most 10 failing audits, biggest savings first", () => {
    const savings = digest.failingAudits.map((a) => a.overallSavingsMs);
    expect(digest.failingAudits.length).toBeLessThanOrEqual(10);
    expect(savings).toEqual([...savings].sort((a, b) => b - a));
    expect(digest.failingAudits[0].id).toBe("render-blocking-insight");
  });

  it("excludes the metric audits themselves", () => {
    const ids = digest.failingAudits.map((a) => a.id);
    expect(ids).not.toContain("largest-contentful-paint");
    expect(ids).not.toContain("total-blocking-time");
  });

  it("keeps only the digest keys, never raw PSI", () => {
    expect(Object.keys(digest).sort()).toEqual(
      ["failingAudits", "fetchedAt", "field", "lab", "scores", "strategy", "url"],
    );
  });

  it("sets field to null when CrUX has no data", () => {
    const noField = { ...fixture, loadingExperience: undefined };
    expect(normalize(noField).field).toBeNull();
  });

  it("throws on an unexpected PSI shape", () => {
    expect(() => normalize({ nope: true })).toThrow();
  });
});
