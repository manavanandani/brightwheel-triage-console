// ─────────────────────────────────────────────────────────────────────────────
// lib/types.ts
// Core type definitions for the Brightwheel Onboarding Triage Console.
// Taxonomy is derived from the real bw_onboarding_tickets.xlsx dataset.
// ─────────────────────────────────────────────────────────────────────────────

// ── Category taxonomy — matches real CSV expected_category values ─────────────
export type MessageCategory =
  | "Setup - Staff Management"
  | "Setup - New Staff"
  | "Setup - Roster Import"
  | "Access - Staff Login"
  | "Access - Admin Transfer (Time-Sensitive)"
  | "Billing - Duplicate Charge"
  | "Billing - Invoice Request"
  | "Billing - Plan Discrepancy"
  | "Technical - App Crash"
  | "Technical - Classroom Visibility"
  | "Technical - Feature Bug"
  | "Technical - Parent Invite Delivery"
  | "Urgent - Parent Access"
  | "Urgent - Technical Outage"
  | "Urgent - Privacy / Data Breach"
  | "Urgent - No Contact / At Risk"
  | "Feature Request - Customization"
  | "Feature Request - Reporting"
  | "Misdirected - Job Application"
  | "Misdirected - Sales Inquiry"
  | "Upsell / Expansion Opportunity"
  | "Multi-Part - Setup + Billing"
  | "Multi-Part - Setup + Privacy + Billing"
  | "Ambiguous - Vague"
  | "Low Signal - Follow-Up";

// ── Priority levels — P1/P2/P3 matching CSV expected_priority ────────────────
// P1 = Urgent (school open / blocked / breach)
// P2 = High   (launch soon, blocked progress, billing issues)
// P3 = Medium/Low (routine questions, low-signal messages)
export type Priority = "P1" | "P2" | "P3" | "P4";

// ── Routing owners — matches real CSV expected_owner values ───────────────────
export type SuggestedOwner =
  | "Onboarding Specialist"
  | "Onboarding Specialist (Escalate)"
  | "Onboarding Specialist (Escalate to Manager)"
  | "Onboarding Specialist (Needs Clarification)"
  | "Onboarding Billing Coordinator"
  | "Onboarding Billing Coordinator + Tech Support"
  | "Onboarding Specialist + Billing Coordinator"
  | "Tech Support"
  | "Tech Support (Escalate Immediately)"
  | "Sales / Account Manager"
  | "Sales Team"
  | "Escalate to Engineering + Legal Immediately"
  | "No Action (Wrong Recipient)";

// ── Message status lifecycle ──────────────────────────────────────────────────
export type MessageStatus = "New" | "Triaged" | "Needs Review" | "Escalated";

// ─────────────────────────────────────────────────────────────────────────────
// Inbound message — matches bw_onboarding_tickets.xlsx schema exactly
// ─────────────────────────────────────────────────────────────────────────────
export interface InboundMessage {
  message_id: string;
  received_at: string;        // ISO 8601 timestamp
  sender_name: string;
  sender_email: string;
  subject: string;
  body: string;
  // Ground truth labels from CSV (present in dataset, not shown to LLM)
  expected_category?: string;
  expected_priority?: string;
  expected_owner?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Triage result — strict schema returned by /api/triage
// ─────────────────────────────────────────────────────────────────────────────
export interface TriageResult {
  category: MessageCategory;
  priority: Priority;
  suggested_owner: SuggestedOwner;
  escalation_required: boolean;
  human_review_required: boolean;
  confidence: number;           // 0.0 – 1.0
  reasoning: string;
  recommended_next_action: string;
  draft_reply: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Processed message — inbound message + triage result + status
// ─────────────────────────────────────────────────────────────────────────────
export interface ProcessedMessage extends InboundMessage {
  status: MessageStatus;
  triage?: TriageResult;
  processed_at?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API shapes
// ─────────────────────────────────────────────────────────────────────────────
export interface TriageRequest {
  message: InboundMessage;
}

export interface TriageResponse {
  success: boolean;
  result?: TriageResult;
  error?: string;
}
