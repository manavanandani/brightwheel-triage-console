"use client";

// ─────────────────────────────────────────────────────────────────────────────
// app/page.tsx
// Brightwheel Onboarding Triage Console — Main Application
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from "react";
import MetricCard from "@/components/MetricCard";
import InboxQueue from "@/components/InboxQueue";
import LiveIntakeForm from "@/components/LiveIntakeForm";
import TriageResultPanel from "@/components/TriageResult";
import RecentActivity from "@/components/RecentActivity";
import { sampleMessages } from "@/lib/sampleMessages";
import type {
  ProcessedMessage,
  InboundMessage,
  TriageResult,
  TriageResponse,
} from "@/lib/types";

function toProcessedMessage(msg: InboundMessage): ProcessedMessage {
  return { ...msg, status: "New" };
}

function deriveStatus(result: TriageResult): ProcessedMessage["status"] {
  if (result.escalation_required) return "Escalated";
  if (result.human_review_required) return "Needs Review";
  return "Triaged";
}

const Icons = {
  Inbox: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Eye: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  Alert: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

// ── Workflow step arrow ──────────────────────────────────────────────────────
function WorkflowStep({
  label,
  sub,
  active,
  last,
}: {
  label: string;
  sub: string;
  active?: boolean;
  last?: boolean;
}) {
  return (
    <>
      <div className={`flex flex-col ${active ? "" : "opacity-50"}`}>
        <span className={`text-xs font-semibold ${active ? "text-slate-800" : "text-slate-500"}`}>
          {label}
        </span>
        <span className="text-[10px] text-slate-400 mt-0.5">{sub}</span>
      </div>
      {!last && (
        <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </>
  );
}

export default function HomePage() {
  const [messages, setMessages] = useState<ProcessedMessage[]>(
    sampleMessages.map(toProcessedMessage)
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isLiveProcessing, setIsLiveProcessing] = useState(false);
  const [triageError, setTriageError] = useState<string | null>(null);

  const selectedMessage = messages.find((m) => m.message_id === selectedId) ?? null;
  const totalMessages = messages.length;
  const triaged = messages.filter((m) => m.status === "Triaged").length;
  const needsReview = messages.filter((m) => m.status === "Needs Review").length;
  const escalated = messages.filter((m) => m.status === "Escalated").length;
  const processedCount = triaged + needsReview + escalated;
  const timeSavedMins = processedCount * 4;
  const timeSavedDisplay =
    timeSavedMins >= 60
      ? `${Math.floor(timeSavedMins / 60)}h ${timeSavedMins % 60}m`
      : `${timeSavedMins}m`;

  const runTriage = useCallback(
    async (message: InboundMessage, isLive = false): Promise<boolean> => {
      setTriageError(null);
      try {
        const response = await fetch("/api/triage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });
        const data: TriageResponse = await response.json();
        if (!response.ok || !data.success || !data.result) {
          throw new Error(data.error || "Triage API returned an error.");
        }
        const result = data.result;
        const status = deriveStatus(result);
        const now = new Date().toISOString();
        if (isLive) {
          setMessages((prev) => [{ ...message, status, triage: result, processed_at: now }, ...prev]);
          setSelectedId(message.message_id);
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.message_id === message.message_id
                ? { ...m, status, triage: result, processed_at: now }
                : m
            )
          );
        }
        return true;
      } catch (err) {
        setTriageError(err instanceof Error ? err.message : "Unknown error.");
        return false;
      }
    },
    []
  );

  const handleProcessSingle = useCallback(
    async (message: ProcessedMessage) => {
      if (processingId) return;
      setProcessingId(message.message_id);
      setSelectedId(message.message_id);
      await runTriage(message, false);
      setProcessingId(null);
    },
    [processingId, runTriage]
  );

  const handleProcessAll = useCallback(async () => {
    const unprocessed = messages.filter((m) => m.status === "New");
    for (const message of unprocessed) {
      setProcessingId(message.message_id);
      setSelectedId(message.message_id);
      await runTriage(message, false);
    }
    setProcessingId(null);
  }, [messages, runTriage]);

  const handleTriageLive = useCallback(
    async (message: InboundMessage) => {
      setIsLiveProcessing(true);
      setTriageError(null);
      await runTriage(message, true);
      setIsLiveProcessing(false);
    },
    [runTriage]
  );

  const handleRetry = useCallback(() => {
    if (selectedMessage) handleProcessSingle(selectedMessage);
  }, [selectedMessage, handleProcessSingle]);

  const isResultLoading =
    (processingId !== null && processingId === selectedId) || isLiveProcessing;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200/70 sticky top-0 z-10 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Brightwheel logomark — using their actual brand blue */}
            <div className="flex items-center gap-2.5">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="14" fill="#4A57C8"/>
                <circle cx="14" cy="14" r="6" fill="white" opacity="0.9"/>
                <circle cx="14" cy="14" r="3" fill="#4A57C8"/>
                <circle cx="14" cy="5" r="2.5" fill="white"/>
                <circle cx="14" cy="23" r="2.5" fill="white"/>
                <circle cx="5" cy="14" r="2.5" fill="white"/>
                <circle cx="23" cy="14" r="2.5" fill="white"/>
              </svg>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 tracking-tight">brightwheel</span>
                  <span className="text-slate-300 text-xs">|</span>
                  <span className="text-sm font-medium text-slate-600">Onboarding Console</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-px leading-none">Internal Operations · Triage &amp; Routing</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 hidden md:block">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Intake Enabled
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-6 py-5 space-y-5">
        {/* ── Metrics Row ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <MetricCard label="Total Messages" value={totalMessages} subtext="this week" icon={<Icons.Inbox />} accent="blue" />
          <MetricCard label="Triaged" value={triaged} subtext="no action needed" icon={<Icons.Check />} accent="green" />
          <MetricCard label="Needs Review" value={needsReview} subtext="low confidence" icon={<Icons.Eye />} accent="amber" />
          <MetricCard label="Escalated" value={escalated} subtext="urgent / blocked" icon={<Icons.Alert />} accent="red" />
          <MetricCard
            label="Specialist Time Saved"
            value={processedCount > 0 ? timeSavedDisplay : "—"}
            subtext={processedCount > 0 ? `${processedCount} msgs × 4 min avg` : "Run triage to calculate"}
            icon={<Icons.Clock />}
            accent="indigo"
          />
        </div>

        {/* ── Workflow Strip ─────────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200/70 rounded-xl px-8 py-3.5 shadow-sm flex items-center w-full">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-12 flex-shrink-0">Pipeline</span>
          <div className="flex-1 flex items-center justify-between">
            <WorkflowStep label="Inbound Message" sub="email · form · ticket" active />
            <WorkflowStep label="AI Triage" sub="classify · prioritize" active />
            <WorkflowStep label="Owner Routing" sub="auto-assigned" active />
            <WorkflowStep label="Human Review" sub="escalation check" active />
            <WorkflowStep label="Draft Reply" sub="ready to send" active last />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-5 h-[640px]">
          {/* Left — Inbox Queue */}
          <div className="col-span-12 md:col-span-4 lg:col-span-3 bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden flex flex-col">
            <InboxQueue
              messages={messages}
              selectedId={selectedId}
              processingId={processingId}
              onSelect={(msg) => setSelectedId(msg.message_id)}
              onProcessSingle={handleProcessSingle}
              onProcessAll={handleProcessAll}
            />
          </div>

          {/* Center — Message Detail / Live Intake */}
          <div className="col-span-12 md:col-span-4 lg:col-span-5 bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden flex flex-col">
            <LiveIntakeForm
              selectedMessage={selectedMessage}
              onTriageLive={handleTriageLive}
              isProcessing={isLiveProcessing}
            />
          </div>

          {/* Right — Triage Decision */}
          <div className="col-span-12 md:col-span-4 lg:col-span-4 bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden flex flex-col">
            <TriageResultPanel
              message={selectedMessage}
              isLoading={isResultLoading}
              error={triageError}
              onRetry={handleRetry}
            />
          </div>
        </div>

        {/* ── Recent Activity ─────────────────────────────────────────────── */}
        <RecentActivity messages={messages} onSelect={(msg) => setSelectedId(msg.message_id)} />

        {/* ── Footer note ─────────────────────────────────────────────────── */}
        <div className="flex items-start gap-3 bg-slate-50 border border-slate-200/70 rounded-xl px-5 py-4 shadow-sm">
          <svg className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-slate-500 leading-relaxed">
            <strong className="font-semibold text-slate-700">First-pass triage only.</strong>{" "}
            Urgent, escalated, and low-confidence cases are flagged for specialist review. Draft replies should be reviewed before sending,
            particularly for sensitive or time-critical situations.
          </p>
        </div>
      </div>
    </div>
  );
}
