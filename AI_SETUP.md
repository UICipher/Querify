# Enable the AI-backed Querify demo

The deployed Vercel API sends a natural-language question to an OpenAI-compatible chat-completions endpoint, receives a constrained JSON query plan, compiles a parameterized read-only `SELECT`, and runs it against Querify’s seeded synthetic SQLite tables. The API key stays on the server and is never included in browser code or the repository.

## Add the provider settings in Vercel

1. Open the **Querify** project in the Vercel dashboard and go to **Settings → Environment Variables**.
2. Add `QUERIFY_LLM_API_KEY` and paste the key from your chosen OpenAI-compatible provider. Mark it sensitive/encrypted if Vercel offers that option. Do not send the key in chat, commit it, or paste it into a source file.
3. Add `QUERIFY_LLM_MODEL` with the exact chat model ID enabled for your provider account.
4. For OpenAI, `QUERIFY_LLM_BASE_URL` is optional and defaults to `https://api.openai.com/v1`. For another provider, set it to that provider’s OpenAI-compatible API base URL (the code appends `/chat/completions`).
5. Select the environments where Querify should run (at least **Production**; add **Preview** if you want preview deployments to call the provider), save, and redeploy the latest commit so the serverless function receives the values.

Keep all three settings in Vercel’s server-side environment configuration. `QUERIFY_LLM_API_KEY` is the only secret; the model ID and base URL are configuration values. Never create a `VITE_`-prefixed key: Vite variables can be included in browser bundles.

## Verify the setup

After deployment, use a sample prompt such as **“Show restaurants in Seattle rated above 4.5”** or click a domain prompt in Querify. The result should show generated SQL, matching rows, and a notice that the records are synthetic. The tables cover companies, restaurants, hotels, homes, cars, and phones; they are examples, not live listings, prices, or market data. A question naming multiple domains asks you to choose one; the API will not execute a plan against a different table than the one selected.

If the key or model ID is missing, the API returns an `AI_NOT_CONFIGURED` error rather than quietly returning company fixtures. A provider/configuration failure is also surfaced; check the exact model ID, base URL, account access, and provider quota. A supported-domain query that matches no sample records returns an empty result rather than unrelated rows.

## Cost and access note

The endpoint limits request bodies to 16 KiB, natural-language prompts to 800 characters, results to at most 50 rows, and applies a best-effort per-serverless-instance request throttle. Because Vercel functions can scale across instances, this in-memory throttle is **not** a global production rate limiter. Before sharing the public demo widely, set provider-side spend limits/alerts and add a shared rate limiter or authenticated access if stronger abuse protection is needed.

The local static preview intentionally does not contain a provider key. On local preview, non-company domains show a clear message that the deployed server-side AI API is required; they never fall back to company rows.
