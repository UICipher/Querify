export type ResultRow = Record<string, string | number>;
export type DemoMetric = "revenue" | "profit" | "growth" | "roi";
export type DemoPeriod = "fiscal_year_2024" | "all_time";
export type DemoChartType = "bar" | "line";

export function inferDemoMetric(question: string): DemoMetric {
  const normalized = question.toLowerCase();
  if (
    /\b(?:roi|investment\s+return|return\s+on\s+investment)\b/.test(normalized)
  )
    return "roi";
  if (/\b(?:growth|grew|growing)\b/.test(normalized)) return "growth";
  if (/\b(?:profit|profitable|earnings)\b/.test(normalized)) return "profit";
  return "revenue";
}

export type DemoResult = {
  sql: string;
  logic: string;
  rows: ResultRow[];
  columns: string[];
  chart: DemoChartType;
  chartField: string;
  title: string;
  duration: number;
  businessInsight: string;
  chartHint: { chartType: DemoChartType; title: string };
};

export const DEMO_BASE_SQL =
  "SELECT c.company_name, f.revenue_millions, f.profit_millions, f.revenue_growth_percent\nFROM companies c\nJOIN financial_performance f ON c.company_id = f.company_id\nWHERE f.fiscal_year = 2024\nORDER BY f.revenue_millions DESC\nLIMIT 10;";

// These are illustrative UI fixtures for Demo Mode, not reported company results.
export const demoCompanies: Array<
  ResultRow & {
    company_name: string;
    profit_millions: number;
    revenue_millions: number;
    revenue_growth_percent: number;
    estimated_return_percent: number;
  }
> = [
  {
    company_name: "NVIDIA",
    profit_millions: 68000,
    revenue_millions: 122000,
    revenue_growth_percent: 100.3,
    estimated_return_percent: 18.4,
  },
  {
    company_name: "Microsoft AI",
    profit_millions: 14200,
    revenue_millions: 38500,
    revenue_growth_percent: 43.7,
    estimated_return_percent: 16.8,
  },
  {
    company_name: "Amazon AWS AI",
    profit_millions: 10800,
    revenue_millions: 31000,
    revenue_growth_percent: 47.6,
    estimated_return_percent: 14.9,
  },
  {
    company_name: "Apple ML",
    profit_millions: 7200,
    revenue_millions: 19800,
    revenue_growth_percent: 46.7,
    estimated_return_percent: 12.8,
  },
  {
    company_name: "Meta AI",
    profit_millions: 6900,
    revenue_millions: 24500,
    revenue_growth_percent: 51.2,
    estimated_return_percent: 15.1,
  },
  {
    company_name: "Scale AI",
    profit_millions: 1450,
    revenue_millions: 8900,
    revenue_growth_percent: 17.1,
    estimated_return_percent: 17.3,
  },
  {
    company_name: "Google DeepMind",
    profit_millions: 580,
    revenue_millions: 3100,
    revenue_growth_percent: 59.0,
    estimated_return_percent: 10.6,
  },
  {
    company_name: "Databricks",
    profit_millions: 320,
    revenue_millions: 2400,
    revenue_growth_percent: 60.0,
    estimated_return_percent: 21.7,
  },
  {
    company_name: "Perplexity AI",
    profit_millions: 8,
    revenue_millions: 50,
    revenue_growth_percent: 400.0,
    estimated_return_percent: 24.6,
  },
  {
    company_name: "Hugging Face",
    profit_millions: 4.5,
    revenue_millions: 35,
    revenue_growth_percent: 75.0,
    estimated_return_percent: 19.2,
  },
];

const metricDefinitions: Record<
  DemoMetric,
  {
    field: string;
    table: "financial_performance" | "ai_investments";
    title: string;
    logic: string;
    insight: string;
    columns: string[];
    chart: DemoChartType;
  }
> = {
  revenue: {
    field: "revenue_millions",
    table: "financial_performance",
    title: "Annual revenue by company",
    logic: "gross annual revenue",
    insight:
      "Illustrative demo values are ranked by annual revenue; connect a live source for production analysis.",
    columns: [
      "company_name",
      "profit_millions",
      "revenue_millions",
      "revenue_growth_percent",
    ],
    chart: "bar",
  },
  profit: {
    field: "profit_millions",
    table: "financial_performance",
    title: "Highest net profit by company",
    logic: "net profitability",
    insight:
      "Illustrative demo values are ranked by net profit; connect a live source for production analysis.",
    columns: [
      "company_name",
      "profit_millions",
      "revenue_millions",
      "revenue_growth_percent",
    ],
    chart: "bar",
  },
  growth: {
    field: "revenue_growth_percent",
    table: "financial_performance",
    title: "Revenue growth rate by company",
    logic: "year-over-year revenue growth",
    insight:
      "Illustrative demo values are ranked by year-over-year growth; connect a live source for production analysis.",
    columns: [
      "company_name",
      "profit_millions",
      "revenue_millions",
      "revenue_growth_percent",
    ],
    chart: "bar",
  },
  roi: {
    field: "estimated_return_percent",
    table: "ai_investments",
    title: "AI investment return by company",
    logic: "estimated AI investment return",
    insight:
      "Illustrative demo estimates are ranked by investment return; they are not financial forecasts.",
    columns: ["company_name", "estimated_return_percent"],
    chart: "bar",
  },
};

export function createDemoResult(
  metric: string,
  options: { period?: DemoPeriod; limit?: number } = {}
): DemoResult {
  const selectedMetric: DemoMetric =
    metric in metricDefinitions ? (metric as DemoMetric) : "revenue";
  const definition = metricDefinitions[selectedMetric];
  const period = options.period ?? "fiscal_year_2024";
  const limit = Math.max(1, Math.min(10, Math.floor(options.limit ?? 10)));
  const rows = [...demoCompanies]
    .sort(
      (left, right) =>
        Number(right[definition.field]) - Number(left[definition.field])
    )
    .slice(0, limit)
    .map(
      row =>
        Object.fromEntries(
          definition.columns.map(column => [column, row[column]])
        ) as ResultRow
    );

  const sql =
    definition.table === "ai_investments"
      ? `SELECT company_name, estimated_return_percent\nFROM ai_investments${period === "all_time" ? "" : "\nWHERE investment_year = 2024"}\nORDER BY estimated_return_percent DESC\nLIMIT ${limit};`
      : `SELECT c.company_name, f.revenue_millions, f.profit_millions, f.revenue_growth_percent\nFROM companies c\nJOIN financial_performance f ON c.company_id = f.company_id${period === "all_time" ? "" : "\nWHERE f.fiscal_year = 2024"}\nORDER BY f.${definition.field} DESC\nLIMIT ${limit};`;

  const periodLabel =
    period === "all_time" ? "all available demo records" : "2024";
  return {
    sql,
    logic: `Ranks AI companies by ${definition.logic} for ${periodLabel}.`,
    rows,
    columns: definition.columns,
    chart: definition.chart,
    chartField: definition.field,
    title: definition.title,
    duration: 10,
    businessInsight: definition.insight,
    chartHint: { chartType: definition.chart, title: definition.title },
  };
}

export function formatResultValue(
  column: string,
  value: string | number
): string {
  if (typeof value !== "number" || !Number.isFinite(value))
    return String(value ?? "—");
  if (column.endsWith("_millions")) {
    return `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value)}M`;
  }
  if (column.endsWith("_percent")) {
    return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
  }
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
    value
  );
}
