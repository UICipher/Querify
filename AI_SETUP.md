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


## General Web Research: Gemini + Google Search

The Query Console now opens in **Web Research** mode. This is separate from **SQL Demo**: it sends a question about any topic to Gemini with Google's Search grounding tool, then displays the answer, inline source citations, source links, and Google's Search Suggestions widget. It does not query or return rows from the six synthetic SQLite tables. Results are shown only for the current browser view and are not written to Querify's audit history or local storage.

### Configure the server-side key

1. In the Querify Vercel project, open **Settings → Environment Variables**.
2. Add `QUERIFY_GEMINI_API_KEY` with the Gemini API key. Keep it encrypted/server-side; do not paste it into chat, commit it, or use a `VITE_` prefix.
3. `QUERIFY_GEMINI_MODEL` is optional and defaults to `gemini-3.8-flash`. Use a model enabled for Google Search grounding on your Google AI account.
4. Add the variables to **Production** (and **Preview** if needed), save, then redeploy the current commit.
5. In Querify, leave **Web Research** selected and ask a question on any topic or in any language. A successful answer shows Google Search grounding and cited sources. If the key is missing, model access fails, or Google returns no grounding metadata, Querify displays an error and does **not** substitute demo rows.

This searches publicly indexed web pages available to Google at request time; it cannot fetch every page or guarantee exhaustive coverage. Gemini decides whether to search and may run multiple Google Search requests for one user prompt. Google currently documents 5,000 free Google Search requests per month shared across Gemini 3 and newer models, then $14 per 1,000 requests; billing/availability depend on your account and can change. Set quota and billing alerts before sharing the endpoint publicly. See [Google Search grounding docs](https://ai.google.dev/gemini-api/docs/generate-content/google-search), [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing), and [Gemini API additional terms](https://aistudio.google.com/docs/terms).

The web-research endpoint applies a best-effort six-request-per-minute throttle per serverless instance. Vercel may scale across instances, so this is not a global rate limiter. For a public production launch, add a shared rate limiter or authenticated access and use Google's project quotas to control spend. Preserve Google's grounded answer citations and Search Suggestions widget when changing the display; do not cache or repurpose grounded results.
