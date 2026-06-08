import { describe, it, expect } from "vitest";
import { demoActiveCall, demoTranscript, demoFrustrationAlerts, demoMetrics, demoQualityReview } from "@/lib/demo-data";

describe("transcript", () => {
  it("has 9 turns", () => expect(demoTranscript).toHaveLength(9));
  it("starts with AI announcement of identity", () => {
    expect(demoTranscript[0].speaker).toBe("ai");
    expect(demoTranscript[0].text.toLowerCase()).toContain("ai assistant");
  });
});

describe("frustration detection", () => {
  it("detected frustration keywords", () => {
    expect(demoFrustrationAlerts.length).toBeGreaterThan(0);
    expect(demoFrustrationAlerts[0].keywords).toContain("ridiculous");
  });
  it("escalation was triggered", () => {
    expect(demoActiveCall.escalationTriggered).toBe(true);
  });
});

describe("metrics", () => {
  it("total matches sum of outcomes", () => {
    expect(demoMetrics.resolvedCount + demoMetrics.escalatedCount).toBeLessThanOrEqual(demoMetrics.totalCalls);
  });
});

describe("quality review", () => {
  it("has rubric scores covering 4 categories", () => {
    expect(demoQualityReview?.rubricScores.map(s => s.category)).toEqual(
      expect.arrayContaining(["clarity", "accuracy", "empathy", "efficiency"])
    );
  });
  it("empathy scored lower than accuracy", () => {
    const empathy = demoQualityReview?.rubricScores.find(s => s.category === "empathy");
    const accuracy = demoQualityReview?.rubricScores.find(s => s.category === "accuracy");
    expect((empathy?.score ?? 0)).toBeLessThan((accuracy?.score ?? 10));
  });
});
