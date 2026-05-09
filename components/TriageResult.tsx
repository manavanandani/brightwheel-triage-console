"use client";

// ─────────────────────────────────────────────────────────────────────────────
// components/TriageResult.tsx
// Right panel — structured triage decision display.
// Shows primary category + subcategory, human-readable priority (Urgent/High/Routine),
// escalation/review status always visible, triage rationale, next action, draft reply.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import type { TriageResult, ProcessedMessage } from "@/lib/types";
import {
  PRIORITY_COLORS,
  PRIORITY_HUMAN_LABELS,
  CATEGORY_PRIMARY,
  CATEGORY_PRIMARY_COLORS,
  STATUS_COLORS,
} from "@/lib/taxonomy";

interface TriageResultPanelProps {
  message: ProcessedMessage | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

function ConfidenceBar({ value }: { value: number }) {
  const percent = Math.round(value * 100);
  const color =
    value >= 0.85 ? "bg-emerald-500" : value >= 0.70 ? "bg-amber-400" : "bg-red-400";
  const label =
    value >= 0.85 ? "High confidence" : value >= 0.70 ? "Moderate confidence" : "Low confidence";

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-slate-500">{label}</span>
        <span className="text-xs font-semibold text-slate-700">{percent}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors duration-150"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-emerald-600">Copied!</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy reply
        </>
      )}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
      {children}
    </p>
  );
}



export default function TriageResultPanel({
  message,
  isLoading,
  error,
  onRetry,
}: TriageResultPanelProps) {
  const result: TriageResult | undefined = message?.triage;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="relative w-12 h-12 mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-blue-100"></div>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-600 animate-spin"></div>
          <div className="absolute inset-2 rounded-full bg-blue-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>
        <p className="text-sm font-semibold text-slate-700">Running triage</p>
        <p className="text-xs text-slate-400 mt-1">Classifying, prioritizing, and drafting reply…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-3">
          <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-700 mb-1">Triage failed</p>
        <p className="text-xs text-slate-500 mb-4 max-w-xs">{error}</p>
        <button
          onClick={onRetry}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors duration-150"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!result || !message) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-500">Triage Decision</p>
        <p className="text-xs text-slate-400 mt-1 max-w-[200px] leading-relaxed">
          Select a message and click Run Triage, or use Live Intake.
        </p>
      </div>
    );
  }

  // Derive primary category and subcategory for display
  const primaryCategory = CATEGORY_PRIMARY[result.category] ?? result.category;
  const subcategory =
    CATEGORY_PRIMARY[result.category] && CATEGORY_PRIMARY[result.category] !== result.category
      ? result.category
      : null;
  const categoryColor = CATEGORY_PRIMARY_COLORS[primaryCategory] ?? "bg-slate-100 text-slate-600";
  const humanPriority = PRIORITY_HUMAN_LABELS[result.priority] ?? result.priority;

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Triage Decision</h2>
          <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[220px]">{message.subject}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded border border-slate-100">
            Source: {message.message_id.startsWith("LIVE-") ? "Live Intake" : "Queue"}
          </span>
          <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_COLORS[message.status]}`}>
            {message.status}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ── Escalation banners ─────────────────────────────────────────────── */}
        {result.escalation_required && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-2.5">
            <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-red-800">Escalation Required</p>
              <p className="text-xs text-red-700 mt-0.5">Do not handle with standard workflow. Route to the assigned owner immediately.</p>
            </div>
          </div>
        )}

        {result.human_review_required && !result.escalation_required && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-2.5">
            <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-amber-800">Specialist Review Recommended</p>
              <p className="text-xs text-amber-700 mt-0.5">Low confidence or ambiguous message. Review before sending draft reply.</p>
            </div>
          </div>
        )}

        {/* ── Category + Priority ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <SectionLabel>Category</SectionLabel>
            <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1.5 rounded-lg ${categoryColor}`}>
              {primaryCategory}
            </span>
            {subcategory && (
              <p className="text-[10px] text-slate-400 mt-1.5 pl-0.5">{subcategory}</p>
            )}
          </div>

          <div>
            <SectionLabel>Priority</SectionLabel>
            <div>
              <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1.5 rounded-lg border ${PRIORITY_COLORS[result.priority]}`}>
                {humanPriority}
              </span>
              <p className="text-[10px] text-slate-400 mt-1.5 pl-0.5">{result.priority}</p>
            </div>
          </div>
        </div>

        {/* ── Owner ──────────────────────────────────────────────────────────── */}
        <div>
          <SectionLabel>Assigned Owner</SectionLabel>
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-200">
            <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs font-medium text-slate-700">{result.suggested_owner}</span>
          </div>
        </div>

        {/* ── Draft Reply ────────────────────────────────────────────────────── */}
        <div>
          <SectionLabel>Draft Reply</SectionLabel>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <span className="text-xs font-medium text-slate-500">Ready to send</span>
              </div>
              <CopyButton text={result.draft_reply} />
            </div>
            <div className="p-3 bg-white max-h-48 overflow-y-auto">
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "inherit" }}>
                {result.draft_reply}
              </p>
            </div>
          </div>
        </div>

        {/* ── Recommended Next Action ────────────────────────────────────────── */}
        <div>
          <SectionLabel>Recommended Next Action</SectionLabel>
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-3">
            <p className="text-xs text-blue-800 leading-relaxed font-medium">{result.recommended_next_action}</p>
          </div>
        </div>

        {/* ── Triage Rationale ──────────────────────────────────────────────── */}
        <div>
          <SectionLabel>Triage Rationale</SectionLabel>
          <div className="bg-slate-50 rounded-lg px-3 py-3 border border-slate-100">
            <p className="text-xs text-slate-600 leading-relaxed">{result.reasoning}</p>
          </div>
        </div>

        {/* ── Confidence ─────────────────────────────────────────────────────── */}
        <div className="bg-slate-50 rounded-lg px-3 py-3 border border-slate-100">
          <SectionLabel>Confidence</SectionLabel>
          <ConfidenceBar value={result.confidence} />
        </div>
      </div>
    </div>
  );
}
