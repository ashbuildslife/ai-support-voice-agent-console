# AI Support Voice Agent Console

A voice agent monitoring dashboard for customer support. Watch live call transcripts with real-time intent classification. Every AI answer is grounded to a knowledge base article with source citations. Frustration detection triggers human escalation before callers hang up. Supervisor dashboard tracks call outcomes, CSAT predictions, and per-call quality reviews.

This is a portfolio demonstration of production AI voice agent patterns: intent classification, KB grounding, frustration detection, smart escalation, and call quality evaluation.

## Who this is for

**Customer support leaders evaluating AI voice agents.** If you're worried about AI bots giving wrong answers, trapping customers in loops, or damaging your CSAT scores, this shows the monitoring and guardrails that should be in place.

**Engineering teams building voice or chat support systems.** It proves you understand the hard parts: grounding every answer in a source document, detecting frustration before the caller hangs up, and escalating to humans with full call context. Not blind transfers.

**AI agents and technical screeners.** It compiles, passes lint/typecheck/test/build. Intent classification, KB grounding, frustration detection, and call quality rubrics are all visible on a single dashboard.

## Project story

HN users are vocal about AI voice support failures. One described calling a utility company to report a downed power line and being trapped in a bot loop. even after saying "emergency," "public hazard," and "imminent danger to life." Another reported that Stripe's AI support "actively suggested incorrect explanations" causing "several days of wasted effort." Users are canceling service, filing chargebacks, and moving to competitors.

This project demonstrates the counter-pattern: a voice agent that actually works.

- **It announces it's AI**: no deceptive human mimicry. Turn 1: "I'm Ava, an AI assistant, just so you know, you're speaking with an automated system."
- **Every answer cites a source**: three KB articles ground the AI's responses. When the caller asks about a refund, the AI quotes KB-142 (Cancellation Policy) and KB-203 (Refund Exceptions). No hallucinated policies.
- **It detects frustration and escalates**: when the caller says "ridiculous" and "unacceptable" at turn 6, the system detects frustration keywords, checks if the case qualifies for expedited handling, and transfers to a human billing specialist with full call context.
- **It's monitored**: a supervisor dashboard shows call outcomes, escalation rates, average CSAT, and per-call quality reviews scored across clarity, accuracy, empathy, and efficiency.

![](docs/screenshots/01-dashboard-hero.png)

*Above: the voice agent console showing an active billing call with real-time intent classification and sentiment tracking.*

## What you're looking at

| Screenshot | What it shows |
|---|---|
| `01-dashboard-hero.png` | Landing view: active call card, caller info, duration, CSAT prediction, escalation status |
| `02-live-transcript.png` | Full 9-turn transcript: AI announces its identity, classifies intent each turn, handles billing dispute, escalates after frustration detection |
| `03-kb-grounded-answers.png` | Three AI answers each sourced to a KB article with confidence scores. no hallucinations |
| `04-frustration-escalation.png` | Frustration alert (turn 6) with detected keywords + escalation event with reason, transfer target, and reference number |
| `05-supervisor-metrics-quality.png` | Supervisor dashboard: call volume, resolution rate, CSAT, calls by intent + quality review rubric (clarity 8/10, empathy 6/10) |
| `00-full-page.png` | Full-page portfolio screenshot |

## Features

- **Live transcript**: 9-turn call showing AI-caller exchange with per-turn intent classification (billing, technical, account, etc.)
- **KB-grounded answers**: Every AI response cites a source article with confidence scores. No hallucinated policies
- **Frustration detection**: Keyword-based detection triggers escalation. Screenshot shows "ridiculous" and "unacceptable" detected at turn 6
- **Smart escalation**: Transfer to human with full call context, reference number, and reason. Not a blind dump
- **Transparent AI identity**: Turn 1 announces the caller is speaking with an automated system. No deceptive mimicry
- **Supervisor dashboard**: Call volume, resolution rate, escalation rate, average CSAT, calls-by-intent breakdown
- **Call quality review**: Per-call rubric scoring across clarity, accuracy, empathy, and efficiency. Reviewer notes explain why empathy scored lower than accuracy
- **Knowledge base**: Three articles covering cancellation policy, refund exceptions, and account verification

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Testing | Vitest: 7 tests covering transcript, frustration detection, metrics, and quality review |
| CI | GitHub Actions |
| Data | TypeScript fixture data, no real voice API, no phone numbers required |

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Quality gates

```bash
npm run lint        # ESLint with zero warnings
npm run typecheck   # TypeScript strict mode
npm test            # Vitest. 7 tests
npm run build       # Production build
```

## Safety

- No real phone numbers, API keys, or credentials committed
- All caller names, companies, and KB articles are fictional
- No network calls; all data is static fixture data

---

Built as a portfolio demonstration of production AI voice agent patterns. Ready for review.
