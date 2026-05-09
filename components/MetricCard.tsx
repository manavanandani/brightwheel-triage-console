"use client";

// ─────────────────────────────────────────────────────────────────────────────
// components/MetricCard.tsx
// A single stat card for the dashboard metrics row.
// ─────────────────────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  accent?: "blue" | "green" | "amber" | "red" | "indigo";
}

const accentStyles = {
  blue: {
    icon: "bg-blue-50 text-blue-600",
    value: "text-slate-900",
  },
  green: {
    icon: "bg-emerald-50 text-emerald-600",
    value: "text-slate-900",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600",
    value: "text-slate-900",
  },
  red: {
    icon: "bg-red-50 text-red-600",
    value: "text-red-700",
  },
  indigo: {
    icon: "bg-slate-50 text-slate-600",
    value: "text-slate-900",
  },
};

export default function MetricCard({
  label,
  value,
  subtext,
  icon,
  accent = "blue",
}: MetricCardProps) {
  const styles = accentStyles[accent];

  return (
    <div className="bg-white rounded-xl border border-slate-200/70 p-4 shadow-sm flex items-start gap-3 hover:shadow-md transition-shadow duration-200">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${styles.icon}`}>
        {icon}
      </div>
      <div className="min-w-0 pt-0.5">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-2xl font-bold tracking-tight leading-none ${styles.value}`}>{value}</p>
        {subtext && (
          <p className="text-[11px] text-slate-400 mt-1.5 font-medium">{subtext}</p>
        )}
      </div>
    </div>
  );
}
