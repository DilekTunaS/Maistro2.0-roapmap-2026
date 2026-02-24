import { RoadmapWorkspace } from "@/components/RoadmapWorkspace";
import { readDb } from "@/lib/backlog-db";

export const dynamic = "force-dynamic";

export default async function RoadmapPage({
  searchParams,
}: {
  searchParams?: { quarter?: string };
}) {
  const db = await readDb();
  return (
    <RoadmapWorkspace
      initialItems={db.initiatives}
      initialQuarterFilter={searchParams?.quarter ?? "all"}
    />
  );
}
