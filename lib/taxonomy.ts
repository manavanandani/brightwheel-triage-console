// ─────────────────────────────────────────────────────────────────────────────
// lib/taxonomy.ts
// Authoritative taxonomy derived from bw_onboarding_tickets.xlsx.
// All categories, priorities, and routing rules reflect the REAL dataset.
// ─────────────────────────────────────────────────────────────────────────────

import type { MessageCategory, Priority, SuggestedOwner } from "./types";

// ── All valid categories (from real CSV expected_category) ────────────────────
export const CATEGORIES: MessageCategory[] = [
  "Setup - Staff Management",
  "Setup - New Staff",
  "Setup - Roster Import",
  "Access - Staff Login",
  "Access - Admin Transfer (Time-Sensitive)",
  "Billing - Duplicate Charge",
  "Billing - Invoice Request",
  "Billing - Plan Discrepancy",
  "Technical - App Crash",
  "Technical - Classroom Visibility",
  "Technical - Feature Bug",
  "Technical - Parent Invite Delivery",
  "Urgent - Parent Access",
  "Urgent - Technical Outage",
  "Urgent - Privacy / Data Breach",
  "Urgent - No Contact / At Risk",
  "Feature Request - Customization",
  "Feature Request - Reporting",
  "Misdirected - Job Application",
  "Misdirected - Sales Inquiry",
  "Upsell / Expansion Opportunity",
  "Multi-Part - Setup + Billing",
  "Multi-Part - Setup + Privacy + Billing",
  "Ambiguous - Vague",
  "Low Signal - Follow-Up",
];

// ── Priority levels (P1/P2/P3) ────────────────────────────────────────────────
export const PRIORITIES: Priority[] = ["P1", "P2", "P3", "P4"];

// ── All valid routing owners (from real CSV expected_owner) ───────────────────
export const OWNERS: SuggestedOwner[] = [
  "Onboarding Specialist",
  "Onboarding Specialist (Escalate)",
  "Onboarding Specialist (Escalate to Manager)",
  "Onboarding Specialist (Needs Clarification)",
  "Onboarding Billing Coordinator",
  "Onboarding Billing Coordinator + Tech Support",
  "Onboarding Specialist + Billing Coordinator",
  "Tech Support",
  "Tech Support (Escalate Immediately)",
  "Sales / Account Manager",
  "Sales Team",
  "Escalate to Engineering + Legal Immediately",
  "No Action (Wrong Recipient)",
];

// ── Priority rules ────────────────────────────────────────────────────────────
export const PRIORITY_RULES = `
PRIORITY LOGIC:
- P1 (Urgent): school opens within 48 hours, go-live is actively blocked, parents cannot access app before launch, technical outage affecting all devices, admin transfer needed immediately (director leaving), privacy/data breach reported.
- P2 (High): school opens within 1–2 weeks with a blocking issue, billing discrepancy affecting current period, app crash on a specific device, upgrade plan not applied, ambiguous message with signals of urgency, multi-part issue touching billing or technical.
- P3 (Medium): routine setup questions, low-signal follow-ups with no new information, invoice requests, staff add requests with no urgency.
- P4 (Low): feature requests, misdirected messages (job apps, sales inquiries), vague messages with no urgency signals.
`.trim();

// ── Escalation rules ──────────────────────────────────────────────────────────
export const ESCALATION_RULES = `
ESCALATION LOGIC (set escalation_required: true if ANY apply):
- School opens within 48 hours and any issue is blocking launch
- Parent access is completely blocked before school opens
- All classroom devices are down (technical outage)
- A privacy or data breach has been reported (parent seeing another family's child)
- Admin account ownership must transfer before a director leaves (time-sensitive)
- No contact from a school that should have launched (at-risk account)
`.trim();

// ── Human review rules ────────────────────────────────────────────────────────
export const HUMAN_REVIEW_RULES = `
HUMAN REVIEW LOGIC (set human_review_required: true if ANY apply):
- Priority is P1
- Confidence is below 0.75
- Message is ambiguous or vague (category: Ambiguous - Vague)
- Message is misdirected (category: Misdirected - *)
- Message has multiple issues requiring multiple teams
- Draft reply requires business policy confirmation
- Customer shows signs of frustration, distress, or launch risk
- Privacy or data breach involved (always escalate + human review)
`.trim();

// ── Draft reply guidance ──────────────────────────────────────────────────────
export const DRAFT_REPLY_RULES = `
DRAFT REPLY REQUIREMENTS:
- Professional, empathetic, and concise
- Address the sender by first name if it can be inferred
- Acknowledge the specific issue — do not give a generic response
- Do not overpromise or claim action is already complete. For urgent cases, state clearly that the issue is being flagged/routed for immediate review, NOT that it has been resolved.
- P1/Escalation: clearly state it is being escalated for immediate attention
- Privacy breach: be serious, do not downplay — confirm investigation is immediate
- Misdirected: politely explain this reached the wrong team and redirect
- Upsell/expansion: be warm and enthusiastic, route to Sales/Account Manager
- Vague/ambiguous: ask a specific clarifying question
- Sound like Brightwheel onboarding/support — not a generic AI assistant
- Do not use placeholder text like [NAME] or [INSERT]
`.trim();

// ── UI display helpers ────────────────────────────────────────────────────────

export const PRIORITY_COLORS: Record<Priority, string> = {
  P1: "bg-red-50 text-red-700 border-red-200",
  P2: "bg-amber-50 text-amber-700 border-amber-200",
  P3: "bg-slate-100 text-slate-700 border-slate-200",
  P4: "bg-slate-50 text-slate-500 border-slate-200",
};

// Human-readable priority labels — shown as primary label in UI
export const PRIORITY_HUMAN_LABELS: Record<Priority, string> = {
  P1: "Urgent",
  P2: "High",
  P3: "Medium",
  P4: "Low",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  P1: "P1 — Urgent",
  P2: "P2 — High",
  P3: "P3 — Medium",
  P4: "P4 — Low",
};

// Maps detailed CSV categories to stable primary display categories
export const CATEGORY_PRIMARY: Record<string, string> = {
  "Setup - Staff Management":               "Setup / Implementation",
  "Setup - New Staff":                      "Setup / Implementation",
  "Setup - Roster Import":                  "Setup / Implementation",
  "Access - Staff Login":                   "Account Access",
  "Access - Admin Transfer (Time-Sensitive)": "Account Access",
  "Billing - Duplicate Charge":             "Billing / Payments",
  "Billing - Invoice Request":              "Billing / Payments",
  "Billing - Plan Discrepancy":             "Billing / Payments",
  "Technical - App Crash":                  "Technical Issue",
  "Technical - Classroom Visibility":       "Technical Issue",
  "Technical - Feature Bug":                "Technical Issue",
  "Technical - Parent Invite Delivery":     "Technical Issue",
  "Urgent - Parent Access":                 "Urgent Launch Blocker",
  "Urgent - Technical Outage":              "Urgent Launch Blocker",
  "Urgent - Privacy / Data Breach":         "Urgent Launch Blocker",
  "Urgent - No Contact / At Risk":          "Urgent Launch Blocker",
  "Feature Request - Customization":        "Feature Request / Product Feedback",
  "Feature Request - Reporting":            "Feature Request / Product Feedback",
  "Misdirected - Job Application":          "Non-Onboarding / Wrong Team",
  "Misdirected - Sales Inquiry":            "Non-Onboarding / Wrong Team",
  "Upsell / Expansion Opportunity":         "Upsell / Expansion",
  "Multi-Part - Setup + Billing":           "Multi-Part Issue",
  "Multi-Part - Setup + Privacy + Billing": "Multi-Part Issue",
  "Ambiguous - Vague":                      "General Question",
  "Low Signal - Follow-Up":                 "Follow-Up",
};

// Colors keyed on PRIMARY category for consistent display
export const CATEGORY_PRIMARY_COLORS: Record<string, string> = {
  "Setup / Implementation":     "bg-blue-50 text-blue-700",
  "Account Access":             "bg-sky-50 text-sky-700",
  "Billing / Payments":         "bg-violet-50 text-violet-700",
  "Technical Issue":            "bg-orange-50 text-orange-700",
  "Urgent Launch Blocker":      "bg-red-50 text-red-700",
  "Feature Request / Product Feedback": "bg-teal-50 text-teal-700",
  "Non-Onboarding / Wrong Team": "bg-slate-100 text-slate-600",
  "Upsell / Expansion":         "bg-emerald-50 text-emerald-700",
  "Multi-Part Issue":           "bg-purple-50 text-purple-700",
  "General Question":           "bg-yellow-50 text-yellow-700",
  "Follow-Up":                  "bg-slate-100 text-slate-500",
};

export const STATUS_COLORS: Record<string, string> = {
  New: "bg-blue-50 text-blue-700 border-blue-200",
  Triaged: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Needs Review": "bg-amber-50 text-amber-700 border-amber-200",
  Escalated: "bg-red-50 text-red-700 border-red-200",
};

// Category → color (grouped by type)
export const CATEGORY_COLORS: Record<MessageCategory, string> = {
  "Setup - Staff Management":               "bg-indigo-50 text-indigo-700",
  "Setup - New Staff":                      "bg-indigo-50 text-indigo-700",
  "Setup - Roster Import":                  "bg-indigo-50 text-indigo-700",
  "Access - Staff Login":                   "bg-cyan-50 text-cyan-700",
  "Access - Admin Transfer (Time-Sensitive)":"bg-cyan-50 text-cyan-700",
  "Billing - Duplicate Charge":             "bg-violet-50 text-violet-700",
  "Billing - Invoice Request":              "bg-violet-50 text-violet-700",
  "Billing - Plan Discrepancy":             "bg-violet-50 text-violet-700",
  "Technical - App Crash":                  "bg-orange-50 text-orange-700",
  "Technical - Classroom Visibility":       "bg-orange-50 text-orange-700",
  "Technical - Feature Bug":                "bg-orange-50 text-orange-700",
  "Technical - Parent Invite Delivery":     "bg-orange-50 text-orange-700",
  "Urgent - Parent Access":                 "bg-red-50 text-red-700",
  "Urgent - Technical Outage":              "bg-red-50 text-red-700",
  "Urgent - Privacy / Data Breach":         "bg-red-50 text-red-700",
  "Urgent - No Contact / At Risk":          "bg-red-50 text-red-700",
  "Feature Request - Customization":        "bg-teal-50 text-teal-700",
  "Feature Request - Reporting":            "bg-teal-50 text-teal-700",
  "Misdirected - Job Application":          "bg-gray-100 text-gray-600",
  "Misdirected - Sales Inquiry":            "bg-gray-100 text-gray-600",
  "Upsell / Expansion Opportunity":         "bg-emerald-50 text-emerald-700",
  "Multi-Part - Setup + Billing":           "bg-purple-50 text-purple-700",
  "Multi-Part - Setup + Privacy + Billing": "bg-purple-50 text-purple-700",
  "Ambiguous - Vague":                      "bg-yellow-50 text-yellow-700",
  "Low Signal - Follow-Up":                 "bg-slate-100 text-slate-500",
};
