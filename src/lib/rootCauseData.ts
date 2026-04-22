import rootCauseRaw from "@/data/root-cause.json";

export type IncidentSeverity = "critical" | "high" | "medium" | "low";
export type IncidentStatus = "active" | "investigating" | "resolved";

export interface IncidentMetric {
  label: string;
  value: string;
  sparkline?: number[];
  trend?: "up" | "down" | "stable";
  color?: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  service: string;
  createdAt: Date;
  resolvedAt?: Date;
  metrics?: IncidentMetric[];
}

export interface DiagnosisStep {
  label: string;
  detail: string;
  duration: number;
}

export interface Hypothesis {
  title: string;
  confidence: number;
  explanation: string;
  recommendation: string;
}

export interface SystemService {
  name: string;
  displayName: string;
  status: "healthy" | "degraded" | "down";
  latency: string;
  incidentIds?: string[];
}

export interface CorrelationLink {
  fromId: string;
  toId: string;
  reason: string;
  confidence: number;
  sharedComponent: string;
}

type RootCauseRaw = {
  incidents: Array<Incident & { createdAtOffsetMinutes: number; resolvedAtOffsetMinutes?: number }>;
  services: SystemService[];
  diagnosisSteps: DiagnosisStep[];
  followUpSuggestions: Record<string, string[]>;
  hypotheses: Record<string, Hypothesis[]>;
  aiResponses: Record<string, string[]>;
  correlations: CorrelationLink[];
  scanLogs: Record<string, string[]>;
};

const rootCauseData = rootCauseRaw as unknown as RootCauseRaw;

const dateFromOffset = (offsetMinutes: number) => new Date(Date.now() - offsetMinutes * 60 * 1000);

export const mockIncidents: Incident[] = rootCauseData.incidents.map(
  ({ createdAtOffsetMinutes, resolvedAtOffsetMinutes, ...incident }) => ({
    ...incident,
    createdAt: dateFromOffset(createdAtOffsetMinutes),
    resolvedAt: resolvedAtOffsetMinutes ? dateFromOffset(resolvedAtOffsetMinutes) : undefined,
  })
);

export const mockServices = rootCauseData.services;
export const mockDiagnosisSteps = rootCauseData.diagnosisSteps;
export const mockFollowUpSuggestions = rootCauseData.followUpSuggestions;
export const mockHypotheses = rootCauseData.hypotheses;
export const mockCorrelations = rootCauseData.correlations;
export const scanLogs = rootCauseData.scanLogs;

export function getMockAIResponse(incidentId: string, _question: string): string {
  const pool = rootCauseData.aiResponses[incidentId] || rootCauseData.aiResponses.default || [];
  return pool[Math.floor(Math.random() * pool.length)] || "";
}

export function getRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}м назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}ч назад`;
  const days = Math.floor(hours / 24);
  return `${days}д назад`;
}

export function getSeverityColor(severity: IncidentSeverity) {
  switch (severity) {
    case "critical":
      return {
        text: "text-red-400",
        bg: "bg-red-500/15",
        dot: "bg-red-500",
        glow: "shadow-red-500/20",
        ambient: "hsl(0 60% 45% / 0.08)",
        stripe: "hsl(0 68% 52%)",
        icon: "⚡",
      };
    case "high":
      return {
        text: "text-orange-400",
        bg: "bg-orange-500/15",
        dot: "bg-orange-500",
        glow: "shadow-orange-500/20",
        ambient: "hsl(25 60% 45% / 0.05)",
        stripe: "hsl(25 95% 53%)",
        icon: "⚠",
      };
    case "medium":
      return {
        text: "text-yellow-400",
        bg: "bg-yellow-500/15",
        dot: "bg-yellow-500",
        glow: "shadow-yellow-500/20",
        ambient: "hsl(45 60% 45% / 0.04)",
        stripe: "hsl(45 93% 47%)",
        icon: "●",
      };
    case "low":
      return {
        text: "text-blue-400",
        bg: "bg-blue-500/15",
        dot: "bg-blue-500",
        glow: "shadow-blue-500/20",
        ambient: "hsl(210 50% 50% / 0.03)",
        stripe: "hsl(210 60% 50%)",
        icon: "ℹ",
      };
  }
}

export function getStatusLabel(status: IncidentStatus) {
  switch (status) {
    case "active":
      return "Активен";
    case "investigating":
      return "Расследование";
    case "resolved":
      return "Решён";
  }
}