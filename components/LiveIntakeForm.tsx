"use client";

// ─────────────────────────────────────────────────────────────────────────────
// components/LiveIntakeForm.tsx
// Center panel — two modes:
//   A. Selected message detail view (read the full message)
//   B. Live intake form (paste a brand-new unseen message and triage it live)
//
// During the review call, the interviewer will paste a new message here.
// This must work without any app restart or configuration change.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import type { ProcessedMessage, InboundMessage } from "@/lib/types";
import { PRIORITY_COLORS, PRIORITY_HUMAN_LABELS, STATUS_COLORS } from "@/lib/taxonomy";

interface LiveIntakeFormProps {
  selectedMessage: ProcessedMessage | null;
  onTriageLive: (message: InboundMessage) => Promise<void>;
  isProcessing: boolean;
}

function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function LiveIntakeForm({
  selectedMessage,
  onTriageLive,
  isProcessing,
}: LiveIntakeFormProps) {
  const [mode, setMode] = useState<"detail" | "intake">("detail");
  const [form, setForm] = useState({
    sender_name: "",
    sender_email: "",
    subject: "",
    body: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!form.sender_name.trim()) newErrors.sender_name = "Sender name is required.";
    if (!form.sender_email.trim()) newErrors.sender_email = "Sender email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.sender_email))
      newErrors.sender_email = "Please enter a valid email address.";
    if (!form.subject.trim()) newErrors.subject = "Subject is required.";
    if (!form.body.trim()) newErrors.body = "Message body is required.";
    else if (form.body.trim().length < 10)
      newErrors.body = "Please enter the full message body.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const message: InboundMessage = {
      message_id: `LIVE-${Date.now()}`,
      received_at: new Date().toISOString(),
      sender_name: form.sender_name.trim(),
      sender_email: form.sender_email.trim(),
      subject: form.subject.trim(),
      body: form.body.trim(),
    };

    await onTriageLive(message);
    // Reset form on success
    setForm({ sender_name: "", sender_email: "", subject: "", body: "" });
    setErrors({});
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Mode tabs */}
      <div className="flex border-b border-slate-200 bg-white">
        <button
          onClick={() => setMode("detail")}
          className={`flex-1 py-3 text-sm font-medium transition-colors duration-150 ${
            mode === "detail"
              ? "text-blue-700 border-b-2 border-blue-600 bg-white"
              : "text-slate-500 hover:text-slate-700 border-b-2 border-transparent"
          }`}
        >
          Message Detail
        </button>
        <button
          onClick={() => setMode("intake")}
          className={`flex-1 py-3 text-sm font-medium transition-colors duration-150 flex items-center justify-center gap-1.5 ${
            mode === "intake"
              ? "text-blue-700 border-b-2 border-blue-600 bg-white"
              : "text-slate-500 hover:text-slate-700 border-b-2 border-transparent"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          Live Intake
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ── Mode A: Message Detail ──────────────────────────────────────── */}
        {mode === "detail" && (
          <div className="p-5">
            {!selectedMessage ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500 font-medium">No message selected</p>
                <p className="text-xs text-slate-400 mt-1">
                  Select a message from the queue, or use Live Intake to process a new message.
                </p>
              </div>
            ) : (
              <div>
                {/* Message metadata header */}
                <div className="mb-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-base font-semibold text-slate-900 leading-snug">
                      {selectedMessage.subject}
                    </h3>
                    <span className={`flex-shrink-0 inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_COLORS[selectedMessage.status]}`}>
                      {selectedMessage.status}
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-lg px-4 py-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500 w-16">From</span>
                      <span className="text-xs text-slate-800">
                        {selectedMessage.sender_name} &lt;{selectedMessage.sender_email}&gt;
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500 w-16">Received</span>
                      <span className="text-xs text-slate-800">
                        {formatDateTime(selectedMessage.received_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500 w-16">ID</span>
                      <span className="text-xs text-slate-500 font-mono">
                        {selectedMessage.message_id}
                      </span>
                    </div>
                    {selectedMessage.triage?.priority && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500 w-16">Priority</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[selectedMessage.triage.priority]}`}>
                          {PRIORITY_HUMAN_LABELS[selectedMessage.triage.priority]}
                        </span>
                        <span className="text-[10px] text-slate-400">{selectedMessage.triage.priority}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Message body */}
                <div className="mb-6">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Message</p>
                  <div className="bg-white rounded-lg border border-slate-200 p-4">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {selectedMessage.body}
                    </p>
                  </div>
                </div>

                {/* Automation Summary */}
                {selectedMessage.triage && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Automation Summary</p>
                    <div className="bg-slate-50 rounded-lg border border-slate-100 p-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-slate-500 flex-shrink-0">Detected Signal</span>
                        <span className="text-xs font-medium text-slate-800 text-right truncate" title={selectedMessage.triage.category}>{selectedMessage.triage.category}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-slate-500 flex-shrink-0">Routing Signal</span>
                        <span className="text-xs font-medium text-slate-800 text-right truncate" title={selectedMessage.triage.suggested_owner}>{selectedMessage.triage.suggested_owner}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-slate-500 flex-shrink-0">Review Signal</span>
                        <span className="text-xs font-medium text-slate-800 text-right">
                          {selectedMessage.triage.escalation_required ? "Escalation Required" : selectedMessage.triage.human_review_required ? "Human Review Required" : "Auto-Process Eligible"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-200/60 mt-1">
                        <span className="text-xs text-slate-500 flex-shrink-0">Workflow Status</span>
                        <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border ${STATUS_COLORS[selectedMessage.status]}`}>
                          {selectedMessage.status}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Mode B: Live Intake Form ─────────────────────────────────── */}
        {mode === "intake" && (
          <div className="p-5">
            <div className="mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <h3 className="text-sm font-semibold text-slate-800">Live Intake</h3>
              </div>
              <p className="text-xs text-slate-500">
                Paste a new inbound message to run real-time triage. Results appear immediately.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Sender name */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="sender_name">
                    Sender Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="sender_name"
                    name="sender_name"
                    type="text"
                    value={form.sender_name}
                    onChange={handleChange}
                    placeholder="Jane Smith"
                    className={`w-full px-3 py-2 text-sm rounded-lg border bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.sender_name ? "border-red-300 bg-red-50" : "border-slate-300"
                    }`}
                  />
                  {errors.sender_name && (
                    <p className="mt-1 text-xs text-red-600">{errors.sender_name}</p>
                  )}
                </div>

                {/* Sender email */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="sender_email">
                    Sender Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="sender_email"
                    name="sender_email"
                    type="email"
                    value={form.sender_email}
                    onChange={handleChange}
                    placeholder="jane@school.org"
                    className={`w-full px-3 py-2 text-sm rounded-lg border bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.sender_email ? "border-red-300 bg-red-50" : "border-slate-300"
                    }`}
                  />
                  {errors.sender_email && (
                    <p className="mt-1 text-xs text-red-600">{errors.sender_email}</p>
                  )}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="subject">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="e.g. Cannot access admin account"
                  className={`w-full px-3 py-2 text-sm rounded-lg border bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.subject ? "border-red-300 bg-red-50" : "border-slate-300"
                  }`}
                />
                {errors.subject && (
                  <p className="mt-1 text-xs text-red-600">{errors.subject}</p>
                )}
              </div>

              {/* Message body */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="body">
                  Message Body <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="body"
                  name="body"
                  rows={5}
                  value={form.body}
                  onChange={handleChange}
                  placeholder="Paste the full message here..."
                  className={`w-full px-3 py-2 text-sm rounded-lg border bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none leading-relaxed ${
                    errors.body ? "border-red-300 bg-red-50" : "border-slate-300"
                  }`}
                />
                {errors.body && (
                  <p className="mt-1 text-xs text-red-600">{errors.body}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors duration-150 shadow-sm disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Triaging…
                  </>
                ) : (
                  <>Run Triage</>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
