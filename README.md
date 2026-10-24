# Querify

Querify has two deliberately separate modes: **Web Research** uses Gemini with Google Search grounding to answer questions across topics with citations and source links; **SQL Demo** turns natural-language questions into visible, guarded SQL over six synthetic sample datasets. Web Research does not return SQL demo rows, and the SQL demo is never presented as live market data.

## Query modes

The same-origin `POST /api/v1/query` function powers SQL Demo and works without a provider key. With no model configured, a deterministic rule-based planner maps supported questions to a constrained query plan, asks for clarification when the dataset or business metric is ambiguous, and runs only against the seeded sample tables. It does not call an external service. If an OpenAI-compatible model is configured, that optional model can interpret a broader range of wording; its JSON plan is validated before Querify compiles parameterized, read-only SQL. If the provider is unavailable, supported questions fall back to the same structured planner and the result notice identifies the fallback. A model never supplies executable SQL.

Web Research uses a separate same-origin `POST /api/v1/research` endpoint. It calls Gemini with Google's native Search grounding tool, using GenerateContent and `groundingMetadata` for Gemini 2.5 and the Interactions API with URL-citation annotations for Gemini 3 and newer. It displays citations, source links, and Google's Search Suggestions content. If configuration is missing, grounding fails, or citation metadata is absent, the endpoint returns an explicit error—it never substitutes sample rows. Search covers public pages available in Google's index at request time; it is broad and topic-agnostic, not an exhaustive or unlimited copy of the internet.

All non-company records are fictional, and all figures are illustrative. Results visibly state that they are synthetic and are not live listings, prices, or market data. Unsupported domains are rejected without returning unrelated rows. Requests that explicitly mention multiple supported domains first ask which single sample table to query; the server also rejects a model plan whose selected table does not match the explicit request. The Spring Boot service in `text-to-sql-backend/` remains a separate backend and its existing API contract is unchanged.

No API key or Vercel setting is required for key-free SQL Demo. To opt into an OpenAI-compatible SQL planner, follow [`AI_SETUP.md`](AI_SETUP.md) and set `QUERIFY_LLM_API_KEY` and `QUERIFY_LLM_MODEL` only in Vercel's server-side Environment Variables; optionally set `QUERIFY_LLM_BASE_URL`. Web Research requires the server-side `QUERIFY_GEMINI_API_KEY`; `QUERIFY_GEMINI_MODEL` is optional. Never put provider keys in source code, a `VITE_` variable, GitHub, or a browser bundle.

The APIs limit request bodies to 16 KiB. SQL prompts are limited to 800 characters and results to 50 rows; Web Research questions are limited to 1,000 characters. Its in-memory per-instance throttle is a best-effort demo safeguard, not a global production rate limiter; set provider spend limits and add shared rate limiting or authentication before broad public use.

## Frontend and interactions

The `client/` Vite + React application provides an editorial two-column Web Research workspace with **Topic roulette**, **Go deeper**, **Find another perspective**, source hover details, and one-click Focus mode, plus a separate SQL workspace with clarification, generated SQL, table/chart views, CSV export, query history, and a schema/sample-data explorer. It distinguishes real web-grounded results from fictional SQL demo rows in the header, result panel, and citations. Unsupported SQL questions retain a clear explanation and offer supported sample prompts; empty results offer a one-click way to broaden the query. Pointer-follow spotlights, result-row hover, tactile controls, and reduced-motion support are included.

The local static Vite preview does not host Vercel serverless functions, so Web Research requires a deployed backend or a configured API URL. SQL Demo still works in the Vercel no-key mode across the six sample domains. Gemini/OpenAI-compatible credentials are used only server-side; local browser code never receives provider credentials.

## Run and validate

```bash
pnpm install --frozen-lockfile
pnpm run dev:static
```

Run the project checks with:

```bash
pnpm check
pnpm test
node test-querify-ui.cjs
pnpm build:static
```

The Java service can be run separately from `text-to-sql-backend/` with `mvn spring-boot:run`; its tests run with `mvn test`.

## Security boundary

SQL Demo executes only one validated, parameterized `SELECT` against the fixed sample schema. Mutations, SQL comments, and stacked statements are rejected. Values are bound as parameters and identifiers come from an allowlist. Web Research is a separate provider call; it does not construct or execute SQL. Model credentials remain server-side.

## Attribution

Designed and built by Muhammad Umar Imran. Contact: umerimran1882@gmail.com.
