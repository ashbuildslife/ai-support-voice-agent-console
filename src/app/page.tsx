import { demoActiveCall, demoEscalationEvents, demoFrustrationAlerts, demoGroundedAnswers, demoKBArticles, demoMetrics, demoQualityReview, demoTranscript } from "@/lib/demo-data";
import type { EscalationAction, IntentCategory, Sentiment } from "@/lib/types";

function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: string }) {
  const t: Record<string, string> = { slate: "border-slate-200 bg-white text-slate-700", green: "border-emerald-200 bg-emerald-50 text-emerald-700", red: "border-red-200 bg-red-50 text-red-700", amber: "border-amber-200 bg-amber-50 text-amber-800", purple: "border-indigo-200 bg-indigo-50 text-indigo-700" };
  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${t[tone]}`}>{children}</span>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur ${className}`}>{children}</section>;
}

function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  const m = { calm: { label: "Calm", tone: "green" }, frustrated: { label: "Frustrated", tone: "amber" }, angry: { label: "Angry", tone: "red" } };
  return <Badge tone={m[sentiment].tone as "green" | "amber" | "red"}>{m[sentiment].label}</Badge>;
}

function IntentBadge({ intent }: { intent: IntentCategory }) {
  const m: Record<IntentCategory, string> = { billing: "purple", technical: "indigo", account: "slate", cancellation: "red", general: "slate" };
  return <Badge tone={m[intent]}>{intent}</Badge>;
}

const escalationActionLabels: Record<EscalationAction, string> = {
  continue: "Continue",
  clarify: "Clarify",
  human_handoff: "Human handoff",
  qa_review: "QA review",
  immediate_alert: "Immediate alert"
};

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-5 py-8 md:px-8 lg:px-10 bg-slate-50">
      {/* HEADER */}
      <header className="grid gap-6 rounded-[2rem] border border-white/80 bg-white/80 p-8 shadow-sm backdrop-blur lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge tone="purple">AI Voice Agent</Badge>
            <Badge tone={demoActiveCall.outcome === "escalated" ? "amber" : "green"}>{demoActiveCall.outcome}</Badge>
            <IntentBadge intent={demoActiveCall.intent} />
            <SentimentBadge sentiment={demoActiveCall.sentiment} />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-indigo-600">Live Call Monitor</p>
          <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-6xl">AI Support Voice Agent</h1>
          <p className="max-w-3xl text-lg leading-8 text-slate-600">
            Real-time intent classification. KB-grounded answers with source citations. 
            Frustration detection that escalates to humans before callers hang up.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Caller", value: demoActiveCall.callerName },
            { label: "Duration", value: demoActiveCall.duration },
            { label: "CSAT predicted", value: `${demoActiveCall.csatPredicted}/100` },
            { label: "Escalated", value: demoActiveCall.escalationTriggered ? "Yes — turn 7" : "No" }
          ].map(s => (
            <div key={s.label} className="rounded-2xl bg-slate-950 p-4 text-white">
              <p className="text-sm text-slate-300">{s.label}</p>
              <p className="text-3xl font-black">{s.value}</p>
            </div>
          ))}
        </div>
      </header>

      {/* TRANSCRIPT + KB GROUNDING */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-950">Live Transcript</h2>
            <div className="flex gap-2 text-xs">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-500" /> AI</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-400" /> Caller</span>
            </div>
          </div>
          <div className="space-y-3">
            {demoTranscript.map(turn => (
              <div key={turn.id} className={`rounded-2xl p-4 ${turn.speaker === "ai" ? "bg-indigo-50 border border-indigo-100 ml-4" : "bg-white border border-slate-200 mr-4"}`}>
   <div className="flex items-center justify-between gap-2 text-xs mb-2">
     <span className={`font-semibold uppercase tracking-wide ${turn.speaker === "ai" ? "text-indigo-600" : "text-slate-500"}`}>
       {turn.speaker === "ai" ? "🤖 AI Assistant" : "📞 Caller"}
     </span>
     <div className="flex items-center gap-2">
       {turn.intent && <IntentBadge intent={turn.intent} />}
       <span className="text-slate-400">{turn.timestamp}</span>
       {turn.silenceBeforeSeconds !== undefined && turn.silenceBeforeSeconds > 2.5 && (
         <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700" title={`${turn.silenceBeforeSeconds}s silence before reply`}>
           ⏱ +{turn.silenceBeforeSeconds}s
         </span>
       )}
     </div>
   </div>
                <p className="text-sm leading-6 text-slate-700">{turn.text}</p>
              </div>
            ))}
          </div>
          {/* Frustration alert */}
          {demoFrustrationAlerts.map(alert => (
            <div key={alert.callId} className="mt-4 rounded-2xl border-2 border-red-300 bg-red-50 p-4">
              <p className="font-bold text-red-700 text-sm">⚠ Frustration Detected — Turn {alert.turnNumber}</p>
              <p className="mt-1 text-xs text-red-600">Keywords: {alert.keywords.join(", ")}. Escalation triggered: {alert.escalated ? "Yes ✓" : "No"}</p>
            </div>
          ))}
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <h2 className="text-xl font-bold text-slate-950">KB-Grounded Answers</h2>
            <div className="mt-4 space-y-3">
              {demoGroundedAnswers.map(ans => (
                <div key={ans.turnId} className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                  <p className="text-xs leading-5 text-slate-700">{ans.answer}</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-emerald-700 font-semibold">📄 {ans.sourceArticle}</span>
                    <span className="tabular-nums text-slate-500">{Math.round(ans.confidence * 100)}% confidence</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="text-xl font-bold text-slate-950">Escalation Event</h2>
            {demoEscalationEvents.map(e => (
              <div key={e.callId} className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
                <p className="text-sm font-semibold text-slate-950">Transferred to: {e.transferredTo}</p>
                <p className="mt-2 text-xs leading-5 text-slate-600">{e.reason}</p>
                <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                  <div className="rounded-xl bg-white/80 p-3">
                    <p className="font-semibold text-slate-500">Risk score</p>
                    <p className="text-lg font-black text-amber-700">{e.riskScore}/10</p>
                  </div>
                  <div className="rounded-xl bg-white/80 p-3">
                    <p className="font-semibold text-slate-500">Rubric action</p>
                    <p className="font-black text-slate-950">{escalationActionLabels[e.recommendedAction]}</p>
                  </div>
                  <div className="rounded-xl bg-white/80 p-3">
                    <p className="font-semibold text-slate-500">Policy sensitivity</p>
                    <p className="font-black text-slate-950">{e.policySensitivity}</p>
                  </div>
                </div>
                <div className="mt-3 rounded-xl border border-amber-200 bg-white/70 p-3 text-xs leading-5 text-slate-700">
                  <p className="font-bold text-slate-950">Warm handoff summary</p>
                  <p className="mt-1">{e.handoffSummary.customerIssue}</p>
                  <ul className="mt-2 list-disc pl-4">
                    {e.handoffSummary.attemptedResolution.map(item => <li key={item}>{item}</li>)}
                  </ul>
                  <p className="mt-2"><strong>Next action:</strong> {e.handoffSummary.recommendedNextAction}</p>
                  <p className="mt-2 text-amber-800"><strong>Risk flags:</strong> {e.riskFlags.join(", ")}</p>
                </div>
                <p className="mt-2 text-xs text-slate-400">At {e.atTimestamp}</p>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {/* METRICS + QUALITY REVIEW */}
      <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        <Card>
          <h2 className="text-xl font-bold text-slate-950">Supervisor Metrics</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { label: "Total calls", value: demoMetrics.totalCalls },
              { label: "Resolved", value: demoMetrics.resolvedCount },
              { label: "Escalated", value: demoMetrics.escalatedCount },
              { label: "Escalation rate", value: `${demoMetrics.escalationRate}%` },
              { label: "Avg duration", value: demoMetrics.avgDuration },
              { label: "Avg CSAT", value: `${demoMetrics.avgCsat}/100` }
            ].map(s => (
              <div key={s.label} className="rounded-xl bg-slate-950 p-3 text-white">
                <p className="text-xs text-slate-300">{s.label}</p>
                <p className="text-xl font-black">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Calls by intent</p>
            {Object.entries(demoMetrics.callsByIntent).map(([intent, count]) => (
              <div key={intent} className="flex items-center justify-between rounded-lg px-3 py-1.5 text-sm">
                <span className="capitalize">{intent}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </Card>

        {demoQualityReview && (
          <Card>
            <h2 className="text-xl font-bold text-slate-950">Call Quality Review</h2>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-3xl font-black text-indigo-700">{demoQualityReview.overallScore}</span>
              <span className="text-sm text-slate-400">/ 100</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {demoQualityReview.rubricScores.map(score => (
                <div key={score.category} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm capitalize">{score.category}</p>
                    <p className="font-black text-indigo-700">{score.score}/{score.maxScore}</p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-indigo-600" style={{ width: `${(score.score / score.maxScore) * 100}%` }} />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{score.evidence}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 text-sm leading-6 text-indigo-900">
              <strong>Reviewer notes:</strong> {demoQualityReview.reviewerNotes}
            </div>
          </Card>
        )}
      </div>

      {/* KB ARTICLES */}
      <Card>
        <h2 className="text-xl font-bold text-slate-950">Knowledge Base</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {demoKBArticles.map(kb => (
            <div key={kb.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-bold text-slate-950">{kb.title}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-600">{kb.content}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {kb.tags.map(tag => (
                  <span key={tag} className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
}
