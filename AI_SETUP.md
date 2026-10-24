# Optional: Enable an external AI model

Querify works without provider credentials. In no-key mode, the deployed Vercel API uses deterministic rules for the supported sample tables, requests clarification rather than guessing where practical, and never calls an external service. Add the settings below only if you want broader language interpretation from an OpenAI-compatible model. In that mode, the model returns a constrained JSON query plan; Querify validates it, compiles a parameterized read-only `SELECT`, and runs it against the seeded synthetic SQLite tables. The API key stays on the server.

## Add the provider settings in Vercel

1. Open the **Querify** project in the Vercel dashboard and go to **Settings → Environment Variables**.
2. Add `QUERIFY_LLM_API_KEY` and paste the key from your chosen OpenAI-compatible provider. Mark it sensitive/encrypted if Vercel offers that option. Do not send the key in chat, commit it, or paste it into a source file.
3. Add `QUERIFY_LLM_MODEL` with the exact chat model ID enabled for your provider account.
4. For OpenAI, `QUERIFY_LLM_BASE_URL` is optional and defaults to `https://api.openai.com/v1`. For another provider, set it to that provider’s OpenAI-compatible API base URL (the code appends `/chat/completions`).
5. Select the environments where Querify should run (at least **Production**; add **Preview** if you want preview deployments to call the provider), save, and redeploy the latest commit so the serverless function receives the values.

Keep all three settings in Vercel’s server-side environment configuration. `QUERIFY_LLM_API_KEY` is the only secret; the model ID and base URL are configuration values. Never create a `VITE_`-prefixed key: Vite variables can be included in browser bundles.

## Verify the setup

After deployment, use a sample prompt such as **“Show restaurants in Seattle rated above 4.5”** or click a domain prompt in Querify. Check the planner badge: **“Model used for SQL planning”** confirms an LLM call; **“Built-in rules · no model call”** confirms the no-key fallback. The separate **“Synthetic sample data”** badge is always present because the rows are examples—not live listings, prices, or market data. A question naming multiple domains asks you to choose one; the API will not execute a plan against a different table than the one selected.

If the key or model ID is missing, the API uses no-key structured mode and returns a provenance notice; it does not quietly substitute company fixtures for another domain. If a configured provider is unavailable, supported questions fall back to structured rules and the response notice says so. Invalid query plans are still rejected. A supported-domain query that matches no sample records returns an empty result and a recovery action rather than unrelated rows.

## Cost and access note

The endpoint limits request bodies to 16 KiB, natural-language prompts to 800 characters, results to at most 50 rows, and applies a best-effort per-serverless-instance request throttle. Because Vercel functions can scale across instances, this in-memory throttle is **not** a global production rate limiter. Before sharing the public demo widely, set provider-side spend limits/alerts and add a shared rate limiter or authenticated access if stronger abuse protection is needed.

The local static preview intentionally does not contain a provider key or host the Vercel serverless function. The deployed Vercel API runs the no-key structured mode by default. Local browser code never receives provider credentials.
