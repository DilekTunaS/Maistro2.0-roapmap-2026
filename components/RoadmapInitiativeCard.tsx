import { calculateInitiativeProgress } from "@/lib/roadmap-metrics";
import { InitiativeStatus, RoadmapInitiative } from "@/lib/types";

const statusStyles: Record<InitiativeStatus, string> = {
  planned: "bg-slate-100 text-slate-700 border-slate-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  done: "bg-emerald-50 text-emerald-700 border-emerald-200",
  blocked: "bg-rose-50 text-rose-700 border-rose-200",
};

type RoadmapInitiativeCardProps = {
  initiative: RoadmapInitiative;
  atRisk?: boolean;
};

export function RoadmapInitiativeCard({ initiative, atRisk = false }: RoadmapInitiativeCardProps) {
  const progress = calculateInitiativeProgress(initiative.completed, initiative.total);

  return (
    <article className="rounded-xl border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold leading-6">{initiative.title}</h3>
        <div className="flex flex-wrap justify-end gap-1">
          {atRisk ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
              at risk
            </span>
          ) : null}
          <span
            className={`rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${statusStyles[initiative.status]}`}
          >
            {initiative.status.replace("_", " ")}
          </span>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted">{initiative.month} | Owner: {initiative.owner}</p>

      <div className="mt-3 h-1.5 w-full rounded-full bg-line">
        <div className="h-1.5 rounded-full bg-ink/80" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted">
        Progress {progress}% ({initiative.completed}/{initiative.total})
      </p>

      <p className="mt-3 text-sm leading-6">{initiative.businessValue}</p>
      {initiative.dependencies.length > 0 ? (
        <p className="mt-2 text-xs text-muted">Dependencies: {initiative.dependencies.join(", ")}</p>
      ) : null}
    </article>
  );
}