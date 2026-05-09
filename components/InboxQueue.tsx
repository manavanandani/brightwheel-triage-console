"use client";

// ─────────────────────────────────────────────────────────────────────────────
// components/InboxQueue.tsx
// Left panel — incoming message queue.
// Shows sender, subject, body preview, status badge.
// "Run Triage" is shown only on the selected/hovered card to reduce clutter.
// ─────────────────────────────────────────────────────────────────────────────

import type { ProcessedMessage } from "@/lib/types";
import { STATUS_COLORS, PRIORITY_COLORS, PRIORITY_HUMAN_LABELS } from "@/lib/taxonomy";

interface InboxQueueProps {
  messages: ProcessedMessage[];
  selectedId: string | null;
  processingId: string | null;
  onSelect: (message: ProcessedMessage) => void;
  onProcessSingle: (message: ProcessedMessage) => void;
  onProcessAll: () => void;
}

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${Math.floor(diffHours / 24)}d`;
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
  "bg-emerald-100 text-emerald-700",
  "bg-orange-100 text-orange-700",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export default function InboxQueue({
  messages,
  selectedId,
  processingId,
  onSelect,
  onProcessSingle,
  onProcessAll,
}: InboxQueueProps) {
  const newCount = messages.filter((m) => m.status === "New").length;
  const hasUnprocessed = newCount > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Incoming Queue</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {messages.length} messages
            {newCount > 0 && (
              <span className="ml-1.5 text-blue-600 font-medium">· {newCount} untriaged</span>
            )}
          </p>
        </div>
        {hasUnprocessed && (
          <button
            onClick={onProcessAll}
            disabled={processingId !== null}
            className="text-xs font-medium text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 px-3 py-1.5 rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Process Queue
          </button>
        )}
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center px-6">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-slate-500 font-medium">Queue is empty</p>
            <p className="text-xs text-slate-400 mt-1">Use Live Intake to add a message</p>
          </div>
        )}

        {messages.map((message) => {
          const isSelected = message.message_id === selectedId;
          const isProcessing = message.message_id === processingId;
          const avatarColor = getAvatarColor(message.sender_name);
          const isNew = message.status === "New";

          return (
            <div
              key={message.message_id}
              onClick={() => onSelect(message)}
              className={`px-4 py-3 cursor-pointer transition-colors duration-100 border-b border-slate-50 last:border-0 ${
                isSelected
                  ? "bg-blue-50 border-l-2 border-l-blue-500"
                  : "hover:bg-slate-50 border-l-2 border-l-transparent"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColor}`}>
                  {getInitials(message.sender_name)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className={`text-xs font-semibold truncate ${isNew ? "text-slate-900" : "text-slate-600"}`}>
                      {message.sender_name}
                    </span>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">
                      {formatRelativeTime(message.received_at)}
                    </span>
                  </div>

                  <p className={`text-xs truncate mb-1 ${isNew ? "font-medium text-slate-700" : "text-slate-500"}`}>
                    {message.subject}
                  </p>

                  <p className="text-[10px] text-slate-400 line-clamp-1 leading-relaxed">
                    {message.body.slice(0, 80)}{message.body.length > 80 ? "…" : ""}
                  </p>

                  {/* Status + priority */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {isProcessing ? (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-blue-600">
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Processing…
                      </span>
                    ) : (
                      <>
                        <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[message.status]}`}>
                          {message.status}
                        </span>
                        {message.triage?.priority && (
                          <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[message.triage.priority]}`}>
                            {PRIORITY_HUMAN_LABELS[message.triage.priority]}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Triage button — only on selected New messages to reduce noise */}
              {isSelected && isNew && !isProcessing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onProcessSingle(message);
                  }}
                  disabled={processingId !== null}
                  className="mt-2.5 w-full text-xs font-medium text-blue-600 hover:text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Run Triage →
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
