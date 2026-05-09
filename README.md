# Brightwheel Onboarding Triage Console

An AI-powered first-pass triage automation for Brightwheel's onboarding team. Converts raw inbound school messages into structured operational decisions — category, priority, routing, escalation, and draft reply — before a human specialist ever reads the message.

---

## What It Does

Brightwheel's Onboarding team helps newly signed schools go live on the platform within 30 days. Each week, roughly 200 messages arrive from administrators, directors, and teachers. Each message requires a specialist to manually read it and decide: what does this school need, how urgent is it, who should handle it, and whether a standard reply applies.

This console automates that first-pass triage with Claude (Anthropic), reducing per-message processing from 3–5 minutes to near-zero for clear-cut cases.

**The output of each triage:**
- Category (Setup, Billing, Technical Issue, Urgent Launch Blocker, etc.)
- Priority (Urgent / High / Medium / Low)
- Suggested owner (Escalation Lead, Billing Team, Onboarding Specialist, etc.)
- Whether escalation is required
- Whether human review is recommended
- Confidence score (0–100%)
- AI reasoning explanation
- Recommended next action
- Draft reply (professional, ready to send or lightly edit)

---

## Quick Start

```bash
# 1. Clone/open the project
cd brightwheel-triage

# 2. Install dependencies
npm install

# 3. Add your Anthropic API key
cp .env.example .env.local
# Edit .env.local and add: ANTHROPIC_API_KEY=your_key_here

# 4. Run locally
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Without an API key:** The app runs in mock/demo mode with realistic simulated responses. All UI flows work fully.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes (for live AI) | Your Anthropic API key. Read server-side only. Never sent to browser. |

Add this to Vercel's Environment Variables for production deployment.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| AI | Anthropic Claude (claude-opus-4-5) |
| Hosting | Vercel-ready |
| Database | None |
| Auth | None |

---

## How the Workflow Works

```
Inbound Message
     │
     ▼
[Live Intake Form OR Queue Selection]
     │
     ▼
POST /api/triage (server-side)
     │
     ├── Build system prompt (taxonomy + rules)
     ├── Call Claude with strict JSON schema
     ├── Parse + validate response
     ├── Enforce business rules (Urgent → human_review, etc.)
     └── Return fallback if parse fails
     │
     ▼
[Triage Decision Panel]
     ├── Category badge
     ├── Priority badge  
     ├── Escalation / Review banners
     ├── Confidence bar
     ├── Reasoning
     ├── Recommended next action
     └── Draft reply (copy button)
     │
     ▼
[Status Update]
     escalation_required → Escalated
     human_review_required → Needs Review
     else → Triaged
     │
     ▼
[Recent Activity + Metrics Updated]
```

---

## Why This Design Was Chosen

**Why a Next.js web app and not a Python script or n8n workflow?**

A web interface is the only format that satisfies the live ingestion requirement from the assignment. The reviewer must be able to paste a brand-new, never-seen message and see a triage result instantly — with zero restarts, no CLI knowledge, and no configuration changes. A web form achieves this. A script does not.

**Why Claude (Anthropic) and not GPT?**

Claude produces reliably structured JSON output with less need for extensive prompt hardening. Its instruction-following for strict schema compliance is strong, which matters when the output drives operational decisions.

**Why no database?**

The assignment explicitly calls for a prototype. Introducing a database adds deployment complexity without adding value for a demo. The in-memory state model is appropriate for this scope and is clearly separated so a database can be added later.

**Why server-side API calls only?**

API keys must never be exposed in client-side JavaScript. The `/api/triage` route runs on the server, reads the key from `process.env`, calls Anthropic, and returns the result. The browser never sees the key.

---

## File Structure

```
brightwheel-triage/
├── app/
│   ├── page.tsx              ← Main console layout + state management
│   ├── layout.tsx            ← Root layout with Inter font
│   ├── globals.css           ← Global design tokens
│   └── api/triage/
│       └── route.ts          ← Server-side triage API (Claude call)
├── components/
│   ├── MetricCard.tsx        ← Dashboard stat card
│   ├── InboxQueue.tsx        ← Left panel — message queue
│   ├── LiveIntakeForm.tsx    ← Center panel — detail view + live intake
│   ├── TriageResult.tsx      ← Right panel — triage decision display
│   └── RecentActivity.tsx   ← Bottom table — processed messages
├── lib/
│   ├── types.ts              ← All TypeScript interfaces
│   ├── taxonomy.ts           ← Categories, priorities, routing rules, colors
│   ├── triagePrompt.ts       ← LLM prompt builder + fallback
│   └── sampleMessages.ts    ← 10 placeholder messages (CSV-ready shape)
├── .env.example
├── README.md
└── WRITTEN_SUMMARY.md
```

---

## CSV Integration (Future)

The sample messages in `lib/sampleMessages.ts` use exactly the same field shape as `bw_onboarding_tickets.csv`:

```typescript
{
  message_id: string,
  received_at: string,   // ISO 8601
  sender_name: string,
  sender_email: string,
  subject: string,
  body: string,
}
```

To swap in the real CSV:

```typescript
// lib/sampleMessages.ts — replace the array with:
import { parseBwTicketsCsv } from "./csvParser";
export const sampleMessages = parseBwTicketsCsv("bw_onboarding_tickets.csv");
```

See TODO comments in `sampleMessages.ts` and `triagePrompt.ts` for the exact integration points.

---

## Deployment to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

1. Go to Vercel dashboard → Project Settings → Environment Variables
2. Add `ANTHROPIC_API_KEY` with your key
3. Redeploy

The app is fully stateless. No database setup, no migrations, no infrastructure.

---

## Tradeoffs Made

| Decision | Tradeoff |
|---|---|
| In-memory state | No persistence across sessions — acceptable for prototype |
| Single Claude call per message | Simpler but could benefit from retrieval-augmented few-shot examples |
| No streaming | Simpler error handling; adds ~2s latency vs. streaming UX |
| No auth | Fine for internal prototype; required before production |
| No real email ingestion | Simulated queue is sufficient for demo; Zendesk/Gmail webhook needed in prod |

---

## How This Becomes Production-Ready

1. **Persistence:** Move message state to a database (Postgres via Supabase or PlanetScale)
2. **Auth:** Add Brightwheel SSO (Okta, Google Workspace) via NextAuth
3. **Real ingestion:** Webhook receiver for Zendesk, Intercom, or Gmail API
4. **Feedback loop:** Specialists can accept/reject/edit triage decisions; use corrections to improve prompt and few-shot examples
5. **Analytics:** Track triage accuracy, escalation rates, and time saved per week
6. **CSV integration:** Parse `bw_onboarding_tickets.csv` for batch processing and historical few-shot examples
