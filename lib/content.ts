import { promises as fs } from "fs";
import * as fsNative from "fs";
import path from "path";
import matter from "gray-matter";
import { readFile as readXlsxFile, set_fs, SSF, utils } from "xlsx";
import {
  InitiativeStatus,
  Roadmap,
  RoadmapBoardData,
  RoadmapBoardGroup,
  RoadmapBoardItem,
  RoadmapBoardStatus,
  RoadmapInitiative,
  Sprint,
} from "@/lib/types";

const sprintDirectory = path.join(process.cwd(), "content", "sprints");
const roadmapMarkdownPath = path.join(process.cwd(), "content", "roadmap", "roadmap.md");
const roadmapJsonPath = path.join(process.cwd(), "content", "roadmap", "roadmap.json");
const roadmapExcelPath = path.join(process.cwd(), "content", "roadmap", "yolharitasi_maistro.xlsx");

set_fs(fsNative);

type SprintFrontMatter = Omit<
  Sprint,
  "slug" | "rangeLabel" | "completionRate" | "riskCount" | "openWorkCount"
>;

type ExcelRoadmapRow = {
  Epic?: string;
  "Is Paketi"?: string;
  "İş Paketi"?: string;
  Detay?: string;
  "Hedef Tarih"?: string | number | Date;
  Kısıtlar?: string;
  "Tamamlanma Kriteri"?: string;
  İstisnalar?: string;
  "Neyi Çözecek?"?: string;
  Beklenti?: string;
  "Story Point"?: string | number;
};

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function parseNumber(value: string | number | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    if (!normalized) {
      return null;
    }
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function parseDate(value: string | number | Date | undefined): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "number") {
    const parsed = SSF.parse_date_code(value);
    if (!parsed) {
      return null;
    }
    return new Date(parsed.y, parsed.m - 1, parsed.d);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const byNative = new Date(trimmed);
    if (!Number.isNaN(byNative.getTime())) {
      return byNative;
    }

    const parts = trimmed.split(/[./-]/).map((item) => Number(item));
    if (parts.length === 3 && parts.every((item) => Number.isFinite(item))) {
      if (parts[0] > 1900) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
      }
      return new Date(parts[2], parts[1] - 1, parts[0]);
    }
  }

  return null;
}

function formatDate(date: Date | null): string {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function toQuarter(date: Date | null): string {
  if (!date) {
    return "Backlog";
  }

  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `Q${quarter}, ${date.getFullYear()}`;
}

function deriveProgress(row: ExcelRoadmapRow): number {
  const scoredFields = [
    row.Detay,
    row.Kısıtlar,
    row["Tamamlanma Kriteri"],
    row["Neyi Çözecek?"],
    row.Beklenti,
  ];

  const filledCount = scoredFields.filter((value) => typeof value === "string" && value.trim().length > 0).length;
  const richnessScore = (filledCount / scoredFields.length) * 75;

  const storyPoint = parseNumber(row["Story Point"]);
  const pointScore = storyPoint ? Math.min(25, storyPoint * 2) : 0;

  return clampPercent(Math.max(5, richnessScore + pointScore));
}

function deriveStatus(progress: number, targetDate: Date | null, constraints: string): RoadmapBoardStatus {
  const now = new Date();
  const daysToTarget = targetDate ? Math.floor((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

  if (progress >= 90) {
    return "completed";
  }

  if (daysToTarget !== null && daysToTarget < 0 && progress < 85) {
    return "at_risk";
  }

  if (daysToTarget !== null && daysToTarget <= 21 && progress < 55) {
    return "at_risk";
  }

  if (constraints.trim().length > 80 && progress < 60) {
    return "at_risk";
  }

  if (progress <= 25) {
    return "not_started";
  }

  return "on_track";
}

function mergeStatus(items: RoadmapBoardItem[]): RoadmapBoardStatus {
  if (items.some((item) => item.status === "at_risk")) {
    return "at_risk";
  }

  if (items.every((item) => item.status === "completed")) {
    return "completed";
  }

  if (items.every((item) => item.status === "not_started")) {
    return "not_started";
  }

  return "on_track";
}

function toRangeLabel(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function toSprint(slug: string, data: SprintFrontMatter): Sprint {
  const completedCount = data.completed.length;
  const inProgressCount = data.inProgress.length;
  const totalKnownWork = completedCount + inProgressCount;

  const completionRate = totalKnownWork > 0 ? (completedCount / totalKnownWork) * 100 : data.progress;
  const normalizedProgress = Number.isFinite(data.progress)
    ? clampPercent(data.progress)
    : clampPercent(completionRate);

  return {
    slug,
    ...data,
    progress: normalizedProgress,
    completionRate: clampPercent(completionRate),
    riskCount: data.risks.length,
    openWorkCount: inProgressCount,
    rangeLabel: toRangeLabel(data.startDate, data.endDate),
  };
}

function isInitiativeStatus(value: string): value is InitiativeStatus {
  return value === "planned" || value === "in_progress" || value === "done" || value === "blocked";
}

function normalizeInitiative(item: unknown): RoadmapInitiative | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const source = item as Record<string, unknown>;
  const status = typeof source.status === "string" && isInitiativeStatus(source.status)
    ? source.status
    : "planned";

  const completed = typeof source.completed === "number" ? source.completed : 0;
  const total = typeof source.total === "number" && source.total > 0 ? source.total : 1;

  return {
    title: typeof source.title === "string" ? source.title : "Untitled Initiative",
    owner: typeof source.owner === "string" ? source.owner : "Unassigned",
    month: typeof source.month === "string" ? source.month : "TBD",
    status,
    completed,
    total,
    businessValue: typeof source.businessValue === "string" ? source.businessValue : "",
    dependencies: Array.isArray(source.dependencies)
      ? source.dependencies.filter((value): value is string => typeof value === "string")
      : [],
  };
}

function normalizeRoadmapData(data: Record<string, unknown>): Roadmap {
  const laneSource = Array.isArray(data.lanes) ? data.lanes : [];

  return {
    quarter: typeof data.quarter === "string" ? data.quarter : "Quarter TBD",
    northStarGoal: typeof data.northStarGoal === "string" ? data.northStarGoal : "North Star goal pending.",
    strategyNarrative:
      typeof data.strategyNarrative === "string"
        ? data.strategyNarrative
        : "Strategy narrative not provided.",
    futureStrategy: Array.isArray(data.futureStrategy)
      ? data.futureStrategy.filter((item): item is string => typeof item === "string")
      : [],
    priorities: {
      must: Array.isArray((data.priorities as Record<string, unknown>)?.must)
        ? (((data.priorities as Record<string, unknown>).must as unknown[]).filter(
            (item): item is string => typeof item === "string",
          ))
        : [],
      should: Array.isArray((data.priorities as Record<string, unknown>)?.should)
        ? (((data.priorities as Record<string, unknown>).should as unknown[]).filter(
            (item): item is string => typeof item === "string",
          ))
        : [],
      niceToHave: Array.isArray((data.priorities as Record<string, unknown>)?.niceToHave)
        ? (((data.priorities as Record<string, unknown>).niceToHave as unknown[]).filter(
            (item): item is string => typeof item === "string",
          ))
        : [],
    },
    lanes: laneSource
      .map((lane): { lane: string; items: RoadmapInitiative[] } | null => {
        if (!lane || typeof lane !== "object") {
          return null;
        }

        const source = lane as Record<string, unknown>;
        const items = Array.isArray(source.items)
          ? source.items
              .map((item) => normalizeInitiative(item))
              .filter((item): item is RoadmapInitiative => item !== null)
          : [];

        return {
          lane: typeof source.lane === "string" ? source.lane : "Unnamed Lane",
          items,
        };
      })
      .filter((lane): lane is { lane: string; items: RoadmapInitiative[] } => lane !== null),
    risksAndDependencies: Array.isArray(data.risksAndDependencies)
      ? data.risksAndDependencies.filter((item): item is string => typeof item === "string")
      : [],
    expectedBusinessImpact: Array.isArray(data.expectedBusinessImpact)
      ? data.expectedBusinessImpact.filter((item): item is string => typeof item === "string")
      : [],
  };
}

export async function getSprints(): Promise<Sprint[]> {
  const entries = await fs.readdir(sprintDirectory);

  const sprints = await Promise.all(
    entries
      .filter((file) => file.endsWith(".md"))
      .map(async (file) => {
        const slug = file.replace(/\.md$/, "");
        const source = await fs.readFile(path.join(sprintDirectory, file), "utf8");
        const { data } = matter(source);
        return toSprint(slug, data as SprintFrontMatter);
      }),
  );

  return sprints.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
}

export async function getSprintBySlug(slug: string): Promise<Sprint | null> {
  const fullPath = path.join(sprintDirectory, `${slug}.md`);

  try {
    const source = await fs.readFile(fullPath, "utf8");
    const { data } = matter(source);
    return toSprint(slug, data as SprintFrontMatter);
  } catch {
    return null;
  }
}

export async function getRoadmap(): Promise<Roadmap> {
  try {
    const markdownSource = await fs.readFile(roadmapMarkdownPath, "utf8");
    const { data } = matter(markdownSource);
    return normalizeRoadmapData(data as Record<string, unknown>);
  } catch {
    const jsonSource = await fs.readFile(roadmapJsonPath, "utf8");
    return normalizeRoadmapData(JSON.parse(jsonSource) as Record<string, unknown>);
  }
}

export async function getRoadmapBoardData(): Promise<RoadmapBoardData> {
  const workbook = readXlsxFile(roadmapExcelPath, {
    cellDates: true,
  });

  const sourceSheet = workbook.SheetNames[0] ?? "Sheet1";
  const sheet = workbook.Sheets[sourceSheet];
  const rows = utils.sheet_to_json<ExcelRoadmapRow>(sheet, {
    defval: "",
    raw: false,
  });

  const items: RoadmapBoardItem[] = rows
    .map((row, index) => {
      const epic = (row.Epic ?? "Uncategorized").trim() || "Uncategorized";
      const initiative = (row["İş Paketi"] ?? row["Is Paketi"] ?? "Untitled initiative").trim() || "Untitled initiative";
      const detail = (row.Detay ?? "").trim();
      const constraints = (row.Kısıtlar ?? "").trim();
      const completionCriteria = (row["Tamamlanma Kriteri"] ?? "").trim();
      const solution = (row["Neyi Çözecek?"] ?? "").trim();
      const expectation = (row.Beklenti ?? "").trim();
      const targetDateValue = parseDate(row["Hedef Tarih"]);
      const targetDate = formatDate(targetDateValue);
      const quarter = toQuarter(targetDateValue);
      const progress = deriveProgress(row);
      const status = deriveStatus(progress, targetDateValue, constraints);
      const storyPoint = parseNumber(row["Story Point"]);

      const notes = [
        detail,
        completionCriteria ? `Done when: ${completionCriteria}` : "",
        constraints ? `Constraint: ${constraints}` : "",
      ].filter((item) => item.length > 0);

      return {
        id: index + 1,
        epic,
        initiative,
        quarter,
        status,
        progress,
        lead: expectation || "Unassigned",
        notes,
        targetDate,
        constraints,
        completionCriteria,
        expectation,
        solution,
        storyPoint,
      };
    })
    .filter((item) => item.initiative.length > 0);

  const grouped = new Map<string, RoadmapBoardItem[]>();
  for (const item of items) {
    const existing = grouped.get(item.epic) ?? [];
    existing.push(item);
    grouped.set(item.epic, existing);
  }

  const groups: RoadmapBoardGroup[] = Array.from(grouped.entries())
    .map(([epic, groupItems]) => ({
      epic,
      status: mergeStatus(groupItems),
      progress: clampPercent(groupItems.reduce((sum, item) => sum + item.progress, 0) / Math.max(groupItems.length, 1)),
      itemCount: groupItems.length,
      items: groupItems.sort((a, b) => a.id - b.id),
    }))
    .sort((a, b) => a.epic.localeCompare(b.epic));

  const quarters = Array.from(new Set(items.map((item) => item.quarter))).sort((a, b) => a.localeCompare(b));

  return {
    title: "Product Strategy",
    sourceSheet,
    quarters,
    groups,
    totalItems: items.length,
  };
}
