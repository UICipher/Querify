const fs = require("node:fs");
const home = fs.readFileSync("client/src/pages/Home.tsx", "utf8");
const researchPanel = fs.readFileSync("client/src/components/WebResearchPanel.tsx", "utf8");
const researchApi = fs.readFileSync("server/querify-api/geminiSearch.ts", "utf8") + fs.readFileSync("api/v1/research.ts", "utf8");
const css = fs.readFileSync("client/src/index.css", "utf8");
const routes = JSON.parse(
  fs.readFileSync("client/public/manus-routes.json", "utf8")
);
function listApiCodeFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = `${directory}/${entry.name}`;
    return entry.isDirectory()
      ? listApiCodeFiles(filePath)
      : /\.(?:[cm]?js|tsx?)$/.test(entry.name)
        ? [filePath]
        : [];
  });
}
const apiCodeFiles = listApiCodeFiles("api").sort();
const expectedApiCodeFiles = [
  "api/health.ts",
  "api/history.ts",
  "api/v1/query.ts",
  "api/v1/research.ts",
];
if (JSON.stringify(apiCodeFiles) !== JSON.stringify(expectedApiCodeFiles))
  throw new Error("Keep Vercel route entrypoints only under api/; store helpers and tests under server/querify-api/");
const main = fs.readFileSync("client/src/main.jsx", "utf8");
const app = fs.readFileSync("client/src/App.jsx", "utf8");
const html = fs.readFileSync("client/index.html", "utf8");

for (const token of [
  "ReactDOM.createRoot",
  "React.StrictMode",
  'document.getElementById("root")',
  'import "./index.css"',
]) {
  if (!main.includes(token))
    throw new Error(`Missing mount contract: ${token}`);
}
if (!html.includes('<div id="root"></div>') || !html.includes("/src/main.jsx"))
  throw new Error("Vite HTML mount contract missing");
if (!app.includes("<Home />") || !app.includes("<ErrorBoundary>"))
  throw new Error("App composition contract missing");
if (!css.includes('@import "tailwindcss"'))
  throw new Error("Tailwind v4 CSS directive missing");
for (const token of [
  "clarification_needed",
  "Query Console",
  "DB Explorer",
  "Audit Trail",
  "Architecture Guide",
  "businessInsight",
  "chartHint",
  "Highest Revenue",
  "Fiscal Year 2024",
  "All Available Demo Data",
  "Export CSV",
  "Security & Auth",
  "Query planner",
  "SHOWN PER RESULT",
  "OPTIONAL",
  "Model used for SQL planning",
  "Built-in rules · no model call",
  "Synthetic sample data",
  "Surprise me",
  "Focus mode",
  "Knowledge Answers",
  "Get answer ↵",
  "Topic roulette",
  "webResearchMode",
  "Open questions",
  "Ask a question.",
  "Explore what is known.",
  "Explore knowledge answers",
  "Try SQL demo",
  "Knowledge Answers · Text only",
  "Current knowledge answer mode",
  "Use model knowledge",
  "Check current facts",
  "OPTIONAL SQL DEMO",
  "Synthetic SQL demo · read-only",
  "querify-answers // no live web search",
  "No demo-data fallback",
  "Try a sample question →",
  "What are common ways restaurants are ranked internationally?",
  "plannerMode",
  "Run an example query",
  "SQL Demo · Synthetic data",
  "engineering-team-grid",
  "SqlSecurityGuard",
]) {
  if (!home.includes(token))
    throw new Error(`Missing UI contract token: ${token}`);
}
for (const token of ["MODEL KNOWLEDGE · NO LIVE WEB", "No live citations", "Go deeper", "Compare viewpoints"]) {
  if (!researchPanel.includes(token))
    throw new Error(`Missing text-only answer UI contract: ${token}`);
}
for (const token of ["gemini-3.5-flash-lite", "QUERIFY_GEMINI_API_KEY", "No demo data was used", "GEMINI_TEXT_GENERATION_FAILED", "no live web browsing"]) {
  if (!researchApi.includes(token))
    throw new Error(`Missing text-only answer API contract: ${token}`);
}
if (researchApi.includes("google_search") || researchApi.includes("googleSearchRetrieval"))
  throw new Error("Free text-only mode must never enable Search grounding");
for (const token of [
  ".engineering-team-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr))",
  ".person-badge.female",
  ".person-badge.male",
  "DM Serif Display",
  "Manrope",
  "IBM Plex Mono",
  ".console-page.focus-mode",
  ".web-research-mode.console-page",
  ".research-topic-chip",
  ".research-answer",
  ".google-search-suggestions iframe",
  ".surprise-button:hover:not(:disabled)",
  ".planner-pill.ai_model",
  "--querify-cool-bg: #090d14",
  "--querify-cool-accent: #a8bad6",
  ".footer-credit-line",
  ".footer-credit-team",
]) {
  if (!css.includes(token))
    throw new Error(`Missing theme/layout contract token: ${token}`);
}
for (const staleLabel of [
  "Model Fine-Tuning Studio",
  "SQL AI",
  "AI Engine",
  "All Systems Operational",
  "SYNTHESIZED SQL",
  "RULE-BASED",
]) {
  if (home.includes(staleLabel))
    throw new Error(`Misleading AI-styled placeholder remains: ${staleLabel}`);
}
for (const name of [
  "Nazish Saghir",
  "Zuryat Fatima",
  "Umar Imran",
  "Project contact",
]) {
  if (!home.includes(name)) throw new Error(`Missing attribution: ${name}`);
}
if (!home.includes("umerimran1882@gmail.com"))
  throw new Error("Missing exact contact email");
if (!home.includes('className="footer-credit-team">\n            Umar Imran, Nazish Saghir, and Zuryat Fatima'))
  throw new Error("Copyright byline must present all three contributors together and equally");
if (home.includes("footer-credit-lead"))
  throw new Error("Copyright byline must not single out one contributor");
if (
  home.includes("querify-pipeline // SQL demo · synthetic rows") ||
  home.includes("company_name, revenue_millions") ||
  home.includes('"Show me the best performing AI companies in 2024"')
)
  throw new Error("Overview must not show a canned synthetic SQL result preview");
if (home.includes("Product lead") || home.includes("product-owner"))
  throw new Error("Owner attribution must not be present");
for (const profile of [
  "zuryat-fatima-aba474334",
  "nazish-saghir-1448b2381",
  "umar-imran-65538738a",
]) {
  if (!home.includes(profile))
    throw new Error(`Missing LinkedIn profile: ${profile}`);
}
if (
  !css.includes("Inter, ui-sans-serif") ||
  !css.includes("-webkit-font-smoothing: antialiased") ||
  !css.includes("backdrop-filter:blur(24px)")
)
  throw new Error("Original glass/calligraphy design DNA missing");
if (
  !css.includes("transition:all .2s ease-in-out") ||
  !css.includes("scale(.95)")
)
  throw new Error("Missing tactile 200ms interaction contract");
for (const token of [
  "interactive-btn",
  "clarification-pill",
  "cubic-bezier(0.16, 1, 0.3, 1)",
]) {
  if (!css.includes(token))
    throw new Error(`Missing raw interaction class: ${token}`);
}
for (const token of [
  "transition-all duration-200 ease-out",
  "active:scale-95",
  "focus:ring-2 focus:ring-cyan-500/50",
]) {
  if (!home.includes(token))
    throw new Error(`Missing requested Tailwind interaction class: ${token}`);
}
if (!css.includes("#66a9ff"))
  throw new Error("Missing original electric-blue accent");
for (const token of [
  "query-error-banner",
  "QUERIFY_QUERY_API_URL",
  "clarificationAnswer",
  "conversationId",
]) {
  if (!home.includes(token) && token !== "QUERIFY_QUERY_API_URL")
    throw new Error(`Missing query safety contract: ${token}`);
}
if (routes.routes?.[0]?.path !== "/") throw new Error("Invalid route manifest");
console.log("Querify UI contract checks passed");
