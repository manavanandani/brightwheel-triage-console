# Written Summary: Brightwheel Onboarding Triage Console

---

## 1. What Was Built and Why This Approach

I built a lightweight internal operations console — not a chatbot, not a Python script, and not a mockup. The key insight was that the assignment's live ingestion requirement ("we will paste a new message during the review call") dictates the format: it must be a web interface, accessible without any CLI knowledge or configuration change.

The console has three integrated parts: a pre-loaded inbox queue containing the 25 provided CSV messages, a message detail + live intake panel (the two modes a specialist actually operates in), and a structured triage decision panel that renders the AI output in a form an operations leader can act on without reading JSON.

I chose OpenAI GPT-4o for the AI layer because of its reliable structured JSON output and strong instruction-following. The entire LLM call happens server-side in a Next.js API route — API keys never touch the browser. The app is Vercel-deployable with a single environment variable.

I deliberately avoided: databases (adds deployment complexity with no demo value), authentication (same), streaming (simpler error handling was more important than 1-second faster UX), and n8n or external workflow tools (introduces fragility and setup requirements during a live demo).

---

## 2. Key Design Decisions and Tradeoffs

**Decision 1: One-page stateless app with in-memory state**

I chose to keep all state in React's `useState` rather than introducing a database or state management library. For a 3-hour prototype that will be demoed live, this is the right call — it eliminates a full class of failure modes (database connectivity, migration errors, API rate limits on a database service). The tradeoff is that refreshing the page resets the queue, which is fine for a demo but would need to change in production.

**Decision 2: Strict JSON schema with server-side business rule enforcement**

The LLM prompt enforces strict JSON with no markdown. But I don't trust the model alone: the API route validates every field against the taxonomy enum after parsing, and re-applies business rules post-validation (e.g., if priority is Urgent, `human_review_required` is forced to `true` regardless of what the model said). This prevents a hallucinated `false` from creating a gap in the safety net. The tradeoff is slightly more code in the route, but the reliability is worth it.

**Decision 3: Mock response mode when no API key is present**

The app functions without an API key — it returns realistic mock responses based on keyword signals in the message. This was essential for making the demo resilient: if there's an API issue during the review call, the interface still demonstrates the full workflow. The mock responses are clearly marked in the `reasoning` field with `[DEMO MODE]`.

---

## 3. Where This Breaks — Failure Modes That Concern Me

**Prompt brittleness on edge cases.** The taxonomy I defined is derived from the provided CSV, but a real production system would need to analyze a much larger historical ticket volume to validate that these categories cover all edge cases. If a message doesn't fit neatly into the taxonomy, the model might force it into the closest bucket rather than flagging it as unknown.

**False confidence on urgent cases.** If a school writes in a calm, non-urgent tone but is actually 36 hours from launch, the model may assign Medium priority based on tone rather than content. Urgency signals in the body (dates, school opening day) are present in the prompt guidance but models can miss subtle ones. This is exactly why `human_review_required: true` is forced for all urgent routing.

**No feedback loop.** Today, if the AI makes a wrong classification, there is no mechanism to capture that correction and improve future triage. In production, every specialist accept/reject action is training signal.

**In-memory state.** Queue resets on page refresh. If two specialists are using the tool simultaneously, they see different state.

---

## 4. What Business Information Would Be Needed for Production

- **Actual ticket taxonomy at scale.** What categories does the team actually use today beyond the provided 25 examples? The current taxonomy was inferred from the sample data — it needs to be validated against real escalation history and team mental models.
- **Routing org chart.** Who specifically are the Escalation Leads, Implementation Managers, and Billing contacts? Routing to a role is step one; routing to a named queue or person in a real ticketing system is step two.
- **SLA definitions.** What is the expected response time for Urgent vs. High vs. Medium? These should be reflected in the draft reply ("we will follow up within 4 hours") rather than left generic.
- **Policy guardrails.** What can the AI never promise or confirm? Pricing, refunds, contract terms, and timeline commitments should be flagged for human review and excluded from draft replies entirely.
- **Volume patterns.** Are there surge periods (start of semester, August enrollment season) where the priority logic should be more aggressive?

---

## 5. What I Would Tackle First With More Time

**Priority 1: Database Persistence & Auth.** Currently, state is entirely in-memory for the sake of the live demo. I would integrate a Postgres database (via Prisma/Drizzle) to persist messages and an auth provider (like NextAuth) to ensure only authorized Brightwheel employees can access the triage engine.

**Priority 2: Specialist feedback UI.** Add a simple thumbs up/down on each triage result, with an optional correction field for category and priority. Log these corrections. After 100 corrections, retrain the prompt examples. This is the highest-leverage improvement to accuracy over time.

**Priority 3: Real ingestion webhook.** A Zendesk or Intercom webhook that fires on every new inbound message, calls `/api/triage`, and writes the result back to the ticket as an internal note. This removes the manual queue step entirely — specialists open a ticket and see the AI decision already pre-populated.

**Priority 4: Escalation notifications.** For `escalation_required: true` messages, automatically send a Slack message to the #onboarding-escalations channel or page the on-call Escalation Lead. Time-to-acknowledge on urgent cases is a critical SLA.
