import {
  DEMO_TABLES,
  quoteIdentifier,
  type DemoTableName,
  type QueryParameter,
} from "./demoDatabase.js";

export type FilterOperator = "eq" | "neq" | "contains" | "gt" | "gte" | "lt" | "lte";
export type AggregateFunction = "count" | "avg" | "sum" | "min" | "max";

export type QueryFilter = {
  column: string;
  operator: FilterOperator;
  value: string | number;
};

export type QueryPlan = {
  status: "query";
  table: DemoTableName;
  columns: string[];
  filters: QueryFilter[];
  groupBy: string[];
  aggregate?: { function: AggregateFunction; column: string };
  orderBy?: { column: string; direction: "asc" | "desc" };
  limit: number;
  title: string;
  insight: string;
  chartType: "table" | "bar" | "line";
};

export type ClarificationPlan = {
  status: "clarification_needed";
  question: string;
  options: Array<{ id: string; label: string; value: string }>;
};

export type UnsupportedPlan = {
  status: "unsupported";
  domain: string;
  message: string;
};

export type InterpretedPlan = QueryPlan | ClarificationPlan | UnsupportedPlan;

export class InvalidQueryPlanError extends Error {
  constructor(message = "The model returned a query plan outside the allowed schema.") {
    super(message);
    this.name = "InvalidQueryPlanError";
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function boundedText(value: unknown, fallback: string, maxLength: number): string {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim();
  return normalized && normalized.length <= maxLength ? normalized : fallback;
}

function tableName(value: unknown): value is DemoTableName {
  return typeof value === "string" && Object.hasOwn(DEMO_TABLES, value);
}

function columnExists(table: DemoTableName, column: string): boolean {
  return Object.hasOwn(DEMO_TABLES[table].columns, column);
}

function getColumnType(table: DemoTableName, column: string): "TEXT" | "INTEGER" | "REAL" {
  return (DEMO_TABLES[table].columns as Record<string, { type: "TEXT" | "INTEGER" | "REAL" }>)[column].type;
}

function uniqueColumns(value: unknown, table: DemoTableName, maximum: number): string[] {
  if (!Array.isArray(value) || value.some(column => typeof column !== "string"))
    throw new InvalidQueryPlanError("The selected columns are invalid.");
  const columns = [...new Set(value as string[])];
  if (columns.length > maximum || columns.some(column => !columnExists(table, column)))
    throw new InvalidQueryPlanError("The plan selected a column outside the sample schema.");
  return columns;
}

function parseFilters(value: unknown, table: DemoTableName): QueryFilter[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 8)
    throw new InvalidQueryPlanError("The filter list is invalid.");

  const allowedOperators = new Set<FilterOperator>([
    "eq",
    "neq",
    "contains",
    "gt",
    "gte",
    "lt",
    "lte",
  ]);

  return value.map(entry => {
    if (!isObject(entry)) throw new InvalidQueryPlanError("A filter is malformed.");
    const { column, operator, value: filterValue } = entry;
    if (typeof column !== "string" || !columnExists(table, column))
      throw new InvalidQueryPlanError("A filter references a column outside the sample schema.");
    if (typeof operator !== "string" || !allowedOperators.has(operator as FilterOperator))
      throw new InvalidQueryPlanError("A filter uses an unsupported operator.");
    if (typeof filterValue !== "string" && typeof filterValue !== "number")
      throw new InvalidQueryPlanError("A filter value must be text or a finite number.");
    if (typeof filterValue === "number" && !Number.isFinite(filterValue))
      throw new InvalidQueryPlanError("A numeric filter value must be finite.");
    if (typeof filterValue === "string" && filterValue.length > 120)
      throw new InvalidQueryPlanError("A text filter value is too long.");

    const kind = getColumnType(table, column);
    const isText = kind === "TEXT";
    if ((operator === "contains" && (!isText || typeof filterValue !== "string")) ||
      (isText && operator !== "eq" && operator !== "neq" && operator !== "contains") ||
      (!isText && typeof filterValue !== "number")) {
      throw new InvalidQueryPlanError("The filter operator or value does not match its column type.");
    }

    return { column, operator: operator as FilterOperator, value: filterValue };
  });
}

function parseAggregate(value: unknown, table: DemoTableName): QueryPlan["aggregate"] {
  if (value === undefined || value === null) return undefined;
  if (!isObject(value) || typeof value.function !== "string" || typeof value.column !== "string")
    throw new InvalidQueryPlanError("The aggregate definition is invalid.");
  const fn = value.function.toLowerCase() as AggregateFunction;
  const allowed = new Set<AggregateFunction>(["count", "avg", "sum", "min", "max"]);
  if (!allowed.has(fn) || !columnExists(table, value.column))
    throw new InvalidQueryPlanError("The aggregate references an unsupported function or column.");
  const type = getColumnType(table, value.column);
  if ((fn === "avg" || fn === "sum") && type === "TEXT")
    throw new InvalidQueryPlanError("AVG and SUM are limited to numeric columns.");
  return { function: fn, column: value.column };
}

export function validateQueryPlan(value: unknown): InterpretedPlan {
  if (!isObject(value) || typeof value.status !== "string")
    throw new InvalidQueryPlanError();

  if (value.status === "unsupported") {
    return {
      status: "unsupported",
      domain: boundedText(value.domain, "that data domain", 60),
      message: boundedText(
        value.message,
        "This demo does not contain a matching sample dataset.",
        240
      ),
    };
  }

  if (value.status === "clarification_needed") {
    const options = Array.isArray(value.options)
      ? value.options.slice(0, 6).map((option, index) => {
          if (!isObject(option)) throw new InvalidQueryPlanError("A clarification option is malformed.");
          return {
            id: boundedText(option.id, `option-${index + 1}`, 40),
            label: boundedText(option.label, `Option ${index + 1}`, 80),
            value: boundedText(option.value, `option-${index + 1}`, 80),
          };
        })
      : [];
    return {
      status: "clarification_needed",
      question: boundedText(value.question, "Which sample data domain should I query?", 240),
      options,
    };
  }

  if (value.status !== "query" || !tableName(value.table))
    throw new InvalidQueryPlanError("The model selected an unsupported sample table.");

  const table = value.table;
  const columns = uniqueColumns(value.columns ?? [], table, 8);
  const aggregate = parseAggregate(value.aggregate, table);
  const groupBy = uniqueColumns(value.groupBy ?? [], table, 4);
  const filters = parseFilters(value.filters, table);

  if (aggregate && columns.some(column => !groupBy.includes(column)))
    throw new InvalidQueryPlanError("Every selected field in an aggregate query must be grouped.");
  if (aggregate && groupBy.length === 0 && columns.length > 0)
    throw new InvalidQueryPlanError("A global aggregate cannot select ungrouped fields.");
  if (!aggregate && groupBy.length > 0)
    throw new InvalidQueryPlanError("GROUP BY requires an aggregate in this demo.");
  if (!aggregate && columns.length === 0)
    columns.push(...Object.keys(DEMO_TABLES[table].columns).slice(1, 5));
  if (aggregate && columns.length === 0 && groupBy.length > 0)
    columns.push(...groupBy);
  if (aggregate && groupBy.length > 0 && groupBy.some(column => !columns.includes(column)))
    columns.push(...groupBy.filter(column => !columns.includes(column)));

  const aggregateAlias = aggregate
    ? `${aggregate.function}_${aggregate.column}`
    : undefined;
  const orderByValue = value.orderBy;
  let orderBy: QueryPlan["orderBy"];
  if (orderByValue !== undefined && orderByValue !== null) {
    if (!isObject(orderByValue) || typeof orderByValue.column !== "string")
      throw new InvalidQueryPlanError("The sort definition is invalid.");
    const direction = typeof orderByValue.direction === "string"
      ? orderByValue.direction.toLowerCase()
      : "";
    const allowedOrderColumn = columnExists(table, orderByValue.column) ||
      (aggregateAlias !== undefined && orderByValue.column === aggregateAlias);
    if (!allowedOrderColumn || (direction !== "asc" && direction !== "desc"))
      throw new InvalidQueryPlanError("The sort references an unsupported field or direction.");
    if (aggregate && columnExists(table, orderByValue.column) && !groupBy.includes(orderByValue.column))
      throw new InvalidQueryPlanError("An aggregate query can only sort by grouped or aggregated fields.");
    orderBy = { column: orderByValue.column, direction };
  }

  const rawLimit = value.limit === undefined ? 10 : Number(value.limit);
  if (!Number.isInteger(rawLimit) || rawLimit < 1 || rawLimit > 50)
    throw new InvalidQueryPlanError("The row limit must be an integer from 1 to 50.");

  const chartType = value.chartType === "bar" || value.chartType === "line"
    ? value.chartType
    : "table";

  return {
    status: "query",
    table,
    columns: [...new Set(columns)],
    filters,
    groupBy,
    ...(aggregate ? { aggregate } : {}),
    ...(orderBy ? { orderBy } : {}),
    limit: rawLimit,
    title: boundedText(value.title, `${DEMO_TABLES[table].label} sample results`, 100),
    insight: boundedText(value.insight, `Query executed against the ${DEMO_TABLES[table].label.toLowerCase()} sample table.`, 240),
    chartType,
  };
}

export function compileQueryPlan(plan: QueryPlan): {
  sql: string;
  parameters: QueryParameter[];
} {
  const projections = plan.columns.map(quoteIdentifier);
  if (plan.aggregate) {
    const alias = `${plan.aggregate.function}_${plan.aggregate.column}`;
    projections.push(
      `${plan.aggregate.function.toUpperCase()}(${quoteIdentifier(plan.aggregate.column)}) AS ${quoteIdentifier(alias)}`
    );
  }
  if (projections.length === 0)
    throw new InvalidQueryPlanError("The plan does not select any fields.");

  const parameters: QueryParameter[] = [];
  const whereParts = plan.filters.map(filter => {
    const column = quoteIdentifier(filter.column);
    if (filter.operator === "contains") {
      parameters.push(filter.value as string);
      return `INSTR(LOWER(${column}), LOWER(?)) > 0`;
    }
    const operatorMap: Record<Exclude<FilterOperator, "contains">, string> = {
      eq: "=",
      neq: "<>",
      gt: ">",
      gte: ">=",
      lt: "<",
      lte: "<=",
    };
    parameters.push(filter.value);
    return `${column} ${operatorMap[filter.operator]} ?`;
  });

  let sql = `SELECT ${projections.join(", ")} FROM ${quoteIdentifier(plan.table)}`;
  if (whereParts.length) sql += ` WHERE ${whereParts.join(" AND ")}`;
  if (plan.groupBy.length)
    sql += ` GROUP BY ${plan.groupBy.map(quoteIdentifier).join(", ")}`;
  if (plan.orderBy)
    sql += ` ORDER BY ${quoteIdentifier(plan.orderBy.column)} ${plan.orderBy.direction.toUpperCase()}`;
  sql += ` LIMIT ${plan.limit}`;
  return { sql, parameters };
}
