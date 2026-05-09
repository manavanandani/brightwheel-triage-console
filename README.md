# Brightwheel Onboarding Triage Console

An AI-powered first-pass triage automation for Brightwheel's onboarding team. Converts raw inbound school messages into structured operational decisions — category, priority, routing, escalation, and draft reply — before a human specialist ever reads the message.

---

## What It Does

Brightwheel's Onboarding team helps newly signed schools go live on the platform within 30 days. Each week, roughly 200 messages arrive from administrators, directors, and teachers. Each message requires a specialist to manually read it and decide: what does this school need, how urgent is it, who should handle it, and whether a standard reply applies.

This console automates that first-pass triage with OpenAI GPT-4o, reducing per-message processing from 3–5 minutes to near-zero for clear-cut cases.

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

# 3. Add your OpenAI API key
cp .env.example .env.local
# Edit .env.local and add: OPENAI_API_KEY=your_key_here

# 4. Run locally
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Without an API key:** The app runs in mock/demo mode with realistic simulated responses. All UI flows work fully.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes (for live AI) | Your OpenAI API key. Read server-side only. Never exposed to the browser. |

Add this to your Vercel Environment Variables for production deployment.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| AI | OpenAI GPT-4o |
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
     ├── Call OpenAI with strict JSON schema
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

**Why OpenAI GPT-4o?**

GPT-4o produces reliably structured JSON output and its instruction-following for strict schema compliance is incredibly strong, which is vital when the output drives operations.

**Why no database?**

The assignment explicitly calls for a prototype. Introducing a database adds deployment complexity without adding value for a demo. The in-memory state model is appropriate for this scope and is clearly separated so a database can be added later.

**Why server-side API calls only?**

API keys must never be exposed in client-side JavaScript. The `/api/triage` route runs entirely on the server, reads the key from `process.env`, calls OpenAI, and returns the result safely.

---

## File Structure

```
brightwheel-triage/
├── app/
│   ├── page.tsx              ← Main console layout + state management
│   ├── layout.tsx            ← Root layout with Inter font
│   ├── globals.css           ← Global design tokens
│   └── api/triage/
│       └── route.ts          ← Server-side triage API (OpenAI call)
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
│   └── sampleMessages.ts    ← The actual 25 messages from the assignment CSV
├── .env.example
├── README.md
└── WRITTEN_SUMMARY.md
```

---

## Deployment to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

1. Go to your Vercel dashboard → Project Settings → Environment Variables
2. Add `OPENAI_API_KEY` with your OpenAI key
3. Redeploy

The app is fully stateless. There is no database setup, no migrations, and no infrastructure to manage.

---

## Tradeoffs Made

| Decision | Tradeoff |
|---|---|
| In-memory state | No persistence across sessions — acceptable for prototype |
| Single OpenAI call per message | Simpler but could benefit from retrieval-augmented few-shot examples |
| No streaming | Simpler error handling; adds ~2s latency vs. streaming UX |
| No auth | Fine for internal prototype; required before production |
| No real email ingestion | Simulated queue is sufficient for demo; Zendesk/Gmail webhook needed in prod |

---

## How This Becomes Production-Ready

1. **Persistence:** Move message state to a database (Postgres via Prisma or Drizzle).
2. **Auth:** Add Brightwheel SSO (Okta, Google Workspace) via NextAuth so only employees can access the dashboard.
3. **Real ingestion:** Build a webhook receiver for Zendesk, Intercom, or the Gmail API.
4. **Feedback loop:** Allow specialists to accept/reject triage decisions to build a high-quality dataset for fine-tuning.
5. **Analytics:** Track triage accuracy, escalation rates, and specialist time saved per week.
