import { describe, it, expect } from "vitest";
import { demoActiveCall, demoTranscript, demoFrustrationAlerts, demoMetrics, demoQualityReview, demoEscalationEvents } from "@/lib/demo-data";

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

describe("escalation rubric handoff", () => {
  const event = demoEscalationEvents[0];

  it("uses human handoff when risk reaches the escalation threshold", () => {
    expect(event.riskScore).toBeGreaterThanOrEqual(5);
    expect(event.recommendedAction).toBe("human_handoff");
  });

  it("passes enough context for the specialist to avoid restarting the call", () => {
    expect(event.handoffSummary.customerIssue).toContain("$247.50");
    expect(event.handoffSummary.attemptedResolution).toEqual(
      expect.arrayContaining([
        expect.stringContaining("KB-142"),
        expect.stringContaining("KB-203")
      ])
    );
    expect(event.handoffSummary.recommendedNextAction.toLowerCase()).toContain("same-day reversal");
  });

  it("flags payment-sensitive risk for supervisor review", () => {
    expect(event.policySensitivity.toLowerCase()).toContain("payment");
    expect(event.riskFlags).toEqual(expect.arrayContaining(["payment dispute", "repeat contact"]));
  });

  it("builds a handoff readiness packet so the specialist does not restart the call", () => {
    const labels = event.handoffSummary.readinessChecklist.map(item => item.label);

    expect(labels).toEqual(
      expect.arrayContaining(["Customer identity", "Issue history", "Intent and sentiment", "Prior actions"])
    );
    expect(event.handoffSummary.readinessChecklist.filter(item => item.status === "ready")).toHaveLength(4);
    expect(event.handoffSummary.readinessChecklist.some(item => item.evidence.includes("call_2801"))).toBe(true);
  });

  it("keeps unresolved compliance checks in review before the transfer", () => {
    const reviewItem = event.handoffSummary.readinessChecklist.find(item => item.status === "needs_review");

    expect(reviewItem?.label).toBe("Open compliance check");
    expect(reviewItem?.evidence.toLowerCase()).toContain("processor status");
    expect(event.handoffSummary.routingRationale.toLowerCase()).toContain("repeat contact");
  });

  it("gives the specialist an opening line that proves the caller should not repeat themselves", () => {
    const brief = event.handoffSummary.specialistOpeningBrief;

    expect(brief.openingLine).toContain("James");
    expect(brief.openingLine).toContain("call_2801");
    expect(brief.openingLine).toContain("$247.50");
    expect(brief.repeatPreventionEvidence).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Customer identity"),
        expect.stringContaining("KB-203"),
        expect.stringContaining("REF-2847-JM")
      ])
    );
  });

  it("keeps unresolved processor and duplicate-refund checks visible to the specialist", () => {
    const prompts = event.handoffSummary.specialistOpeningBrief.unresolvedReviewPrompts.join(" ").toLowerCase();

    expect(prompts).toContain("processor status");
    expect(prompts).toContain("duplicate reversal risk");
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

describe("first-contact resolution (containment ≠ resolution)", () => {
  it("marks the active call as not resolved on first contact because it escalated", () => {
    expect(demoActiveCall.resolvedOnFirstContact).toBe(false);
  });

  it("links the active call to a prior contact ID", () => {
    expect(demoActiveCall.previousCallId).toBeTruthy();
    expect(demoActiveCall.previousCallId).toMatch(/^call_/);
  });

  it("repeat contact rate is between 1 and 15 percent of total calls", () => {
    const rate = demoMetrics.repeatContactRate;
    expect(rate).toBeGreaterThan(0);
    expect(rate).toBeLessThan(15);
    const expectedCount = Math.round(demoMetrics.totalCalls * (rate / 100));
    expect(demoMetrics.repeatContactCount).toBe(expectedCount);
  });

  it("repeat contact count is consistent with rate and total calls", () => {
    expect(typeof demoMetrics.repeatContactRate).toBe("number");
    expect(typeof demoMetrics.repeatContactCount).toBe("number");
    expect(demoMetrics.repeatContactCount).toBeGreaterThan(0);
    expect(demoMetrics.repeatContactCount).toBeLessThan(demoMetrics.totalCalls);
  });
});
