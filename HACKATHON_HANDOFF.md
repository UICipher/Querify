# Querify — Hackathon Handoff

## What was used from the supplied ZIP

The final version intentionally builds on the supplied Querify work rather than replacing it with a generic template.

- `App.jsx`, `main.jsx`, and `index.css`: original navigation and interaction vocabulary, rebuilt with an asymmetric editorial hero, warm charcoal palette, softer surfaces, and a clearer query workflow.
- `nested/frontend/index.html`: original enterprise workspace direction, database selector, Security & Auth control, query studio, clarification box, output studio, chart/table tabs, Model Fine-Tuning Studio, and SqlSecurityGuard guardrail concepts.
- Original team attribution and contact links: Nazish Saghir, Zuryat Fatima, and Umar Imran, with the supplied GitHub/LinkedIn destinations.
- Original verification scripts: `test-live-site.cjs` and `test-royal-theme.cjs` were used as behavioral and visual reference for console, clarification, SQL, explorer, and audit flows.
- Backend Spring Boot source: controller/service/DTO/security guard structure was preserved and hardened rather than discarded.

The supplied CraftSolve Hackathon 2026 judging image was used as a presentation reference. The product now visibly communicates core functions, backend contract, frontend deployment, documentation, and pitch/demo readiness without claiming fabricated scores.

## What changed from the original

- Reconstructed the original product surface inside the managed React application instead of keeping the earlier sparse replacement page.
- Replaced the AI-blue, box-heavy layout with a restrained dark editorial theme, Manrope/DM Serif Display/IBM Plex Mono typography, asymmetrical hero, and softened corner shapes.
- Replaced the nonfunctional model-tuning mock controls with a truthful Query Planner panel, working sample-query action, SqlSecurityGuard status, and Workspace Source panel.
- Reframed the console and architecture copy around query clarity and safe SQL, then added a separate topic-agnostic public-web research mode instead of using AI as visual marketing.
- Rebalanced the Engineering Team footer into three equal-width desktop cards, with the requested restrained rose accents for female members and blue accents for the male member; the row stacks cleanly on narrow screens.
- Added a multi-turn revenue-report clarification flow with This Month, Last Month, and All Time options.
- Added a key-free structured query path for the six existing sample domains. It uses deterministic rules when no provider is configured or an optional provider is unavailable, asks when a domain or company-performance metric is ambiguous, and does not substitute unrelated rows.
- Added supported-query suggestions for out-of-scope requests and a one-click broadening action for zero-row results.
- Extended the pointer spotlight to feature, schema, audit, and sample-domain surfaces with a low-intensity cool slate-blue glow and a readable result-row hover state.
- Added **Surprise me** to run a supported SQL sample and **Focus mode** to hide the sidebar and reduce console distractions.
- Added default **Web Research** mode using Gemini's Google Search grounding tool for broad real-world questions, with required citations, source links, Google's Search Suggestions widget, a visible public-index boundary, and no synthetic-data fallback.
- Added **Topic roulette**, plus **Go deeper** and **Find another perspective** actions that submit new grounded searches. SQL Demo remains a separate switch and clearly labels all sample rows as fictional.
- Added the analytics payload surface: business insight, chart hint, raw rows/columns, table view, chart projection, CSV export, and audit records.
- Replaced the generic font stack with Manrope for interface text, DM Serif Display for editorial headings, and IBM Plex Mono for technical labels and SQL.
- Added tactile click states, restrained hover lift and pointer feedback, voice-listening pulse, keyboard-visible focus, and reduced-motion support.
- Fixed the Audit Trail controlled-search focus bug by removing nested page remounts; multi-character typing now stays focused and filters results continuously.
- Added a Hackathon Readiness section describing core functions, backend contract, frontend deployment, and documentation.
- Removed the owner/product-lead framing. The footer now uses the neutral label `Project contact` with `umerimran1882@gmail.com`.
- Kept the original team names, emails, GitHub links, and LinkedIn links visible so the original contributors receive clear credit.

## Demonstration path

1. Open **Query Console**; it opens in **Web Research** mode, not on synthetic rows.
2. Enter any topic or click **Topic roulette**. A successful result displays inline citation links, returned source links, and Google's Search Suggestions widget.
3. Use **Go deeper** or **Find another perspective** to run a follow-up web search. These are fresh provider requests, not generated demo rows.
4. Switch to **SQL Demo** for the separate sample database. Use a supported domain prompt or click **Surprise me**.
5. Read the planner badge: **Model used for SQL planning** means the optional SQL provider ran; **Built-in rules · no model call** means it did not. Confirm the **Synthetic sample data** badge—these rows are illustrative, never live market data.
6. Toggle **Focus mode**, then inspect SQL, table/chart views, DB Explorer, Audit Trail, and Architecture Guide.
7. Demonstrate the read-only guardrail and workspace source in the SQL Demo rail.

Web Research requires `QUERIFY_GEMINI_API_KEY` in Vercel server-side Environment Variables. Search covers public pages available to Google at request time; it is broad and topic-agnostic but not exhaustive or unlimited. If the key or grounding metadata is missing, the app reports an error rather than substituting sample rows.

## Validation completed

- `node test-querify-ui.cjs`
- `pnpm run check`
- `pnpm test` (full Vitest suite)
- `pnpm run build:static`
- `pnpm run build`
- 10 new mocked tests for Google Search request shape, source/citation handling, the Search Suggestions widget, no-key behavior, and provider failures
- Live external Gemini Search was not invoked from this sandbox because no Vercel Gemini secret was available; set the documented Vercel variable and redeploy for a real-source production test.
- Default `pnpm dev` startup and `/api/health` after correcting the Express/path-to-regexp compatibility override
- Public Vercel read-only sample query: `plannerMode: local_rules`, synthetic sample-data notice, and matching SQL
- Browser checks for Focus mode, Surprise me, and result provenance

## Criteria alignment

- **Structure / code quality:** separated React page, CSS system, backend DTO/controller/service/security modules, tests, and documentation.
- **Core functions:** topic-agnostic Gemini Google Search grounding with source citations (when configured), no-demo fallback on research errors, optional SQL model planning with visible provenance, deterministic no-key SQL fallback, multi-turn clarification, verified SQL, guided recovery, table/chart analytics, schema explorer, audit trail, and export path.
- **Backend deployment readiness:** Spring Boot 3 source, read-only datasource settings, timeout limits, and HTTP 422 unsafe-query handling.
- **Frontend deployment:** responsive Vercel build with a live public alias.
- **README/UI/UX:** this handoff, README, route manifest, non-boxy cool-dark editorial research workspace, separate Web Research/SQL Demo labels, Topic roulette/deep-dive/perspective actions, a single 2026 byline with all three contributors treated equally, supported-query recovery, pointer spotlights, keyboard focus, and reduced-motion fallback.
- **Pitch/demo clarity:** the Overview page now explains the value, workflow, product modules, and implementation story without relying on vague AI marketing copy.

## Detailed design provenance for the team

The original team should be credited for the product foundation. Nazish Saghir, Zuryat Fatima, and Umar Imran remain named in the footer with their original profile links and emails; no owner or product-lead title was added.

The supplied root prototype contributed the first product language, navigation model, landing-page narrative, dark technical mood, query-console concept, and the original team presentation. Its stylesheet contributed the early color vocabulary, panel hierarchy, SQL presentation direction, and the visual reference for the dark workspace.

The supplied nested frontend contributed the richer enterprise composition: the database selector, Security & Auth control, query studio, clarification interaction, table/chart result split, voice-input affordance, Model Fine-Tuning Studio, SqlSecurityGuard panel, schema explorer, audit trail, architecture guide, and export-oriented result controls. These were adapted into the current React/Vite application instead of shipping the nested static page as-is.

The supplied backend contributed the Spring Boot controller/service/DTO/repository organization and the original security boundary. The final implementation keeps the useful contracts while hardening single-SELECT enforcement, semicolon/comment/mutation rejection, read-only execution limits, timeouts, HTTP 422 handling, and analytics fields such as `businessInsight` and `chartHint`.

The supplied test scripts were used as behavioral references for the live Query Console, ambiguity flow, result views, explorer, audit trail, and visual theme. They were then replaced/extended by the current UI contract test so the final source protects the original team attribution, LinkedIn links, clarification states, analytics payload markers, Tailwind loading, mount contract, focus behavior, and raw interaction classes.

## Final visual delta from the supplied original

The final page keeps the original Querify identity but is not a copy of the original static frontend. The implementation adds a managed Vite/React structure, an explicit JSX mount path, an ErrorBoundary, stable nested-page rendering, a production-safe Vercel build, responsive layout rules, the hackathon-readiness section, the Spring Boot integration boundary, and documented source provenance.

The final visual layer uses deep charcoal surfaces, restrained cool slate-blue highlights, an asymmetric overview, Manrope/DM Serif Display/IBM Plex Mono typography, accessible focus states, responsive editorial research columns, softer nonuniform corner shapes, and a specificity-safe interaction layer. The Web Research mode has a rounded search bar, open topic list, source rail, and citation-first answer canvas; SQL Demo retains its guarded query flow. **Topic roulette**, **Go deeper**, **Find another perspective**, pointer spotlights, Focus mode, and explicit provenance labels complement the original interactions. The 2026 credit presents Umar Imran, Nazish Saghir, and Zuryat Fatima together with equal emphasis.

The final production release also fixes the Audit Trail search remount bug, removes duplicate legacy mount entries, guarantees the React root exists, mounts through `ReactDOM.createRoot` with `React.StrictMode`, keeps CSS loading through Tailwind v4’s Vite plugin, and verifies the production DOM after JavaScript executes.
