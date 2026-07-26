export type IntentCategory = "billing" | "technical" | "account" | "cancellation" | "general";
export type Sentiment = "calm" | "frustrated" | "angry";
export type CallOutcome = "resolved" | "escalated" | "transferred" | "abandoned";
export type EscalationAction = "continue" | "clarify" | "human_handoff" | "qa_review" | "immediate_alert";
export type HandoffReadinessStatus = "ready" | "needs_review";
export type HandoffDeliveryStatus = "queued" | "sent" | "acknowledged" | "needs_retry";
export type RubricCategory = "clarity" | "accuracy" | "empathy" | "efficiency";
export type TurnTakingEvent = "caller_barge_in" | "agent_interruption";
export type SensitiveActionGateStatus = "allowed" | "step_up_required" | "blocked";
export type PaymentCaptureChannel = "secure_dtmf" | "hosted_payment_link";
export type IndependentCallerFactor = "authenticated_app_challenge" | "security_key";
export type CallerChallengeStatus = "pending" | "verified";
export type SyntheticSpeechRiskStatus = "not_detected" | "suspected" | "unavailable";
export type SyntheticSpeechRiskResponse = "continue_independent_challenge" | "hold_for_identity_fraud_review";

export interface SentimentTimelineEntry {
  turnNumber: number; sentiment: Sentiment; confidence: number;
}

export interface TurnTakingSignal {
  event: TurnTakingEvent;
  /** Milliseconds from caller speech detection until the agent stopped talking */
  agentYieldMs: number;
  /** Confirms the caller's complete utterance survived the interruption */
  callerUtterancePreserved: boolean;
}

export interface SupportCall {
  id: string; callerName: string; callerPhone: string; intent: IntentCategory;
  sentiment: Sentiment; duration: string; outcome: CallOutcome;
  escalationTriggered: boolean; csatPredicted: number;
  /** Per-turn sentiment snapshots — trajectory is a stronger churn signal than any single point */
  sentimentTimeline: SentimentTimelineEntry[];
  /** 0-100 score derived from sentiment trajectory. Rising anger with no de-escalation → high risk */
  churnRisk: number;
  /** False when customer called back within 72h of a prior contact for the same issue.
   *  The gap between "contained" and "resolved" is the #1 silent failure mode in voice AI —
   *  repeat contacts mean the AI deflected the call but didn't solve the problem. */
  resolvedOnFirstContact: boolean;
  /** The prior call ID when this is a repeat contact (null for first contacts) */
  previousCallId: string | null;
}

export interface TranscriptTurn {
  id: string; callId: string; speaker: "ai" | "caller"; text: string;
  timestamp: string; intent?: IntentCategory; confidence?: number;
  /** Seconds of silence before this turn began — the #1 latency pain point in voice AI */
  silenceBeforeSeconds?: number;
  /** Turn-taking telemetry for interruptions that should not be mistaken for dead air */
  turnTakingSignal?: TurnTakingSignal;
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

export interface HandoffReadinessItem {
  label: string; status: HandoffReadinessStatus; evidence: string;
}

export interface HandoffDeliveryAudit {
  destination: string;
  sentBeforeTransferSeconds: number;
  status: HandoffDeliveryStatus;
  acknowledgementRequired: boolean;
  fallbackIfNotAcknowledged: string;
}

export interface CustomerTransferNotice {
  spokenDisclosure: string;
  contextShared: string[];
  callerAcknowledged: boolean;
  repeatExpectation: string;
}

export interface NoRepeatGuardrail {
  capturedDetail: string;
  reuseInstruction: string;
}

export interface SpecialistOpeningBrief {
  openingLine: string;
  repeatPreventionEvidence: string[];
  unresolvedReviewPrompts: string[];
  /** Details already captured from AI conversation that the human should reuse instead of re-asking */
  noRepeatGuardrails: NoRepeatGuardrail[];
}

export interface PaymentDataIsolation {
  captureChannel: PaymentCaptureChannel;
  /** Card digits never enter the AI model context or live transcript */
  cardDataVisibleToModel: false;
  cardDataStoredInTranscript: false;
  cardDataStoredInRecording: false;
  retainedEvidence: string[];
  resumeCondition: string;
}

export interface SyntheticSpeechRiskAssessment {
  status: SyntheticSpeechRiskStatus;
  /** Null when screening is unavailable; never treated as identity proof */
  confidence: number | null;
  acceptedAsAuthenticator: false;
  evidence: string[];
  requiredResponse: SyntheticSpeechRiskResponse;
}

export interface CallerAuthenticationBoundary {
  /** Voice biometric comparison is not accepted as an authentication factor */
  voiceBiometricAccepted: false;
  /** ANI/caller ID is routing context, not proof of account control */
  callerIdAcceptedAsAuthenticator: false;
  requiredIndependentFactor: IndependentCallerFactor;
  challengeStatus: CallerChallengeStatus;
  failureRoute: string;
  /** Synthetic-speech screening can raise risk but can never authorize the caller */
  syntheticSpeechRiskAssessment: SyntheticSpeechRiskAssessment;
}

export interface HighValueActionGate {
  action: string;
  amountUsd: number;
  verificationSignals: string[];
  status: SensitiveActionGateStatus;
  automatedActionBlocked: boolean;
  requiredNextChecks: string[];
  riskRationale: string;
  /** Keeps voice and caller ID as context only until possession-bound proof succeeds */
  callerAuthenticationBoundary: CallerAuthenticationBoundary;
  /** Pre-model boundary for any payment data requested during specialist review */
  paymentDataIsolation: PaymentDataIsolation;
}

export interface EscalationHandoffSummary {
  customerIssue: string;
  attemptedResolution: string[];
  missingInformation: string[];
  recommendedNextAction: string;
  /** Why this call routes to a specific human team instead of a generic queue */
  routingRationale: string;
  /** Context packet used to prevent the customer repeating details after transfer */
  readinessChecklist: HandoffReadinessItem[];
  /** Delivery audit proving the packet reached the specialist desktop before live connection */
  deliveryAudit: HandoffDeliveryAudit;
  /** Caller-facing receipt of what context will move with the transfer */
  customerTransferNotice: CustomerTransferNotice;
  /** Agent-assist pre-brief the specialist sees before greeting the caller */
  specialistOpeningBrief: SpecialistOpeningBrief;
  /** Authorization gate that prevents account context alone from approving a sensitive action */
  highValueActionGate: HighValueActionGate;
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
  /** Percentage of calls that were repeat contacts (customer called back within 72h).
   *  Below 5% is healthy; above 12% signals the AI is deflecting but not resolving. */
  repeatContactRate: number;
  /** Absolute count of repeat contacts in the measurement window */
  repeatContactCount: number;
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
