import { Incident, IncidentSeverity, mockServices } from "@/lib/rootCauseData";

export interface ParsedQuery {
  raw: string;
  id?: string;
  date?: string; // dd.mm.yyyy normalized
  timeRange?: { from: string; to: string };
  metricPercent?: number;
  service?: string;
  keywords: string[];
  isRich: boolean; // worth showing parsed-entity panel
}

const STOP = new Set([
  "и","в","на","по","с","от","до","за","для","или","но","к","о","об",
  "the","a","an","and","or","of","to","in","on","at","by","for",
  "инцидент","инциденте","ошибка","проблема","сервис",
]);

export function parseIncidentQuery(input: string): ParsedQuery {
  const raw = input.trim();
  const result: ParsedQuery = { raw, keywords: [], isRich: false };
  if (!raw) return result;

  // ID
  const idMatch = raw.match(/INC[-\s]?(\d{2,6})/i);
  if (idMatch) result.id = `INC-${idMatch[1]}`;

  // Date dd.mm.yyyy
  const dateMatch = raw.match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})/);
  if (dateMatch) {
    const [, d, m, y] = dateMatch;
    const yyyy = y.length === 2 ? `20${y}` : y;
    result.date = `${d.padStart(2, "0")}.${m.padStart(2, "0")}.${yyyy}`;
  }

  // Time range HH:MM - HH:MM
  const timeRange = raw.match(/(\d{1,2}:\d{2})\s*[-–—по\s]+\s*(\d{1,2}:\d{2})/);
  if (timeRange) {
    result.timeRange = { from: timeRange[1], to: timeRange[2] };
  }

  // Percent
  const pctMatch = raw.match(/(\d+(?:[.,]\d+)?)\s*%/);
  if (pctMatch) {
    result.metricPercent = parseFloat(pctMatch[1].replace(",", "."));
  }

  // Service hint
  const lower = raw.toLowerCase();
  const svc = mockServices.find(
    (s) =>
      lower.includes(s.name.toLowerCase()) ||
      lower.includes(s.displayName.toLowerCase())
  );
  if (svc) result.service = svc.displayName;

  // Keywords (for similarity matching)
  result.keywords = lower
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP.has(w));

  result.isRich =
    !!result.id ||
    !!result.date ||
    !!result.timeRange ||
    result.metricPercent !== undefined ||
    !!result.service ||
    result.keywords.length >= 3;

  return result;
}

export function severityFromPercent(p?: number): IncidentSeverity {
  if (p === undefined) return "medium";
  if (p >= 1) return "critical";
  if (p >= 0.5) return "high";
  if (p >= 0.1) return "medium";
  return "low";
}

export function scoreIncidentMatch(q: ParsedQuery, inc: Incident): number {
  let score = 0;
  if (q.id && inc.id.toUpperCase() === q.id.toUpperCase()) score += 100;
  if (q.service && inc.service.toLowerCase() === q.service.toLowerCase()) score += 8;
  const hay = `${inc.id} ${inc.title} ${inc.service} ${inc.description}`.toLowerCase();
  for (const kw of q.keywords) {
    if (hay.includes(kw)) score += 2;
  }
  return score;
}

export function buildVirtualIncident(q: ParsedQuery): Incident {
  const id = q.id || `INC-${Math.floor(900 + Math.random() * 99)}`;
  const title =
    q.raw.length > 80 ? q.raw.slice(0, 78).trim() + "…" : q.raw || "Новый инцидент";
  const severity = severityFromPercent(q.metricPercent);
  const metricValue =
    q.metricPercent !== undefined
      ? `${q.metricPercent.toString().replace(".", ",")}%`
      : "—";
  return {
    id,
    title,
    description: q.raw,
    severity,
    status: "active",
    service: q.service || "auto-detected",
    createdAt: new Date(),
    metrics: [
      {
        label: q.metricPercent !== undefined ? "Failure Rate" : "Аномалия",
        value: metricValue,
        trend: "up",
      },
    ],
  };
}
