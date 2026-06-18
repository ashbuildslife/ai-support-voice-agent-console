export type IntentCategory = "billing" | "technical" | "account" | "cancellation" | "general";
export type Sentiment = "calm" | "frustrated" | "angry";
export type CallOutcome = "resolved" | "escalated" | "transferred" | "abandoned";
export type EscalationAction = "continue" | "clarify" | "human_handoff" | "qa_review" | "immediate_alert";
export type RubricCategory = "clarity" | "accuracy" | "empathy" | "efficiency";

export interface SentimentTimelineEntry {
  turnNumber: number; sentiment: Sentiment; confidence: number;
}

export interface SupportCall {
  id: string; callerName: string; callerPhone: string; intent: IntentCategory;
  sentiment: Sentiment; duration: string; outcome: CallOutcome;
  escalationTriggered: boolean; csatPredicted: number;
  /** Per-turn sentiment snapshots — trajectory is a stronger churn signal than any single point */
  sentimentTimeline: SentimentTimelineEntry[];
  /** 0-100 score derived from sentiment trajectory. Rising anger with no de-escalation → high risk */
  churnRisk: number;
}

export interface TranscriptTurn {
  id: string; callId: string; speaker: "ai" | "caller"; text: string;
  timestamp: string; intent?: IntentCategory; confidence?: number;
  /** Seconds of silence before this turn began — the #1 latency pain point in voice AI */
  silenceBeforeSeconds?: number;
}

export interface KBArticle {
  id: string; title: string; content: string; tags: string[];
}

export interface GroundedAnswer {
  turnId: string; answer: string; sourceArticle: string; confidence: number;
}

export interface FrustrationAlert {
  callId: string; keywords: string[]; turnNumber: number; escalated: boolean;
}

export interface EscalationHandoffSummary {
  customerIssue: string;
  attemptedResolution: string[];
  missingInformation: string[];
  recommendedNextAction: string;
}

export interface EscalationEvent {
  callId: string; reason: string; transferredTo: string; atTimestamp: string;
  riskScore: number; recommendedAction: EscalationAction; policySensitivity: string;
  riskFlags: string[]; handoffSummary: EscalationHandoffSummary;
}

export interface SupervisorMetrics {
  totalCalls: number; resolvedCount: number; escalatedCount: number;
  avgDuration: string; avgCsat: number; escalationRate: number;
  callsByIntent: Record<string, number>;
}

export interface RubricScore {
  category: RubricCategory; score: number; maxScore: number; evidence: string;
}

export interface CallQualityReview {
  callId: string; overallScore: number; rubricScores: RubricScore[];
  reviewerNotes: string;
}

export interface VoiceAgentSnapshot {
  activeCall: SupportCall | null;
  transcript: TranscriptTurn[];
  kbArticles: KBArticle[];
  groundedAnswers: GroundedAnswer[];
  frustrationAlerts: FrustrationAlert[];
  escalationEvents: EscalationEvent[];
  metrics: SupervisorMetrics;
  qualityReview: CallQualityReview | null;
}
