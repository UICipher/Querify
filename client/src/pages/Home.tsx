import { useMemo, useState } from "react";
import { executeLiveQuery, queryApiUrl, type LiveQueryResponse } from "../lib/queryApi";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, ArrowRight, BarChart3, BookOpen, Check, Clipboard, Copy, Database, Download, Github, History, LayoutDashboard, Linkedin, LockKeyhole, Menu, Play, RefreshCw, Search, Server, ShieldCheck, Sparkles, Table2, Trash2, X, Zap } from "lucide-react";

type View = "overview" | "console" | "explorer" | "audit" | "architecture";
type ResultRow = Record<string, string | number>;
type AnalyticsContract = { businessInsight: string; chartHint: { chartType: "table" | "bar" | "line"; title: string } };
type Result = { sql: string; logic: string; rows: ResultRow[]; columns: string[]; chart: "bar" | "line"; title: string; duration: number } & AnalyticsContract;
type AuditEntry = { status: "SUCCESS" | "SECURITY_BLOCKED"; question: string; sql: string; duration: number; rows: number; time: string; error?: string };
type TeamMember = { name: string; gender: "female" | "male"; email: string; github: string; linkedin: string; attribution?: string };
const clarificationStatus = "clarification_needed" as const;

const team: TeamMember[] = [
  { name: "Nazish Saghir", gender: "female", attribution: "Female Architect & Original Web Vision", email: "saghirahmed0@gmail.com", github: "https://github.com/nazish-saghir-ahmed/Querify", linkedin: "https://www.linkedin.com/in/nazish-saghir-1448b2381?utm_source=share_via&utm_content=profile&utm_medium=member_android" },
  { name: "Zuryat Fatima", gender: "female", email: "zuryatfatima96@gmail.com", github: "https://github.com/zuryatfatima96", linkedin: "https://www.linkedin.com/in/zuryat-fatima-aba474334" },
  { name: "Umar Imran", gender: "male", email: "umerimran1882@gmail.com", github: "https://github.com/umarimran1882", linkedin: "https://www.linkedin.com/in/umar-imran-65538738a?utm_source=share_via&utm_content=profile&utm_medium=member_android" },
];

const companies = [
  { company_name: "NVIDIA", profit_millions: "$68,000M", revenue_millions: "$122,000M", revenue_growth_percent: "+100.3%" },
  { company_name: "Microsoft AI", profit_millions: "$14,200M", revenue_millions: "$38,500M", revenue_growth_percent: "+43.7%" },
  { company_name: "Amazon AWS AI", profit_millions: "$10,800M", revenue_millions: "$31,000M", revenue_growth_percent: "+47.6%" },
  { company_name: "Apple ML", profit_millions: "$7,200M", revenue_millions: "$19,800M", revenue_growth_percent: "+46.7%" },
  { company_name: "Meta AI", profit_millions: "$6,900M", revenue_millions: "$24,500M", revenue_growth_percent: "+51.2%" },
  { company_name: "Scale AI", profit_millions: "$1,450M", revenue_millions: "$8,900M", revenue_growth_percent: "+17.1%" },
  { company_name: "Google DeepMind", profit_millions: "$580M", revenue_millions: "$3,100M", revenue_growth_percent: "+59.0%" },
  { company_name: "Databricks", profit_millions: "$320M", revenue_millions: "$2,400M", revenue_growth_percent: "+60.0%" },
  { company_name: "Perplexity AI", profit_millions: "$8M", revenue_millions: "$50M", revenue_growth_percent: "+400.0%" },
  { company_name: "Hugging Face", profit_millions: "$4.5M", revenue_millions: "$35M", revenue_growth_percent: "+75.0%" },
];

const revenueTrend = [
  { month: "Jan", revenue: 72 }, { month: "Feb", revenue: 86 }, { month: "Mar", revenue: 79 }, { month: "Apr", revenue: 104 }, { month: "May", revenue: 122 }, { month: "Jun", revenue: 138 },
];

const schemaTables = [
  { name: "companies", rows: 15, description: "Stores AI enterprises, frontier research labs, and technology corporations.", columns: [["company_id", "INT"], ["company_name", "VARCHAR(100)"], ["industry", "VARCHAR(100)"], ["country", "VARCHAR(50)"], ["founded_year", "INT"], ["company_type", "VARCHAR(50)"], ["headquarters_city", "VARCHAR(100)"]] },
  { name: "ai_models", rows: 16, description: "Catalog of prominent artificial intelligence models and benchmark evaluations.", columns: [["model_id", "INT"], ["company_id", "INT"], ["company_name", "VARCHAR(100)"], ["model_name", "VARCHAR(100)"], ["model_category", "VARCHAR(50)"], ["release_year", "INT"], ["parameter_count_billions", "DECIMAL(10,2)"], ["performance_score", "DECIMAL(5,2)"]] },
  { name: "financial_performance", rows: 18, description: "Annual balance sheet, top-line revenue, and net profit records (Millions USD).", columns: [["performance_id", "INT"], ["company_id", "INT"], ["company_name", "VARCHAR(100)"], ["fiscal_year", "INT"], ["revenue_millions", "DECIMAL(12,2)"], ["profit_millions", "DECIMAL(12,2)"], ["operating_cost_millions", "DECIMAL(12,2)"], ["revenue_growth_percent", "DECIMAL(6,2)"]] },
  { name: "ai_investments", rows: 15, description: "Capital investments allocated to AI compute clusters, research, and chips.", columns: [["investment_id", "INT"], ["company_id", "INT"], ["company_name", "VARCHAR(100)"], ["investment_year", "INT"], ["investment_amount_millions", "DECIMAL(12,2)"], ["investment_category", "VARCHAR(100)"], ["estimated_return_percent", "DECIMAL(6,2)"]] },
  { name: "research_projects", rows: 12, description: "Specialized frontier R&D initiatives, robotics, and scientific explorations.", columns: [["project_id", "INT"], ["company_id", "INT"], ["company_name", "VARCHAR(100)"], ["project_name", "VARCHAR(150)"], ["research_area", "VARCHAR(100)"], ["budget_millions", "DECIMAL(10,2)"], ["project_status", "VARCHAR(50)"], ["start_date", "DATE"]] },
  { name: "market_performance", rows: 15, description: "Market dominance, adoption velocity, and composite health indexes.", columns: [["market_id", "INT"], ["company_id", "INT"], ["company_name", "VARCHAR(100)"], ["fiscal_year", "INT"], ["market_share_percent", "DECIMAL(5,2)"], ["customer_growth_percent", "DECIMAL(6,2)"], ["performance_index", "DECIMAL(5,2)"]] },
];

const ambiguousOptions = [
  { label: "Highest Revenue", detail: "Rank companies by their 2024 annual revenue (USD Millions)", value: "revenue" },
  { label: "Highest Net Profit", detail: "Rank companies by their net profitability after operating costs", value: "profit" },
  { label: "Highest Revenue Growth Rate", detail: "Rank companies by year-over-year revenue percentage growth (%)", value: "growth" },
  { label: "Highest AI Investment Return", detail: "Rank companies by estimated ROI on AI compute & infrastructure", value: "roi" },
];
const periodOptions = [
  { label: "This Month", detail: "Use the current calendar month", value: "this_month" },
  { label: "Last Month", detail: "Compare against the previous calendar month", value: "last_month" },
  { label: "All Time", detail: "Use the complete available reporting history", value: "all_time" },
];

const baseSql = "SELECT c.company_name, f.revenue_millions, f.profit_millions, f.revenue_growth_percent\nFROM companies c\nJOIN financial_performance f ON c.company_id = f.company_id\nWHERE f.fiscal_year = 2024\nORDER BY f.revenue_millions DESC\nLIMIT 10;";

function safeResult(metric: string): Result {
  const order = metric === "profit" ? "f.profit_millions" : metric === "growth" ? "f.revenue_growth_percent" : "f.revenue_millions";
  const title = metric === "profit" ? "Highest net profit by company" : metric === "growth" ? "Revenue growth rate by company" : metric === "roi" ? "AI investment return by company" : "Annual revenue by company";
  const insight = metric === "growth" ? "Smaller frontier players show the fastest relative growth, while larger platforms still lead on absolute revenue." : "Revenue leadership is concentrated among the largest platform companies, with a clear separation between scale and relative growth.";
  return { sql: baseSql.replace("ORDER BY f.revenue_millions DESC", `ORDER BY ${order} DESC`), logic: `Ranks AI companies by ${metric === "profit" ? "net profitability" : metric === "growth" ? "year-over-year revenue growth" : metric === "roi" ? "estimated AI investment return" : "gross annual revenue"} in 2024.`, rows: companies, columns: ["company_name", "profit_millions", "revenue_millions", "revenue_growth_percent"], chart: metric === "growth" ? "line" : "bar", title, duration: 10, businessInsight: insight, chartHint: { chartType: metric === "growth" ? "line" : "bar", title } };
}

function navLabel(view: View) { return ({ overview: "Overview", console: "Query Console", explorer: "DB Explorer", audit: "Audit Trail", architecture: "Architecture Guide" })[view]; }

export default function Home() {
  const [view, setView] = useState<View>("overview");
  const [query, setQuery] = useState("");
  const [selectedMetric, setSelectedMetric] = useState("revenue");
  const [clarifying, setClarifying] = useState(false);
  const [clarificationMode, setClarificationMode] = useState<"metric" | "period">("metric");
  const [result, setResult] = useState<Result | null>(null);
  const [resultTab, setResultTab] = useState<"sql" | "table" | "chart">("sql");
  const [history, setHistory] = useState<AuditEntry[]>(() => [
    {
      status: "SUCCESS",
      question: "Which AI companies have the highest revenue in 2024?",
      sql: baseSql,
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
      error: "SqlSecurityException: Mutation operations (DROP, DELETE, UPDATE, INSERT, ALTER) are strictly prohibited.",
    },
  ]);
  const [search, setSearch] = useState("");
  const [schemaSearch, setSchemaSearch] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [toast, setToast] = useState("");
  const [apiError, setApiError] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [conversationId, setConversationId] = useState("");

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2200); };
  const go = (next: View) => { setView(next); setMobileNav(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const showResult = (metric = selectedMetric, question = query || "Show me the best performing AI companies") => {
    const next = safeResult(metric); setResult(next); setResultTab("sql"); setClarifying(false); setConversationId(""); setHistory((entries) => [{ status: "SUCCESS", question, sql: next.sql, duration: next.duration, rows: next.rows.length, time: new Date().toLocaleString() }, ...entries]);
  };
  const showLiveResult = (response: LiveQueryResponse, question: string) => {
    const rows = (response.rows ?? []).map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value ?? ""])));
    const chartType = response.chartHint?.chartType === "line" ? "line" : "bar";
    const next: Result = { sql: response.sql ?? "", logic: response.resolvedQuery ?? question, rows, columns: response.columns ?? Object.keys(rows[0] ?? {}), chart: chartType, title: response.chartHint?.title ?? "Verified query result", duration: response.executionTimeMs ?? 0, businessInsight: response.businessInsight ?? "The live query returned a verified result set.", chartHint: { chartType, title: response.chartHint?.title ?? "Verified query result" } };
    setResult(next); setResultTab("sql"); setClarifying(false); setConversationId(""); setApiError("");
    setHistory((entries) => [{ status: "SUCCESS", question, sql: next.sql, duration: next.duration, rows: next.rows.length, time: new Date().toLocaleString() }, ...entries]);
  };
  const handleLiveResponse = (response: LiveQueryResponse, question: string) => {
    if (response.status === "clarification_needed") {
      setConversationId(response.conversationId ?? ""); setClarificationMode((response.question ?? "").toLowerCase().includes("window") ? "period" : "metric"); setClarifying(true); setResult(null); setApiError(""); return;
    }
    showLiveResult(response, question);
  };
  const submitQuery = async () => {
    const text = query.trim().toLowerCase();
    if (!text) { notify("Type an analytical question first."); return; }
    setApiError("");
    if (/;|--|\b(drop|delete|update|insert|alter|truncate)\b/i.test(query)) {
      const message = "Query blocked (HTTP 422): only one read-only SELECT statement is permitted. Remove mutations, comments, semicolons, or stacked statements.";
      setApiError(message); setClarifying(false); setConversationId(""); setHistory((entries) => [{ status: "SECURITY_BLOCKED", question: query, sql: query, duration: 0, rows: 0, time: new Date().toLocaleString(), error: message }, ...entries]); return;
    }
    if (queryApiUrl()) {
      setIsExecuting(true);
      try { handleLiveResponse(await executeLiveQuery({ query, conversationId: conversationId || undefined, execute: true }), query); }
      catch (error) {
        const status = (error as Error & { status?: number }).status;
        if (status === 422) { const message = `Query blocked (HTTP 422): ${(error as Error).message}`; setApiError(message); setHistory((entries) => [{ status: "SECURITY_BLOCKED", question: query, sql: query, duration: 0, rows: 0, time: new Date().toLocaleString(), error: message }, ...entries]); }
        else setApiError(`Live query service unavailable: ${(error as Error).message}. Demo mode remains available.`);
      } finally { setIsExecuting(false); }
      return;
    }
    if (text.includes("revenue report")) { setClarificationMode("period"); setClarifying(true); return; }
    if (text.includes("best performing") || text.includes("most money") || text.includes("top performing")) { setClarificationMode("metric"); setClarifying(true); return; }
    showResult(text.includes("growth") ? "growth" : text.includes("profit") ? "profit" : selectedMetric, query);
  };
  const submitClarification = async (answer: string, fallbackMetric: string, fallbackQuestion: string) => {
    setSelectedMetric(fallbackMetric); setApiError("");
    if (queryApiUrl() && conversationId) { setIsExecuting(true); try { handleLiveResponse(await executeLiveQuery({ query, clarificationAnswer: answer, conversationId, execute: true }), fallbackQuestion); } catch (error) { setApiError(`Clarification request failed: ${(error as Error).message}`); } finally { setIsExecuting(false); } return; }
    showResult(fallbackMetric, fallbackQuestion);
  };
  const chooseMetric = (metric: string) => { void submitClarification(metric, metric, `${query} · ${metric}`); };
  const choosePeriod = (period: string) => { void submitClarification(period, "revenue", `${query} · ${period.replace("_", " ")}`); };
  const copySql = async (sql = result?.sql) => { if (!sql) return; await navigator.clipboard?.writeText(sql); setCopied(true); notify("SQL copied to clipboard"); window.setTimeout(() => setCopied(false), 1400); };
  const runVoiceDemo = () => { setIsListening(true); notify("Voice input listening…"); window.setTimeout(() => { setQuery("Show active user revenue last month"); setIsListening(false); }, 1400); };
  const filteredAudit = history.filter((entry) => `${entry.question} ${entry.sql} ${entry.status}`.toLowerCase().includes(search.toLowerCase()));
  const filteredSchema = schemaTables.filter((table) => `${table.name} ${table.description} ${table.columns.join(" ")}`.toLowerCase().includes(schemaSearch.toLowerCase()));

  const Header = () => <header className="site-header"><button className="brand-lockup" onClick={() => go("overview")}><span className="brand-mark calligraphy-q">Q</span><span><b>Querify</b><small>SQL AI</small></span></button><nav className={`main-nav ${mobileNav ? "open" : ""}`}>{(["overview", "console", "explorer", "audit", "architecture"] as View[]).map((item) => <button key={item} className={view === item ? "active" : ""} onClick={() => go(item)}>{item === "overview" ? <LayoutDashboard size={14} /> : item === "console" ? <Zap size={14} /> : item === "explorer" ? <Database size={14} /> : item === "audit" ? <History size={14} /> : <BookOpen size={14} />}{navLabel(item)}</button>)}</nav><div className="header-actions"><select className="db-selector" aria-label="Database connection"><option>PostgreSQL 15 · Enterprise</option><option>MySQL 8 · Analytics</option><option>SQLite · Local demo</option></select><button className="auth-button" onClick={() => notify("Security & Auth controls are active in demo mode")}><LockKeyhole size={13} /> Security & Auth</button><span className="demo-badge"><span /> Demo Mode</span><a href="https://github.com/nazish-saghir-ahmed/Querify" target="_blank" rel="noreferrer"><Github size={14} /> GitHub</a><button className="menu-button" onClick={() => setMobileNav(!mobileNav)}>{mobileNav ? <X size={18} /> : <Menu size={18} />}</button></div></header>;
  const Footer = () => <footer className="site-footer"><div className="footer-intro"><div className="brand-lockup"><span className="brand-mark calligraphy-q">Q</span><span><b>Querify</b><small>SQL AI</small></span></div><p>Ask in English. Get the right SQL.<br />An intelligent natural-language-to-SQL platform engineered with Spring Boot 3, AST verification, and proactive multi-turn clarification.</p><div className="footer-proof"><ShieldCheck size={14} /> AST Read-Only Enforced <span>•</span> MySQL 8 Relational</div></div><div><h4>Platform Navigation</h4>{(["overview", "console", "explorer", "audit", "architecture"] as View[]).map((item) => <button className="footer-link" key={item} onClick={() => go(item)}>{navLabel(item)}</button>)}</div><div><h4>Engineering Team</h4>{team.map((member) => <div className="team-member" key={member.name}><strong><span className={`person-badge ${member.gender}`} title={member.attribution ?? `${member.gender} team member`}>{member.gender === "female" ? "♀" : "♂"}</span>{member.name}</strong>{member.attribution && <span className="team-attribution">{member.attribution}</span>}<a href={`mailto:${member.email}`}>{member.email}</a><span className="profile-links"><a href={member.github} target="_blank" rel="noreferrer"><Github size={11} /> GitHub</a><a href={member.linkedin} target="_blank" rel="noreferrer"><Linkedin size={11} /> LinkedIn</a></span></div>)}<div className="team-member footer-contact"><strong>Project contact</strong><a href="mailto:umerimran1882@gmail.com">umerimran1882@gmail.com</a></div></div><div className="footer-bottom">© 2026 Querify. Designed & engineered by Nazish Saghir, Zuryat Fatima, and Umar Imran. <span><Activity size={13} /> All Systems Operational</span></div></footer>;

  const Overview = () => <section className="page overview-page"><div className="hero"><div className="hero-kicker"><span className="live-dot" /> Querify Clarification Engine v1.3 <b>AST Guarded</b></div><h1>Ask in English.<br /><em>Get the right SQL.</em></h1><p>Turn an imprecise question into a decision-ready answer. Querify pauses at the business rule, keeps the conversation intact, and returns SQL your team can inspect before it runs.</p><div className="hero-actions"><button className="primary-button interactive-btn transition-all duration-200 ease-out hover:scale-[1.01] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/10 active:scale-[0.98] cursor-pointer" onClick={() => go("console")}>→ &nbsp; Try the demo <ArrowRight size={15} /></button><a className="secondary-button interactive-btn transition-all duration-200 ease-out hover:scale-[1.01] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/10 active:scale-[0.98] cursor-pointer" href="https://github.com/nazish-saghir-ahmed/Querify" target="_blank" rel="noreferrer"><Github size={15} /> View on GitHub</a></div><div className="pipeline-card"><div className="pipeline-top"><span>querify-pipeline // clarification-loop.preview</span><div>{["Step 1", "Step 2", "Step 3", "Step 4"].map((step) => <span key={step}>{step}</span>)}</div></div><div className="pipeline-body"><div className="pipeline-number">1. HUMAN QUESTION <span>Natural English Input</span></div><div className="pipeline-prompt">›_ "Show me the best performing AI companies in 2024"<small>ⓘ Flagged: "best performing" is semantically ambiguous</small></div></div><div className="pipeline-foot"><span>Automatically advancing every 4 seconds</span><button onClick={() => { setQuery("Show me the best performing AI companies"); go("console"); }}>Run this question →</button></div></div></div><div className="section-heading"><span>EXECUTION FLOW</span><h2>How Querify Works</h2><p>Three deterministic steps from human inquiry to relational precision.</p></div><div className="flow-grid">{[{ n: "01", title: "Ask in English", copy: "Type your analytical inquiry naturally. Querify parses semantic intent and grounds tokens against the database schema catalog." }, { n: "02", title: "Clarify Ambiguity", copy: "If multiple valid interpretations exist, execution halts. Choose between targeted business metrics via card options or arrow keys." }, { n: "03", title: "Get Verified SQL", copy: "Receive AST-validated SELECT SQL, inspect formatted data rows with sticky headers, and visualize distributions." }].map((item) => <article className="feature-card" key={item.n}><span>{item.n}</span><h3>{item.title}</h3><p>{item.copy}</p></article>)}</div><div className="section-heading product-surface-heading"><span>PRODUCT SURFACE</span><h2>A working surface for the questions behind the dashboard.</h2><p>One deliberate path from intent to evidence — with the decision rule visible at every step.</p></div><div className="flow-grid four product-surface">{[{ title: "Clarification ledger", copy: "Keeps the original question, selected answer, and resolved intent together across turns." }, { title: "Read-only runtime", copy: "Single-statement SELECT enforcement, bounded rows, and database timeouts protect the execution boundary." }, { title: "Analytics brief", copy: "Rows, columns, businessInsight, and chartHint arrive together so the result is immediately useful." }, { title: "Team-ready workspace", copy: "Schema cards, audit records, CSV export, and architecture notes make handoff straightforward." }].map((item) => <article className="feature-card product-card" key={item.title}><span>QUERIFY MODULE</span><h3>{item.title}</h3><p>{item.copy}</p><button className="text-button" onClick={() => go("console")}>Open workflow <ArrowRight size={12} /></button></article>)}</div></section>;

  const Console = () => <section className="page console-page"><div className="page-heading"><div><span>› NATURAL LANGUAGE CONSOLE</span><h2>Translate intent into a verified query.</h2><p>Ask naturally. If intent is ambiguous, Querify pauses execution and makes the business rule explicit.</p></div><div className="guard-pill"><ShieldCheck size={14} /> AST Guard Active</div></div><div className="console-card"><div className="input-row"><input value={query} onChange={(e) => { const next = e.target.value; setQuery(next); if (clarifying && next.trim() !== query.trim()) { setClarifying(false); setConversationId(""); setResult(null); setApiError(""); } }} onKeyDown={(e) => e.key === "Enter" && submitQuery()} className="focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all duration-200" placeholder="e.g. Which AI companies have the highest revenue in 2024?" /><button disabled={isExecuting} className="query-button interactive-btn transition-all duration-200 ease-out hover:scale-[1.01] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/10 active:scale-[0.98] cursor-pointer" onClick={submitQuery}>{isExecuting ? "Running…" : "Query ↵"}</button><button className={`voice-button ${isListening ? "listening" : ""}`} onClick={runVoiceDemo} title="Voice input"><Activity size={16} /></button></div>{apiError && <div className={`query-error-banner ${apiError.includes("HTTP 422") ? "security" : ""}`} role="alert"><ShieldCheck size={16} /><span>{apiError}</span><button className="icon-button" onClick={() => setApiError("")} aria-label="Dismiss error"><X size={14} /></button></div>}<div className="prompt-groups"><div><span className="group-label">ⓘ Ambiguous Questions (Triggers Clarification):</span><div className="chip-row">{["Show me the best performing AI companies", "Which AI company made the most money?", "Show me the revenue report"].map((sample) => <button className="prompt-chip ambiguous clarification-pill interactive-btn transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-cyan-500/60 active:scale-95 cursor-pointer" key={sample} onClick={() => { setQuery(sample); setClarificationMode(sample.includes("revenue report") ? "period" : "metric"); setClarifying(true); }}>{sample} <small>AMBIGUOUS</small></button>)}</div></div><div><span className="group-label">✣ Direct Analytical Questions:</span><div className="chip-row">{["Show the five most profitable companies", "Compare revenue across companies in 2024"].map((sample) => <button className="prompt-chip clarification-pill interactive-btn transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-cyan-500/60 active:scale-95 cursor-pointer" key={sample} onClick={() => { setQuery(sample); showResult(sample.includes("profitable") ? "profit" : "revenue", sample); }}>{sample}</button>)}</div></div></div></div><aside className="studio-sidebar"><div className="studio-card"><h3><Sparkles size={15} /> Model Fine-Tuning Studio</h3><p>Shape the query experience around your schema conventions without adding noise to the workspace.</p><label>Base model architecture<select><option>SQLCoder-7B · Optimized</option><option>CodeLlama · Enterprise</option></select></label><label>Schema adaptation depth<input type="range" min="1" max="10" defaultValue="5" /></label><button className="studio-action" onClick={() => notify("Fine-tuning job staged for review")}>Launch schema job <ArrowRight size={13} /></button></div><div className="studio-card guardrail-card"><h3><ShieldCheck size={15} /> SqlSecurityGuard</h3><div className="guardrail-row"><span>Connection mode</span><b>READ ONLY</b></div><div className="guardrail-row"><span>Statement policy</span><b>SELECT ONLY</b></div><p>DDL, mutation queries, comments, semicolons, and unconstrained execution are blocked before the database boundary.</p></div><div className="studio-card source-card"><h3><Database size={15} /> Workspace source</h3><p>Schema catalog synced · 6 tables · H2 fallback available</p><button className="text-button" onClick={() => go("explorer")}>Inspect schema <ArrowRight size={12} /></button></div></aside>{clarifying && <div className="clarification-card" data-status={clarificationStatus}><div className="modal-header"><div><span className="eyebrow amber">AMBIGUITY DETECTED · DISAMBIGUATION REQUIRED</span><h3>{clarificationMode === "period" ? "Which reporting window should we use?" : "What metric would you like to use to evaluate company performance?"}</h3></div><button className="icon-button" onClick={() => setClarifying(false)}><X size={16} /></button></div><div className="clarification-copy">{clarificationMode === "period" ? <>“Revenue report” needs a time window before Querify can produce a defensible comparison.</> : <>The term <b>“best performing”</b> can refer to top-line gross revenue, net profitability, year-over-year revenue growth, or AI investment return.</>}</div>{clarificationMode === "metric" && <div className="metric-options">{ambiguousOptions.map((option, index) => <button className={`metric-option clarification-pill transition-transform duration-200 active:scale-95 cursor-pointer ${selectedMetric === option.value ? "selected" : ""}`} key={option.value} onClick={() => chooseMetric(option.value)}><span className="metric-index">{index + 1}</span><span><strong>{option.label}</strong><small>{option.detail}</small></span><Check size={15} /></button>)}</div>}{clarificationMode === "period" && <div className="metric-options period-options">{periodOptions.map((option, index) => <button className="metric-option clarification-pill" key={option.value} onClick={() => choosePeriod(option.value)}><span className="metric-index">{index + 1}</span><span><strong>{option.label}</strong><small>{option.detail}</small></span><ArrowRight size={15} /></button>)}</div>}<div className="modal-footer"><span>Use ↑ ↓ to select <b>·</b> Enter to confirm</span><div><button className="text-button" onClick={() => setClarifying(false)}>Dismiss</button><button className="primary-button small interactive-btn transition-all duration-200 ease-out hover:scale-[1.01] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/10 active:scale-[0.98] cursor-pointer" onClick={() => clarificationMode === "period" ? choosePeriod("all_time") : showResult(selectedMetric)}>Generate Verified SQL <ArrowRight size={14} /></button></div></div></div>}{result ? ResultPanel() : <div className="ready-card"><div className="ready-icon"><Database size={22} /></div><h3>Ready to Translate Analytical Inquiries</h3><p>Click one of the sample prompt chips above or type a natural language inquiry. If your question contains ambiguity, Querify will ask for clarification before querying the database.</p></div>}</section>;

  const ResultPanel = () => { if (!result) return null; const current = result; return <div className="result-panel"><div className="result-top"><span>› SYNTHESIZED SQL</span><div><span className="verified-badge"><ShieldCheck size={13} /> Read-only verified</span><button onClick={() => copySql()}><Copy size={13} /> {copied ? "Copied" : "Copy"}</button><button className="primary-button tiny interactive-btn transition-all duration-200 ease-out hover:scale-[1.01] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/10 active:scale-[0.98] cursor-pointer" onClick={() => notify("Query executed in demo mode")}>Run Query <Play size={12} fill="currentColor" /></button></div></div><pre className="sql-view"><code>{current.sql}</code></pre><div className="logic-line"><b>Logic:</b> {current.logic}</div><div className="result-tabs"><button className={resultTab === "sql" ? "active" : ""} onClick={() => setResultTab("sql")}>Generated SQL</button><button className={resultTab === "table" ? "active" : ""} onClick={() => setResultTab("table")}>Table View</button><button className={resultTab === "chart" ? "active" : ""} onClick={() => setResultTab("chart")}>Chart Projection</button><span>Query returned {current.rows.length} verified records</span></div>{resultTab === "sql" && <div className="sql-note"><Clipboard size={16} /> AST validation passed. Only one read-only SELECT statement reached the execution boundary.</div>}{resultTab === "table" && <DataTable rows={current.rows} columns={current.columns} />}{resultTab === "chart" && <div className="chart-card"><h3>{current.chartHint.title}</h3><ResponsiveContainer width="100%" height={260}>{current.chartHint.chartType === "line" ? <AreaChart data={revenueTrend}><CartesianGrid strokeDasharray="3 3" stroke="#1d3159" /><XAxis dataKey="month" stroke="#7890b8" /><YAxis stroke="#7890b8" /><Tooltip contentStyle={{ background: "#101a31", border: "1px solid #29467b" }} /><Area type="monotone" dataKey="revenue" stroke="#66a8ff" fill="#1f5da3" fillOpacity={0.32} /></AreaChart> : <BarChart data={companies.slice(0, 6)}><CartesianGrid strokeDasharray="3 3" stroke="#1d3159" /><XAxis dataKey="company_name" hide /><YAxis stroke="#7890b8" /><Tooltip contentStyle={{ background: "#101a31", border: "1px solid #29467b" }} /><Bar dataKey="revenue_millions" fill="#4c8dff" radius={[4, 4, 0, 0]} /></BarChart>}</ResponsiveContainer></div>}{resultTab === "sql" && <div className="result-summary"><Sparkles size={15} /><span><b>Business insight</b> {current.businessInsight}</span></div>}</div>; }

  const DataTable = ({ rows, columns }: { rows: ResultRow[]; columns: string[] }) => <div className="table-card"><div className="table-toolbar"><span>Query Execution Results <b>{rows.length} rows</b><b>10 ms</b></span><input placeholder="Search results..." /><button onClick={() => notify("CSV export prepared") }><Download size={13} /> Export CSV</button></div><div className="table-scroll"><table><thead><tr>{columns.map((column) => <th key={column}>{column.replaceAll("_", " ")} •</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{columns.map((column) => <td key={column}>{row[column]}</td>)}</tr>)}</tbody></table></div></div>;

  const Explorer = () => <section className="page explorer-page"><div className="page-heading"><div><span>▣ DOMAIN DATABASE CATALOG</span><h2>Inspect the schema behind the answers.</h2><p>Inspect the 6 relational domain tables, primary/foreign keys, and data fixtures.</p></div><div className="view-switch"><button className="active">Schema Cards</button><button>Sample Rows</button><button onClick={() => notify("Schema refreshed") }><RefreshCw size={14} /></button></div></div><div className="search-bar"><Search size={16} /><input value={schemaSearch} onChange={(e) => setSchemaSearch(e.target.value)} className="focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all duration-200" placeholder="Search tables or columns..." /></div><div className="schema-grid">{filteredSchema.map((table) => <article className="schema-card" key={table.name}><div className="schema-title"><span><Table2 size={14} /> {table.name}</span><b>{table.rows} rows</b></div><p>{table.description}</p><div className="columns-list">{table.columns.map(([name, type]) => <div key={name}><span><KeyIcon /></span><strong>{name}</strong><small>{type}</small></div>)}</div><button className="inspect-button" onClick={() => notify(`${table.name}: ${table.rows} sample rows available`)}><Search size={13} /> Inspect Sample Rows</button></article>)}</div></section>;

  const KeyIcon = () => <span className="key-icon">⌘</span>;

  const Audit = () => (
    <section className="page audit-page">
      <div className="page-heading">
        <div>
          <span>◔ QUERY HISTORY</span>
          <h2>Query Audit Trail</h2>
          <p>History of natural language questions, synthesized SQL, execution times, and security events.</p>
        </div>
        <button className="danger-button" onClick={() => { setHistory([]); setSearch(""); }}>
          <Trash2 size={14} /> Clear History
        </button>
      </div>
      <div className="search-bar">
        <Search size={16} />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all duration-200"
          placeholder="Search by question, SQL keywords, or execution status..."
        />
      </div>
      <div className="audit-list">
        {filteredAudit.length > 0 ? filteredAudit.map((entry, index) => (
          <article className="audit-entry" key={`${entry.time}-${index}`}>
            <div className="audit-meta">
              <span className={`status-badge ${entry.status === "SUCCESS" ? "success" : "blocked"}`}>{entry.status}</span>
              <span>{entry.duration} ms</span>
              <span>{entry.rows} rows</span>
              <time>{entry.time}</time>
            </div>
            <h3>“{entry.question}”</h3>
            <pre>{entry.sql}</pre>
            {entry.error && <p className="audit-error">{entry.error}</p>}
            <div className="audit-actions">
              <button onClick={() => copySql(entry.sql)}><Copy size={13} /> Copy SQL</button>
              <button onClick={() => { setQuery(entry.question); go("console"); }}><Play size={13} fill="currentColor" /> Re-run</button>
              <button
                className="delete-icon"
                aria-label={`Delete history item: ${entry.question}`}
                onClick={() => setHistory((entries) => entries.filter((historyEntry) => historyEntry !== entry))}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </article>
        )) : (
          <div className="ready-card audit-empty" role="status">
            <div className="ready-icon"><History size={22} /></div>
            <h3>No audit history</h3>
            <p>Queries and security events will appear here as they occur.</p>
          </div>
        )}
      </div>
    </section>
  );
  const Architecture = () => <section className="page architecture-page"><div className="vision-card"><span>◫ PROJECT VISION & PHILOSOPHY</span><h2>Ambiguity is the primary failure mode of text-to-SQL.</h2><p>When a stakeholder asks a deceptively simple question like <i>“Who is our top client?”</i>, standard AI chatbots blindly assume a single metric and produce convincing but misleading numbers.</p><p><b>Querify</b> solves this by introducing a <b>Clarification Engine</b> paired with a <b>JSqlParser AST Security Guard</b>. Execution halts when ambiguity is flagged, engaging the user in a rapid, structured clarification dialogue before generating mathematically sound, read-only SQL.</p></div><div className="architecture-block"><span>SYSTEM ARCHITECTURE</span><h2>End-to-End Enterprise Data Flow</h2><div className="architecture-flow">{[{ icon: <LayoutDashboard />, title: "React 18 UI", copy: "Vite 5, Tailwind CSS, Recharts. Dispatches REST requests & renders sticky tables." }, { icon: <Server />, title: "Spring Boot 3", copy: "Java 17/21 REST Gateway. Handles session UUIDs, turns, and exception mapping." }, { icon: <Sparkles />, title: "AI Engine", copy: "Ambiguity detector, metric projections, and option synthesizer." }, { icon: <ShieldCheck />, title: "AST Guard", copy: "Parses SQL tree. Strictly blocks mutation and statement chaining." }, { icon: <Database />, title: "MySQL 8 Store", copy: "HikariCP pool, 6 relational domain tables, and H2 test fallback." }].map((item, index) => <article key={item.title}><span>{index + 1}. {item.title}</span><div>{item.icon}</div><p>{item.copy}</p></article>)}</div></div><div className="section-heading left"><span>CORE ARCHITECTURE</span><h2>Engineered for precision & security</h2><p>Architectural guarantees designed to eliminate AI hallucination and database vulnerabilities.</p></div><div className="flow-grid four">{[{ title: "Clarification Engine", icon: <Sparkles />, copy: "Multi-turn disambiguation flags semantic gaps and guarantees user intent before synthesis." }, { title: "AST Security Guard", icon: <ShieldCheck />, copy: "JSqlParser verifies the AST, enforcing read-only SELECT limits and blocking injection attempts." }, { title: "Auto-Generated Charts", icon: <BarChart3 />, copy: "Charts are deduced directly from executed SQL column types and cardinality." }, { title: "Zero-Setup Demo Mode", icon: <Zap />, copy: "Visitors can test clarification, SQL, and charts without external API keys." }].map((item) => <article className="feature-card architecture-feature" key={item.title}><div>{item.icon}</div><h3>{item.title}</h3><p>{item.copy}</p></article>)}</div><div className="comparison"><div><span>STANDARD TEXT-TO-SQL CHATBOT</span><p>✕ Blind assumptions</p><p>✕ Hallucinated schemas</p><p>✕ Vulnerable execution</p><p>✕ Misleading visuals</p></div><div><span>QUERIFY CLARIFICATION ENGINE</span><p>✓ Proactive ambiguity detection</p><p>✓ Structured disambiguation</p><p>✓ AST read-only guard</p><p>✓ Deterministic visualizations</p></div></div></section>;

  return <div className="app-shell"><Header /><main>{view === "overview" ? Overview() : view === "console" ? Console() : view === "explorer" ? Explorer() : view === "audit" ? Audit() : Architecture()}</main><Footer />{toast && <div className="toast"><Check size={14} /> {toast}</div>}</div>;
}
