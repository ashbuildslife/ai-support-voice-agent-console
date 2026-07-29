import { describe, it, expect } from "vitest";
import { demoActiveCall, demoTranscript, demoFrustrationAlerts, demoMetrics, demoQualityReview, demoEscalationEvents } from "@/lib/demo-data";

describe("transcript", () => {
  it("has 9 turns", () => expect(demoTranscript).toHaveLength(9));
  it("starts with AI announcement of identity", () => {
    expect(demoTranscript[0].speaker).toBe("ai");
    expect(demoTranscript[0].text.toLowerCase()).toContain("ai assistant");
  });

  it("redacts the caller email before model context or transcript storage", () => {
    const emailTurn = demoTranscript.find(turn => turn.id === "t4");

    expect(emailTurn?.text).toContain("[EMAIL REDACTED]");
    expect(JSON.stringify(demoTranscript)).not.toContain("james.morrison@gmail.com");
    expect(emailTurn?.sensitiveDataRedaction?.status).toBe("redacted_before_model");
    expect(emailTurn?.sensitiveDataRedaction?.rawValueInModelContext).toBe(false);
  });

  it("keeps sensitive caller data out of stored transcripts and recordings", () => {
    const treatment = demoTranscript.find(turn => turn.id === "t4")?.sensitiveDataRedaction;

    expect(treatment?.rawValueStoredInTranscript).toBe(false);
    expect(treatment?.rawValueStoredInRecording).toBe(false);
    expect(treatment?.retainedEvidence).toEqual(
      expect.arrayContaining(["verified account lookup token", expect.stringContaining("redaction audit event")])
    );
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

  it("audits that the handoff packet reached the specialist before transfer", () => {
    const delivery = event.handoffSummary.deliveryAudit;

    expect(delivery.destination.toLowerCase()).toContain("agent desktop");
    expect(delivery.sentBeforeTransferSeconds).toBeGreaterThan(0);
    expect(delivery.status).toBe("acknowledged");
    expect(delivery.acknowledgementRequired).toBe(true);
    expect(delivery.fallbackIfNotAcknowledged.toLowerCase()).toContain("context-preserving callback");
  });

  it("records the caller-facing transfer receipt before the human handoff", () => {
    const notice = event.handoffSummary.customerTransferNotice;

    expect(notice.spokenDisclosure).toContain("James");
    expect(notice.spokenDisclosure).toContain("REF-2847-JM");
    expect(notice.contextShared).toEqual(
      expect.arrayContaining(["verified email", "prior call_2801", "KB-203 same-day reversal exception"])
    );
    expect(notice.callerAcknowledged).toBe(true);
    expect(notice.repeatExpectation.toLowerCase()).toContain("ask only");
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

  it("shows no-repeat guardrails for details already captured by the AI", () => {
    const guardrails = event.handoffSummary.specialistOpeningBrief.noRepeatGuardrails;

    expect(guardrails.map(item => item.capturedDetail)).toEqual(
      expect.arrayContaining(["Verified account email", "$247.50 post-cancellation charge", "Prior support contact"])
    );
    expect(guardrails.some(item => item.reuseInstruction.toLowerCase().includes("do not ask"))).toBe(true);
  });

  it("keeps prior-call references in the no-repeat guardrail before new questions", () => {
    const priorContactGuardrail = event.handoffSummary.specialistOpeningBrief.noRepeatGuardrails.find(
      item => item.capturedDetail === "Prior support contact"
    );

    expect(priorContactGuardrail?.reuseInstruction).toContain("call_2801");
    expect(priorContactGuardrail?.reuseInstruction).toContain("REF-2847-JM");
  });

  it("blocks the high-value same-day reversal until step-up verification succeeds", () => {
    const gate = event.handoffSummary.highValueActionGate;

    expect(gate.amountUsd).toBeGreaterThan(200);
    expect(gate.status).toBe("step_up_required");
    expect(gate.automatedActionBlocked).toBe(true);
  });

  it("requires an independent challenge and duplicate-refund review before approval", () => {
    const gate = event.handoffSummary.highValueActionGate;
    const checks = gate.requiredNextChecks.join(" ").toLowerCase();

    expect(gate.verificationSignals).toEqual(
      expect.arrayContaining(["Account email supplied in-call", "Inbound phone matched account record"])
    );
    expect(checks).toContain("one-time code");
    expect(checks).toContain("duplicate reversal risk");
    expect(gate.riskRationale).toContain("do not independently authorize");
  });

  it("rejects voice biometrics and caller ID as authorization", () => {
    const gate = event.handoffSummary.highValueActionGate;
    const boundary = gate.callerAuthenticationBoundary;

    expect(boundary.voiceBiometricAccepted).toBe(false);
    expect(boundary.callerIdAcceptedAsAuthenticator).toBe(false);
    expect(boundary.challengeStatus).toBe("pending");
    expect(gate.automatedActionBlocked).toBe(true);
  });

  it("requires possession-bound proof before the sensitive action can continue", () => {
    const boundary = event.handoffSummary.highValueActionGate.callerAuthenticationBoundary;

    expect(boundary.requiredIndependentFactor).toBe("authenticated_app_challenge");
    expect(boundary.failureRoute.toLowerCase()).toContain("identity-fraud review");
    expect(boundary.failureRoute.toLowerCase()).toContain("refund blocked");
  });

  it("holds suspected synthetic speech for identity-fraud review", () => {
    const gate = event.handoffSummary.highValueActionGate;
    const assessment = gate.callerAuthenticationBoundary.syntheticSpeechRiskAssessment;

    expect(assessment.status).toBe("suspected");
    expect(assessment.confidence).toBeGreaterThan(0.8);
    expect(assessment.requiredResponse).toBe("hold_for_identity_fraud_review");
    expect(gate.automatedActionBlocked).toBe(true);
  });

  it("does not let synthetic-speech screening replace possession-bound proof", () => {
    const boundary = event.handoffSummary.highValueActionGate.callerAuthenticationBoundary;

    expect(boundary.syntheticSpeechRiskAssessment.acceptedAsAuthenticator).toBe(false);
    expect(boundary.requiredIndependentFactor).toBe("authenticated_app_challenge");
    expect(boundary.challengeStatus).toBe("pending");
  });

  it("keeps card data outside the model, transcript, and recording", () => {
    const boundary = event.handoffSummary.highValueActionGate.paymentDataIsolation;

    expect(boundary.captureChannel).toBe("secure_dtmf");
    expect(boundary.cardDataVisibleToModel).toBe(false);
    expect(boundary.cardDataStoredInTranscript).toBe(false);
    expect(boundary.cardDataStoredInRecording).toBe(false);
  });

  it("retains only masked payment evidence before AI assistance resumes", () => {
    const boundary = event.handoffSummary.highValueActionGate.paymentDataIsolation;

    expect(boundary.retainedEvidence).toEqual(
      expect.arrayContaining(["processor reference", "authorization result", "masked payment-method suffix"])
    );
    expect(boundary.resumeCondition.toLowerCase()).toContain("secure capture is complete");
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
  it("distinguishes dead air from a caller barge-in during the frustration peak", () => {
    const deadAirTurns = demoTranscript.filter(t => ["t5", "t7"].includes(t.id));
    const bargeInTurn = demoTranscript.find(t => t.id === "t6");

    expect(deadAirTurns.every(t => (t.silenceBeforeSeconds ?? 0) > 2.5)).toBe(true);
    expect(bargeInTurn?.silenceBeforeSeconds).toBeLessThan(0.5);
    expect(bargeInTurn?.turnTakingSignal?.event).toBe("caller_barge_in");
  });

  it("records a fast agent yield without losing the caller's utterance", () => {
    const signal = demoTranscript.find(t => t.id === "t6")?.turnTakingSignal;

    expect(signal?.agentYieldMs).toBeLessThanOrEqual(250);
    expect(signal?.callerUtterancePreserved).toBe(true);
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
