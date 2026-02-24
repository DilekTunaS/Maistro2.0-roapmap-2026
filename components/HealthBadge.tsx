import { HealthStatus } from "@/lib/types";

const healthStyles: Record<HealthStatus, string> = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  yellow: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-rose-50 text-rose-700 border-rose-200",
};

type HealthBadgeProps = {
  health: HealthStatus;
  compact?: boolean;
};

export function HealthBadge({ health, compact = false }: HealthBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${healthStyles[health]}`}
    >
      <span className={`rounded-full ${compact ? "h-1.5 w-1.5" : "h-2 w-2"} bg-current`} />
      {health}
    </span>
  );
}
