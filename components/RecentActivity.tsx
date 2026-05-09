"use client";

// ─────────────────────────────────────────────────────────────────────────────
// components/RecentActivity.tsx
// Bottom panel — shows recently processed messages in a compact activity list.
// ─────────────────────────────────────────────────────────────────────────────

import type { ProcessedMessage } from "@/lib/types";
import { PRIORITY_COLORS, PRIORITY_HUMAN_LABELS, CATEGORY_PRIMARY, CATEGORY_PRIMARY_COLORS, STATUS_COLORS } from "@/lib/taxonomy";

interface RecentActivityProps {
  messages: ProcessedMessage[];
  onSelect: (message: ProcessedMessage) => void;
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function RecentActivity({ messages, onSelect }: RecentActivityProps) {
  const processed = messages
    .filter((m) => m.status !== "New" && m.triage)
    .sort((a, b) => {
      const aTime = a.processed_at || a.received_at;
      const bTime = b.processed_at || b.received_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

  if (processed.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-800">Recent Activity</h2>
          <span className="text-xs text-slate-400">No activity yet</span>
        </div>
        <div className="flex items-center justify-center py-6 text-center">
          <p className="text-xs text-slate-400">
            Triaged messages will appear here. Run triage on messages in the queue to see activity.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-800">Recent Activity</h2>
        <span className="text-xs text-slate-400">{processed.length} processed</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-5 py-2.5 text-left font-medium text-slate-500 w-1/4">Message</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500">Category</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500">Priority</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500">Owner</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500">Status</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {processed.map((message) => (
              <tr
                key={message.message_id}
                onClick={() => onSelect(message)}
                className="hover:bg-slate-50 cursor-pointer transition-colors duration-100"
              >
                <td className="px-5 py-3">
                  <p className="font-medium text-slate-800 truncate max-w-[200px]">
                    {message.subject}
                  </p>
                  <p className="text-slate-400 truncate max-w-[200px]">
                    {message.sender_name}
                  </p>
                </td>
                <td className="px-4 py-3">
                  {message.triage && (() => {
                    const primaryCategory = CATEGORY_PRIMARY[message.triage.category] ?? message.triage.category;
                    const subcategory = CATEGORY_PRIMARY[message.triage.category] && CATEGORY_PRIMARY[message.triage.category] !== message.triage.category ? message.triage.category : null;
                    return (
                      <div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-medium text-xs ${CATEGORY_PRIMARY_COLORS[primaryCategory] ?? "bg-slate-100 text-slate-600"}`}>
                          {primaryCategory}
                        </span>
                        {subcategory && <p className="text-[10px] text-slate-400 mt-1">{subcategory}</p>}
                      </div>
                    );
                  })()}
                </td>
                <td className="px-4 py-3">
                  {message.triage && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border font-medium text-xs ${PRIORITY_COLORS[message.triage.priority]}`}>
                      {PRIORITY_HUMAN_LABELS[message.triage.priority] ?? message.triage.priority}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-slate-600">
                    {message.triage?.suggested_owner || "—"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full border font-medium text-xs ${STATUS_COLORS[message.status]}`}>
                    {message.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {message.processed_at ? formatTime(message.processed_at) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
