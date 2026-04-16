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
  duration: number; // ms to simulate
}

export interface Hypothesis {
  title: string;
  confidence: number;
  explanation: string;
  recommendation: string;
}

export const mockIncidents: Incident[] = [
  {
    id: "INC-4521",
    title: "Payment Gateway Timeout Spike",
    description: "Резкий рост таймаутов на платёжном шлюзе. P99 латентность превысила 12s. Затронуты 23% транзакций за последний час.",
    severity: "critical",
    status: "active",
    service: "payment-gateway",
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
    metrics: [
      { label: "P99 Latency", value: "12.4s", sparkline: [0.5, 0.8, 1.2, 2.1, 4.5, 7.8, 10.2, 12.4], trend: "up", color: "hsl(0 68% 52%)" },
      { label: "Error Rate", value: "23.1%", sparkline: [2, 3, 5, 8, 12, 18, 21, 23.1], trend: "up", color: "hsl(25 95% 53%)" },
      { label: "Affected Txns", value: "1,847", sparkline: [120, 340, 580, 890, 1100, 1400, 1650, 1847], trend: "up" },
    ],
  },
  {
    id: "INC-4518",
    title: "AML Scoring Service Degradation",
    description: "AML scoring pipeline возвращает stale результаты. Feature store не обновлялся 3 часа.",
    severity: "high",
    status: "investigating",
    service: "aml-scoring",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    metrics: [
      { label: "Staleness", value: "3h 12m", sparkline: [5, 15, 30, 60, 90, 120, 160, 192], trend: "up", color: "hsl(25 95% 53%)" },
      { label: "Affected Checks", value: "5,200", sparkline: [800, 1500, 2200, 3000, 3800, 4400, 4900, 5200], trend: "up" },
    ],
  },
  {
    id: "INC-4515",
    title: "Velocity Check False Positives",
    description: "Velocity rule `vel_24h_count > 5` блокирует легитимных пользователей из-за дублирования событий в Kafka.",
    severity: "medium",
    status: "active",
    service: "velocity-engine",
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    metrics: [
      { label: "False Positive Rate", value: "8.7%", sparkline: [2.1, 2.4, 3.2, 4.8, 5.9, 7.2, 8.1, 8.7], trend: "up", color: "hsl(45 93% 47%)" },
      { label: "Blocked Users", value: "342", sparkline: [40, 80, 130, 180, 230, 270, 310, 342], trend: "up" },
    ],
  },
  {
    id: "INC-4510",
    title: "Card BIN Database Sync Failure",
    description: "BIN database не синхронизировалась с upstream провайдером. Новые BIN-ы не распознаются.",
    severity: "low",
    status: "active",
    service: "bin-lookup",
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
  },
  {
    id: "INC-4490",
    title: "Redis Cluster Memory Pressure",
    description: "Redis cluster достиг 92% memory usage. Eviction policy начала удалять горячие ключи сессий.",
    severity: "critical",
    status: "resolved",
    service: "session-store",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    resolvedAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000),
  },
  {
    id: "INC-4485",
    title: "3DS Authentication Timeout",
    description: "3DS provider возвращает таймауты для Mastercard. Visa не затронута.",
    severity: "high",
    status: "resolved",
    service: "3ds-gateway",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    resolvedAt: new Date(Date.now() - 2.8 * 24 * 60 * 60 * 1000),
  },
  {
    id: "INC-4472",
    title: "Chargeback Webhook Delivery Failure",
    description: "Webhook endpoint для chargeback notifications недоступен. Накопилось 1,200 недоставленных уведомлений.",
    severity: "medium",
    status: "resolved",
    service: "webhook-dispatcher",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    resolvedAt: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000),
  },
];

// ── Discovery Mode: Services to scan ──
export interface SystemService {
  name: string;
  displayName: string;
  status: "healthy" | "degraded" | "down";
  latency: string;
  incidentIds?: string[]; // linked incidents
}

export const mockServices: SystemService[] = [
  { name: "payment-gateway", displayName: "Payment Gateway", status: "degraded", latency: "12.4s", incidentIds: ["INC-4521"] },
  { name: "aml-scoring", displayName: "AML Scoring", status: "degraded", latency: "340ms", incidentIds: ["INC-4518"] },
  { name: "velocity-engine", displayName: "Velocity Engine", status: "degraded", latency: "89ms", incidentIds: ["INC-4515"] },
  { name: "bin-lookup", displayName: "BIN Lookup", status: "healthy", latency: "12ms", incidentIds: ["INC-4510"] },
  { name: "session-store", displayName: "Session Store (Redis)", status: "healthy", latency: "2ms" },
  { name: "3ds-gateway", displayName: "3DS Gateway", status: "healthy", latency: "45ms" },
  { name: "webhook-dispatcher", displayName: "Webhook Dispatcher", status: "healthy", latency: "8ms" },
  { name: "fraud-scorer", displayName: "Fraud Scorer ML", status: "healthy", latency: "67ms" },
  { name: "card-tokenizer", displayName: "Card Tokenizer", status: "healthy", latency: "5ms" },
  { name: "kyc-service", displayName: "KYC Service", status: "healthy", latency: "120ms" },
];

export const mockDiagnosisSteps: DiagnosisStep[] = [
  { label: "Сбор метрик", detail: "Анализ логов, метрик и трейсов за последние 2 часа", duration: 1500 },
  { label: "Корреляция событий", detail: "Поиск паттернов и корреляций между сервисами", duration: 2000 },
  { label: "Анализ зависимостей", detail: "Проверка upstream/downstream сервисов", duration: 1800 },
  { label: "Формирование гипотез", detail: "Ранжирование возможных причин по вероятности", duration: 2200 },
];

export const mockHypotheses: Record<string, Hypothesis[]> = {
  "INC-4521": [
    {
      title: "Connection Pool Exhaustion",
      confidence: 87,
      explanation: "Connection pool к PostgreSQL исчерпан. Текущий лимит 100 connections при пиковой нагрузке требует 180+. Все новые запросы ждут в очереди, что вызывает каскадные таймауты.",
      recommendation: "Увеличить `max_connections` до 250, включить PgBouncer в transaction mode. Краткосрочно — рестарт пула.",
    },
    {
      title: "DNS Resolution Delay",
      confidence: 42,
      explanation: "Внутренний DNS resolver показывает повышенную латентность (p99 = 800ms vs нормальных 5ms). Возможно связано с обновлением CoreDNS.",
      recommendation: "Проверить логи CoreDNS, откатить последний деплой DNS если подтвердится.",
    },
  ],
  "INC-4518": [
    {
      title: "Kafka Consumer Lag",
      confidence: 91,
      explanation: "Consumer group `aml-feature-updater` имеет lag > 500K сообщений. Причина — OOM kill одного из consumer pods 3 часа назад.",
      recommendation: "Рестартовать consumer pod, увеличить memory limit до 4Gi. Проверить retention policy.",
    },
  ],
};

export function getMockAIResponse(incidentId: string, question: string): string {
  const responses: Record<string, string[]> = {
    "INC-4521": [
      "На основе анализа метрик, **основная причина** — исчерпание пула соединений к PostgreSQL.\n\n### Ключевые индикаторы:\n- `pg_active_connections`: 100/100 (лимит достигнут)\n- `pg_waiting_queries`: 80+ в очереди\n- Корреляция: рост латентности совпадает с пиком трафика в 14:23 UTC\n\n### Рекомендации:\n1. **Немедленно**: Рестарт connection pool\n2. **Краткосрочно**: Увеличить `max_connections` до 250\n3. **Долгосрочно**: Внедрить PgBouncer",
      "Анализ dependency graph показывает, что **payment-gateway** зависит от 3 downstream сервисов:\n\n| Сервис | Статус | Латентность |\n|--------|--------|-------------|\n| `pg-primary` | ⚠️ Degraded | 12.4s p99 |\n| `redis-sessions` | ✅ Healthy | 2ms p99 |\n| `fraud-scorer` | ✅ Healthy | 45ms p99 |\n\nПроблема изолирована на уровне PostgreSQL.",
    ],
    default: [
      "Проведён анализ доступных данных по инциденту.\n\n### Наблюдения:\n- Аномалия обнаружена в метриках сервиса\n- Корреляция с недавними изменениями конфигурации\n- Паттерн указывает на ресурсное ограничение\n\nДля более точной диагностики рекомендую проверить:\n1. Логи за период возникновения\n2. Последние деплои\n3. Capacity планирование",
    ],
  };

  const pool = responses[incidentId] || responses.default;
  return pool[Math.floor(Math.random() * pool.length)];
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
    case "critical": return { text: "text-red-400", bg: "bg-red-500/15", dot: "bg-red-500", glow: "shadow-red-500/20" };
    case "high": return { text: "text-orange-400", bg: "bg-orange-500/15", dot: "bg-orange-500", glow: "shadow-orange-500/20" };
    case "medium": return { text: "text-yellow-400", bg: "bg-yellow-500/15", dot: "bg-yellow-500", glow: "shadow-yellow-500/20" };
    case "low": return { text: "text-blue-400", bg: "bg-blue-500/15", dot: "bg-blue-500", glow: "shadow-blue-500/20" };
  }
}

export function getStatusLabel(status: IncidentStatus) {
  switch (status) {
    case "active": return "Активен";
    case "investigating": return "Расследование";
    case "resolved": return "Решён";
  }
}
