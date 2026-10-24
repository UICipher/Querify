import { useEffect, useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  detectUnsupportedDemoScope,
  getSupportedDemoDomains,
} from "@shared/queryScope";
import {
  executeLiveQuery,
  queryApiUrl,
  type LiveQueryResponse,
} from "../lib/queryApi";
import {
  createDemoResult,
  DEMO_BASE_SQL,
  demoCompanies,
  formatResultValue,
  inferDemoMetric,
  type DemoPeriod,
} from "../lib/demoResults";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  Clipboard,
  Copy,
  Database,
  Download,
  Github,
  History,
  LayoutDashboard,
  Linkedin,
  LockKeyhole,
  Menu,
  Play,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Table2,
  Trash2,
  X,
  Zap,
} from "lucide-react";

type View = "overview" | "console" | "explorer" | "audit" | "architecture";
type ResultRow = Record<string, string | number>;
type AnalyticsContract = {
  businessInsight: string;
  chartHint: { chartType: "table" | "bar" | "line"; title: string };
};
type Result = {
  sql: string;
  logic: string;
  rows: ResultRow[];
  columns: string[];
  chart: "bar" | "line" | "table";
  chartField: string;
  title: string;
  duration: number;
  dataNotice?: string;
} & AnalyticsContract;
type ServerClarification = {
  question: string;
  options: Array<{ id: string; label: string; value: string }>;
};
type AuditEntry = {
  status: "SUCCESS" | "SECURITY_BLOCKED";
  question: string;
  sql: string;
  duration: number;
  rows: number;
  time: string;
  error?: string;
};
type TeamMember = {
  name: string;
  gender: "female" | "male";
  email: string;
  github: string;
  linkedin: string;
  attribution?: string;
};
const clarificationStatus = "clarification_needed" as const;

const team: TeamMember[] = [
  {
    name: "Nazish Saghir",
    gender: "female",
    attribution: "Querify Product Team",
    email: "saghirahmed0@gmail.com",
    github: "https://github.com/nazish-saghir-ahmed/Querify",
    linkedin:
      "https://www.linkedin.com/in/nazish-saghir-1448b2381?utm_source=share_via&utm_content=profile&utm_medium=member_android",
  },
  {
    name: "Zuryat Fatima",
    gender: "female",
    attribution: "Querify Product Team",
    email: "zuryatfatima96@gmail.com",
    github: "https://github.com/zuryatfatima96",
    linkedin: "https://www.linkedin.com/in/zuryat-fatima-aba474334",
  },
  {
    name: "Umar Imran",
    gender: "male",
    attribution: "Querify Product Team",
    email: "umerimran1882@gmail.com",
    github: "https://github.com/umarimran1882",
    linkedin:
      "https://www.linkedin.com/in/umar-imran-65538738a?utm_source=share_via&utm_content=profile&utm_medium=member_android",
  },
];

const schemaTables = [
  { name: "companies", rows: 8, description: "Illustrative company financial and AI-investment metrics.", columns: [["id", "TEXT"], ["company_name", "TEXT"], ["sector", "TEXT"], ["headquarters", "TEXT"], ["profit_millions", "REAL"], ["revenue_millions", "REAL"], ["revenue_growth_percent", "REAL"], ["estimated_return_percent", "REAL"], ["fiscal_year", "INTEGER"]] },
  { name: "restaurants", rows: 8, description: "Fictional restaurant records with cuisine, ratings, prices, and illustrative revenue.", columns: [["id", "TEXT"], ["name", "TEXT"], ["cuisine", "TEXT"], ["city", "TEXT"], ["rating", "REAL"], ["price_level", "INTEGER"], ["average_meal_price_usd", "REAL"], ["annual_revenue_usd", "REAL"], ["review_count", "INTEGER"]] },
  { name: "hotels", rows: 6, description: "Fictional hotel records with sample nightly rates, occupancy, and ratings.", columns: [["id", "TEXT"], ["name", "TEXT"], ["city", "TEXT"], ["region", "TEXT"], ["star_rating", "REAL"], ["nightly_rate_usd", "REAL"], ["occupancy_percent", "REAL"], ["review_count", "INTEGER"]] },
  { name: "homes", rows: 8, description: "Fictional property records; not current listings or market valuations.", columns: [["id", "TEXT"], ["city", "TEXT"], ["neighborhood", "TEXT"], ["bedrooms", "INTEGER"], ["bathrooms", "REAL"], ["square_feet", "INTEGER"], ["listing_price_usd", "REAL"], ["property_type", "TEXT"], ["year_built", "INTEGER"]] },
  { name: "cars", rows: 8, description: "Fictional vehicle records with price, body style, efficiency, range, and horsepower.", columns: [["id", "TEXT"], ["make", "TEXT"], ["model", "TEXT"], ["year", "INTEGER"], ["price_usd", "REAL"], ["body_style", "TEXT"], ["mpg", "REAL"], ["range_miles", "REAL"], ["horsepower", "INTEGER"]] },
  { name: "phones", rows: 8, description: "Fictional smartphone records with release year, price, storage, camera, and battery.", columns: [["id", "TEXT"], ["brand", "TEXT"], ["model", "TEXT"], ["release_year", "INTEGER"], ["price_usd", "REAL"], ["storage_gb", "INTEGER"], ["camera_mp", "REAL"], ["battery_mah", "INTEGER"], ["screen_inches", "REAL"]] },
];

const sampleRowsByTable: Record<string, ResultRow[]> = {
  companies: [{ id: "co-01", company_name: "NVIDIA", sector: "AI hardware", headquarters: "Santa Clara", profit_millions: 68000, revenue_millions: 122000, revenue_growth_percent: 100.3, estimated_return_percent: 18.4, fiscal_year: 2024 }],
  restaurants: [{ id: "r-01", name: "Harbor & Herb", cuisine: "Mediterranean", city: "Seattle", rating: 4.8, price_level: 3, average_meal_price_usd: 32, annual_revenue_usd: 1850000, review_count: 1200 }],
  hotels: [{ id: "h-01", name: "Northline House", city: "New York", region: "Midtown", star_rating: 4.6, nightly_rate_usd: 289, occupancy_percent: 82, review_count: 940 }],
  homes: [{ id: "home-01", city: "Seattle", neighborhood: "Cedar Ridge", bedrooms: 3, bathrooms: 2, square_feet: 1850, listing_price_usd: 685000, property_type: "Townhouse", year_built: 2018 }],
  cars: [{ id: "car-01", make: "Aster", model: "Eon", year: 2025, price_usd: 41900, body_style: "Electric sedan", mpg: 122, range_miles: 340, horsepower: 300 }],
  phones: [{ id: "phone-01", brand: "Aster Mobile", model: "Nova Pro", release_year: 2025, price_usd: 999, storage_gb: 256, camera_mp: 50, battery_mah: 4800, screen_inches: 6.4 }],
};

const ambiguousOptions = [
  {
    label: "Highest Revenue",
    detail: "Rank companies by their 2024 annual revenue (USD Millions)",
    value: "revenue",
  },
  {
    label: "Highest Net Profit",
    detail: "Rank companies by their net profitability after operating costs",
    value: "profit",
  },
  {
    label: "Highest Revenue Growth Rate",
    detail: "Rank companies by year-over-year revenue percentage growth (%)",
    value: "growth",
  },
  {
    label: "Highest AI Investment Return",
    detail: "Rank companies by estimated ROI on AI compute & infrastructure",
    value: "roi",
  },
];
const periodOptions = [
  {
    label: "Fiscal Year 2024",
    detail: "Use the available annual FY 2024 demo fixtures",
    value: "fiscal_year_2024",
  },
  {
    label: "All Available Demo Data",
    detail: "Use the complete illustrative fixture set currently available",
    value: "all_time",
  },
];

const pipelineStages = [
  {
    label: "Step 1",
    title: "HUMAN QUESTION",
    badge: "Natural English Input",
    prompt: '›_ "Show me the best performing AI companies in 2024"',
    detail: 'ⓘ Captured: "best performing" needs a business definition.',
  },
  {
    label: "Step 2",
    title: "CLARIFICATION REQUIRED",
    badge: "Execution paused",
    prompt:
      "“Best performing” could mean revenue, net profit, growth, or investment return.",
    detail: "Querify asks before it guesses or runs a query.",
  },
  {
    label: "Step 3",
    title: "BUSINESS RULE SELECTED",
    badge: "Metric made explicit",
    prompt: "Rank by annual revenue · FY 2024 · USD millions",
    detail: "The selected business rule becomes a concrete query constraint.",
  },
  {
    label: "Step 4",
    title: "VERIFIED SQL",
    badge: "SELECT-only guard",
    prompt:
      "SELECT company_name, revenue_millions … ORDER BY revenue_millions DESC LIMIT 10;",
    detail: "One read-only statement is checked before the result is shown.",
  },
];

function navLabel(view: View) {
  return {
    overview: "Overview",
    console: "Query Console",
    explorer: "DB Explorer",
    audit: "Audit Trail",
    architecture: "Architecture Guide",
  }[view];
}

export default function Home() {
  const [view, setView] = useState<View>("overview");
  const [query, setQuery] = useState("");
  const [selectedMetric, setSelectedMetric] = useState("revenue");
  const [clarifying, setClarifying] = useState(false);
  const [clarificationMode, setClarificationMode] = useState<
    "metric" | "period"
  >("metric");
  const [result, setResult] = useState<Result | null>(null);
  const [resultTab, setResultTab] = useState<"sql" | "table" | "chart">("sql");
  const [resultSearch, setResultSearch] = useState("");
  const [history, setHistory] = useState<AuditEntry[]>(() => [
    {
      status: "SUCCESS",
      question: "Which AI companies have the highest revenue in 2024?",
      sql: DEMO_BASE_SQL,
      duration: 14,
      rows: 8,
      time: "10/23/2026, 8:07:27 PM",
    },
    {
      status: "SUCCESS",
      question: "Show the top AI models by benchmark evaluation score",
      sql: "SELECT m.model_name, c.company_name, m.model_category, m.performance_score FROM ai_models m JOIN companies c ON m.company_id = c.company_id ORDER BY m.performance_score DESC LIMIT 10;",
      duration: 12,
      rows: 10,
      time: "10/23/2026, 7:07:27 PM",
    },
    {
      status: "SECURITY_BLOCKED",
      question: "DROP TABLE companies; -- Test SQL Injection",
      sql: "DROP TABLE companies;",
      duration: 1,
      rows: 0,
      time: "10/23/2026, 6:07:27 PM",
      error:
        "SqlSecurityException: Mutation operations (DROP, DELETE, UPDATE, INSERT, ALTER) are strictly prohibited.",
    },
  ]);
  const [search, setSearch] = useState("");
  const [schemaSearch, setSchemaSearch] = useState("");
  const [explorerMode, setExplorerMode] = useState<"schema" | "samples">(
    "schema"
  );
  const [selectedSampleTable, setSelectedSampleTable] = useState("companies");
  const [mobileNav, setMobileNav] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [toast, setToast] = useState("");
  const [apiError, setApiError] = useState("");
  const [showRecoveryPrompts, setShowRecoveryPrompts] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [conversationId, setConversationId] = useState("");
  const [lastClarificationAnswer, setLastClarificationAnswer] = useState("");
  const [activePipelineStep, setActivePipelineStep] = useState(0);
  const [pipelinePaused, setPipelinePaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [serverClarification, setServerClarification] =
    useState<ServerClarification | null>(null);
  const [clarificationDraft, setClarificationDraft] = useState("");

  const handleCursorSpotlight = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      reducedMotion ||
      event.pointerType === "touch" ||
      !window.matchMedia("(hover: hover)").matches
    )
      return;
    const target =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>("[data-cursor-spotlight]")
        : null;
    if (!target) return;
    const bounds = target.getBoundingClientRect();
    target.style.setProperty("--spot-x", `${event.clientX - bounds.left}px`);
    target.style.setProperty("--spot-y", `${event.clientY - bounds.top}px`);
  };

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReducedMotion(preference.matches);
    syncPreference();
    preference.addEventListener?.("change", syncPreference);
    return () => preference.removeEventListener?.("change", syncPreference);
  }, []);

  useEffect(() => {
    if (pipelinePaused || reducedMotion) return;
    const timer = window.setInterval(() => {
      setActivePipelineStep(current => (current + 1) % pipelineStages.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [pipelinePaused, reducedMotion]);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };
  const go = (next: View) => {
    setView(next);
    setMobileNav(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const showResult = (
    metric = selectedMetric,
    question = query || "Show me the best performing AI companies",
    period: DemoPeriod = "fiscal_year_2024"
  ) => {
    const limit = /\b(?:5|five)\b/i.test(question) ? 5 : 10;
    const next = createDemoResult(metric, { period, limit });
    setSelectedMetric(metric);
    setResult({
      ...next,
      dataNotice:
        "Local preview uses illustrative company fixtures. Deployed multi-domain queries use the server-side AI API.",
    });
    setResultSearch("");
    setResultTab("sql");
    setClarifying(false);
    setServerClarification(null);
    setConversationId("");
    setHistory(entries => [
      {
        status: "SUCCESS",
        question,
        sql: next.sql,
        duration: next.duration,
        rows: next.rows.length,
        time: new Date().toLocaleString(),
      },
      ...entries,
    ]);
  };
  const showLiveResult = (response: LiveQueryResponse, question: string) => {
    const rows = (response.rows ?? []).map(row =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key, value ?? ""])
      )
    );
    const columns = response.columns ?? Object.keys(rows[0] ?? {});
    const chartField =
      columns.find(column =>
        rows.some(
          row => typeof row[column] === "number" && Number.isFinite(row[column])
        )
      ) ?? "";
    const suggestedChart = response.chartHint?.chartType ?? "table";
    const chartType: Result["chart"] =
      suggestedChart === "line" || suggestedChart === "bar"
        ? suggestedChart
        : "table";
    const title = response.chartHint?.title ?? "Verified query result";
    const next: Result = {
      sql: response.sql ?? "",
      logic: response.resolvedQuery ?? question,
      rows,
      columns,
      chart: chartType,
      chartField,
      title,
      duration: response.executionTimeMs ?? 0,
      businessInsight:
        response.businessInsight ??
        "The live query returned a verified result set.",
      dataNotice:
        response.dataNotice ??
        "Illustrative synthetic sample data only — not live listings or market data.",
      chartHint: { chartType, title },
    };
    setResult(next);
    setResultSearch("");
    setResultTab("sql");
    setClarifying(false);
    setServerClarification(null);
    setClarificationDraft("");
    setConversationId("");
    setApiError("");
    setHistory(entries => [
      {
        status: "SUCCESS",
        question,
        sql: next.sql,
        duration: next.duration,
        rows: next.rows.length,
        time: new Date().toLocaleString(),
      },
      ...entries,
    ]);
  };
  const handleLiveResponse = (
    response: LiveQueryResponse,
    question: string
  ) => {
    if (response.status === "clarification_needed") {
      setConversationId(response.conversationId ?? "");
      setServerClarification({
        question: response.question ?? "Which detail should Querify use?",
        options: response.options ?? [],
      });
      setClarificationDraft("");
      setClarificationMode(
        (response.question ?? "").toLowerCase().includes("window")
          ? "period"
          : "metric"
      );
      setClarifying(true);
      setResult(null);
      setApiError("");
      return;
    }
    showLiveResult(response, question);
  };
  const submitQuery = async (queryText = query) => {
    const submittedQuery = queryText.trim();
    const text = submittedQuery.toLowerCase();
    if (!text) {
      notify("Type an analytical question first.");
      return;
    }
    setApiError("");
    setShowRecoveryPrompts(false);
    setServerClarification(null);
    setClarificationDraft("");
    setClarifying(false);
    setConversationId("");
    if (/;|--|\b(drop|delete|update|insert|alter|truncate)\b/i.test(submittedQuery)) {
      const message =
        "Query blocked (HTTP 422): only one read-only SELECT statement is permitted. Remove mutations, comments, semicolons, or stacked statements.";
      setApiError(message);
      setClarifying(false);
      setConversationId("");
      setHistory(entries => [
        {
          status: "SECURITY_BLOCKED",
          question: submittedQuery,
          sql: submittedQuery,
          duration: 0,
          rows: 0,
          time: new Date().toLocaleString(),
          error: message,
        },
        ...entries,
      ]);
      return;
    }
    const scopeIssue = detectUnsupportedDemoScope(submittedQuery);
    if (scopeIssue) {
      setApiError(scopeIssue.message);
      setShowRecoveryPrompts(true);
      setClarifying(false);
      setConversationId("");
      setResult(null);
      return;
    }
    if (queryApiUrl()) {
      setIsExecuting(true);
      try {
        handleLiveResponse(
          await executeLiveQuery({
            query: submittedQuery,
            conversationId: conversationId || undefined,
            execute: true,
          }),
          submittedQuery
        );
      } catch (error) {
        const apiError = error as Error & { status?: number; code?: string };
        if (apiError.code === "UNSUPPORTED_DEMO_SCOPE") {
          setApiError(apiError.message);
          setShowRecoveryPrompts(true);
          setClarifying(false);
          setConversationId("");
          setResult(null);
        } else if (apiError.status === 422) {
          const message = `Query blocked (HTTP 422): ${(error as Error).message}`;
          setApiError(message);
          setHistory(entries => [
            {
              status: "SECURITY_BLOCKED",
              question: submittedQuery,
              sql: submittedQuery,
              duration: 0,
              rows: 0,
              time: new Date().toLocaleString(),
              error: message,
            },
            ...entries,
          ]);
        } else {
          setResult(null);
          setClarifying(false);
          setApiError(
            apiError.code === "AI_NOT_CONFIGURED"
              ? apiError.message
              : `Live AI query failed: ${apiError.message}. No fixture fallback was used.`
          );
        }
      } finally {
        setIsExecuting(false);
      }
      return;
    }
    const localDomains = getSupportedDemoDomains(submittedQuery);
    if (localDomains.length > 1) {
      setResult(null);
      setClarifying(false);
      setApiError(
        "This local preview can run only its company fixture. Choose one sample domain at a time and use the deployed AI API for restaurants, hotels, homes, cars, or phones. No rows were returned."
      );
      return;
    }
    const localDomain = localDomains[0] ?? null;
    if (localDomain && localDomain !== "companies") {
      setResult(null);
      setClarifying(false);
      setApiError(
        `The ${localDomain} sample table is available through the deployed server-side AI API. This local preview does not substitute company rows for it; configure the Vercel model settings to run the query.`
      );
      return;
    }
    if (text.includes("revenue report")) {
      setClarificationMode("period");
      setClarifying(true);
      return;
    }
    if (
      text.includes("best performing") ||
      text.includes("most money") ||
      text.includes("top performing")
    ) {
      setClarificationMode("metric");
      setClarifying(true);
      return;
    }
    showResult(inferDemoMetric(text), submittedQuery);
  };
  const submitClarification = async (
    answer: string,
    fallbackMetric: string,
    fallbackQuestion: string,
    fallbackPeriod?: DemoPeriod
  ) => {
    setSelectedMetric(fallbackMetric);
    setLastClarificationAnswer(answer);
    setApiError("");
    if (queryApiUrl() && conversationId) {
      setIsExecuting(true);
      try {
        handleLiveResponse(
          await executeLiveQuery({
            query,
            clarificationAnswer: answer,
            conversationId,
            execute: true,
          }),
          fallbackQuestion
        );
      } catch (error) {
        setApiError(
          `Clarification request failed: ${(error as Error).message}`
        );
      } finally {
        setIsExecuting(false);
      }
      return;
    }
    showResult(fallbackMetric, fallbackQuestion, fallbackPeriod);
  };
  const chooseMetric = (metric: string) => {
    void submitClarification(metric, metric, `${query} · ${metric}`);
  };
  const choosePeriod = (period: string) => {
    if (period !== "fiscal_year_2024" && period !== "all_time") {
      setClarifying(false);
      setApiError(
        "Demo Mode supports annual FY 2024 fixtures and all available demo rows only. Monthly reporting requires a live data source."
      );
      return;
    }
    const demoPeriod: DemoPeriod =
      period === "all_time" ? "all_time" : "fiscal_year_2024";
    void submitClarification(
      period,
      "revenue",
      `${query} · ${period.replace("_", " ")}`,
      demoPeriod
    );
  };
  const copySql = async (sql = result?.sql) => {
    if (!sql) return;
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard access unavailable");
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      notify("SQL copied to clipboard");
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setApiError(
        "Automatic copy is unavailable here. Select the SQL text and copy it manually."
      );
    }
  };
  const exportCsv = (rows: ResultRow[], columns: string[]) => {
    if (!rows.length || !columns.length) {
      notify("There are no matching rows to export.");
      return;
    }
    const cell = (value: string | number | undefined) =>
      `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [
      columns.map(column => cell(column)).join(","),
      ...rows.map(row => columns.map(column => cell(row[column])).join(",")),
    ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" })
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `querify-results-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify(`Exported ${rows.length} rows to CSV`);
  };
  const runCurrentQuery = async () => {
    if (!result) return;
    setApiError("");
    if (!queryApiUrl()) {
      showResult(
        selectedMetric,
        query || result.logic,
        result.logic.includes("all available") ? "all_time" : "fiscal_year_2024"
      );
      notify("Demo result refreshed using the selected metric.");
      return;
    }
    setIsExecuting(true);
    const requestQuery = query.trim() || result.logic;
    try {
      handleLiveResponse(
        await executeLiveQuery({
          query: requestQuery,
          clarificationAnswer: lastClarificationAnswer || undefined,
          execute: true,
        }),
        requestQuery
      );
    } catch (error) {
      setApiError(`Query rerun failed: ${(error as Error).message}`);
    } finally {
      setIsExecuting(false);
    }
  };
  const runVoiceDemo = () => {
    setIsListening(true);
    notify("Voice input listening…");
    window.setTimeout(() => {
      setQuery("Show active user revenue last month");
      setIsListening(false);
    }, 1400);
  };
  const filteredAudit = history.filter(entry =>
    `${entry.question} ${entry.sql} ${entry.status}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  const filteredSchema = schemaTables.filter(table =>
    `${table.name} ${table.description} ${table.columns.join(" ")}`
      .toLowerCase()
      .includes(schemaSearch.toLowerCase())
  );

  const Header = () => (
    <header className="site-header">
      <button className="brand-lockup" onClick={() => go("overview")}>
        <span className="brand-mark calligraphy-q">Q</span>
        <span>
          <b>Querify</b>
          <small>SQL AI</small>
        </span>
      </button>
      <nav className={`main-nav ${mobileNav ? "open" : ""}`}>
        {(
          ["overview", "console", "explorer", "audit", "architecture"] as View[]
        ).map(item => (
          <button
            key={item}
            className={view === item ? "active" : ""}
            onClick={() => go(item)}
          >
            {item === "overview" ? (
              <LayoutDashboard size={14} />
            ) : item === "console" ? (
              <Zap size={14} />
            ) : item === "explorer" ? (
              <Database size={14} />
            ) : item === "audit" ? (
              <History size={14} />
            ) : (
              <BookOpen size={14} />
            )}
            {navLabel(item)}
          </button>
        ))}
      </nav>
      <div className="header-actions">
        <select className="db-selector" aria-label="Database connection">
          <option>PostgreSQL 15 · Enterprise</option>
          <option>MySQL 8 · Analytics</option>
          <option>SQLite · Local demo</option>
        </select>
        <button
          className="auth-button"
          onClick={() =>
            notify("Security & Auth controls are active in demo mode")
          }
        >
          <LockKeyhole size={13} /> Security & Auth
        </button>
        <span className="demo-badge">
          <span /> Demo Mode
        </span>
        <a
          href="https://github.com/UICipher/Querify"
          target="_blank"
          rel="noreferrer"
        >
          <Github size={14} /> GitHub
        </a>
        <button
          className="menu-button"
          onClick={() => setMobileNav(!mobileNav)}
        >
          {mobileNav ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
    </header>
  );
  const Footer = () => (
    <footer className="site-footer">
      <div className="footer-intro">
        <div className="brand-lockup">
          <span className="brand-mark calligraphy-q">Q</span>
          <span>
            <b>Querify</b>
            <small>SQL AI</small>
          </span>
        </div>
        <p>
          Ask in English. Get the right SQL.
          <br />
          An intelligent natural-language-to-SQL platform engineered with Spring
          Boot 3, AST verification, and proactive multi-turn clarification.
        </p>
        <div className="footer-proof">
          <ShieldCheck size={14} /> AST Read-Only Enforced <span>•</span> MySQL
          8 Relational
        </div>
      </div>
      <div>
        <h4>Platform Navigation</h4>
        {(
          ["overview", "console", "explorer", "audit", "architecture"] as View[]
        ).map(item => (
          <button className="footer-link" key={item} onClick={() => go(item)}>
            {navLabel(item)}
          </button>
        ))}
      </div>
      <div>
        <h4>Engineering Team</h4>
        {team.map(member => (
          <div className="team-member" key={member.name}>
            <strong>
              <span
                className={`person-badge ${member.gender}`}
                title={member.attribution ?? `${member.gender} team member`}
              >
                {member.gender === "female" ? "♀" : "♂"}
              </span>
              {member.name}
            </strong>
            {member.attribution && (
              <span className="team-attribution">{member.attribution}</span>
            )}
            <a href={`mailto:${member.email}`}>{member.email}</a>
            <span className="profile-links">
              <a href={member.github} target="_blank" rel="noreferrer">
                <Github size={11} /> GitHub
              </a>
              <a href={member.linkedin} target="_blank" rel="noreferrer">
                <Linkedin size={11} /> LinkedIn
              </a>
            </span>
          </div>
        ))}
        <div className="team-member footer-contact">
          <strong>Project contact</strong>
          <a href="mailto:umerimran1882@gmail.com">umerimran1882@gmail.com</a>
        </div>
      </div>
      <div className="footer-bottom">
        © 2026 Querify. Designed & engineered by Nazish Saghir, Zuryat Fatima,
        and Umar Imran.{" "}
        <span>
          <Activity size={13} /> All Systems Operational
        </span>
      </div>
    </footer>
  );

  const Overview = () => (
    <section className="page overview-page">
      <div className="hero">
        <div className="hero-kicker">
          <span className="live-dot" /> Querify Clarification Engine v1.3{" "}
          <b>AST Guarded</b>
        </div>
        <h1>
          Ask in English.
          <br />
          <em>Get the right SQL.</em>
        </h1>
        <p>
          Turn an imprecise question into a decision-ready answer. Querify
          pauses at the business rule, keeps the conversation intact, and
          returns SQL your team can inspect before it runs.
        </p>
        <div className="hero-actions">
          <button
            className="primary-button interactive-btn transition-all duration-200 ease-out hover:scale-[1.01] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/10 active:scale-[0.98] cursor-pointer"
            onClick={() => go("console")}
          >
            → &nbsp; Try the demo <ArrowRight size={15} />
          </button>
          <a
            className="secondary-button interactive-btn transition-all duration-200 ease-out hover:scale-[1.01] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/10 active:scale-[0.98] cursor-pointer"
            href="https://github.com/UICipher/Querify"
            target="_blank"
            rel="noreferrer"
          >
            <Github size={15} /> View on GitHub
          </a>
        </div>
        <div
          className="pipeline-card"
          aria-label="Querify four-step workflow demo"
        >
          <div className="pipeline-top">
            <span>querify-pipeline // clarification-loop.preview</span>
            <div
              className="pipeline-stepper"
              role="group"
              aria-label="Choose workflow stage"
            >
              {pipelineStages.map((stage, index) => (
                <button
                  className={`pipeline-step-button ${activePipelineStep === index ? "active" : ""}`}
                  key={stage.label}
                  type="button"
                  aria-label={`Show ${stage.label}: ${stage.title}`}
                  aria-pressed={activePipelineStep === index}
                  onClick={() => setActivePipelineStep(index)}
                >
                  {stage.label}
                </button>
              ))}
            </div>
          </div>
          <div
            className="pipeline-body pipeline-stage"
            data-stage={activePipelineStep + 1}
          >
            <div className="pipeline-number">
              {activePipelineStep + 1}.{" "}
              {pipelineStages[activePipelineStep].title}
              <span>{pipelineStages[activePipelineStep].badge}</span>
            </div>
            <div className="pipeline-prompt">
              {pipelineStages[activePipelineStep].prompt}
              <small>{pipelineStages[activePipelineStep].detail}</small>
            </div>
          </div>
          <div className="pipeline-foot">
            <span>
              {reducedMotion
                ? "Reduced motion · select a stage manually"
                : pipelinePaused
                  ? "Auto-advance paused"
                  : "Automatically advancing every 4 seconds"}
            </span>
            <div className="pipeline-controls">
              <button
                type="button"
                aria-pressed={pipelinePaused}
                onClick={() => setPipelinePaused(paused => !paused)}
              >
                {pipelinePaused ? "Resume" : "Pause"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuery("Show me the best performing AI companies");
                  setLastClarificationAnswer("");
                  go("console");
                }}
              >
                Run this question →
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="section-heading">
        <span>EXECUTION FLOW</span>
        <h2>How Querify Works</h2>
        <p>
          Three deterministic steps from human inquiry to relational precision.
        </p>
      </div>
      <div className="flow-grid">
        {[
          {
            n: "01",
            title: "Ask in English",
            copy: "Type your analytical inquiry naturally. Querify parses semantic intent and grounds tokens against the database schema catalog.",
          },
          {
            n: "02",
            title: "Clarify Ambiguity",
            copy: "If multiple valid interpretations exist, execution halts. Choose between targeted business metrics via card options or arrow keys.",
          },
          {
            n: "03",
            title: "Get Verified SQL",
            copy: "Receive AST-validated SELECT SQL, inspect formatted data rows with sticky headers, and visualize distributions.",
          },
        ].map(item => (
          <article className="feature-card" data-cursor-spotlight key={item.n}>
            <span>{item.n}</span>
            <h3>{item.title}</h3>
            <p>{item.copy}</p>
          </article>
        ))}
      </div>
      <div className="section-heading product-surface-heading">
        <span>PRODUCT SURFACE</span>
        <h2>A working surface for the questions behind the dashboard.</h2>
        <p>
          One deliberate path from intent to evidence — with the decision rule
          visible at every step.
        </p>
      </div>
      <div className="flow-grid four product-surface">
        {[
          {
            title: "Clarification ledger",
            copy: "Keeps the original question, selected answer, and resolved intent together across turns.",
          },
          {
            title: "Read-only runtime",
            copy: "Single-statement SELECT enforcement, bounded rows, and database timeouts protect the execution boundary.",
          },
          {
            title: "Analytics brief",
            copy: "Rows, columns, businessInsight, and chartHint arrive together so the result is immediately useful.",
          },
          {
            title: "Team-ready workspace",
            copy: "Schema cards, audit records, CSV export, and architecture notes make handoff straightforward.",
          },
        ].map(item => (
          <article className="feature-card product-card" data-cursor-spotlight key={item.title}>
            <span>QUERIFY MODULE</span>
            <h3>{item.title}</h3>
            <p>{item.copy}</p>
            <button className="text-button" onClick={() => go("console")}>
              Open workflow <ArrowRight size={12} />
            </button>
          </article>
        ))}
      </div>
    </section>
  );

  const Console = () => (
    <section className="page console-page">
      <div className="page-heading">
        <div>
          <span>› NATURAL LANGUAGE CONSOLE</span>
          <h2>Translate intent into a verified query.</h2>
          <p>
            A server-side AI model maps your question to guarded SQL and runs it
            only against the synthetic sample tables.
          </p>
        </div>
        <div className="guard-pill">
          <ShieldCheck size={14} /> Read-only SQL Guard
        </div>
      </div>
      <div className="console-card" data-cursor-spotlight>
        <div className="input-row">
          <input
            value={query}
            onChange={e => {
              const next = e.target.value;
              if (next.trim() !== query.trim()) {
                setClarifying(false);
                setConversationId("");
                setServerClarification(null);
                setClarificationDraft("");
                setLastClarificationAnswer("");
                setResult(null);
                setApiError("");
              }
              setQuery(next);
            }}
            onKeyDown={e => e.key === "Enter" && submitQuery()}
            className="focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all duration-200"
            placeholder="e.g. Show restaurants in Seattle rated above 4.5"
          />
          <button
            disabled={isExecuting}
            className="query-button interactive-btn transition-all duration-200 ease-out hover:scale-[1.01] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/10 active:scale-[0.98] cursor-pointer"
            onClick={() => void submitQuery()}
          >
            {isExecuting ? "Running…" : "Query ↵"}
          </button>
          <button
            className={`voice-button ${isListening ? "listening" : ""}`}
            onClick={runVoiceDemo}
            title="Voice input"
          >
            <Activity size={16} />
          </button>
        </div>
        {apiError && (
          <div
            className={`query-error-banner ${apiError.includes("HTTP 422") ? "security" : ""}`}
            role="alert"
          >
            <ShieldCheck size={16} />
            <span>{apiError}</span>
            <button
              className="icon-button"
              onClick={() => setApiError("")}
              aria-label="Dismiss error"
            >
              <X size={14} />
            </button>
          </div>
        )}
        {showRecoveryPrompts && (
          <div
            className="recovery-prompts"
            role="group"
            aria-label="Supported sample questions"
          >
            <span>Try a supported sample question instead:</span>
            <div className="chip-row">
              {[
                "Rank companies by revenue growth",
                "Show restaurants in Seattle rated above 4.5",
                "Compare average hotel nightly rates by city",
                "Find three-bedroom homes under $600,000",
                "Rank cars by estimated range in miles",
                "Show phones with the highest camera resolution",
              ].map(sample => (
                <button
                  className="prompt-chip clarification-pill"
                  data-cursor-spotlight
                  key={sample}
                  onClick={() => {
                    setQuery(sample);
                    setResult(null);
                    setLastClarificationAnswer("");
                    setApiError("");
                    setShowRecoveryPrompts(false);
                    void submitQuery(sample);
                  }}
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="prompt-groups">
          <div>
            <span className="group-label">
              ⓘ Ambiguous Questions (Triggers Clarification):
            </span>
            <div className="chip-row">
              {[
                "Show me the best performing AI companies",
                "Which AI company made the most money?",
                "Show me the revenue report",
              ].map(sample => (
                <button
                  className="prompt-chip ambiguous clarification-pill interactive-btn transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-cyan-500/60 active:scale-95 cursor-pointer"
                  key={sample}
                  onClick={() => {
                    setQuery(sample);
                    setResult(null);
                    setLastClarificationAnswer("");
                    setApiError("");
                    void submitQuery(sample);
                  }}
                >
                  {sample} <small>AMBIGUOUS</small>
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="group-label">✣ Direct Analytical Questions:</span>
            <div className="chip-row">
              {[
                "Show the five most profitable companies",
                "Compare revenue across companies in 2024",
              ].map(sample => (
                <button
                  className="prompt-chip clarification-pill interactive-btn transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-cyan-500/60 active:scale-95 cursor-pointer"
                  key={sample}
                  onClick={() => {
                    setQuery(sample);
                    void submitQuery(sample);
                  }}
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="group-label">✦ One-tap AI sample domains:</span>
            <div
              className="chip-row domain-prompt-row"
              aria-label="Sample questions for each supported domain"
            >
              {[
                { domain: "Restaurants", sample: "Show restaurants in Seattle rated above 4.5" },
                { domain: "Hotels", sample: "Compare average hotel nightly rates by city" },
                { domain: "Homes", sample: "Find three-bedroom homes under $600,000" },
                { domain: "Cars", sample: "Rank cars by estimated range in miles" },
                { domain: "Phones", sample: "Show phones with the highest camera resolution" },
                { domain: "Companies", sample: "Rank companies by revenue growth" },
              ].map(({ domain, sample }) => (
                <button
                  className="prompt-chip domain-prompt clarification-pill"
                  data-cursor-spotlight
                  key={domain}
                  onClick={() => {
                    setQuery(sample);
                    setResult(null);
                    setLastClarificationAnswer("");
                    setApiError("");
                    void submitQuery(sample);
                  }}
                >
                  <span className="domain-prompt-label">{domain}</span>
                  <span>{sample}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <aside className="studio-sidebar">
        <div className="studio-card" data-cursor-spotlight>
          <h3>
            <Sparkles size={15} /> Model Fine-Tuning Studio
          </h3>
          <p>
            Shape the query experience around your schema conventions without
            adding noise to the workspace.
          </p>
          <label>
            Base model architecture
            <select>
              <option>SQLCoder-7B · Optimized</option>
              <option>CodeLlama · Enterprise</option>
            </select>
          </label>
          <label>
            Schema adaptation depth
            <input type="range" min="1" max="10" defaultValue="5" />
          </label>
          <button
            className="studio-action"
            onClick={() => notify("Fine-tuning job staged for review")}
          >
            Launch schema job <ArrowRight size={13} />
          </button>
        </div>
        <div className="studio-card guardrail-card" data-cursor-spotlight>
          <h3>
            <ShieldCheck size={15} /> SqlSecurityGuard
          </h3>
          <div className="guardrail-row">
            <span>Connection mode</span>
            <b>READ ONLY</b>
          </div>
          <div className="guardrail-row">
            <span>Statement policy</span>
            <b>SELECT ONLY</b>
          </div>
          <p>
            DDL, mutation queries, comments, semicolons, and unconstrained
            execution are blocked before the database boundary.
          </p>
        </div>
        <div className="studio-card source-card" data-cursor-spotlight>
          <h3>
            <Database size={15} /> Workspace source
          </h3>
          <p>6 seeded sample tables · read-only SQLite execution</p>
          <button className="text-button" onClick={() => go("explorer")}>
            Inspect schema <ArrowRight size={12} />
          </button>
        </div>
      </aside>
      {clarifying && (
        <div className="clarification-card" data-status={clarificationStatus}>
          <div className="modal-header">
            <div>
              <span className="eyebrow amber">
                AMBIGUITY DETECTED · DISAMBIGUATION REQUIRED
              </span>
              <h3>
                {serverClarification?.question ??
                  (clarificationMode === "period"
                    ? "Which reporting window should we use?"
                    : "What metric would you like to use to evaluate company performance?")}
              </h3>
            </div>
            <button
              className="icon-button"
              onClick={() => {
                setClarifying(false);
                setServerClarification(null);
                setConversationId("");
              }}
              aria-label="Close clarification"
            >
              <X size={16} />
            </button>
          </div>
          <div className="clarification-copy">
            {serverClarification ? (
              <>Choose an option or enter a short answer so the model can refine the safe sample query.</>
            ) : clarificationMode === "period" ? (
              <>“Revenue report” needs a time window before Querify can produce a defensible comparison.</>
            ) : (
              <>The term <b>“best performing”</b> can refer to top-line gross revenue, net profitability, year-over-year revenue growth, or AI investment return.</>
            )}
          </div>
          {serverClarification ? (
            <div className="metric-options">
              {serverClarification.options.map((option, index) => (
                <button
                  className="metric-option clarification-pill transition-transform duration-200 active:scale-95 cursor-pointer"
                  key={option.id}
                  onClick={() =>
                    void submitClarification(
                      option.value,
                      option.value,
                      `${query} · ${option.label}`
                    )
                  }
                >
                  <span className="metric-index">{index + 1}</span>
                  <span><strong>{option.label}</strong></span>
                  <ArrowRight size={15} />
                </button>
              ))}
              {!serverClarification.options.length && (
                <label className="server-clarification-input">
                  Your answer
                  <input
                    value={clarificationDraft}
                    onChange={event => setClarificationDraft(event.target.value)}
                    aria-label="Your clarification answer"
                  />
                </label>
              )}
            </div>
          ) : clarificationMode === "metric" ? (
            <div className="metric-options">
              {ambiguousOptions.map((option, index) => (
                <button
                  className={`metric-option clarification-pill transition-transform duration-200 active:scale-95 cursor-pointer ${selectedMetric === option.value ? "selected" : ""}`}
                  key={option.value}
                  onClick={() => chooseMetric(option.value)}
                >
                  <span className="metric-index">{index + 1}</span>
                  <span><strong>{option.label}</strong><small>{option.detail}</small></span>
                  <Check size={15} />
                </button>
              ))}
            </div>
          ) : (
            <div className="metric-options period-options">
              {(queryApiUrl()
                ? periodOptions
                : periodOptions.filter(option => option.value === "all_time")
              ).map((option, index) => (
                <button
                  className="metric-option clarification-pill"
                  key={option.value}
                  onClick={() => choosePeriod(option.value)}
                >
                  <span className="metric-index">{index + 1}</span>
                  <span><strong>{option.label}</strong><small>{option.detail}</small></span>
                  <ArrowRight size={15} />
                </button>
              ))}
            </div>
          )}
          <div className="modal-footer">
            <span>
              {serverClarification ? "Choose an option or enter a short answer" : <>Use ↑ ↓ to select <b>·</b> Enter to confirm</>}
            </span>
            <div>
              <button
                className="text-button"
                onClick={() => {
                  setClarifying(false);
                  setServerClarification(null);
                  setConversationId("");
                }}
              >
                Dismiss
              </button>
              <button
                className="primary-button small interactive-btn transition-all duration-200 ease-out hover:scale-[1.01] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/10 active:scale-[0.98] cursor-pointer"
                onClick={() => {
                  if (serverClarification) {
                    const firstOption = serverClarification.options[0];
                    const answer = firstOption?.value || clarificationDraft.trim();
                    if (answer)
                      void submitClarification(answer, answer, `${query} · ${answer}`);
                    else notify("Select an option or enter a short answer first.");
                  } else if (clarificationMode === "period") {
                    choosePeriod("all_time");
                  } else {
                    showResult(selectedMetric);
                  }
                }}
              >
                {serverClarification ? "Continue with this answer" : "Generate Verified SQL"} <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
      {result ? (
        ResultPanel()
      ) : (
        <div className="ready-card" data-cursor-spotlight>
          <div className="ready-icon">
            <Database size={22} />
          </div>
          <h3>Ready to Translate Analytical Inquiries</h3>
          <p>
            Click one of the sample prompt chips above or type a natural
            language inquiry. If your question contains ambiguity, Querify will
            ask for clarification before querying the database.
          </p>
        </div>
      )}
    </section>
  );

  const ResultPanel = () => {
    if (!result) return null;
    const current = result;
    return (
      <div className="result-panel" data-cursor-spotlight>
        <div className="result-top">
          <span>› SYNTHESIZED SQL</span>
          <div>
            <span className="verified-badge">
              <ShieldCheck size={13} /> Read-only verified
            </span>
            <button onClick={() => copySql()}>
              <Copy size={13} /> {copied ? "Copied" : "Copy"}
            </button>
            <button
              className="primary-button tiny interactive-btn transition-all duration-200 ease-out hover:scale-[1.01] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/10 active:scale-[0.98] cursor-pointer"
              disabled={isExecuting}
              onClick={runCurrentQuery}
            >
              Run Query <Play size={12} fill="currentColor" />
            </button>
          </div>
        </div>
        <pre className="sql-view">
          <code>{current.sql}</code>
        </pre>
        <div className="logic-line">
          <b>Logic:</b> {current.logic}
        </div>
        {current.dataNotice && (
          <div className="data-provenance" role="note">
            <ShieldCheck size={14} /> {current.dataNotice}
          </div>
        )}
        {current.rows.length === 0 && (
          <div className="empty-result-recovery" role="status">
            <div>
              <b>No sample rows matched those filters.</b>
              <span>Broaden the question to see the available records for this dataset.</span>
            </div>
            <button
              className="prompt-chip clarification-pill"
              data-cursor-spotlight
              onClick={() => {
                const domain = getSupportedDemoDomains(query)[0] ?? "companies";
                const sample = `Show ${domain} sample records`;
                setQuery(sample);
                setLastClarificationAnswer("");
                void submitQuery(sample);
              }}
            >
              Show available sample rows <ArrowRight size={13} />
            </button>
          </div>
        )}
        <div className="result-tabs">
          <button
            className={resultTab === "sql" ? "active" : ""}
            onClick={() => setResultTab("sql")}
          >
            Generated SQL
          </button>
          <button
            className={resultTab === "table" ? "active" : ""}
            onClick={() => setResultTab("table")}
          >
            Table View
          </button>
          <button
            className={resultTab === "chart" ? "active" : ""}
            onClick={() => setResultTab("chart")}
          >
            Chart Projection
          </button>
          <span>Query returned {current.rows.length} sample rows</span>
        </div>
        {resultTab === "sql" && (
          <div className="sql-note">
            <Clipboard size={16} /> Allowlist validation passed. One parameterized,
            read-only SELECT reached the SQLite sample executor.
          </div>
        )}
        {resultTab === "table" && (
          <DataTable
            rows={current.rows}
            columns={current.columns}
            duration={current.duration}
          />
        )}
        {resultTab === "chart" && (
          <div className="chart-card">
            <h3>{current.chartHint.title}</h3>
            {!current.chartField || current.chart === "table" ? (
              <p className="chart-empty-state">
                This result has no numeric measure to chart. Open Table View to
                inspect its rows.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                {current.chart === "line" ? (
                  <AreaChart data={current.rows}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#294464" />
                    <XAxis
                      dataKey={
                        current.columns.find(
                          column => column !== current.chartField
                        ) ?? current.chartField
                      }
                      stroke="#91a9c9"
                    />
                    <YAxis stroke="#91a9c9" />
                    <Tooltip
                      contentStyle={{
                        background: "#0c1a31",
                        border: "1px solid #355582",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey={current.chartField}
                      stroke="#4c8dff"
                      fill="#4c8dff"
                      fillOpacity={0.22}
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={current.rows}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#294464" />
                    <XAxis
                      dataKey={
                        current.columns.find(
                          column => column !== current.chartField
                        ) ?? current.chartField
                      }
                      hide
                    />
                    <YAxis stroke="#91a9c9" />
                    <Tooltip
                      contentStyle={{
                        background: "#0c1a31",
                        border: "1px solid #355582",
                      }}
                    />
                    <Bar
                      dataKey={current.chartField}
                      fill="#4c8dff"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        )}
        {resultTab === "sql" && (
          <div className="result-summary">
            <Sparkles size={15} />
            <span>
              <b>Business insight</b> {current.businessInsight}
            </span>
          </div>
        )}
      </div>
    );
  };

  const DataTable = ({
    rows,
    columns,
    duration,
  }: {
    rows: ResultRow[];
    columns: string[];
    duration: number;
  }) => {
    const needle = resultSearch.trim().toLowerCase();
    const filteredRows = rows.filter(
      row =>
        !needle ||
        columns.some(column =>
          String(row[column] ?? "")
            .toLowerCase()
            .includes(needle)
        )
    );
    return (
      <div className="table-card">
        <div className="table-toolbar">
          <span>
            Query Execution Results{" "}
            <b>
              {filteredRows.length} of {rows.length} rows
            </b>
            <b>{duration} ms</b>
          </span>
          <input
            aria-label="Search query result rows"
            value={resultSearch}
            onChange={event => setResultSearch(event.target.value)}
            placeholder="Search results..."
          />
          <button
            onClick={() => exportCsv(filteredRows, columns)}
            disabled={!filteredRows.length}
          >
            <Download size={13} /> Export CSV
          </button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {columns.map(column => (
                  <th key={column}>{column.replaceAll("_", " ")} •</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.length ? (
                filteredRows.map((row, index) => (
                  <tr key={`${String(row[columns[0]] ?? "row")}-${index}`}>
                    {columns.map(column => (
                      <td key={column}>
                        {formatResultValue(column, row[column] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={Math.max(columns.length, 1)}>
                    No result rows match this search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const Explorer = () => {
    const activeTable =
      schemaTables.find(table => table.name === selectedSampleTable) ??
      schemaTables[0];
    const sampleColumns = activeTable.columns.map(([name]) => name);
    const sampleRows = sampleRowsByTable[activeTable.name] ?? [];
    const sampleNeedle = schemaSearch.trim().toLowerCase();
    const filteredSamples = sampleRows.filter(
      row =>
        !sampleNeedle ||
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(sampleNeedle)
        )
    );
    return (
      <section className="page explorer-page">
        <div className="page-heading">
          <div>
            <span>▣ DOMAIN DATABASE CATALOG</span>
            <h2>Inspect the schema behind the answers.</h2>
            <p>
              Inspect six seeded sample tables and their synthetic preview values.
            </p>
          </div>
          <div className="view-switch" role="group" aria-label="Explorer view">
            <button
              className={explorerMode === "schema" ? "active" : ""}
              onClick={() => setExplorerMode("schema")}
            >
              Schema Cards
            </button>
            <button
              className={explorerMode === "samples" ? "active" : ""}
              onClick={() => setExplorerMode("samples")}
            >
              Sample Rows
            </button>
            <button
              aria-label="Refresh demo schema"
              onClick={() =>
                notify(
                  "The sample schema is fixed for this demo and uses illustrative records."
                )
              }
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
        <div className="search-bar">
          <Search size={16} />
          <input
            value={schemaSearch}
            onChange={e => setSchemaSearch(e.target.value)}
            className="focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all duration-200"
            placeholder={
              explorerMode === "schema"
                ? "Search tables or columns..."
                : "Search sample values..."
            }
            aria-label={
              explorerMode === "schema" ? "Search schema" : "Search sample rows"
            }
          />
        </div>
        {explorerMode === "schema" ? (
          <div className="schema-grid">
            {filteredSchema.map(table => (
              <article className="schema-card" data-cursor-spotlight key={table.name}>
                <div className="schema-title">
                  <span>
                    <Table2 size={14} /> {table.name}
                  </span>
                  <b>{table.rows} rows</b>
                </div>
                <p>{table.description}</p>
                <div className="columns-list">
                  {table.columns.map(([name, type]) => (
                    <div key={name}>
                      <span>
                        <KeyIcon />
                      </span>
                      <strong>{name}</strong>
                      <small>{type}</small>
                    </div>
                  ))}
                </div>
                <button
                  className="inspect-button"
                  onClick={() => {
                    setSelectedSampleTable(table.name);
                    setExplorerMode("samples");
                    setSchemaSearch("");
                  }}
                >
                  <Search size={13} /> Inspect Sample Rows
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="sample-rows-panel">
            <div className="sample-rows-heading">
              <div>
                <span>ILLUSTRATIVE SAMPLE PREVIEW</span>
                <h3>{activeTable.name}</h3>
                <p>
                  Representative synthetic values. Query results run against the server-side SQLite sample table.
                </p>
              </div>
              <label>
                Table
                <select
                  value={activeTable.name}
                  onChange={event => setSelectedSampleTable(event.target.value)}
                >
                  {schemaTables.map(table => (
                    <option key={table.name} value={table.name}>
                      {table.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="table-card">
              <div className="table-toolbar">
                <span>
                  Preview rows{" "}
                  <b>
                    {filteredSamples.length} of {sampleRows.length} preview rows
                  </b>
                </span>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      {sampleColumns.map(column => (
                        <th key={column}>{column.replaceAll("_", " ")}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSamples.length ? (
                      filteredSamples.map((row, index) => (
                        <tr
                          key={`${String(row[sampleColumns[0]] ?? "sample")}-${index}`}
                        >
                          {sampleColumns.map(column => (
                            <td key={column}>
                              {formatResultValue(column, row[column] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={Math.max(sampleColumns.length, 1)}>
                          No sample values match this search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  };

  const KeyIcon = () => <span className="key-icon">⌘</span>;

  const Audit = () => (
    <section className="page audit-page">
      <div className="page-heading">
        <div>
          <span>◔ QUERY HISTORY</span>
          <h2>Query Audit Trail</h2>
          <p>
            History of natural language questions, synthesized SQL, execution
            times, and security events.
          </p>
        </div>
        <button
          className="danger-button"
          onClick={() => {
            setHistory([]);
            setSearch("");
          }}
        >
          <Trash2 size={14} /> Clear History
        </button>
      </div>
      <div className="search-bar">
        <Search size={16} />
        <input
          value={search}
          onChange={event => setSearch(event.target.value)}
          className="focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all duration-200"
          placeholder="Search by question, SQL keywords, or execution status..."
        />
      </div>
      <div className="audit-list">
        {filteredAudit.length > 0 ? (
          filteredAudit.map((entry, index) => (
            <article className="audit-entry" data-cursor-spotlight key={`${entry.time}-${index}`}>
              <div className="audit-meta">
                <span
                  className={`status-badge ${entry.status === "SUCCESS" ? "success" : "blocked"}`}
                >
                  {entry.status}
                </span>
                <span>{entry.duration} ms</span>
                <span>{entry.rows} rows</span>
                <time>{entry.time}</time>
              </div>
              <h3>“{entry.question}”</h3>
              <pre>{entry.sql}</pre>
              {entry.error && <p className="audit-error">{entry.error}</p>}
              <div className="audit-actions">
                <button onClick={() => copySql(entry.sql)}>
                  <Copy size={13} /> Copy SQL
                </button>
                <button
                  onClick={() => {
                    setQuery(entry.question);
                    go("console");
                  }}
                >
                  <Play size={13} fill="currentColor" /> Re-run
                </button>
                <button
                  className="delete-icon"
                  aria-label={`Delete history item: ${entry.question}`}
                  onClick={() =>
                    setHistory(entries =>
                      entries.filter(historyEntry => historyEntry !== entry)
                    )
                  }
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="ready-card audit-empty" role="status">
            <div className="ready-icon">
              <History size={22} />
            </div>
            <h3>No audit history</h3>
            <p>Queries and security events will appear here as they occur.</p>
          </div>
        )}
      </div>
    </section>
  );
  const Architecture = () => (
    <section className="page architecture-page">
      <div className="vision-card">
        <span>◫ PROJECT VISION & PHILOSOPHY</span>
        <h2>Ambiguity is the primary failure mode of text-to-SQL.</h2>
        <p>
          When a stakeholder asks a deceptively simple question like{" "}
          <i>“Who is our top client?”</i>, standard AI chatbots blindly assume a
          single metric and produce convincing but misleading numbers.
        </p>
        <p>
          <b>Querify</b> solves this by introducing a{" "}
          <b>Clarification Engine</b> paired with a{" "}
          <b>JSqlParser AST Security Guard</b>. Execution halts when ambiguity
          is flagged, engaging the user in a rapid, structured clarification
          dialogue before generating mathematically sound, read-only SQL.
        </p>
      </div>
      <div className="architecture-block">
        <span>SYSTEM ARCHITECTURE</span>
        <h2>End-to-End Enterprise Data Flow</h2>
        <div className="architecture-flow">
          {[
            {
              icon: <LayoutDashboard />,
              title: "React 18 UI",
              copy: "Vite 5, Tailwind CSS, Recharts. Dispatches REST requests & renders sticky tables.",
            },
            {
              icon: <Server />,
              title: "Spring Boot 3",
              copy: "Java 17/21 REST Gateway. Handles session UUIDs, turns, and exception mapping.",
            },
            {
              icon: <Sparkles />,
              title: "AI Engine",
              copy: "Ambiguity detector, metric projections, and option synthesizer.",
            },
            {
              icon: <ShieldCheck />,
              title: "AST Guard",
              copy: "Parses SQL tree. Strictly blocks mutation and statement chaining.",
            },
            {
              icon: <Database />,
              title: "MySQL 8 Store",
              copy: "HikariCP pool, 6 relational domain tables, and H2 test fallback.",
            },
          ].map((item, index) => (
            <article key={item.title}>
              <span>
                {index + 1}. {item.title}
              </span>
              <div>{item.icon}</div>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </div>
      <div className="section-heading left">
        <span>CORE ARCHITECTURE</span>
        <h2>Engineered for precision & security</h2>
        <p>
          Architectural guarantees designed to eliminate AI hallucination and
          database vulnerabilities.
        </p>
      </div>
      <div className="flow-grid four">
        {[
          {
            title: "Clarification Engine",
            icon: <Sparkles />,
            copy: "Multi-turn disambiguation flags semantic gaps and guarantees user intent before synthesis.",
          },
          {
            title: "AST Security Guard",
            icon: <ShieldCheck />,
            copy: "JSqlParser verifies the AST, enforcing read-only SELECT limits and blocking injection attempts.",
          },
          {
            title: "Auto-Generated Charts",
            icon: <BarChart3 />,
            copy: "Charts are deduced directly from executed SQL column types and cardinality.",
          },
          {
            title: "Zero-Setup Demo Mode",
            icon: <Zap />,
            copy: "Visitors can test clarification, SQL, and charts without external API keys.",
          },
        ].map(item => (
          <article
            className="feature-card architecture-feature"
            key={item.title}
          >
            <div>{item.icon}</div>
            <h3>{item.title}</h3>
            <p>{item.copy}</p>
          </article>
        ))}
      </div>
      <div className="comparison">
        <div>
          <span>STANDARD TEXT-TO-SQL CHATBOT</span>
          <p>✕ Blind assumptions</p>
          <p>✕ Hallucinated schemas</p>
          <p>✕ Vulnerable execution</p>
          <p>✕ Misleading visuals</p>
        </div>
        <div>
          <span>QUERIFY CLARIFICATION ENGINE</span>
          <p>✓ Proactive ambiguity detection</p>
          <p>✓ Structured disambiguation</p>
          <p>✓ AST read-only guard</p>
          <p>✓ Deterministic visualizations</p>
        </div>
      </div>
    </section>
  );

  return (
    <div className="app-shell" onPointerMove={handleCursorSpotlight}>
      <Header />
      <main>
        {view === "overview"
          ? Overview()
          : view === "console"
            ? Console()
            : view === "explorer"
              ? Explorer()
              : view === "audit"
                ? Audit()
                : Architecture()}
      </main>
      <Footer />
      {toast && (
        <div className="toast">
          <Check size={14} /> {toast}
        </div>
      )}
    </div>
  );
}
