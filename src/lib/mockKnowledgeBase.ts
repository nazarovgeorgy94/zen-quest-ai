/**
 * ═══════════════════════════════════════════════════════════════════
 *  MOCK KNOWLEDGE BASE — Antifraud Assistant
 * ═══════════════════════════════════════════════════════════════════
 *
 *  HOW TO ADD A NEW TOPIC:
 *  1. Create a new KnowledgeEntry object (copy any existing one as template).
 *  2. Push it into `knowledgeBase` array below.
 *  3. Fill in:
 *       • keywords  — lowercase stems/phrases the matcher will look for
 *       • sources   — 2-4 mock references (id starts from 1 within each entry)
 *       • response  — HTML string; use <span class="citation-tag">N</span> to
 *                      reference sources by their `id`
 *       • thinkingText / sourceText — status messages shown during "streaming"
 *
 *  The matcher scores every entry by summing the length of each matched keyword
 *  found in the user query (longer keyword = higher weight). A bonus +5 is added
 *  for an exact word match. Minimum score of 3 is required to beat the fallback.
 *
 *  TIP: Add both Russian and English keywords for bilingual coverage.
 * ═══════════════════════════════════════════════════════════════════
 */

// ─── Types ───────────────────────────────────────────────────────

export interface Source {
  id: number;
  title: string;
  relevance: number;
  lastUpdated: string;
  type: string;
}

export interface KnowledgeEntry {
  /** Unique slug for the topic (optional, for debugging/logging) */
  slug?: string;
  /** Keywords / stems used by the matcher — lowercase recommended */
  keywords: string[];
  /** Mock data sources shown as citation cards */
  sources: Source[];
  /** HTML response body — supports <h3>, <p>, <strong>, <span class="citation-tag"> */
  response: string;
  /** Status text while "thinking" */
  thinkingText: string;
  /** Status text while "reading sources" */
  sourceText: string;
  /** Chain-of-thought reasoning steps shown before the answer */
  thinkingSteps?: string[];
}

// ─── Knowledge entries ───────────────────────────────────────────
//  Each entry is a self-contained topic. Order does not matter —
//  the matcher picks the highest-scoring one.

const knowledgeBase: KnowledgeEntry[] = [

  // ══════════════════════════════════════════════════════════════
  //  1. VELOCITY / SPEED RULES
  // ══════════════════════════════════════════════════════════════
  {
    slug: "velocity",
    keywords: ["velocity", "скорость", "velocity_check", "частота", "количество транзакций", "24h", "24ч", "частот"],
    thinkingText: "Анализирую правила velocity...",
    thinkingSteps: [
      "Определяю тип запроса → контроль частоты операций",
      "Поиск правила velocity_check_24h в каталоге",
      "Загрузка конфигурации порогов и scoring-весов",
      "Сопоставление с инцидент-репортами Q4 2025",
    ],
    sourceText: "Анализ 3 источников...",
    sources: [
      { id: 1, title: "Policy Rule: velocity_check_24h", relevance: 96, lastUpdated: "10 марта 2026", type: "Rule" },
      { id: 2, title: "Fraud Detection Playbook — Section 3.1", relevance: 89, lastUpdated: "2 февраля 2026", type: "Wiki" },
      { id: 3, title: "Incident Report: Card-Not-Present Spike Q4", relevance: 74, lastUpdated: "15 января 2026", type: "Report" },
    ],
    response: `<p>Правило <strong>velocity_check_24h</strong> <span class="citation-tag">1</span> отслеживает количество транзакций с одного устройства или карты за скользящее окно в 24 часа. При превышении порога в 15 транзакций правило присваивает score +35 и генерирует алерт уровня <strong>HIGH</strong>.</p>

<h3>Условия срабатывания</h3>

<p>Согласно <strong>Fraud Detection Playbook</strong> <span class="citation-tag">2</span>, правило активируется при выполнении любого из условий:</p>
<p>• Более 15 транзакций с одного device_fingerprint за 24ч<br/>
• Более 5 уникальных получателей с одного аккаунта за 1ч<br/>
• Сумма транзакций превышает 500 000 ₽ за 6ч</p>

<p>По данным инцидент-репорта <span class="citation-tag">3</span>, после калибровки порогов в Q4 2025 false positive rate снизился с 12% до 4.3%, при этом detection rate вырос до 94%.</p>`,
  },

  // ══════════════════════════════════════════════════════════════
  //  2. CNP FRAUD
  // ══════════════════════════════════════════════════════════════
  {
    slug: "cnp-fraud",
    keywords: ["cnp", "card-not-present", "карта не предъявлена", "онлайн-фрод", "e-commerce", "паттерн", "электронная коммерция"],
    thinkingText: "Ищу паттерны CNP-фрода...",
    thinkingSteps: [
      "Классификация запроса → Card-Not-Present фрод",
      "Анализ инцидент-репортов за Q4 2025 – Q1 2026",
      "Выделение трёх основных паттернов атак",
      "Проверка рекомендаций Playbook по митигации",
    ],
    sourceText: "Анализ 4 источников...",
    sources: [
      { id: 1, title: "Incident Report: CNP Spike Q4 2025", relevance: 97, lastUpdated: "15 января 2026", type: "Report" },
      { id: 2, title: "Policy Rule: cnp_risk_scoring_v3", relevance: 91, lastUpdated: "28 февраля 2026", type: "Rule" },
      { id: 3, title: "AML Dashboard: Quarterly Trends", relevance: 82, lastUpdated: "1 марта 2026", type: "Dashboard" },
      { id: 4, title: "Fraud Detection Playbook — Section 5.2", relevance: 78, lastUpdated: "2 февраля 2026", type: "Wiki" },
    ],
    response: `<p>За Q4 2025 — Q1 2026 зафиксированы три основных паттерна CNP-фрода <span class="citation-tag">1</span>:</p>

<h3>1. Enumeration-атаки (BIN-атаки)</h3>
<p>Массовый перебор номеров карт с использованием ботов. Характерный признак — серия микро-транзакций (0.01–1.00 ₽) с одного IP за короткий период. Объём вырос на <strong>340%</strong> в декабре 2025.</p>

<h3>2. Account Takeover (ATO)</h3>
<p>Компрометация учётных записей через credential stuffing. Правило <strong>cnp_risk_scoring_v3</strong> <span class="citation-tag">2</span> детектирует ATO по совокупности: новый device fingerprint + изменение контактных данных + транзакция &gt; 10 000 ₽ в течение 1 часа.</p>

<h3>3. Friendly fraud</h3>
<p>Рост чарджбэков по легитимным транзакциям. По данным квартального дашборда <span class="citation-tag">3</span>, доля friendly fraud составила <strong>23%</strong> от всех чарджбэков, что на 8 п.п. выше Q3.</p>

<p>Playbook <span class="citation-tag">4</span> рекомендует комбинировать 3DS 2.0 с device intelligence для снижения CNP-фрода на 40–60%.</p>`,
  },

  // ══════════════════════════════════════════════════════════════
  //  3. FALSE POSITIVE / THRESHOLDS
  // ══════════════════════════════════════════════════════════════
  {
    slug: "false-positive",
    keywords: ["false positive", "fp", "порог", "threshold", "оптимизация", "калибровка", "снижение", "точность", "корректировка"],
    thinkingText: "Анализирую метрики false positive...",
    sourceText: "Анализ 3 источников...",
    sources: [
      { id: 1, title: "Threshold Calibration Report Q1 2026", relevance: 95, lastUpdated: "5 марта 2026", type: "Report" },
      { id: 2, title: "Policy Rule: adaptive_threshold_engine", relevance: 88, lastUpdated: "20 февраля 2026", type: "Rule" },
      { id: 3, title: "ML Model Performance: fraud_scorer_v4", relevance: 83, lastUpdated: "12 марта 2026", type: "Model" },
    ],
    response: `<p>Текущий false positive rate составляет <strong>4.3%</strong>, что является результатом калибровки Q4 2025 <span class="citation-tag">1</span>. Для дальнейшего снижения рекомендуются следующие корректировки:</p>

<h3>Рекомендации по порогам</h3>

<p><strong>1. velocity_check_24h</strong> — снизить порог с 15 до 12 txn/24h. Моделирование показывает снижение FP на 1.2 п.п. при сохранении detection rate &gt; 92%.</p>

<p><strong>2. amount_anomaly_detector</strong> — перейти на персонализированные пороги вместо фиксированных. Движок <strong>adaptive_threshold_engine</strong> <span class="citation-tag">2</span> позволяет рассчитывать пороги на основе 90-дневной истории клиента.</p>

<p><strong>3. Ensemble scoring</strong> — модель <strong>fraud_scorer_v4</strong> <span class="citation-tag">3</span> при пороге score ≥ 72 (текущий — 65) даёт оптимальный баланс: FP = 2.8%, DR = 91.5%.</p>

<h3>Ожидаемый эффект</h3>
<p>Комплексное применение корректировок прогнозирует снижение FP rate до <strong>2.5–3.0%</strong> при detection rate не ниже 90%.</p>`,
  },

  // ══════════════════════════════════════════════════════════════
  //  4. AML / MONEY LAUNDERING
  // ══════════════════════════════════════════════════════════════
  {
    slug: "aml",
    keywords: ["aml", "отмывание", "laundering", "подозрительн", "мониторинг", "финансирование", "терроризм", "комплаенс", "compliance", "kyc"],
    thinkingText: "Запрашиваю AML-правила...",
    sourceText: "Анализ 4 источников...",
    sources: [
      { id: 1, title: "AML Monitoring: Rule Set v2.8", relevance: 94, lastUpdated: "8 марта 2026", type: "Rule" },
      { id: 2, title: "Compliance Playbook: ФЗ-115", relevance: 91, lastUpdated: "1 марта 2026", type: "Wiki" },
      { id: 3, title: "SAR Report: Structuring Patterns", relevance: 85, lastUpdated: "20 февраля 2026", type: "Report" },
      { id: 4, title: "KYC/EDD Procedures Manual", relevance: 79, lastUpdated: "15 января 2026", type: "Wiki" },
    ],
    response: `<p>Система AML-мониторинга работает на базе <strong>Rule Set v2.8</strong> <span class="citation-tag">1</span>, включающего 47 активных правил по 6 категориям.</p>

<h3>Ключевые сценарии</h3>

<p><strong>Structuring (дробление)</strong> — детекция разбиения крупных операций на суммы ниже порога обязательного контроля (600 000 ₽). По данным SAR-отчёта <span class="citation-tag">3</span>, за Q1 2026 выявлено 234 кейса structuring, из них 89 подтверждены.</p>

<p><strong>Rapid movement</strong> — отслеживание "транзитных" счетов: поступление + вывод средств в течение 24ч с минимальным остатком. Порог: ≥ 3 таких цикла за 30 дней.</p>

<p><strong>Shell company detection</strong> — перекрёстный анализ бенефициаров и учредителей по данным ЕГРЮЛ. Модель выявляет связанные ЮЛ с общими директорами/адресами.</p>

<h3>Процедуры</h3>
<p>Согласно <strong>ФЗ-115</strong> <span class="citation-tag">2</span>, при совокупном score ≥ 80 автоматически инициируется EDD (Enhanced Due Diligence) <span class="citation-tag">4</span> и блокировка исходящих переводов до завершения проверки.</p>`,
  },

  // ══════════════════════════════════════════════════════════════
  //  5. DEVICE FINGERPRINT
  // ══════════════════════════════════════════════════════════════
  {
    slug: "device-fingerprint",
    keywords: ["device", "fingerprint", "устройств", "девайс", "отпечаток", "browser", "браузер", "мобильн", "pos", "канал", "тиражирован"],
    thinkingText: "Анализирую device fingerprinting...",
    sourceText: "Анализ 3 источников...",
    sources: [
      { id: 1, title: "Device Intelligence: Fingerprint Module v3", relevance: 93, lastUpdated: "12 марта 2026", type: "System" },
      { id: 2, title: "Channel Coverage Analysis 2026", relevance: 87, lastUpdated: "5 марта 2026", type: "Report" },
      { id: 3, title: "Policy Rule: device_anomaly_score", relevance: 81, lastUpdated: "25 февраля 2026", type: "Rule" },
    ],
    response: `<p>Модуль <strong>Device Intelligence v3</strong> <span class="citation-tag">1</span> формирует fingerprint на основе 42 параметров устройства, включая:</p>

<p>• Canvas / WebGL fingerprint<br/>
• AudioContext hash<br/>
• Установленные шрифты и плагины<br/>
• Screen resolution + color depth<br/>
• Timezone + language chain<br/>
• Battery API + hardware concurrency</p>

<h3>Покрытие каналов</h3>
<p>По данным Channel Coverage Analysis <span class="citation-tag">2</span>:</p>
<p>• <strong>Web</strong> — полное покрытие (42/42 параметра)<br/>
• <strong>Mobile SDK</strong> — расширенное покрытие (38 параметров + IMEI hash, SIM info)<br/>
• <strong>POS</strong> — базовое (terminal_id, geo, EMV-чип) — <strong>рекомендуется расширение</strong></p>

<p>Правило <strong>device_anomaly_score</strong> <span class="citation-tag">3</span> присваивает +25 к fraud score при обнаружении: подмены User-Agent, использования эмулятора, VPN/Proxy или root/jailbreak-устройства.</p>

<h3>Рекомендация</h3>
<p>Тиражирование SDK-модуля device_fp на POS-канал позволит унифицировать scoring и снизить fraud rate в offline-канале на ~18%.</p>`,
  },

  // ══════════════════════════════════════════════════════════════
  //  6. ML SCORING / MODELS
  // ══════════════════════════════════════════════════════════════
  {
    slug: "ml-scoring",
    keywords: ["score", "скоринг", "модель", "ml", "machine learning", "нейросет", "модел", "fraud_scorer", "предикт", "predict", "xgboost", "gradient"],
    thinkingText: "Загружаю данные по скоринг-моделям...",
    sourceText: "Анализ 3 источников...",
    sources: [
      { id: 1, title: "ML Model: fraud_scorer_v4 — Performance Report", relevance: 96, lastUpdated: "12 марта 2026", type: "Model" },
      { id: 2, title: "Feature Engineering Spec: scoring_features_v4", relevance: 90, lastUpdated: "1 марта 2026", type: "Spec" },
      { id: 3, title: "A/B Test: v3 vs v4 — Results", relevance: 84, lastUpdated: "28 февраля 2026", type: "Report" },
    ],
    response: `<p>Актуальная ML-модель — <strong>fraud_scorer_v4</strong> <span class="citation-tag">1</span>, XGBoost-based ансамбль, обученный на 18 месяцах данных (Q3 2024 — Q4 2025).</p>

<h3>Ключевые метрики</h3>
<p>• AUC-ROC: <strong>0.974</strong> (vs 0.961 у v3)<br/>
• Precision @ 95% recall: <strong>87.3%</strong><br/>
• Latency p99: <strong>12ms</strong> (SLA ≤ 50ms)</p>

<h3>Топ-фичи по importance</h3>
<p>Согласно feature spec <span class="citation-tag">2</span>, наибольший вклад вносят:</p>
<p>1. <strong>txn_velocity_24h</strong> — 14.2%<br/>
2. <strong>device_risk_score</strong> — 11.8%<br/>
3. <strong>amount_zscore</strong> — 9.3%<br/>
4. <strong>geo_distance_prev_txn</strong> — 8.7%<br/>
5. <strong>merchant_category_risk</strong> — 7.1%</p>

<p>По результатам A/B теста <span class="citation-tag">3</span>, v4 показал снижение FP rate на <strong>2.1 п.п.</strong> при идентичном recall. Рекомендуется полный roll-out до конца марта 2026.</p>`,
  },

  // ══════════════════════════════════════════════════════════════
  //  7. ALERTS / INCIDENTS
  // ══════════════════════════════════════════════════════════════
  {
    slug: "alerts",
    keywords: ["алерт", "alert", "инцидент", "incident", "срабатыван", "сработк", "уведомлен", "escalat", "эскалац", "кейс", "тикет"],
    thinkingText: "Собираю данные по алертам...",
    sourceText: "Анализ 3 источников...",
    sources: [
      { id: 1, title: "Alert Management: Routing Rules v2", relevance: 92, lastUpdated: "10 марта 2026", type: "System" },
      { id: 2, title: "Incident Response Playbook", relevance: 88, lastUpdated: "15 февраля 2026", type: "Wiki" },
      { id: 3, title: "Alert Volume Report: March 2026", relevance: 85, lastUpdated: "14 марта 2026", type: "Report" },
    ],
    response: `<p>Система alert management <span class="citation-tag">1</span> обрабатывает алерты по трёхуровневой модели приоритетов:</p>

<h3>Уровни алертов</h3>
<p><strong>🔴 CRITICAL</strong> (score ≥ 90) — автоматическая блокировка транзакции + немедленная эскалация на L2-аналитика. SLA реагирования: <strong>5 минут</strong>.</p>
<p><strong>🟡 HIGH</strong> (score 70–89) — транзакция задерживается на 30 мин, направляется в очередь L1. SLA: <strong>30 минут</strong>.</p>
<p><strong>🟢 MEDIUM</strong> (score 50–69) — транзакция проходит, алерт попадает в пост-обработку. Анализ в течение <strong>24 часов</strong>.</p>

<h3>Текущая статистика</h3>
<p>По данным мартовского отчёта <span class="citation-tag">3</span>:</p>
<p>• Всего алертов за март: <strong>3,847</strong><br/>
• CRITICAL: 127 (3.3%) — подтверждено 94 (74%)<br/>
• HIGH: 891 (23.2%) — подтверждено 412 (46%)<br/>
• MEDIUM: 2,829 (73.5%) — подтверждено 198 (7%)</p>

<p>Playbook <span class="citation-tag">2</span> определяет workflow эскалации: L1 → L2 → Fraud Manager → CISO при неразрешении в рамках SLA.</p>`,
  },

  // ══════════════════════════════════════════════════════════════
  //  8. RULES / POLICIES (general)
  // ══════════════════════════════════════════════════════════════
  {
    slug: "rules",
    keywords: ["правил", "rule", "policy", "политик", "логик", "условие", "condition", "настройк"],
    thinkingText: "Загружаю каталог правил...",
    sourceText: "Анализ 3 источников...",
    sources: [
      { id: 1, title: "Rule Catalog: Active Rules Registry", relevance: 95, lastUpdated: "14 марта 2026", type: "Registry" },
      { id: 2, title: "Rule Governance Framework", relevance: 87, lastUpdated: "1 марта 2026", type: "Wiki" },
      { id: 3, title: "Rule Performance Dashboard Q1 2026", relevance: 82, lastUpdated: "12 марта 2026", type: "Dashboard" },
    ],
    response: `<p>В реестре активных правил <span class="citation-tag">1</span> зарегистрировано <strong>73 правила</strong> по 8 категориям:</p>

<h3>Категории правил</h3>
<p>• <strong>Velocity</strong> (12 правил) — контроль частоты операций<br/>
• <strong>Amount anomaly</strong> (9 правил) — выявление нетипичных сумм<br/>
• <strong>Geo-risk</strong> (8 правил) — географические аномалии<br/>
• <strong>Device intelligence</strong> (11 правил) — анализ устройств<br/>
• <strong>Behavioral</strong> (14 правил) — поведенческие паттерны<br/>
• <strong>AML/CTF</strong> (10 правил) — противодействие отмыванию<br/>
• <strong>Merchant risk</strong> (5 правил) — риск мерчантов<br/>
• <strong>Network analysis</strong> (4 правила) — графовый анализ связей</p>

<h3>Governance</h3>
<p>Согласно governance framework <span class="citation-tag">2</span>, каждое правило проходит lifecycle: Draft → Review → Shadow → Active → Tuning → Deprecated. Средний цикл от draft до active — <strong>14 рабочих дней</strong>.</p>

<p>По дашборду Q1 <span class="citation-tag">3</span>, топ-5 правил по detection volume покрывают <strong>68%</strong> всех подтверждённых фрод-кейсов.</p>`,
  },

  // ══════════════════════════════════════════════════════════════
  //  9. GEO / GEOGRAPHY
  // ══════════════════════════════════════════════════════════════
  {
    slug: "geo",
    keywords: ["geo", "геогр", "страна", "регион", "ip", "vpn", "proxy", "локац", "местоположен"],
    thinkingText: "Анализирую гео-правила...",
    sourceText: "Анализ 3 источников...",
    sources: [
      { id: 1, title: "Policy Rule: geo_risk_matrix_v2", relevance: 94, lastUpdated: "8 марта 2026", type: "Rule" },
      { id: 2, title: "Geo-Risk Country List (March 2026)", relevance: 90, lastUpdated: "1 марта 2026", type: "List" },
      { id: 3, title: "VPN/Proxy Detection Module", relevance: 86, lastUpdated: "25 февраля 2026", type: "System" },
    ],
    response: `<p>Гео-аналитика реализована через <strong>geo_risk_matrix_v2</strong> <span class="citation-tag">1</span>, оценивающую риск по нескольким измерениям:</p>

<h3>Факторы гео-риска</h3>
<p>• <strong>Country risk tier</strong> — 4 уровня (A/B/C/D). Страны tier D добавляют +40 к score <span class="citation-tag">2</span><br/>
• <strong>Impossible travel</strong> — две транзакции из разных стран за время, недостаточное для перелёта. Score: +50<br/>
• <strong>IP/Billing mismatch</strong> — страна IP ≠ страна биллинга. Score: +20<br/>
• <strong>First-time country</strong> — транзакция из страны, нетипичной для клиента. Score: +15</p>

<h3>VPN/Proxy детекция</h3>
<p>Модуль <span class="citation-tag">3</span> использует базу из <strong>12M+ IP-адресов</strong> для определения:</p>
<p>• Коммерческие VPN-сервисы (NordVPN, ExpressVPN и т.д.)<br/>
• Datacenter IP (AWS, GCP, Azure)<br/>
• TOR exit nodes<br/>
• Residential proxies (самая сложная категория, accuracy 78%)</p>

<p>При обнаружении VPN/Proxy к score добавляется +25, а при TOR — +45.</p>`,
  },

  // ══════════════════════════════════════════════════════════════
  //  10. DEEPENING
  // ══════════════════════════════════════════════════════════════
  {
    slug: "deepening",
    keywords: ["углуби", "подробн", "детал", "расскажи больше", "expand", "elaborate"],
    thinkingText: "Углубляю анализ...",
    sourceText: "Расширенный поиск по 5 источникам...",
    sources: [
      { id: 1, title: "Knowledge Base: Deep Dive Analysis", relevance: 92, lastUpdated: "14 марта 2026", type: "Wiki" },
      { id: 2, title: "Technical Documentation v4.2", relevance: 88, lastUpdated: "10 марта 2026", type: "Docs" },
      { id: 3, title: "Expert Notes: Senior Analyst", relevance: 85, lastUpdated: "12 марта 2026", type: "Notes" },
    ],
    response: `<p>Расширяю предыдущий ответ с дополнительной информацией из базы знаний <span class="citation-tag">1</span>:</p>

<h3>Технические детали</h3>
<p>Согласно технической документации <span class="citation-tag">2</span>, архитектура системы построена на event-driven подходе с использованием Apache Kafka для real-time обработки транзакций. Средняя пропускная способность — <strong>15,000 txn/sec</strong> с latency p95 ≤ 25ms.</p>

<h3>Экспертные комментарии</h3>
<p>Заметки старшего аналитика <span class="citation-tag">3</span> указывают на необходимость учитывать сезонность: в периоды распродаж (Black Friday, Новый год) пороги рекомендуется временно повышать на 20–30% для снижения FP без существенной потери в detection.</p>

<p>Также отмечается, что комбинирование rule-based подхода с ML-моделями даёт <strong>синергетический эффект</strong>: правила ловят известные паттерны, модель — аномалии, не покрытые правилами.</p>`,
  },

  // ══════════════════════════════════════════════════════════════
  //  11. SIMPLIFICATION
  // ══════════════════════════════════════════════════════════════
  {
    slug: "simplify",
    keywords: ["упрости", "проще", "простыми словами", "explain simply", "для новичк"],
    thinkingText: "Упрощаю объяснение...",
    sourceText: "Подготовка упрощённого ответа...",
    sources: [
      { id: 1, title: "Fraud Detection: Beginner's Guide", relevance: 90, lastUpdated: "5 марта 2026", type: "Wiki" },
    ],
    response: `<p>Если говорить простыми словами <span class="citation-tag">1</span>:</p>

<p>Антифрод-система работает как <strong>охранник в магазине</strong>. Она наблюдает за каждой покупкой (транзакцией) и ставит оценку от 0 до 100 — насколько покупка подозрительная.</p>

<p><strong>Низкая оценка</strong> (0–49) → всё нормально, покупка проходит.<br/>
<strong>Средняя</strong> (50–69) → покупка проходит, но мы записываем и проверяем позже.<br/>
<strong>Высокая</strong> (70–89) → покупку задерживаем, пока аналитик не проверит.<br/>
<strong>Критичная</strong> (90–100) → покупку блокируем сразу.</p>

<p>Система смотрит на разные признаки: как часто человек покупает, с какого устройства, из какой страны, на какую сумму. Чем больше подозрительных признаков — тем выше оценка.</p>`,
  },

  // ══════════════════════════════════════════════════════════════
  //  12. CHARGEBACKS / DISPUTES
  // ══════════════════════════════════════════════════════════════
  {
    slug: "chargebacks",
    keywords: ["chargeback", "чарджбэк", "диспут", "dispute", "возврат", "оспариван", "refund"],
    thinkingText: "Загружаю статистику чарджбэков...",
    sourceText: "Анализ 3 источников...",
    sources: [
      { id: 1, title: "Chargeback Analytics: Q1 2026", relevance: 95, lastUpdated: "13 марта 2026", type: "Report" },
      { id: 2, title: "Dispute Management Workflow", relevance: 89, lastUpdated: "1 марта 2026", type: "Wiki" },
      { id: 3, title: "Visa/MC Chargeback Reason Codes", relevance: 83, lastUpdated: "10 февраля 2026", type: "Reference" },
    ],
    response: `<p>По данным аналитики Q1 2026 <span class="citation-tag">1</span>, общий объём чарджбэков составил <strong>2,341 кейс</strong> на сумму 47.2 млн ₽.</p>

<h3>Распределение по reason codes</h3>
<p>Согласно классификации Visa/MC <span class="citation-tag">3</span>:</p>
<p>• <strong>10.4 — Fraud</strong>: 42% (настоящий фрод)<br/>
• <strong>13.1 — Merchandise not received</strong>: 19%<br/>
• <strong>10.5 — Counterfeit</strong>: 15%<br/>
• <strong>13.3 — Not as described</strong>: 12%<br/>
• <strong>Friendly fraud</strong>: 12% (клиент врёт)</p>

<h3>Процесс</h3>
<p>Workflow диспутов <span class="citation-tag">2</span>: Получение → Классификация (24ч) → Сбор доказательств (48ч) → Representment / Accept (72ч). Текущий win rate по representment: <strong>61%</strong>.</p>

<p>Для снижения chargeback ratio (текущий 0.87%, порог VISA — 0.9%) рекомендуется внедрение <strong>Verifi CDRN</strong> и <strong>Ethoca alerts</strong>.</p>`,
  },

  // ══════════════════════════════════════════════════════════════
  //  13. 3DS / 3D SECURE  ★ NEW
  // ══════════════════════════════════════════════════════════════
  {
    slug: "3ds",
    keywords: ["3ds", "3d secure", "3д секьюр", "3-d secure", "аутентификац", "sca", "strong customer", "emv 3ds", "challenge", "frictionless"],
    thinkingText: "Загружаю данные по 3D Secure...",
    sourceText: "Анализ 4 источников...",
    sources: [
      { id: 1, title: "3DS 2.2 Implementation Guide", relevance: 97, lastUpdated: "15 марта 2026", type: "Spec" },
      { id: 2, title: "3DS Performance Dashboard Q1 2026", relevance: 92, lastUpdated: "12 марта 2026", type: "Dashboard" },
      { id: 3, title: "Policy Rule: 3ds_decision_engine_v2", relevance: 88, lastUpdated: "8 марта 2026", type: "Rule" },
      { id: 4, title: "PSD2/SCA Compliance Checklist", relevance: 82, lastUpdated: "1 февраля 2026", type: "Wiki" },
    ],
    response: `<p>Платформа использует <strong>EMV 3DS 2.2</strong> <span class="citation-tag">1</span> для аутентификации CNP-транзакций с двумя потоками:</p>

<h3>Frictionless vs Challenge</h3>
<p><strong>Frictionless flow</strong> — банк-эмитент одобряет транзакцию без участия клиента на основе risk-based анализа (device, поведенческие данные, история). Целевая доля: <strong>≥ 85%</strong> всех 3DS-запросов.</p>
<p><strong>Challenge flow</strong> — клиент проходит дополнительную верификацию (OTP, biometric, in-app confirm). Применяется для высокорисковых транзакций.</p>

<h3>Текущие метрики</h3>
<p>По дашборду Q1 <span class="citation-tag">2</span>:</p>
<p>• Frictionless rate: <strong>87.4%</strong> (цель — 85%)<br/>
• Challenge success rate: <strong>76.2%</strong><br/>
• Abandonment rate (challenge): <strong>18.3%</strong> — основная зона потерь конверсии<br/>
• Liability shift coverage: <strong>94.1%</strong></p>

<h3>Decision Engine</h3>
<p>Правило <strong>3ds_decision_engine_v2</strong> <span class="citation-tag">3</span> определяет, когда запрашивать 3DS:</p>
<p>• Score ≥ 60 → обязательный 3DS challenge<br/>
• Score 30–59 → 3DS с preference: frictionless<br/>
• Score &lt; 30 + доверенное устройство → exemption (без 3DS)</p>

<p>Согласно SCA-требованиям <span class="citation-tag">4</span>, исключения (exemptions) доступны для: низкорисковых транзакций (TRA), recurring-платежей, и сумм до €30 (кумулятивный лимит €100).</p>`,
  },

  // ══════════════════════════════════════════════════════════════
  //  14. GEO-ANOMALIES / IMPOSSIBLE TRAVEL  ★ NEW
  // ══════════════════════════════════════════════════════════════
  {
    slug: "geo-anomalies",
    keywords: ["impossible travel", "невозможное перемещен", "гео-аномал", "geo-anomal", "телепортац", "travel", "расстоян", "перемещен", "перелёт", "перелет"],
    thinkingText: "Анализирую гео-аномалии...",
    sourceText: "Анализ 3 источников...",
    sources: [
      { id: 1, title: "Policy Rule: impossible_travel_detector_v3", relevance: 96, lastUpdated: "14 марта 2026", type: "Rule" },
      { id: 2, title: "Geo-Anomaly Investigation Report Q1 2026", relevance: 91, lastUpdated: "10 марта 2026", type: "Report" },
      { id: 3, title: "IP Geolocation Accuracy Benchmark", relevance: 84, lastUpdated: "25 февраля 2026", type: "Benchmark" },
    ],
    response: `<p>Модуль <strong>impossible_travel_detector_v3</strong> <span class="citation-tag">1</span> выявляет физически невозможные перемещения пользователей между транзакциями.</p>

<h3>Алгоритм детекции</h3>
<p>Для каждой пары последовательных транзакций рассчитывается:</p>
<p>• <strong>Географическое расстояние</strong> между точками (Haversine formula)<br/>
• <strong>Минимальное время перемещения</strong> с учётом: авиа (850 км/ч), авто (120 км/ч), ж/д (250 км/ч)<br/>
• <strong>Фактический интервал</strong> между транзакциями</p>

<p>Если фактический интервал < минимального времени перемещения, генерируется алерт.</p>

<h3>Уровни severity</h3>
<p>По данным расследований Q1 <span class="citation-tag">2</span>:</p>
<p>• <strong>Teleportation</strong> (интервал &lt; 30 мин, расстояние &gt; 500 км) → score +50, блокировка<br/>
• <strong>Suspicious travel</strong> (интервал 30 мин – 3ч, нереалистичная скорость) → score +30<br/>
• <strong>Unusual geography</strong> (новый регион + device change) → score +20</p>

<h3>Ограничения</h3>
<p>Точность IP-геолокации <span class="citation-tag">3</span> на уровне города — <strong>82%</strong>, на уровне страны — <strong>99.1%</strong>. Ложные срабатывания чаще возникают при:</p>
<p>• Использовании мобильного интернета (IP привязан к другому городу)<br/>
• Корпоративных VPN с выходной точкой в другой стране<br/>
• Shared-устройствах (семейный аккаунт)</p>

<p>Рекомендация: комбинировать IP-гео с GPS-данными из мобильного SDK для повышения accuracy до <strong>96%</strong>.</p>`,
  },

  // ══════════════════════════════════════════════════════════════
  //  15. BEHAVIORAL BIOMETRICS  ★ NEW
  // ══════════════════════════════════════════════════════════════
  {
    slug: "behavioral-biometrics",
    keywords: ["behavioral", "поведенческ", "биометри", "biometric", "клавиатур", "typing", "keystroke", "mouse", "мышь", "жест", "gesture", "свайп"],
    thinkingText: "Анализирую поведенческую биометрию...",
    sourceText: "Анализ 3 источников...",
    sources: [
      { id: 1, title: "Behavioral Biometrics Module: BioSense v2", relevance: 95, lastUpdated: "16 марта 2026", type: "System" },
      { id: 2, title: "Keystroke Dynamics: Accuracy Report", relevance: 89, lastUpdated: "8 марта 2026", type: "Report" },
      { id: 3, title: "Policy Rule: behavioral_anomaly_score", relevance: 85, lastUpdated: "1 марта 2026", type: "Rule" },
    ],
    response: `<p>Модуль <strong>BioSense v2</strong> <span class="citation-tag">1</span> анализирует паттерны взаимодействия пользователя с устройством для пассивной аутентификации.</p>

<h3>Собираемые сигналы</h3>
<p><strong>Desktop (Web):</strong></p>
<p>• Динамика набора текста — скорость, flight time между клавишами, dwell time<br/>
• Движения мыши — траектория, скорость, кривизна, overshooting<br/>
• Scroll-паттерны — частота, инерция, направление</p>

<p><strong>Mobile:</strong></p>
<p>• Touch pressure + area (на поддерживаемых устройствах)<br/>
• Swipe velocity и угол наклона<br/>
• Гироскоп / акселерометр — как пользователь держит телефон<br/>
• Typing rhythm на виртуальной клавиатуре</p>

<h3>Результаты</h3>
<p>По отчёту accuracy <span class="citation-tag">2</span>:</p>
<p>• EER (Equal Error Rate): <strong>3.2%</strong> при 10+ сессиях обучения<br/>
• Среднее время до формирования профиля: <strong>5 сессий</strong><br/>
• False rejection rate (легитимный пользователь отклонён): <strong>1.8%</strong></p>

<p>Правило <strong>behavioral_anomaly_score</strong> <span class="citation-tag">3</span> добавляет до +30 к fraud score при значительном отклонении от поведенческого профиля (z-score &gt; 2.5). При совпадении device fingerprint + behavioral match — score снижается на −10 (доверенный контекст).</p>`,
  },

  // ══════════════════════════════════════════════════════════════
  //  16. GRAPH / NETWORK ANALYSIS  ★ NEW
  // ══════════════════════════════════════════════════════════════
  {
    slug: "graph-analysis",
    keywords: ["граф", "graph", "network analysis", "сетевой анализ", "связ", "кластер", "cluster", "ring", "кольц", "сообщник", "организованн", "группировк"],
    thinkingText: "Строю граф связей...",
    sourceText: "Анализ 4 источников...",
    sources: [
      { id: 1, title: "Graph Analytics Engine: FraudGraph v2", relevance: 96, lastUpdated: "15 марта 2026", type: "System" },
      { id: 2, title: "Fraud Ring Detection: Case Studies Q1", relevance: 91, lastUpdated: "12 марта 2026", type: "Report" },
      { id: 3, title: "Policy Rule: network_risk_propagation", relevance: 87, lastUpdated: "5 марта 2026", type: "Rule" },
      { id: 4, title: "Neo4j + GDS Integration Spec", relevance: 80, lastUpdated: "20 февраля 2026", type: "Spec" },
    ],
    response: `<p>Движок <strong>FraudGraph v2</strong> <span class="citation-tag">1</span> строит граф связей между сущностями для выявления организованного фрода.</p>

<h3>Узлы и рёбра графа</h3>
<p><strong>Узлы:</strong> пользователи, устройства, IP-адреса, карты, email, телефоны, адреса доставки</p>
<p><strong>Рёбра:</strong> транзакция, логин, смена данных, refund-запрос, chargeback</p>

<p>Граф хранится в <strong>Neo4j</strong> с расширением GDS <span class="citation-tag">4</span> для алгоритмов community detection.</p>

<h3>Алгоритмы</h3>
<p>• <strong>Louvain community detection</strong> — выявление кластеров связанных аккаунтов<br/>
• <strong>PageRank</strong> — определение "центральных" узлов в мошеннических сетях<br/>
• <strong>Shortest path</strong> — поиск неочевидных связей (2–3 hop distance)<br/>
• <strong>Temporal pattern matching</strong> — синхронные действия группы аккаунтов</p>

<h3>Результаты Q1</h3>
<p>По кейс-стади <span class="citation-tag">2</span> выявлено <strong>7 fraud rings</strong> общей стоимостью 12.4 млн ₽:</p>
<p>• Крупнейшее кольцо: 43 аккаунта, 3 общих устройства, 891 транзакция<br/>
• Среднее время обнаружения: <strong>4.2 часа</strong> (vs 18 дней до внедрения графа)</p>

<p>Правило <strong>network_risk_propagation</strong> <span class="citation-tag">3</span>: при подтверждении фрода на одном узле score всех связанных узлов в 2-hop radius повышается на +15…+40 в зависимости от силы связи.</p>`,
  },

  // ══════════════════════════════════════════════════════════════
  //  17. SYNTHETIC IDENTITY / ACCOUNT FRAUD  ★ NEW
  // ══════════════════════════════════════════════════════════════
  {
    slug: "synthetic-identity",
    keywords: ["synthetic", "синтетическ", "поддельн", "фейков", "fake", "identity", "идентичност", "мул", "mule", "дроп", "drop", "номинал"],
    thinkingText: "Анализирую синтетические идентичности...",
    sourceText: "Анализ 3 источников...",
    sources: [
      { id: 1, title: "Synthetic Identity Detection Model v1.4", relevance: 95, lastUpdated: "14 марта 2026", type: "Model" },
      { id: 2, title: "Mule Account Patterns: Q1 2026 Analysis", relevance: 90, lastUpdated: "10 марта 2026", type: "Report" },
      { id: 3, title: "KYC Enrichment: Document Verification API", relevance: 84, lastUpdated: "1 марта 2026", type: "System" },
    ],
    response: `<p>Модель <strong>Synthetic Identity Detection v1.4</strong> <span class="citation-tag">1</span> выявляет аккаунты, созданные с использованием скомпилированных или украденных данных.</p>

<h3>Признаки синтетической идентичности</h3>
<p>• ФИО + дата рождения не соответствуют ни одной записи в бюро кредитных историй<br/>
• SSN/ИНН зарегистрирован недавно или принадлежит умершему/несовершеннолетнему<br/>
• Email создан менее 30 дней назад + одноразовый домен<br/>
• Телефон — виртуальный номер (VoIP) без истории</p>

<h3>Паттерны мул-аккаунтов</h3>
<p>По анализу Q1 <span class="citation-tag">2</span>:</p>
<p>• <strong>Sleeper pattern</strong> — аккаунт активен 60–90 дней с легитимными микро-транзакциями, затем резкий всплеск (bust-out)<br/>
• <strong>Funnel pattern</strong> — множество входящих переводов с разных источников → единый вывод на крипто/электронный кошелёк<br/>
• <strong>Round-trip</strong> — P2P-переводы внутри замкнутой группы аккаунтов</p>

<h3>Верификация</h3>
<p>API документарной верификации <span class="citation-tag">3</span> проверяет: подлинность документа (MRZ, голограммы, шрифты), liveness-check (anti-spoofing), и match score лица на документе vs selfie. Текущий accuracy: <strong>99.2%</strong> при FRR 0.8%.</p>`,
  },

  // ══════════════════════════════════════════════════════════════
  //  18. PAYMENT TOKENIZATION & ENCRYPTION  ★ NEW
  // ══════════════════════════════════════════════════════════════
  {
    slug: "tokenization",
    keywords: ["token", "токенизац", "шифрован", "encrypt", "pci", "dss", "vault", "хранен", "карточн", "маскир", "mask", "pan"],
    thinkingText: "Загружаю данные по токенизации...",
    sourceText: "Анализ 3 источников...",
    sources: [
      { id: 1, title: "Tokenization Service: CardVault v3", relevance: 94, lastUpdated: "12 марта 2026", type: "System" },
      { id: 2, title: "PCI DSS 4.0 Compliance Status", relevance: 91, lastUpdated: "1 марта 2026", type: "Audit" },
      { id: 3, title: "Network Tokenization: Visa/MC Integration", relevance: 86, lastUpdated: "15 февраля 2026", type: "Spec" },
    ],
    response: `<p>Сервис <strong>CardVault v3</strong> <span class="citation-tag">1</span> обеспечивает токенизацию и безопасное хранение платёжных данных.</p>

<h3>Архитектура</h3>
<p>• <strong>Vault-level tokenization</strong> — PAN заменяется на format-preserving token (FPE, FF3-1) при первом вводе<br/>
• <strong>Encryption at rest</strong> — AES-256-GCM с ротацией ключей каждые 90 дней<br/>
• <strong>Encryption in transit</strong> — TLS 1.3, certificate pinning для мобильных SDK<br/>
• <strong>HSM</strong> — мастер-ключи хранятся в аппаратных модулях (Thales Luna)</p>

<h3>Network Tokenization</h3>
<p>Интеграция с Visa VTS и MC MDES <span class="citation-tag">3</span> позволяет:</p>
<p>• Заменять PAN на network-level token → снижение scope PCI DSS<br/>
• Автоматическое обновление при перевыпуске карты (lifecycle management)<br/>
• Улучшение approval rate на <strong>2.4%</strong> за счёт криптограммы</p>

<h3>Статус PCI DSS 4.0</h3>
<p>По результатам аудита <span class="citation-tag">2</span>: 11 из 12 requirements — <strong>compliant</strong>. Requirement 6.4 (client-side script management) — в процессе внедрения CSP и SRI. Дедлайн: <strong>31 марта 2026</strong>.</p>`,
  },

  // ══════════════════════════════════════════════════════════════
  //  19. REAL-TIME MONITORING / DASHBOARD  ★ NEW
  // ══════════════════════════════════════════════════════════════
  {
    slug: "monitoring",
    keywords: ["мониторинг", "monitoring", "дашборд", "dashboard", "реальном времен", "real-time", "realtime", "метрик", "metric", "отчёт", "отчет", "report", "статистик", "kpi"],
    thinkingText: "Подключаюсь к мониторингу...",
    sourceText: "Анализ 3 источников...",
    sources: [
      { id: 1, title: "Real-Time Monitoring: FraudWatch Dashboard", relevance: 95, lastUpdated: "16 марта 2026", type: "Dashboard" },
      { id: 2, title: "KPI Framework: Antifraud Metrics v3", relevance: 90, lastUpdated: "10 марта 2026", type: "Wiki" },
      { id: 3, title: "Alerting & Notification Pipeline", relevance: 84, lastUpdated: "5 марта 2026", type: "System" },
    ],
    response: `<p>Дашборд <strong>FraudWatch</strong> <span class="citation-tag">1</span> обеспечивает real-time мониторинг с обновлением каждые <strong>5 секунд</strong>.</p>

<h3>Ключевые виджеты</h3>
<p>• <strong>Transaction heatmap</strong> — карта транзакций по регионам с цветовой кодировкой риска<br/>
• <strong>Fraud rate trend</strong> — скользящий график fraud rate за 24ч / 7д / 30д<br/>
• <strong>Alert queue</strong> — live-очередь алертов с фильтрами по severity и типу<br/>
• <strong>Model drift monitor</strong> — отслеживание PSI (Population Stability Index) модели</p>

<h3>KPI-метрики</h3>
<p>Фреймворк метрик <span class="citation-tag">2</span> определяет 4 уровня:</p>
<p>• <strong>L1 (Executive)</strong>: Fraud rate (bps), Loss amount, Chargeback ratio<br/>
• <strong>L2 (Operations)</strong>: Detection rate, FP rate, Alert-to-SAR conversion<br/>
• <strong>L3 (Technical)</strong>: Model AUC, Latency p99, Rule hit rates<br/>
• <strong>L4 (Granular)</strong>: Per-rule performance, Feature drift, Data freshness</p>

<h3>Алертинг</h3>
<p>Pipeline уведомлений <span class="citation-tag">3</span> поддерживает: Slack, PagerDuty, email, SMS. Приоритет каналов настраивается per-severity. Среднее время от детекции до уведомления: <strong>800ms</strong>.</p>`,
  },

];

// ─── Fallback ────────────────────────────────────────────────────

const fallbackEntry: KnowledgeEntry = {
  slug: "fallback",
  keywords: [],
  thinkingText: "Обрабатываю запрос...",
  sourceText: "Поиск по базе знаний...",
  sources: [
    { id: 1, title: "Antifraud Knowledge Base: General", relevance: 75, lastUpdated: "14 марта 2026", type: "Wiki" },
    { id: 2, title: "Fraud Detection Playbook", relevance: 70, lastUpdated: "2 февраля 2026", type: "Wiki" },
  ],
  response: `<p>Спасибо за вопрос. На основе анализа базы знаний <span class="citation-tag">1</span> могу предоставить следующую информацию:</p>

<p>Антифрод-платформа обеспечивает комплексную защиту транзакций через многоуровневую систему анализа. Основные компоненты:</p>

<p>• <strong>Rule engine</strong> — 73 активных правила по 8 категориям, от velocity-проверок до графового анализа связей<br/>
• <strong>ML scoring</strong> — XGBoost-ансамбль fraud_scorer_v4 с AUC-ROC 0.974<br/>
• <strong>Device intelligence</strong> — fingerprinting на основе 42 параметров устройства<br/>
• <strong>AML monitoring</strong> — 47 правил для выявления отмывания и подозрительных операций</p>

<p>Согласно Playbook <span class="citation-tag">2</span>, текущие метрики системы: detection rate <strong>94%</strong>, false positive rate <strong>4.3%</strong>, latency p99 <strong>12ms</strong>.</p>

<p>Могу детально разобрать любой из этих компонентов — уточните, что вас интересует.</p>`,
};

// ─── Matching engine ─────────────────────────────────────────────

/**
 * Score a query against an entry's keywords.
 * Returns a relevance score (higher = better match).
 */
function scoreEntry(query: string, entry: KnowledgeEntry): number {
  const q = query.toLowerCase();
  let score = 0;

  for (const keyword of entry.keywords) {
    const kw = keyword.toLowerCase();
    if (q.includes(kw)) {
      // Longer keyword matches are more valuable
      score += kw.length;
      // Bonus for exact word match
      if (q.split(/\s+/).some((word) => word === kw)) {
        score += 5;
      }
    }
  }

  return score;
}

/**
 * Find the best matching knowledge entry for a user query.
 */
export function findBestMatch(query: string): KnowledgeEntry {
  let bestScore = 0;
  let bestEntry = fallbackEntry;

  for (const entry of knowledgeBase) {
    const score = scoreEntry(query, entry);
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  // Require at least some meaningful match
  if (bestScore < 3) {
    return fallbackEntry;
  }

  return bestEntry;
}
