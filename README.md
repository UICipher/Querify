# Querify

Querify is a polished Text-to-SQL workspace that turns natural-language questions into visible, guarded SQL. The public Vercel demo can query synthetic sample data across companies, restaurants, hotels, homes, cars, and phones.

## Query modes

The same-origin `POST /api/v1/query` function works without a provider key. With no model configured, a deterministic rule-based planner maps supported questions to a constrained query plan, asks for clarification when the dataset or business metric is ambiguous, and runs only against the seeded sample tables. It does not call an external service. If an OpenAI-compatible model is configured, that optional model can interpret a broader range of wording; its JSON plan is validated before Querify compiles parameterized, read-only SQL. If the provider is unavailable, supported questions fall back to the same structured planner and the result notice identifies the fallback. A model never supplies executable SQL.

All non-company records are fictional, and all figures are illustrative. Results visibly state that they are synthetic and are not live listings, prices, or market data. Unsupported domains are rejected without returning unrelated rows. Requests that explicitly mention multiple supported domains first ask which single sample table to query; the server also rejects a model plan whose selected table does not match the explicit request. The Spring Boot service in `text-to-sql-backend/` remains a separate backend and its existing API contract is unchanged.

No API key or Vercel setting is required for the structured no-key mode. To opt into the external model, follow [`AI_SETUP.md`](AI_SETUP.md). Set `QUERIFY_LLM_API_KEY` and `QUERIFY_LLM_MODEL` only in Vercel’s server-side Environment Variables; optionally set `QUERIFY_LLM_BASE_URL` for another OpenAI-compatible provider. Never put a provider key in source code, a `VITE_` variable, GitHub, or a browser bundle.

The API limits request bodies to 16 KiB, prompts to 800 characters, and query results to 50 rows. Its in-memory per-instance throttle is a best-effort demo safeguard, not a global production rate limiter; set provider spend limits and add shared rate limiting or authentication before broad public use.

## Frontend and interactions

The `client/` Vite + React application provides a dark, restrained SQL workspace, natural-language query console, clarification options, generated SQL, table and chart views, CSV export, query history, and a schema/sample-data explorer. The console describes its key-free rule-based mode instead of showing nonfunctional model-tuning controls. Unsupported questions retain a clear explanation and offer supported sample prompts; empty results offer a one-click way to broaden the query. Hover lift and pointer-follow spotlights are available on sample cards and result surfaces, with reduced-motion support.

The local static Vite preview does not host the Vercel serverless function. The public Vercel deployment can query all six sample domains in no-key mode. A configured external model is optional and is used only by the server-side function; local browser code never receives provider credentials.

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

Only one validated, parameterized `SELECT` is executed against the fixed sample schema. Mutations, SQL comments, and stacked statements are rejected. Values are bound as parameters, identifiers come from the allowlist, and model credentials are read only by the serverless function.

## Attribution

Designed and built by Muhammad Umar Imran. Contact: umerimran1882@gmail.com.
