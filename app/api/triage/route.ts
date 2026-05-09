// ─────────────────────────────────────────────────────────────────────────────
// app/api/triage/route.ts
// Server-side triage API route — uses OpenAI GPT-4o.
//
// Security: API key read from process.env only — never sent to the browser.
//
// Flow:
//   1. Validate request body
//   2. Call OpenAI GPT-4o with strict JSON schema
//   3. Parse and validate response against real taxonomy
//   4. Enforce business rules (P1 → escalation, etc.)
//   5. Return result or safe fallback
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { SYSTEM_PROMPT, buildUserPrompt, FALLBACK_TRIAGE } from "@/lib/triagePrompt";
import { CATEGORIES, PRIORITIES, OWNERS } from "@/lib/taxonomy";
import type { TriageRequest, TriageResponse, TriageResult } from "@/lib/types";

// ── OpenAI client — API key read from env, never hardcoded ───────────────────
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ─────────────────────────────────────────────────────────────────────────────
// Schema validator — validates all fields and enum values from real taxonomy
// ─────────────────────────────────────────────────────────────────────────────
function validateTriageResult(obj: unknown): obj is TriageResult {
  if (!obj || typeof obj !== "object") return false;
  const r = obj as Record<string, unknown>;

  return (
    typeof r.category === "string" &&
    CATEGORIES.includes(r.category as TriageResult["category"]) &&
    typeof r.priority === "string" &&
    PRIORITIES.includes(r.priority as TriageResult["priority"]) &&
    typeof r.suggested_owner === "string" &&
    OWNERS.includes(r.suggested_owner as TriageResult["suggested_owner"]) &&
    typeof r.escalation_required === "boolean" &&
    typeof r.human_review_required === "boolean" &&
    typeof r.confidence === "number" &&
    r.confidence >= 0 &&
    r.confidence <= 1 &&
    typeof r.reasoning === "string" &&
    r.reasoning.length > 0 &&
    typeof r.recommended_next_action === "string" &&
    r.recommended_next_action.length > 0 &&
    typeof r.draft_reply === "string" &&
    r.draft_reply.length > 0
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock response — used when OPENAI_API_KEY is not set.
// Uses real P1/P2/P3 taxonomy from bw_onboarding_tickets.xlsx.
// ─────────────────────────────────────────────────────────────────────────────
function buildMockResponse(subject: string, body: string): TriageResult {
  const text = `${subject} ${body}`.toLowerCase();

  const isPrivacy =
    text.includes("privacy") ||
    text.includes("can see another") ||
    text.includes("data breach") ||
    text.includes("see a child that is not");

  const isOutage =
    text.includes("stuck on loading") ||
    text.includes("tablets") ||
    text.includes("all classroom") ||
    text.includes("every single");

  const isUrgentAccess =
    text.includes("parents cannot log in") ||
    text.includes("families who") ||
    (text.includes("urgent") && text.includes("tomorrow"));

  const isAdminTransfer =
    text.includes("director left") ||
    text.includes("director resign") ||
    text.includes("transfer admin") ||
    text.includes("transfer ownership") ||
    (text.includes("departure") && text.includes("friday"));

  const isNoContact =
    text.includes("no onboarding call") ||
    text.includes("never had an onboarding") ||
    text.includes("been open") && text.includes("no contact");

  const isMisdirectedJob =
    text.includes("applying for") ||
    text.includes("resume") ||
    text.includes("teacher assistant position");

  const isMisdirectedSales =
    text.includes("interested in brightwheel") ||
    text.includes("evaluating options") ||
    text.includes("competitor") ||
    text.includes("pricing");

  const isBillingDuplicate = text.includes("charged twice") || text.includes("charged $") && text.includes("again");
  const isBillingPlan = text.includes("upgraded plan") || text.includes("premium plan") || text.includes("features not showing");
  const isBillingInvoice = text.includes("invoice") && !text.includes("charged twice");

  const isTechnicalCrash = text.includes("crashing") || text.includes("crash");
  const isTechnicalVisibility = text.includes("not showing in parent") || text.includes("classroom names");
  const isTechnicalBug = text.includes("check-in feature") || text.includes("feature") && text.includes("not") && text.includes("available");
  const isTechnicalInvite = text.includes("invitation") && (text.includes("spam") || text.includes("expired") || text.includes("not received"));

  const isSetupRoster = text.includes("import") || text.includes("spreadsheet") || text.includes("roster");
  const isSetupNewStaff = text.includes("new teacher") && text.includes("monday");
  const isSetupStaff = text.includes("add teacher") || text.includes("add my teaching") || text.includes("add staff");

  const isUpsell = text.includes("ready to add billing") || text.includes("billing features") && text.includes("love it");
  const isMultiPart = text.includes("few things") || text.includes("a few things") || text.includes("several things");
  const isLowSignal = text.includes("following up") || text.includes("any update") || (text.includes("haven't heard") && text.length < 200);
  const isVague = (text.includes("some issues") || text.includes("some problems")) && text.length < 250;
  const isFeatureRequest = text.includes("customize") || text.includes("customization") || text.includes("feature request") || text.includes("health tracking") || text.includes("attendance report");

  // ── Return in order of urgency ────────────────────────────────────────────
  if (isPrivacy) {
    return { category: "Urgent - Privacy / Data Breach", priority: "P1", suggested_owner: "Escalate to Engineering + Legal Immediately", escalation_required: true, human_review_required: true, confidence: 0.95, reasoning: "[DEMO MODE] Serious privacy issue — parent can see another family's child's data. Requires immediate engineering and legal response.", recommended_next_action: "Escalate immediately to Engineering and Legal. Investigate data isolation failure. Contact school director by phone.", draft_reply: "Hi Angela,\n\nThank you for flagging this immediately — we are treating this as a critical issue. I'm escalating it to our engineering and legal teams right now for immediate investigation.\n\nWe will be in touch as soon as we have an update. Please don't hesitate to call us directly.\n\nBrightwheel Onboarding Team" };
  }
  if (isOutage) {
    return { category: "Urgent - Technical Outage", priority: "P1", suggested_owner: "Tech Support (Escalate Immediately)", escalation_required: true, human_review_required: true, confidence: 0.92, reasoning: "[DEMO MODE] Full classroom device outage with school opening in days. Critical escalation required.", recommended_next_action: "Escalate to Tech Support immediately. Call the school. Diagnose the app update failure and restore all classroom devices.", draft_reply: "Hi Yolanda,\n\nI can see this is a critical situation — I'm escalating this to our technical team right now. Someone will call you within the hour to work through this before your opening.\n\nBrightwheel Onboarding Team" };
  }
  if (isAdminTransfer) {
    return { category: "Access - Admin Transfer (Time-Sensitive)", priority: "P1", suggested_owner: "Onboarding Specialist", escalation_required: true, human_review_required: true, confidence: 0.91, reasoning: "[DEMO MODE] Admin account must transfer before director departs Friday. Time-sensitive access issue.", recommended_next_action: "Escalate to Onboarding Specialist immediately. Process account ownership transfer before end of week.", draft_reply: "Hi Thomas,\n\nThank you for flagging this — I understand the urgency with your director's departure on Friday. I'm escalating this to your Onboarding Specialist to get the account transfer processed before then.\n\nBrightwheel Onboarding Team" };
  }
  if (isUrgentAccess) {
    return { category: "Urgent - Parent Access", priority: "P1", suggested_owner: "Onboarding Specialist (Escalate)", escalation_required: true, human_review_required: true, confidence: 0.9, reasoning: "[DEMO MODE] School opens tomorrow and parents cannot log in. Immediate escalation required.", recommended_next_action: "Escalate immediately. Call the school. Diagnose parent invite delivery and resend in bulk.", draft_reply: "Hi Marcus,\n\nI can see this is urgent — I'm escalating this right now. Someone from our team will call you within the hour to get your families access before tomorrow morning.\n\nBrightwheel Onboarding Team" };
  }
  if (isNoContact) {
    return { category: "Urgent - No Contact / At Risk", priority: "P2", suggested_owner: "Onboarding Specialist (Escalate to Manager)", escalation_required: true, human_review_required: true, confidence: 0.88, reasoning: "[DEMO MODE] School has been live for weeks with no onboarding contact. At-risk account requiring manager escalation.", recommended_next_action: "Escalate to Onboarding Manager. Schedule immediate catch-up call. Review account health.", draft_reply: "Hi Terrence,\n\nI sincerely apologize for the lack of outreach — this is not the experience we want for you. I'm escalating this to our onboarding manager who will schedule a call with you as soon as possible.\n\nBrightwheel Onboarding Team" };
  }
  if (isMisdirectedJob) {
    return { category: "Misdirected - Job Application", priority: "P3", suggested_owner: "No Action (Wrong Recipient)", escalation_required: false, human_review_required: false, confidence: 0.97, reasoning: "[DEMO MODE] Job application sent to the wrong team.", recommended_next_action: "No action. Wrong recipient — this is not an onboarding message.", draft_reply: "Hi,\n\nThank you for your interest! It looks like this message reached our onboarding support team. For job opportunities at Brightwheel, please visit brightwheel.com/careers.\n\nBest of luck!\nBrightwheel Team" };
  }
  if (isMisdirectedSales) {
    return { category: "Misdirected - Sales Inquiry", priority: "P3", suggested_owner: "Sales Team", escalation_required: false, human_review_required: false, confidence: 0.91, reasoning: "[DEMO MODE] Sales inquiry from a prospective school — not an existing onboarding customer.", recommended_next_action: "Route to Sales Team to schedule a demo.", draft_reply: "Hi,\n\nThank you for your interest in Brightwheel! You've reached our onboarding team. I'll pass your message along to our sales team who will be in touch shortly.\n\nBrightwheel Team" };
  }
  if (isVague) {
    return { category: "Ambiguous - Vague", priority: "P2", suggested_owner: "Onboarding Specialist (Needs Clarification)", escalation_required: false, human_review_required: true, confidence: 0.6, reasoning: "[DEMO MODE] Message is too vague to classify. Clarification needed before routing.", recommended_next_action: "Reply to ask for specific details about the issue.", draft_reply: "Hi Robert,\n\nThank you for reaching out. To make sure we get you the right help, could you share a bit more detail about the issue you're experiencing?\n\nBrightwheel Onboarding Team" };
  }
  if (isLowSignal) {
    return { category: "Low Signal - Follow-Up", priority: "P3", suggested_owner: "Onboarding Specialist", escalation_required: false, human_review_required: false, confidence: 0.92, reasoning: "[DEMO MODE] Follow-up message with no new information.", recommended_next_action: "Check original message thread and respond with an update.", draft_reply: "Hi Sandra,\n\nThank you for following up — I'm looking into your earlier message and will get back to you shortly.\n\nBrightwheel Onboarding Team" };
  }
  if (isUpsell) {
    return { category: "Upsell / Expansion Opportunity", priority: "P2", suggested_owner: "Sales / Account Manager", escalation_required: false, human_review_required: false, confidence: 0.89, reasoning: "[DEMO MODE] Existing happy customer wants to add billing module before summer enrollment.", recommended_next_action: "Route to Sales/Account Manager to enable the billing module by May 15th.", draft_reply: "Hi Christine,\n\nThat's wonderful to hear — we love that you're loving Brightwheel! I'm connecting you with your Account Manager who will walk you through enabling parent billing in time for your May 15th goal.\n\nBrightwheel Onboarding Team" };
  }
  if (isBillingDuplicate) {
    return { category: "Billing - Duplicate Charge", priority: "P2", suggested_owner: "Onboarding Billing Coordinator", escalation_required: false, human_review_required: false, confidence: 0.9, reasoning: "[DEMO MODE] Duplicate charge reported — billing coordinator review needed.", recommended_next_action: "Route to Billing Coordinator. Review payment history and issue refund if applicable.", draft_reply: "Hi Diana,\n\nThank you for catching this. I'm routing your message to our billing coordinator who will review your account and resolve the duplicate charge as quickly as possible.\n\nBrightwheel Onboarding Team" };
  }
  if (isBillingPlan) {
    return { category: "Billing - Plan Discrepancy", priority: "P2", suggested_owner: "Onboarding Billing Coordinator + Tech Support", escalation_required: false, human_review_required: false, confidence: 0.87, reasoning: "[DEMO MODE] Plan upgrade not reflected — billing and tech support coordination needed.", recommended_next_action: "Route to Billing Coordinator and Tech Support jointly. Verify upgrade applied and provision Premium features.", draft_reply: "Hi David,\n\nI'm sorry the upgrade hasn't come through yet. I'm flagging this to both our billing team and technical support who will verify your plan and get the Premium features activated.\n\nBrightwheel Onboarding Team" };
  }
  if (isBillingInvoice) {
    return { category: "Billing - Invoice Request", priority: "P3", suggested_owner: "Onboarding Billing Coordinator", escalation_required: false, human_review_required: false, confidence: 0.93, reasoning: "[DEMO MODE] Formal invoice requested for accounting.", recommended_next_action: "Route to Billing Coordinator to generate and send formal invoice.", draft_reply: "Hi Frank,\n\nAbsolutely — I'm routing this to our billing team who will send a formal invoice to finance@cedarlakecdc.com.\n\nBrightwheel Onboarding Team" };
  }
  if (isTechnicalCrash) {
    return { category: "Technical - App Crash", priority: "P2", suggested_owner: "Tech Support", escalation_required: false, human_review_required: false, confidence: 0.88, reasoning: "[DEMO MODE] App crashing on a specific device after login.", recommended_next_action: "Route to Tech Support. Gather device model, OS version, app version. Investigate crash on iPad 6th gen iOS 16.4.", draft_reply: "Hi Tanya,\n\nThank you for the details — I'm flagging this to our technical support team who will investigate the crash on that specific device and follow up with you shortly.\n\nBrightwheel Onboarding Team" };
  }
  if (isTechnicalVisibility) {
    return { category: "Technical - Classroom Visibility", priority: "P2", suggested_owner: "Tech Support", escalation_required: false, human_review_required: false, confidence: 0.87, reasoning: "[DEMO MODE] Classrooms set up in admin but not visible in parent app.", recommended_next_action: "Route to Tech Support. Check classroom publishing and parent app sync.", draft_reply: "Hi Fatima,\n\nThank you for flagging this. I'm routing this to our tech support team who will investigate why the classrooms aren't appearing in the parent app and get it resolved.\n\nBrightwheel Onboarding Team" };
  }
  if (isTechnicalBug) {
    return { category: "Technical - Feature Bug", priority: "P2", suggested_owner: "Tech Support", escalation_required: false, human_review_required: false, confidence: 0.83, reasoning: "[DEMO MODE] Expected feature not showing in the account — possible configuration or plan issue.", recommended_next_action: "Route to Tech Support. Verify plan includes check-in feature and check configuration.", draft_reply: "Hi Alicia,\n\nThank you for reaching out. I'm flagging this to our tech support team who will check your account configuration and get the check-in feature working.\n\nBrightwheel Onboarding Team" };
  }
  if (isTechnicalInvite) {
    return { category: "Technical - Parent Invite Delivery", priority: "P2", suggested_owner: "Onboarding Specialist", escalation_required: false, human_review_required: false, confidence: 0.86, reasoning: "[DEMO MODE] Parent invitation emails going to spam or links expiring — delivery issue.", recommended_next_action: "Route to Onboarding Specialist. Investigate email deliverability. Resend invites and advise on spam whitelist.", draft_reply: "Hi Priya,\n\nThank you for letting us know. I'm connecting you with your Onboarding Specialist who will look into the invitation delivery issue and help get your staff access restored.\n\nBrightwheel Onboarding Team" };
  }
  if (isMultiPart) {
    return { category: "Multi-Part - Setup + Billing", priority: "P2", suggested_owner: "Onboarding Specialist + Billing Coordinator", escalation_required: false, human_review_required: true, confidence: 0.78, reasoning: "[DEMO MODE] Message contains multiple questions touching setup and billing — needs coordinated response.", recommended_next_action: "Route to Onboarding Specialist and Billing Coordinator jointly. Address each question in a single reply.", draft_reply: "Hi Paul,\n\nThank you for laying these out so clearly. I'm routing this to your Onboarding Specialist and Billing Coordinator who will answer each question in one organized response.\n\nBrightwheel Onboarding Team" };
  }
  if (isSetupRoster) {
    return { category: "Setup - Roster Import", priority: "P3", suggested_owner: "Onboarding Specialist", escalation_required: false, human_review_required: false, confidence: 0.88, reasoning: "[DEMO MODE] Roster import request — 94 children from spreadsheet.", recommended_next_action: "Route to Onboarding Specialist. Share roster import guide and CSV template.", draft_reply: "Hi Gwen,\n\nGreat news — bulk roster import is supported! I'm connecting you with your Onboarding Specialist who will share our import template and walk you through the process.\n\nBrightwheel Onboarding Team" };
  }
  if (isSetupNewStaff) {
    return { category: "Setup - New Staff", priority: "P3", suggested_owner: "Onboarding Specialist", escalation_required: false, human_review_required: false, confidence: 0.91, reasoning: "[DEMO MODE] Request to add a new teacher account.", recommended_next_action: "Route to Onboarding Specialist. Create account for Emily Garza in Toddler 1 room.", draft_reply: "Hi Marcus,\n\nHappy to get Emily added before Monday! I'm passing this to your Onboarding Specialist who will get her account set up in the Toddler 1 room.\n\nBrightwheel Onboarding Team" };
  }
  if (isFeatureRequest) {
    return { category: "Feature Request - Customization", priority: "P3", suggested_owner: "Onboarding Specialist", escalation_required: false, human_review_required: false, confidence: 0.82, reasoning: "[DEMO MODE] Feature request or customization question — not a blocking issue.", recommended_next_action: "Route to Onboarding Specialist. Document feature request and share current workarounds.", draft_reply: "Hi,\n\nThank you for this feedback — I'm connecting you with your Onboarding Specialist who can walk you through what's currently available and make note of your request for our product team.\n\nBrightwheel Onboarding Team" };
  }
  if (isSetupStaff) {
    return { category: "Setup - Staff Management", priority: "P3", suggested_owner: "Onboarding Specialist", escalation_required: false, human_review_required: false, confidence: 0.87, reasoning: "[DEMO MODE] General staff setup question for a new onboarding customer.", recommended_next_action: "Route to Onboarding Specialist. Walk through staff invitation and classroom assignment.", draft_reply: "Hi Sandra,\n\nWelcome to Brightwheel! Adding your teaching staff is straightforward — your Onboarding Specialist will be in touch to walk you through the steps.\n\nBrightwheel Onboarding Team" };
  }

  // Default fallback
  return {
    category: "Setup - Staff Management",
    priority: "P3",
    suggested_owner: "Onboarding Specialist",
    escalation_required: false,
    human_review_required: false,
    confidence: 0.7,
    reasoning: "[DEMO MODE] General onboarding question routed to Onboarding Specialist.",
    recommended_next_action: "Route to Onboarding Specialist for follow-up.",
    draft_reply: "Hi,\n\nThank you for reaching out! Your Onboarding Specialist will be in touch shortly to assist you.\n\nBrightwheel Onboarding Team",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/triage
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse<TriageResponse>> {
  // ── Parse request body ─────────────────────────────────────────────────────
  let body: TriageRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON in request body." },
      { status: 400 }
    );
  }

  const { message } = body;

  if (
    !message ||
    !message.sender_name ||
    !message.sender_email ||
    !message.subject ||
    !message.body
  ) {
    return NextResponse.json(
      { success: false, error: "Missing required fields: sender_name, sender_email, subject, body." },
      { status: 400 }
    );
  }

  // Ensure message_id exists (live intake generates one on the client)
  if (!message.message_id) {
    message.message_id = `LIVE-${Date.now()}`;
  }

  // ── Check for API key ──────────────────────────────────────────────────────
  const hasApiKey = Boolean(process.env.OPENAI_API_KEY);

  if (!hasApiKey) {
    console.warn("[Triage API] No OPENAI_API_KEY found. Returning mock response.");
    const mock = buildMockResponse(message.subject, message.body);
    return NextResponse.json({ success: true, result: mock });
  }

  // ── Call OpenAI GPT-4o ────────────────────────────────────────────────────
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(message) },
      ],
      temperature: 0.2,
      max_tokens: 1024,
    });

    const rawText = response.choices[0]?.message?.content?.trim();
    if (!rawText) {
      throw new Error("Empty response from OpenAI.");
    }

    // ── Parse JSON ────────────────────────────────────────────────────────
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      console.error("[Triage API] JSON parse failed:", rawText);
      return NextResponse.json({ success: true, result: FALLBACK_TRIAGE });
    }

    // ── Validate schema ───────────────────────────────────────────────────
    if (!validateTriageResult(parsed)) {
      console.error("[Triage API] Schema validation failed:", parsed);
      return NextResponse.json({ success: true, result: FALLBACK_TRIAGE });
    }

    // ── Enforce business rules ────────────────────────────────────────────
    if (parsed.priority === "P1") {
      parsed.human_review_required = true;
      parsed.escalation_required = true;
    }
    if (parsed.confidence < 0.75) {
      parsed.human_review_required = true;
    }
    if (
      parsed.category === "Urgent - Privacy / Data Breach" ||
      parsed.category === "Urgent - Technical Outage" ||
      parsed.category === "Urgent - Parent Access" ||
      parsed.category === "Access - Admin Transfer (Time-Sensitive)"
    ) {
      parsed.escalation_required = true;
      parsed.human_review_required = true;
    }

    return NextResponse.json({ success: true, result: parsed });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error calling OpenAI.";
    console.error("[Triage API] Error:", msg);
    return NextResponse.json(
      { success: false, error: `Triage processing failed: ${msg}` },
      { status: 500 }
    );
  }
}
