# Optional: Enable an external SQL-planning model

Querify works without provider credentials. In no-key mode, the deployed Vercel API uses deterministic rules for the supported sample tables, requests clarification rather than guessing where practical, and never calls an external service. Add the settings below only if you want broader language interpretation from an OpenAI-compatible model. In that mode, the model returns a constrained JSON query plan; Querify validates it, compiles a parameterized read-only `SELECT`, and runs it against the seeded synthetic SQLite tables. The API key stays on the server.

## Add the SQL provider settings in Vercel

1. Open the **Querify** project in the Vercel dashboard and go to **Settings → Environment Variables**.
2. Add `QUERIFY_LLM_API_KEY` and paste the key from your chosen OpenAI-compatible provider. Mark it sensitive/encrypted if Vercel offers that option. Do not send the key in chat, commit it, or paste it into a source file.
3. Add `QUERIFY_LLM_MODEL` with the exact chat model ID enabled for your provider account.
4. For OpenAI, `QUERIFY_LLM_BASE_URL` is optional and defaults to `https://api.openai.com/v1`. For another provider, set it to that provider's OpenAI-compatible API base URL (the code appends `/chat/completions`).
5. Select the environments where Querify should run (at least **Production**; add **Preview** if you want preview deployments to call the provider), save, and redeploy the latest commit so the serverless function receives the values.

Keep all three settings in Vercel's server-side environment configuration. `QUERIFY_LLM_API_KEY` is the only secret; the model ID and base URL are configuration values. Never create a `VITE_`-prefixed key: Vite variables can be included in browser bundles.

## Verify SQL planning

After deployment, use a sample prompt such as **“Show restaurants in Seattle rated above 4.5”** or click a domain prompt in Querify. Check the planner badge: **“Model used for SQL planning”** confirms an LLM call; **“Built-in rules · no model call”** confirms the no-key fallback. The separate **“Synthetic sample data”** badge is always present because the rows are examples—not live listings, prices, or market data. A question naming multiple domains asks you to choose one; the API will not execute a plan against a different table than the one selected.

If the key or model ID is missing, the API uses no-key structured mode and returns a provenance notice; it does not quietly substitute company fixtures for another domain. If a configured provider is unavailable, supported questions fall back to structured rules and the response notice says so. Invalid query plans are still rejected. A supported-domain query that matches no sample records returns an empty result and a recovery action rather than unrelated rows.

## Cost and access note for SQL planning

The endpoint limits request bodies to 16 KiB, natural-language prompts to 800 characters, results to at most 50 rows, and applies a best-effort per-serverless-instance request throttle. Because Vercel functions can scale across instances, this in-memory throttle is **not** a global production rate limiter. Before sharing the public demo widely, set provider-side spend limits/alerts and add a shared rate limiter or authenticated access if stronger abuse protection is needed.

The local static preview intentionally does not contain a provider key or host the Vercel serverless function. The deployed Vercel API runs the no-key structured mode by default. Local browser code never receives provider credentials.

## Knowledge Answers: Gemini text-only mode

Knowledge Answers are separate from SQL Demo. The endpoint sends the user's question to Gemini 3.5 Flash-Lite using the Interactions API with a 1,024-token output cap, low thinking level, and tool use disabled. It does not enable Google Search or live browsing. The API returns the model's answer with empty source and citation lists. Querify displays a notice that answers may be outdated or incomplete and must be checked independently for current facts. It never substitutes SQL demo rows if generation fails.

### Configure the server-side key

1. In the Querify Vercel project, open **Settings → Environment Variables**.
2. Add `QUERIFY_GEMINI_API_KEY` as an encrypted/server-side Secret. Do not paste it into chat, commit it, or use a `VITE_` prefix.
3. Set `QUERIFY_GEMINI_MODEL` to exactly `gemini-3.5-flash-lite` in Production. The server rejects other model IDs in this no-search mode.
4. Keep the Google AI project on the Free Tier with billing disabled if you require zero provider charges. Google's pricing page lists Gemini 3.5 Flash-Lite text input and output as free on the Free Tier. Quotas can still be reached; the endpoint returns an explicit error rather than falling back to sample data.
5. Under Google's Unpaid Services terms, prompts and responses may be used to improve products and may be read or processed by human reviewers. Do not submit sensitive, confidential, or personal information. Review the current [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing), [Interactions API](https://ai.google.dev/gemini-api/docs/interactions), and [Gemini API Additional Terms](https://aistudio.google.com/docs/terms).
6. After saving variables, redeploy the Vercel Production project. The API key is server-side only and is never included in the browser bundle.

Google Search grounding is intentionally disabled because it is not available on the Gemini 3.5 Flash-Lite Free Tier. The app therefore cannot provide real-time search results or source citations in this mode. A free model may still be wrong, incomplete, unable to answer a particular question, or rate-limited; no model can guarantee an error-free answer for every possible query.

The Research function allows up to 60 seconds on Vercel and aborts an individual Gemini request after 50 seconds. The endpoint applies a best-effort six-request-per-minute throttle per serverless instance; this is not a global rate limiter.
