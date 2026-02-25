import { promises as fs } from "fs";
import path from "path";
import * as fsNative from "fs";
import { Pool } from "pg";
import { readFile as readXlsxFile, set_fs, SSF, utils } from "xlsx";
import { BacklogDatabase, IdeaRecord, InitiativeRecord } from "@/lib/types";

set_fs(fsNative);

const dbPath = path.join(process.cwd(), "content", "data", "backlog-db.json");
const excelPath = path.join(process.cwd(), "content", "roadmap", "yolharitasi_maistro.xlsx");
const postgresUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "";
const usePostgres = Boolean(postgresUrl);

type ExcelRoadmapRow = Record<string, string | number | Date | undefined>;

let writeQueue: Promise<void> = Promise.resolve();
let pgPool: Pool | null = null;
let pgReady = false;

function getPgPool(): Pool {
  if (!pgPool) {
    const isLocal = postgresUrl.includes("localhost") || postgresUrl.includes("127.0.0.1");
    pgPool = new Pool({
      connectionString: postgresUrl,
      ssl: isLocal ? undefined : { rejectUnauthorized: false },
    });
  }
  return pgPool;
}

async function ensurePgTable(): Promise<void> {
  if (!usePostgres || pgReady) {
    return;
  }

  const pool = getPgPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS backlog_state (
      id INTEGER PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  pgReady = true;
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function readCell(row: ExcelRoadmapRow, candidates: string[]): string {
  for (const key of candidates) {
    const value = row[key];
    if (value !== undefined && value !== null) {
      const text = String(value).trim();
      if (text.length > 0) {
        return text;
      }
    }
  }
  return "";
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

  const asDate = new Date(String(value));
  if (!Number.isNaN(asDate.getTime())) {
    return asDate;
  }

  return null;
}

function extractUrls(text: string): string[] {
  if (!text.trim()) {
    return [];
  }

  const matches = text.match(/https?:\/\/[^\s<>"')\],]+/gi);
  return matches ? matches.map((item) => item.trim()) : [];
}

function uniqueLinks(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function toQuarter(date: Date | null): string {
  if (!date) {
    return "Backlog";
  }
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `Q${quarter}, ${date.getFullYear()}`;
}

function formatDate(date: Date | null): string {
  if (!date) {
    return "";
  }
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function normalizeStatus(statusText: string): string {
  const value = statusText.trim().toLowerCase();
  if (!value) {
    return "not_started";
  }

  if (["on track", "on_track", "track", "yolda", "devam"].includes(value)) {
    return "on_track";
  }
  if (["at risk", "at_risk", "risk", "riskli", "blok", "blocked"].includes(value)) {
    return "at_risk";
  }
  if (["completed", "done", "tamam", "completed ✅"].includes(value)) {
    return "completed";
  }
  if (["not started", "not_started", "başlamadı", "planned"].includes(value)) {
    return "not_started";
  }

  return value.replace(/\s+/g, "_");
}

function deriveProgress(
  detail: string,
  constraints: string,
  completionCriteria: string,
  solution: string,
  expectation: string,
  storyPoint: number | null,
): number {
  const fields = [detail, constraints, completionCriteria, solution, expectation];
  const filled = fields.filter((field) => field.trim().length > 0).length;
  const fromFields = (filled / fields.length) * 75;
  const fromPoints = storyPoint ? Math.min(25, storyPoint * 2) : 0;
  return clampPercent(Math.max(8, fromFields + fromPoints));
}

function deriveStatusFromFallback(progress: number, targetDate: Date | null, constraints: string): string {
  if (progress >= 90) {
    return "completed";
  }

  if (!targetDate) {
    return progress < 35 ? "not_started" : "on_track";
  }

  const days = Math.floor((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0 && progress < 85) {
    return "at_risk";
  }
  if (days < 21 && progress < 55) {
    return "at_risk";
  }
  if (constraints.length > 80 && progress < 60) {
    return "at_risk";
  }
  if (progress < 30) {
    return "not_started";
  }
  return "on_track";
}

async function ensureDirectory() {
  await fs.mkdir(path.dirname(dbPath), { recursive: true });
}

function defaultIdeas(): IdeaRecord[] {
  const now = new Date().toISOString();
  return [
    {
      id: 1,
      title: "Decentralized agent marketplace altyapisi",
      description: "Dikey agentlarin ticarilestirilmesi icin pazar yeri altyapisi.",
      category: "Strategy",
      votes: 5,
      pinned: false,
      createdAt: now,
    },
  ];
}

function normalizeDb(db: BacklogDatabase): BacklogDatabase {
  return {
    initiatives: Array.isArray(db.initiatives) ? db.initiatives : [],
    ideas: Array.isArray(db.ideas) ? db.ideas : [],
  };
}

async function loadExistingForMerge(): Promise<BacklogDatabase | null> {
  const loadLocalFileDb = async (): Promise<BacklogDatabase | null> => {
    try {
      const raw = await fs.readFile(dbPath, "utf8");
      return normalizeDb(JSON.parse(raw) as BacklogDatabase);
    } catch {
      return null;
    }
  };

  if (usePostgres) {
    await ensurePgTable();
    const pool = getPgPool();
    const result = await pool.query("SELECT payload FROM backlog_state WHERE id = 1 LIMIT 1");
    if (result.rowCount && result.rows[0]?.payload) {
      return normalizeDb(result.rows[0].payload as BacklogDatabase);
    }
    return loadLocalFileDb();
  }

  return loadLocalFileDb();
}

async function seedFromExcel(): Promise<BacklogDatabase> {
  const now = new Date().toISOString();
  const existing = await loadExistingForMerge();
  const existingMap = new Map<string, InitiativeRecord>();

  if (existing) {
    for (const initiative of existing.initiatives) {
      existingMap.set(`${initiative.epic}::${initiative.title}`.toLowerCase(), initiative);
    }
  }

  let initiatives: InitiativeRecord[] = [];

  try {
    const workbook = readXlsxFile(excelPath, { cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = utils.sheet_to_json<ExcelRoadmapRow>(sheet, { defval: "", raw: false });

    initiatives = rows
      .map((row, idx): InitiativeRecord | null => {
        const title = readCell(row, ["İş Paketi", "Is Paketi", "İs Paketi", "Task", "Title"]);
        if (!title) {
          return null;
        }

        const epic = readCell(row, ["Epic", "Tema"]) || "Uncategorized";
        const detail = readCell(row, ["Detay", "Detail", "Açıklama"]);
        const constraints = readCell(row, ["Kısıtlar", "Kisitlar", "Constraints"]);
        const completionCriteria = readCell(row, ["Tamamlanma Kriteri", "Completion Criteria"]);
        const solution = readCell(row, ["Neyi Çözecek?", "Neyi Cozecek?", "Solution"]);
        const expectation = readCell(row, ["Beklenti", "Expectation", "Lead"]);
        const customer = readCell(row, ["Müşteri", "Musteri", "Customer"]);
        const roiMetric = readCell(row, ["ROI", "ROI Metric", "ROI Metriği", "ROI Metrigi"]);
        const roiValue = readCell(row, ["ROI Value", "ROI Değeri", "ROI Degeri"]);
        const demoLinkRaw = readCell(row, [
          "Demo videos / links",
          "Demo Video Links",
          "Demo videos",
          "Demo links",
          "Demo",
          "Video",
          "Video link",
          "Demo Link",
        ]);
        const docLinkRaw = readCell(row, [
          "Project docs",
          "Project doc",
          "Doc",
          "Doc link",
          "Documentation",
          "Dokuman",
          "Dokuman link",
        ]);

        const storyPoint = parseNumber(row["Story Point"] as string | number | undefined);

        const targetDateObj = parseDate(row["Hedef Tarih"] as string | number | Date | undefined);
        const progress = deriveProgress(detail, constraints, completionCriteria, solution, expectation, storyPoint);

        const statusText = readCell(row, ["Status", "Durum"]);
        const status = statusText
          ? normalizeStatus(statusText)
          : deriveStatusFromFallback(progress, targetDateObj, constraints);

        const notes = [
          detail,
          completionCriteria ? `Done when: ${completionCriteria}` : "",
          constraints ? `Constraint: ${constraints}` : "",
        ].filter(Boolean);

        const mergeKey = `${epic}::${title}`.toLowerCase();
        const existingItem = existingMap.get(mergeKey);
        const demoLinks = uniqueLinks([
          ...extractUrls(demoLinkRaw),
          ...extractUrls(detail),
          ...(existingItem?.demoLinks ?? []),
        ]);
        const docLinks = uniqueLinks([
          ...extractUrls(docLinkRaw),
          ...(existingItem?.docLinks ?? []),
        ]);

        return {
          id: idx + 1,
          epic,
          title,
          detail,
          quarter: toQuarter(targetDateObj),
          targetDate: formatDate(targetDateObj),
          status,
          progress,
          lead: expectation || existingItem?.lead || "Unassigned",
          customer: customer || existingItem?.customer || "Unassigned",
          constraints,
          completionCriteria,
          solution,
          expectation,
          roiMetric: roiMetric || existingItem?.roiMetric || "",
          roiValue: roiValue || existingItem?.roiValue || "",
          storyPoint,
          notes,
          demoLinks,
          docLinks,
          createdAt: existingItem?.createdAt ?? now,
          updatedAt: now,
        } satisfies InitiativeRecord;
      })
      .filter((item): item is InitiativeRecord => item !== null);
  } catch {
    initiatives = [];
  }

  return {
    initiatives,
    ideas: existing?.ideas ?? defaultIdeas(),
  };
}

async function writeDb(db: BacklogDatabase): Promise<void> {
  if (usePostgres) {
    writeQueue = writeQueue.then(async () => {
      await ensurePgTable();
      const pool = getPgPool();
      await pool.query(
        `
          INSERT INTO backlog_state (id, payload, updated_at)
          VALUES (1, $1::jsonb, NOW())
          ON CONFLICT (id)
          DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW();
        `,
        [JSON.stringify(db)],
      );
    });
    return writeQueue;
  }

  await ensureDirectory();
  writeQueue = writeQueue.then(() => fs.writeFile(dbPath, JSON.stringify(db, null, 2), "utf8"));
  return writeQueue;
}

export async function readDb(): Promise<BacklogDatabase> {
  if (usePostgres) {
    await ensurePgTable();
    const pool = getPgPool();
    const result = await pool.query("SELECT payload FROM backlog_state WHERE id = 1 LIMIT 1");
    const payload = result.rows[0]?.payload;
    if (payload) {
      return normalizeDb(payload as BacklogDatabase);
    }

    // One-time safety migration: if local JSON already has user-edited data,
    // copy it into Postgres instead of creating a fresh seed.
    try {
      const rawLocal = await fs.readFile(dbPath, "utf8");
      const localDb = normalizeDb(JSON.parse(rawLocal) as BacklogDatabase);
      await writeDb(localDb);
      return localDb;
    } catch {
      // continue with seed fallback
    }

    const seeded = await seedFromExcel();
    await writeDb(seeded);
    return seeded;
  }

  try {
    const raw = await fs.readFile(dbPath, "utf8");
    return normalizeDb(JSON.parse(raw) as BacklogDatabase);
  } catch {
    const seeded = await seedFromExcel();
    await writeDb(seeded);
    return seeded;
  }
}

export async function updateDb(mutator: (db: BacklogDatabase) => BacklogDatabase): Promise<BacklogDatabase> {
  const current = await readDb();
  const next = mutator(current);
  await writeDb(next);
  return next;
}

export async function reseedDbFromExcel(): Promise<BacklogDatabase> {
  const seeded = await seedFromExcel();
  await writeDb(seeded);
  return seeded;
}

export async function saveRoadmapExcelFromUpload(fileBuffer: Buffer): Promise<void> {
  await fs.mkdir(path.dirname(excelPath), { recursive: true });
  await fs.writeFile(excelPath, fileBuffer);
}
