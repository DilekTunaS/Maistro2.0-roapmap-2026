import { NextRequest, NextResponse } from "next/server";
import { readDb } from "@/lib/backlog-db";

function localAnswer(question: string, initiatives: Array<{ title: string; quarter: string; status: string; lead: string; notes: string[] }>) {
  const q = question.toLowerCase();

  const quarterMatch = q.match(/q[1-4]\s*,?\s*20\d{2}/i)?.[0] ?? null;
  if (quarterMatch) {
    const normalized = quarterMatch.toUpperCase().replace(/\s+/g, " ").replace(" ,", ",");
    const filtered = initiatives.filter((item) => item.quarter.toUpperCase() === normalized);
    if (filtered.length === 0) {
      return `No initiatives found for ${normalized}.`;
    }

    return `Found ${filtered.length} initiatives for ${normalized}:\n- ${filtered
      .slice(0, 8)
      .map((item) => `${item.title} (${item.status}, lead: ${item.lead})`)
      .join("\n- ")}`;
  }

  if (q.includes("risk") || q.includes("blok") || q.includes("block")) {
    const risky = initiatives.filter((item) => item.status === "at_risk");
    if (risky.length === 0) {
      return "No at-risk initiatives currently.";
    }
    return `At-risk initiatives (${risky.length}):\n- ${risky
      .slice(0, 8)
      .map((item) => `${item.title} (${item.quarter})`)
      .join("\n- ")}`;
  }

  const keyword = q.split(/\s+/).find((token) => token.length > 3);
  if (keyword) {
    const hits = initiatives.filter((item) =>
      [item.title, item.notes.join(" "), item.lead].join(" ").toLowerCase().includes(keyword),
    );
    if (hits.length > 0) {
      return `I found ${hits.length} matching initiatives:\n- ${hits
        .slice(0, 8)
        .map((item) => `${item.title} (${item.quarter}, ${item.status})`)
        .join("\n- ")}`;
    }
  }

  return `I can answer backlog questions like:\n- Find initiatives planned for Q2, 2026\n- Show at-risk initiatives\n- List initiatives with a specific keyword or owner.`;
}

async function azureAnswer(question: string, context: string) {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2024-10-21";

  if (!endpoint || !apiKey || !deployment) {
    return null;
  }

  const url = `${endpoint.replace(/\/$/, "")}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      temperature: 0.2,
      max_tokens: 600,
      messages: [
        {
          role: "system",
          content:
            "You are a product strategy assistant. Answer only from provided backlog context. If missing, say you do not have that data.",
        },
        {
          role: "user",
          content: `Backlog context:\n${context}\n\nQuestion: ${question}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return payload.choices?.[0]?.message?.content ?? null;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const question = String(body.question ?? "").trim();

  if (!question) {
    return NextResponse.json({ message: "question is required" }, { status: 400 });
  }

  const db = await readDb();
  const initiatives = db.initiatives.map((item) => ({
    title: item.title,
    quarter: item.quarter,
    status: item.status,
    lead: item.lead,
    notes: item.notes,
  }));

  const context = db.initiatives
    .slice(0, 200)
    .map((item) => `${item.title} | ${item.quarter} | ${item.status} | lead:${item.lead} | notes:${item.notes.join("; ")}`)
    .join("\n");

  const fromAzure = await azureAnswer(question, context);
  if (fromAzure) {
    return NextResponse.json({ answer: fromAzure, mode: "azure" });
  }

  const answer = localAnswer(question, initiatives);
  return NextResponse.json({ answer, mode: "local" });
}