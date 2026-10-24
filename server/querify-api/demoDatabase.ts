import initSqlJs from "sql.js/dist/sql-wasm-inline.js";
import type { Database, SqlValue } from "sql.js";

type SqlColumnType = "TEXT" | "INTEGER" | "REAL";
type SampleValue = string | number;
type SampleRow = Record<string, SampleValue>;
type ColumnDefinition = { type: SqlColumnType; description: string };
type TableDefinition = {
  label: string;
  description: string;
  columns: Record<string, ColumnDefinition>;
  rows: SampleRow[];
};

export const SAMPLE_DATA_NOTICE =
  "Illustrative synthetic sample data only — not live listings, prices, or market data.";

export const DEMO_TABLES = {
  companies: {
    label: "Companies",
    description: "Illustrative company financial and AI-investment metrics.",
    columns: {
      id: { type: "TEXT", description: "Stable sample record identifier." },
      company_name: { type: "TEXT", description: "Company or business name." },
      sector: { type: "TEXT", description: "Business sector." },
      headquarters: { type: "TEXT", description: "Headquarters city." },
      profit_millions: { type: "REAL", description: "Illustrative net profit in USD millions." },
      revenue_millions: { type: "REAL", description: "Illustrative annual revenue in USD millions." },
      revenue_growth_percent: { type: "REAL", description: "Illustrative year-over-year revenue growth percentage." },
      estimated_return_percent: { type: "REAL", description: "Illustrative AI-investment return estimate, not a forecast." },
      fiscal_year: { type: "INTEGER", description: "Illustrative fiscal year." },
    },
    rows: [
      { id: "co-01", company_name: "NVIDIA", sector: "AI hardware", headquarters: "Santa Clara", profit_millions: 68000, revenue_millions: 122000, revenue_growth_percent: 100.3, estimated_return_percent: 18.4, fiscal_year: 2024 },
      { id: "co-02", company_name: "Microsoft AI", sector: "Cloud and AI", headquarters: "Redmond", profit_millions: 14200, revenue_millions: 38500, revenue_growth_percent: 43.7, estimated_return_percent: 16.8, fiscal_year: 2024 },
      { id: "co-03", company_name: "Amazon AWS AI", sector: "Cloud and AI", headquarters: "Seattle", profit_millions: 10800, revenue_millions: 31000, revenue_growth_percent: 47.6, estimated_return_percent: 14.9, fiscal_year: 2024 },
      { id: "co-04", company_name: "Apple ML", sector: "Consumer technology", headquarters: "Cupertino", profit_millions: 7200, revenue_millions: 19800, revenue_growth_percent: 46.7, estimated_return_percent: 12.8, fiscal_year: 2024 },
      { id: "co-05", company_name: "Meta AI", sector: "Social and AI", headquarters: "Menlo Park", profit_millions: 6900, revenue_millions: 24500, revenue_growth_percent: 51.2, estimated_return_percent: 15.1, fiscal_year: 2024 },
      { id: "co-06", company_name: "Databricks", sector: "Data and AI", headquarters: "San Francisco", profit_millions: 540, revenue_millions: 2800, revenue_growth_percent: 55.0, estimated_return_percent: 19.2, fiscal_year: 2024 },
      { id: "co-07", company_name: "Anthropic", sector: "AI research", headquarters: "San Francisco", profit_millions: 310, revenue_millions: 1200, revenue_growth_percent: 82.0, estimated_return_percent: 21.1, fiscal_year: 2024 },
      { id: "co-08", company_name: "Scale AI", sector: "AI data services", headquarters: "San Francisco", profit_millions: 190, revenue_millions: 870, revenue_growth_percent: 64.0, estimated_return_percent: 17.6, fiscal_year: 2024 },
    ],
  },
  restaurants: {
    label: "Restaurants",
    description: "Fictional restaurant sample records with ratings, cuisine, and illustrative sales metrics.",
    columns: {
      id: { type: "TEXT", description: "Stable sample record identifier." },
      name: { type: "TEXT", description: "Restaurant name." },
      cuisine: { type: "TEXT", description: "Cuisine category." },
      city: { type: "TEXT", description: "City." },
      rating: { type: "REAL", description: "Sample guest rating on a 1-to-5 scale." },
      price_level: { type: "INTEGER", description: "Sample price level from 1 (budget) to 4 (premium)." },
      average_meal_price_usd: { type: "REAL", description: "Illustrative average meal price in USD." },
      annual_revenue_usd: { type: "REAL", description: "Illustrative annual revenue in USD." },
      review_count: { type: "INTEGER", description: "Sample review count." },
    },
    rows: [
      { id: "r-01", name: "Harbor & Herb", cuisine: "Mediterranean", city: "Seattle", rating: 4.8, price_level: 3, average_meal_price_usd: 32, annual_revenue_usd: 1850000, review_count: 1200 },
      { id: "r-02", name: "Juniper Table", cuisine: "Pacific Northwest", city: "Portland", rating: 4.7, price_level: 3, average_meal_price_usd: 29, annual_revenue_usd: 1420000, review_count: 980 },
      { id: "r-03", name: "Saffron Street", cuisine: "Indian", city: "Austin", rating: 4.6, price_level: 2, average_meal_price_usd: 21, annual_revenue_usd: 1280000, review_count: 1100 },
      { id: "r-04", name: "Marlow Noodle House", cuisine: "Japanese", city: "Seattle", rating: 4.5, price_level: 2, average_meal_price_usd: 24, annual_revenue_usd: 1640000, review_count: 1450 },
      { id: "r-05", name: "Cedar & Stone", cuisine: "Italian", city: "Chicago", rating: 4.4, price_level: 3, average_meal_price_usd: 35, annual_revenue_usd: 2100000, review_count: 870 },
      { id: "r-06", name: "Bluebird Kitchen", cuisine: "American", city: "Austin", rating: 4.3, price_level: 2, average_meal_price_usd: 19, annual_revenue_usd: 980000, review_count: 760 },
      { id: "r-07", name: "Little Fig", cuisine: "French", city: "New York", rating: 4.9, price_level: 4, average_meal_price_usd: 58, annual_revenue_usd: 2450000, review_count: 1320 },
      { id: "r-08", name: "Copper Bowl", cuisine: "Korean", city: "Seattle", rating: 4.2, price_level: 2, average_meal_price_usd: 23, annual_revenue_usd: 1150000, review_count: 640 },
    ],
  },
  hotels: {
    label: "Hotels",
    description: "Fictional hotel sample records with nightly rates, star ratings, and occupancy.",
    columns: {
      id: { type: "TEXT", description: "Stable sample record identifier." },
      name: { type: "TEXT", description: "Hotel name." },
      city: { type: "TEXT", description: "City." },
      region: { type: "TEXT", description: "Sample neighborhood or region." },
      star_rating: { type: "REAL", description: "Sample star rating from 1 to 5." },
      nightly_rate_usd: { type: "REAL", description: "Illustrative nightly rate in USD." },
      occupancy_percent: { type: "REAL", description: "Illustrative occupancy percentage." },
      review_count: { type: "INTEGER", description: "Sample review count." },
    },
    rows: [
      { id: "h-01", name: "Northline House", city: "New York", region: "Midtown", star_rating: 4.6, nightly_rate_usd: 289, occupancy_percent: 82, review_count: 940 },
      { id: "h-02", name: "Tideglass Hotel", city: "Seattle", region: "Waterfront", star_rating: 4.8, nightly_rate_usd: 245, occupancy_percent: 78, review_count: 710 },
      { id: "h-03", name: "Cypress Court", city: "Austin", region: "Downtown", star_rating: 4.3, nightly_rate_usd: 176, occupancy_percent: 74, review_count: 620 },
      { id: "h-04", name: "Lumen Grand", city: "Chicago", region: "River North", star_rating: 4.7, nightly_rate_usd: 312, occupancy_percent: 86, review_count: 1100 },
      { id: "h-05", name: "Juniper Landing", city: "Portland", region: "Pearl District", star_rating: 4.4, nightly_rate_usd: 198, occupancy_percent: 72, review_count: 540 },
      { id: "h-06", name: "Mosaic Bay Inn", city: "San Diego", region: "Harbor", star_rating: 4.5, nightly_rate_usd: 225, occupancy_percent: 80, review_count: 880 },
    ],
  },
  homes: {
    label: "Homes",
    description: "Fictional residential property sample records; these are not current listings.",
    columns: {
      id: { type: "TEXT", description: "Stable sample record identifier." },
      city: { type: "TEXT", description: "City." },
      neighborhood: { type: "TEXT", description: "Fictional neighborhood label; no street addresses are stored." },
      bedrooms: { type: "INTEGER", description: "Number of bedrooms." },
      bathrooms: { type: "REAL", description: "Number of bathrooms." },
      square_feet: { type: "INTEGER", description: "Interior area in square feet." },
      listing_price_usd: { type: "REAL", description: "Illustrative listing price in USD, not a current market quote." },
      property_type: { type: "TEXT", description: "Property type." },
      year_built: { type: "INTEGER", description: "Illustrative year built." },
    },
    rows: [
      { id: "home-01", city: "Seattle", neighborhood: "Cedar Ridge", bedrooms: 3, bathrooms: 2, square_feet: 1850, listing_price_usd: 685000, property_type: "Townhouse", year_built: 2018 },
      { id: "home-02", city: "Portland", neighborhood: "Willow Park", bedrooms: 2, bathrooms: 2, square_feet: 1320, listing_price_usd: 425000, property_type: "Condominium", year_built: 2016 },
      { id: "home-03", city: "Austin", neighborhood: "North Loop", bedrooms: 4, bathrooms: 3, square_feet: 2460, listing_price_usd: 575000, property_type: "Single-family", year_built: 2020 },
      { id: "home-04", city: "Chicago", neighborhood: "Lakeview North", bedrooms: 3, bathrooms: 2, square_feet: 1680, listing_price_usd: 510000, property_type: "Condominium", year_built: 2014 },
      { id: "home-05", city: "San Diego", neighborhood: "Mesa Vista", bedrooms: 5, bathrooms: 3.5, square_feet: 3120, listing_price_usd: 945000, property_type: "Single-family", year_built: 2021 },
      { id: "home-06", city: "New York", neighborhood: "Brookline East", bedrooms: 2, bathrooms: 1.5, square_feet: 1180, listing_price_usd: 790000, property_type: "Condominium", year_built: 2012 },
      { id: "home-07", city: "Seattle", neighborhood: "Rainier Grove", bedrooms: 4, bathrooms: 2.5, square_feet: 2280, listing_price_usd: 735000, property_type: "Single-family", year_built: 2019 },
      { id: "home-08", city: "Portland", neighborhood: "Rosewood Terrace", bedrooms: 3, bathrooms: 2, square_feet: 1740, listing_price_usd: 498000, property_type: "Townhouse", year_built: 2017 },
    ],
  },
  cars: {
    label: "Cars",
    description: "Fictional vehicle sample records with price, body style, efficiency, and range.",
    columns: {
      id: { type: "TEXT", description: "Stable sample record identifier." },
      make: { type: "TEXT", description: "Vehicle make." },
      model: { type: "TEXT", description: "Vehicle model." },
      year: { type: "INTEGER", description: "Model year." },
      price_usd: { type: "REAL", description: "Illustrative vehicle price in USD." },
      body_style: { type: "TEXT", description: "Body style or powertrain category." },
      mpg: { type: "REAL", description: "Sample fuel-efficiency value; electric vehicles use MPGe." },
      range_miles: { type: "REAL", description: "Sample estimated range in miles." },
      horsepower: { type: "INTEGER", description: "Sample horsepower." },
    },
    rows: [
      { id: "car-01", make: "Aster", model: "Eon", year: 2025, price_usd: 41900, body_style: "Electric sedan", mpg: 122, range_miles: 340, horsepower: 300 },
      { id: "car-02", make: "Northstar", model: "Trail", year: 2024, price_usd: 36800, body_style: "Hybrid SUV", mpg: 38, range_miles: 520, horsepower: 225 },
      { id: "car-03", make: "Solara", model: "S4", year: 2025, price_usd: 52900, body_style: "Electric sedan", mpg: 128, range_miles: 410, horsepower: 390 },
      { id: "car-04", make: "Ridgeway", model: "Canyon", year: 2023, price_usd: 31500, body_style: "Pickup truck", mpg: 24, range_miles: 410, horsepower: 285 },
      { id: "car-05", make: "Aster", model: "Terra", year: 2024, price_usd: 48900, body_style: "Electric SUV", mpg: 110, range_miles: 365, horsepower: 340 },
      { id: "car-06", make: "Morrow", model: "Cityline", year: 2023, price_usd: 24600, body_style: "Hybrid hatchback", mpg: 52, range_miles: 610, horsepower: 180 },
      { id: "car-07", make: "Solara", model: "X7", year: 2025, price_usd: 67500, body_style: "Electric SUV", mpg: 116, range_miles: 390, horsepower: 470 },
      { id: "car-08", make: "Northstar", model: "Pioneer", year: 2024, price_usd: 44200, body_style: "Hybrid SUV", mpg: 36, range_miles: 560, horsepower: 250 },
    ],
  },
  phones: {
    label: "Phones",
    description: "Fictional smartphone sample records with release year, price, storage, camera, and battery.",
    columns: {
      id: { type: "TEXT", description: "Stable sample record identifier." },
      brand: { type: "TEXT", description: "Phone brand." },
      model: { type: "TEXT", description: "Phone model name." },
      release_year: { type: "INTEGER", description: "Illustrative release year." },
      price_usd: { type: "REAL", description: "Illustrative launch price in USD." },
      storage_gb: { type: "INTEGER", description: "Storage capacity in gigabytes." },
      camera_mp: { type: "REAL", description: "Main camera resolution in megapixels." },
      battery_mah: { type: "INTEGER", description: "Battery capacity in milliamp-hours." },
      screen_inches: { type: "REAL", description: "Screen diagonal in inches." },
    },
    rows: [
      { id: "phone-01", brand: "Aster Mobile", model: "Nova Pro", release_year: 2025, price_usd: 999, storage_gb: 256, camera_mp: 50, battery_mah: 4800, screen_inches: 6.4 },
      { id: "phone-02", brand: "Pioneer", model: "Pixelis 10", release_year: 2025, price_usd: 799, storage_gb: 128, camera_mp: 64, battery_mah: 5000, screen_inches: 6.7 },
      { id: "phone-03", brand: "Northstar", model: "One X", release_year: 2024, price_usd: 699, storage_gb: 256, camera_mp: 48, battery_mah: 5200, screen_inches: 6.8 },
      { id: "phone-04", brand: "Aster Mobile", model: "Nova Lite", release_year: 2024, price_usd: 499, storage_gb: 128, camera_mp: 32, battery_mah: 4600, screen_inches: 6.2 },
      { id: "phone-05", brand: "Morrow", model: "Edge 5", release_year: 2025, price_usd: 899, storage_gb: 512, camera_mp: 108, battery_mah: 5100, screen_inches: 6.6 },
      { id: "phone-06", brand: "Pioneer", model: "Pixelis Fold", release_year: 2024, price_usd: 1499, storage_gb: 512, camera_mp: 50, battery_mah: 4820, screen_inches: 7.4 },
      { id: "phone-07", brand: "Northstar", model: "One Mini", release_year: 2023, price_usd: 449, storage_gb: 128, camera_mp: 40, battery_mah: 4300, screen_inches: 6.1 },
      { id: "phone-08", brand: "Morrow", model: "Edge 5 Max", release_year: 2025, price_usd: 1099, storage_gb: 512, camera_mp: 108, battery_mah: 5600, screen_inches: 6.9 },
    ],
  },
} satisfies Record<string, TableDefinition>;

export type DemoTableName = keyof typeof DEMO_TABLES;
export type QueryParameter = string | number;
export type QueryResultRow = Record<string, string | number | null>;

export function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

export function getSchemaPrompt(): string {
  return Object.entries(DEMO_TABLES)
    .map(([name, table]) => {
      const columns = Object.entries(table.columns)
        .map(([column, definition]) => `${column} (${definition.type}): ${definition.description}`)
        .join("; ");
      return `${name} — ${table.description}\nColumns: ${columns}`;
    })
    .join("\n\n");
}

let databasePromise: Promise<Database> | undefined;

async function createDatabase(): Promise<Database> {
  const SQL = await initSqlJs();
  const database = new SQL.Database();

  for (const [tableName, table] of Object.entries(DEMO_TABLES)) {
    const columnEntries = Object.entries(table.columns);
    const columnSql = columnEntries
      .map(([column, definition]) => `${quoteIdentifier(column)} ${definition.type} NOT NULL`)
      .join(", ");
    database.run(`CREATE TABLE ${quoteIdentifier(tableName)} (${columnSql})`);

    const insertSql = `INSERT INTO ${quoteIdentifier(tableName)} (${columnEntries
      .map(([column]) => quoteIdentifier(column))
      .join(", ")}) VALUES (${columnEntries.map(() => "?").join(", ")})`;
    for (const row of table.rows) {
      database.run(
        insertSql,
        columnEntries.map(([column]) => (row as SampleRow)[column] ?? null)
      );
    }
  }

  return database;
}

async function getDatabase(): Promise<Database> {
  databasePromise ??= createDatabase();
  return databasePromise;
}

function normalizeSqlValue(value: SqlValue): string | number | null {
  if (value === null || typeof value === "string" || typeof value === "number")
    return value;
  return new TextDecoder().decode(value);
}

export async function executeDemoSql(
  sql: string,
  parameters: QueryParameter[]
): Promise<{ columns: string[]; rows: QueryResultRow[] }> {
  const database = await getDatabase();
  const statement = database.prepare(sql);
  try {
    statement.bind(parameters);
    const columns = statement.getColumnNames();
    const rows: QueryResultRow[] = [];
    while (statement.step() && rows.length < 50) {
      const record = statement.getAsObject();
      rows.push(
        Object.fromEntries(
          Object.entries(record).map(([column, value]) => [
            column,
            normalizeSqlValue(value),
          ])
        ) as QueryResultRow
      );
    }
    return { columns, rows };
  } finally {
    statement.free();
  }
}
