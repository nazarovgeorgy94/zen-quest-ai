export {
  mockIncidents,
  mockServices,
  mockDiagnosisSteps,
  mockFollowUpSuggestions,
  mockHypotheses,
  mockCorrelations,
  scanLogs,
  getMockAIResponse,
  getRelativeTime,
  getSeverityColor,
  getStatusLabel,
} from "@/lib/rootCauseData";

export type {
  IncidentSeverity,
  IncidentStatus,
  IncidentMetric,
  Incident,
  DiagnosisStep,
  Hypothesis,
  SystemService,
  CorrelationLink,
} from "@/lib/rootCauseData";
