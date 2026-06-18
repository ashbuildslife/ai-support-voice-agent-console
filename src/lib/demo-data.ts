import type { CallQualityReview, EscalationEvent, FrustrationAlert, GroundedAnswer, KBArticle, RubricScore, SentimentTimelineEntry, SupervisorMetrics, SupportCall, TranscriptTurn, VoiceAgentSnapshot } from "./types";

export const demoSentimentTimeline: SentimentTimelineEntry[] = [
  { turnNumber: 1, sentiment: "calm", confidence: 0.97 },
  { turnNumber: 2, sentiment: "frustrated", confidence: 0.88 },
  { turnNumber: 3, sentiment: "frustrated", confidence: 0.85 },
  { turnNumber: 4, sentiment: "frustrated", confidence: 0.91 },
  { turnNumber: 5, sentiment: "frustrated", confidence: 0.82 },
  { turnNumber: 6, sentiment: "angry", confidence: 0.94 },
  { turnNumber: 7, sentiment: "frustrated", confidence: 0.86 },
  { turnNumber: 8, sentiment: "frustrated", confidence: 0.89 },
  { turnNumber: 9, sentiment: "calm", confidence: 0.92 },
];

export const demoActiveCall: SupportCall = {
  id: "call_2847", callerName: "James Morrison", callerPhone: "+1 (415) 555-0182",
  intent: "billing", sentiment: "frustrated", duration: "4:32", outcome: "escalated",
  escalationTriggered: true, csatPredicted: 34,
  sentimentTimeline: demoSentimentTimeline,
  churnRisk: 72
};

export const demoTranscript: TranscriptTurn[] = [
  { id: "t1", callId: "call_2847", speaker: "ai", text: "Thank you for calling CloudServe support. I'm Ava, an AI assistant — just so you know, you're speaking with an automated system. How can I help?", timestamp: "00:00", intent: "general", confidence: 0.99, silenceBeforeSeconds: 0.5 },
  { id: "t2", callId: "call_2847", speaker: "caller", text: "Yeah, I just got charged $247.50 and I cancelled my subscription two weeks ago. I need this refunded.", timestamp: "00:12", intent: "billing", confidence: 0.94, silenceBeforeSeconds: 1.8 },
  { id: "t3", callId: "call_2847", speaker: "ai", text: "I understand. Let me look up your account. According to our knowledge base article KB-142 on cancellation and billing, charges posted within 30 days of cancellation should be automatically reversed. Can you confirm the email on your account?", timestamp: "00:18", intent: "billing", confidence: 0.91, silenceBeforeSeconds: 2.1 },
  { id: "t4", callId: "call_2847", speaker: "caller", text: "james.morrison@gmail.com. But I already talked to someone last week and they said it would be handled. This is getting ridiculous.", timestamp: "00:45", intent: "billing", confidence: 0.89, silenceBeforeSeconds: 2.4 },
  { id: "t5", callId: "call_2847", speaker: "ai", text: "I found your account, James. I can see the cancellation was processed on May 22nd, and the charge on June 1st for $247.50 should not have occurred. According to KB-142, this qualifies for an automatic refund within 5–7 business days. I've initiated that refund now.", timestamp: "01:12", intent: "billing", confidence: 0.87, silenceBeforeSeconds: 3.2 },
  { id: "t6", callId: "call_2847", speaker: "caller", text: "Five to seven days? I need this money now. I've already been waiting two weeks — this is completely unacceptable.", timestamp: "01:48", intent: "billing", confidence: 0.92, silenceBeforeSeconds: 2.9 },
  { id: "t7", callId: "call_2847", speaker: "ai", text: "I understand the frustration, James. Let me check if there's an expedited option. According to KB-203 on refund exceptions, same-day reversals are available for duplicate charges or charges exceeding $200 that were processed in error. Your case qualifies. Let me escalate this to our billing specialist team.", timestamp: "02:05", intent: "billing", confidence: 0.88, silenceBeforeSeconds: 3.4 },
  { id: "t8", callId: "call_2847", speaker: "caller", text: "Finally. Yes, please do that. I don't want to call back again.", timestamp: "02:30", intent: "billing", confidence: 0.90, silenceBeforeSeconds: 1.6 },
  { id: "t9", callId: "call_2847", speaker: "ai", text: "I'm transferring you now to Maria in our billing team. She'll have your full call context and refund details. Your reference number is REF-2847-JM. You should not need to repeat any information. Thank you for your patience, James.", timestamp: "02:45", intent: "general", confidence: 0.99, silenceBeforeSeconds: 2.0 }
];

export const demoKBArticles: KBArticle[] = [
  { id: "kb_142", title: "Cancellation and Billing Policy", content: "Charges posted within 30 days of a confirmed cancellation are considered billing errors and qualify for automatic reversal. Refunds are processed within 5–7 business days unless the charge exceeds $200 or was processed as a duplicate, in which case the customer qualifies for same-day expedited reversal. See KB-203 for exception handling.", tags: ["billing", "cancellation", "refund"] },
  { id: "kb_203", title: "Refund Exception Handling", content: "Same-day reversals are available for: (a) duplicate charges, (b) charges exceeding $200 that were processed after a confirmed cancellation, (c) charges resulting from a known system error. Escalate to billing specialist team. Provide call reference number and full account context.", tags: ["billing", "refund", "escalation"] },
  { id: "kb_089", title: "Account Access and Verification", content: "Customer identity can be verified via: account email, last 4 digits of payment method, or account number. Do not disclose account details until identity is confirmed. For security, only the last 4 digits of payment methods should be read aloud.", tags: ["account", "verification", "security"] }
];

export const demoGroundedAnswers: GroundedAnswer[] = [
  { turnId: "t3", answer: "Charges within 30 days of cancellation qualify for automatic reversal per KB-142.", sourceArticle: "KB-142: Cancellation and Billing Policy", confidence: 0.91 },
  { turnId: "t5", answer: "Refund of $247.50 initiated. 5–7 business days standard per KB-142.", sourceArticle: "KB-142: Cancellation and Billing Policy", confidence: 0.87 },
  { turnId: "t7", answer: "Same-day reversal eligible — charge exceeds $200 and was post-cancellation. Per KB-203 exception (b).", sourceArticle: "KB-203: Refund Exception Handling", confidence: 0.88 }
];

export const demoFrustrationAlerts: FrustrationAlert[] = [
  { callId: "call_2847", keywords: ["ridiculous", "unacceptable"], turnNumber: 6, escalated: true }
];

export const demoEscalationEvents: EscalationEvent[] = [
  {
    callId: "call_2847",
    reason: "Frustration keywords detected (turn 6) + charge exceeds $200 threshold for expedited reversal. Flagged for same-day resolution per KB-203.",
    transferredTo: "Maria — Billing Specialist Team",
    atTimestamp: "00:02:45",
    riskScore: 6,
    recommendedAction: "human_handoff",
    policySensitivity: "Payment dispute with account-specific refund exception",
    riskFlags: ["payment dispute", "repeat contact", "anger spike", "expedited refund exception"],
    handoffSummary: {
      customerIssue: "James was charged $247.50 two weeks after cancelling and has already contacted support once.",
      attemptedResolution: [
        "Verified cancellation and post-cancellation charge against KB-142",
        "Identified KB-203 same-day reversal exception for charges over $200"
      ],
      missingInformation: ["Billing specialist must confirm refund processor status before promising exact deposit timing"],
      recommendedNextAction: "Transfer to billing specialist with full context and process same-day reversal if payment processor status is clear."
    }
  }
];

export const demoMetrics: SupervisorMetrics = {
  totalCalls: 847, resolvedCount: 612, escalatedCount: 178,
  avgDuration: "6:12", avgCsat: 72, escalationRate: 21.0,
  callsByIntent: { billing: 312, technical: 289, account: 156, cancellation: 54, general: 36 }
};

const rubricScores: RubricScore[] = [
  { category: "clarity", score: 8, maxScore: 10, evidence: "AI announced itself as automated at turn 1. Used clear, non-technical language throughout." },
  { category: "accuracy", score: 9, maxScore: 10, evidence: "All three answers sourced from KB articles. Correctly applied KB-203 exception criteria for expedited refund." },
  { category: "empathy", score: 6, maxScore: 10, evidence: "Acknowledged frustration at turn 7 but took 3 turns to escalate. Should have escalated at turn 6 after 'ridiculous' and 'unacceptable' were detected." },
  { category: "efficiency", score: 7, maxScore: 10, evidence: "4:32 total call time. Resolved billing issue but could have saved ~1 minute by escalating after first frustration signal rather than offering standard 5–7 day timeline." }
];

export const demoQualityReview: CallQualityReview = {
  callId: "call_2847", overallScore: 75,
  rubricScores, reviewerNotes: "Good accuracy and clarity. Empathy needs improvement — frustration was detected but escalation was delayed by one turn. The AI should escalate immediately when keywords like 'ridiculous' or 'unacceptable' appear, not after offering the standard resolution path first."
};

export const demoSnapshot: VoiceAgentSnapshot = {
  activeCall: demoActiveCall,
  transcript: demoTranscript,
  kbArticles: demoKBArticles,
  groundedAnswers: demoGroundedAnswers,
  frustrationAlerts: demoFrustrationAlerts,
  escalationEvents: demoEscalationEvents,
  metrics: demoMetrics,
  qualityReview: demoQualityReview
};
