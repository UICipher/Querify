# Querify

Querify is a polished Text-to-SQL workspace that turns natural-language questions into visible, guarded SQL. The public Vercel demo can query synthetic sample data across companies, restaurants, hotels, homes, cars, and phones.

## AI-backed Vercel demo

The same-origin `POST /api/v1/query` function sends the question to a server-configured OpenAI-compatible chat-completions model. The model returns a constrained JSON query plan; Querify validates its table, columns, filters, aggregates, sort direction, and row limit, compiles a parameterized read-only SQL statement, then executes it against a seeded in-memory SQLite database. The model never supplies executable SQL.

All non-company records are fictional, and all figures are illustrative. Results visibly state that they are synthetic and are not live listings, prices, or market data. Unsupported domains are rejected without returning unrelated rows. Requests that explicitly mention multiple supported domains first ask which single sample table to query; the server also rejects a model plan whose selected table does not match the explicit request. The Spring Boot service in `text-to-sql-backend/` remains a separate backend and its existing API contract is unchanged.

To enable the model securely in Vercel, follow [`AI_SETUP.md`](AI_SETUP.md). Set `QUERIFY_LLM_API_KEY` and `QUERIFY_LLM_MODEL` in Vercel’s server-side Environment Variables; optionally set `QUERIFY_LLM_BASE_URL` for another OpenAI-compatible provider. Never put a provider key in source code, a `VITE_` variable, GitHub, or a browser bundle.

The API limits request bodies to 16 KiB, prompts to 800 characters, and query results to 50 rows. Its in-memory per-instance throttle is a best-effort demo safeguard, not a global production rate limiter; set provider spend limits and add shared rate limiting or authentication before broad public use.

## Frontend and interactions

The `client/` Vite + React application provides the midnight-navy/cobalt workspace, a four-step workflow, natural-language query console, AI clarification options, generated SQL, table and chart views, CSV export, query history, and a schema/sample-data explorer. The query console includes one-tap sample prompts for every seeded domain and a subtle pointer spotlight. GlowCursor and spotlight effects are disabled for touch/reduced-motion contexts where appropriate.

The local static Vite preview does not contain provider credentials or the Vercel serverless function. It retains a clearly local company fixture for company-only UI smoke tests; other domains show an explicit message instead of being mapped to company data. Multi-domain AI execution requires the deployed Vercel API and the settings in `AI_SETUP.md`.

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
