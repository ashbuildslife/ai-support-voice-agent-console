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

describe("sentiment trajectory and churn risk", () => {
  it("has one timeline entry per transcript turn", () => {
    expect(demoActiveCall.sentimentTimeline).toHaveLength(demoTranscript.length);
  });

  it("shows trajectory deterioration: calm → frustrated → angry at peak frustration turn", () => {
    const firstSentiment = demoActiveCall.sentimentTimeline[0].sentiment;
    const peakEntry = demoActiveCall.sentimentTimeline.find(e => e.sentiment === "angry");
    expect(firstSentiment).toBe("calm");
    expect(peakEntry).toBeDefined();
    expect(peakEntry!.turnNumber).toBe(6); // caller says "unacceptable"
  });

  it("shows trajectory recovery: final turn is calm after de-escalation", () => {
    const finalEntry = demoActiveCall.sentimentTimeline[demoActiveCall.sentimentTimeline.length - 1];
    expect(finalEntry.sentiment).toBe("calm");
  });

  it("churn risk exceeds 50 when caller peaks at angry without early de-escalation", () => {
    expect(demoActiveCall.churnRisk).toBeGreaterThan(50);
    expect(demoActiveCall.churnRisk).toBeLessThan(100);
  });

  it("sentiment transition from angry to frustrated at turn 7 shows de-escalation window", () => {
    const turn6 = demoActiveCall.sentimentTimeline.find(e => e.turnNumber === 6);
    const turn7 = demoActiveCall.sentimentTimeline.find(e => e.turnNumber === 7);
    expect(turn6!.sentiment).toBe("angry");
    expect(turn7!.sentiment).toBe("frustrated");
  });
});

describe("silence gaps (latency)", () => {
  it("all turns have silenceBeforeSeconds defined", () => {
    expect(demoTranscript.every(t => t.silenceBeforeSeconds !== undefined)).toBe(true);
  });
  it("silence peaks >3s in turn 7 when caller frustration is highest", () => {
    const peak = Math.max(...demoTranscript.map(t => t.silenceBeforeSeconds ?? 0));
    expect(peak).toBeGreaterThan(3);
    const t7 = demoTranscript.find(t => t.id === "t7");
    expect(t7?.silenceBeforeSeconds).toBe(peak);
  });
  it("silence spikes correlate with frustration — turns 5-7 all exceed 2.5s", () => {
    const midCall = demoTranscript.filter(t => ["t5", "t6", "t7"].includes(t.id));
    expect(midCall.every(t => (t.silenceBeforeSeconds ?? 0) > 2.5)).toBe(true);
  });
});
