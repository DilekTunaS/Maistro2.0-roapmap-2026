import { InitiativeStatus } from "@/lib/types";

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateInitiativeProgress(completed: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return clampPercent((completed / total) * 100);
}

export function isInitiativeAtRisk(
  status: InitiativeStatus,
  progress: number,
  dependencyCount: number,
): boolean {
  if (status === "blocked") {
    return true;
  }

  if (status === "in_progress" && progress < 45) {
    return true;
  }

  if (dependencyCount >= 2 && progress < 60) {
    return true;
  }

  return false;
}
