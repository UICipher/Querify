# Querify — Final Handoff

## What the app now does

Querify has two intentionally separate experiences:

1. **Web Research** (the default Query Console mode) accepts questions across topics and languages. Its Vercel endpoint calls Gemini's Interactions API with Google's native Search grounding tool. A successful response must include URL-citation annotations and Google's Search Suggestions content. The UI displays the grounded answer, inline citations, source links, and the Search Suggestions widget. It does not query the demo database or invent placeholder rows. If the key is missing or grounding fails, the interface shows an error instead of demo results.
2. **SQL Demo** is a separate tab for exploring six illustrative/sample datasets. It uses the existing optional OpenAI-compatible model planner or deterministic local rules, validates the plan, and executes only guarded read-only SQL. Its rows are always labeled synthetic and are not current real-world market data.

### Data flow

```text
Web Research question
  → POST /api/v1/research
  → Gemini Interactions API + Google Search grounding
  → response steps (answer, URL-citation annotations, Search Suggestions)
  → current-page answer with clickable sources; no persistence and no sample fallback

SQL Demo question
  → POST /api/v1/query
  → optional SQL model planner OR deterministic rules
  → validated parameterized SELECT
  → fixed synthetic sample tables, with planner/data provenance shown
```

Google Search coverage is broad and topic-agnostic, but limited to pages available to Google's index and the sources found for each request; it is not literally unlimited or exhaustive. Users should verify important claims at the linked sources. Gemini Search usage is subject to Google's current quotas, billing, and model availability.

## Design and interactions

The previous SQL-only, box-heavy presentation is now a deep-charcoal editorial layout with cool slate-blue accents, Manrope, DM Serif Display, and IBM Plex Mono. The Overview introduces both modes. In Web Research, the Query Console has a clear mode switch, rounded search field, open topic list, source-status rail, and citation-first answer surface; on narrower screens the columns stack. SQL Demo retains its familiar read-only flow and disclosure.

Additional interactions include **Topic roulette** for cross-topic starting questions, **Go deeper** and **Find another perspective** for new grounded searches, **Focus mode** to reduce distractions, and the existing pointer-follow spotlights/hover details. The 2026 byline presents Umar Imran, Nazish Saghir, and Zuryat Fatima together, with the same emphasis for all three; the Engineering Team cards remain in their existing order.

## Required deployment setup

For real Web Research on Vercel, set the following in the project’s **server-side** Environment Variables:

- `QUERIFY_GEMINI_API_KEY` — required Gemini API key.
- `QUERIFY_GEMINI_MODEL` — optional; defaults to `gemini-3.8-flash`.

Do not use a `VITE_` prefix and do not commit the key. After setting the value for Production (and Preview if needed), redeploy. `AI_SETUP.md` explains the setup, Google Search grounding requirements, source-display requirement, limits, and additional safeguards. The SQL model variables are separate and optional.

The static local Vite preview does not host Vercel serverless functions. Use the deployed Vercel URL (or configure `VITE_QUERY_API_URL`) to exercise real Web Research. A missing key, unavailable model, or ungrounded provider response must remain an explicit error—never replace it with synthetic data.

## Validation completed

- `pnpm run check` — passed.
- `pnpm test` — passed: 84 tests across 10 files, including mocked Interactions API grounding, citation/suggestion parsing, missing credentials, and provider-status errors.
- `node test-querify-ui.cjs` — passed.
- `pnpm run build:static` — passed.
- `pnpm run build` — passed.
- `git diff --check origin/main` — passed.
- Browser preview confirmed the default Web Research screen, mode-specific header/data labels, separate SQL Demo behavior, and the grouped three-person 2026 credit.

## Vercel Hobby function limit

Vercel rejects Hobby deployments with more than 12 Serverless Functions ([function-count limit](https://vercel.link/function-count-limit)). Keep only the four route handlers in `api/`; shared modules, declarations, and tests belong under `server/querify-api/`. The UI contract test enforces this layout.

The first live production request after the Gemini key was configured exposed a request/response protocol mismatch. This release switches to the documented Gemini Interactions API; verify a live sourced answer after the new Vercel deployment is Ready.

## Publication status

The Vercel project is linked to `UICipher/Querify`, and its Gemini key is configured as a server-side **Production** secret. The compatibility fix is being released from `main`; after its deployment is Ready, ask a general-topic question and verify that the returned answer includes Google Search citations. If access, quota, or model configuration fails, the UI returns a targeted error rather than substituting demo rows.
