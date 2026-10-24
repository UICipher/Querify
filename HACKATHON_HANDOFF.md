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
- Reframed the console and architecture copy around query clarity, safe SQL, and sample data rather than AI claims or model-tuning marketing.
- Rebalanced the Engineering Team footer into three equal-width desktop cards, with the requested restrained rose accents for female members and blue accents for the male member; the row stacks cleanly on narrow screens.
- Added a multi-turn revenue-report clarification flow with This Month, Last Month, and All Time options.
- Added a key-free structured query path for the six existing sample domains. It uses deterministic rules when no provider is configured or an optional provider is unavailable, asks when a domain or company-performance metric is ambiguous, and does not substitute unrelated rows.
- Added supported-query suggestions for out-of-scope requests and a one-click broadening action for zero-row results.
- Extended the pointer spotlight to feature, schema, audit, and sample-domain surfaces with a low-intensity warm/slate glow and a readable result-row hover state.
- Added **Surprise me** to run a supported sample query and **Focus mode** to hide the sidebar and reduce console distractions.
- Added the analytics payload surface: business insight, chart hint, raw rows/columns, table view, chart projection, CSV export, and audit records.
- Replaced the generic font stack with Manrope for interface text, DM Serif Display for editorial headings, and IBM Plex Mono for technical labels and SQL.
- Added tactile click states, restrained hover lift and pointer feedback, voice-listening pulse, keyboard-visible focus, and reduced-motion support.
- Fixed the Audit Trail controlled-search focus bug by removing nested page remounts; multi-character typing now stays focused and filters results continuously.
- Added a Hackathon Readiness section describing core functions, backend contract, frontend deployment, and documentation.
- Removed the owner/product-lead framing. The footer now uses the neutral label `Project contact` with `umerimran1882@gmail.com`.
- Kept the original team names, emails, GitHub links, and LinkedIn links visible so the original contributors receive clear credit.

## Demonstration path

1. Open the live site and choose **Query Console**.
2. Use a supported domain prompt or click **Surprise me**.
3. Read the result badge: **Model used for SQL planning** means the configured provider ran; **Built-in rules · no model call** means it did not.
4. Confirm the separate **Synthetic sample data** badge; these rows are illustrative, never live listings or market data.
5. Toggle **Focus mode**, then inspect the SQL, Table View, Chart Projection, DB Explorer, Audit Trail, and Architecture Guide.
6. Demonstrate the read-only guardrail and workspace source in the right rail.

## Validation completed

- `node test-querify-ui.cjs`
- `pnpm run check`
- `pnpm test` (full Vitest suite)
- `pnpm run build:static`
- `pnpm run build`
- Default `pnpm dev` startup and `/api/health` after correcting the Express/path-to-regexp compatibility override
- Public Vercel read-only sample query: `plannerMode: local_rules`, synthetic sample-data notice, and matching SQL
- Browser checks for Focus mode, Surprise me, and result provenance

## Criteria alignment

- **Structure / code quality:** separated React page, CSS system, backend DTO/controller/service/security modules, tests, and documentation.
- **Core functions:** optional model planning with visible provenance, deterministic no-key fallback, multi-turn clarification, verified SQL, guided recovery for unsupported/empty queries, table/chart analytics, schema explorer, audit trail, and export path.
- **Backend deployment readiness:** Spring Boot 3 source, read-only datasource settings, timeout limits, and HTTP 422 unsafe-query handling.
- **Frontend deployment:** responsive Vercel build with a live public alias.
- **README/UI/UX:** this handoff, README, route manifest, polished responsive UI, Surprise me/Focus mode, supported-query recovery, restrained pointer spotlights, keyboard focus, and reduced-motion fallback.
- **Pitch/demo clarity:** the Overview page now explains the value, workflow, product modules, and implementation story without relying on vague AI marketing copy.

## Detailed design provenance for the team

The original team should be credited for the product foundation. Nazish Saghir, Zuryat Fatima, and Umar Imran remain named in the footer with their original profile links and emails; no owner or product-lead title was added.

The supplied root prototype contributed the first product language, navigation model, landing-page narrative, dark technical mood, query-console concept, and the original team presentation. Its stylesheet contributed the early color vocabulary, panel hierarchy, SQL presentation direction, and the visual reference for the dark workspace.

The supplied nested frontend contributed the richer enterprise composition: the database selector, Security & Auth control, query studio, clarification interaction, table/chart result split, voice-input affordance, Model Fine-Tuning Studio, SqlSecurityGuard panel, schema explorer, audit trail, architecture guide, and export-oriented result controls. These were adapted into the current React/Vite application instead of shipping the nested static page as-is.

The supplied backend contributed the Spring Boot controller/service/DTO/repository organization and the original security boundary. The final implementation keeps the useful contracts while hardening single-SELECT enforcement, semicolon/comment/mutation rejection, read-only execution limits, timeouts, HTTP 422 handling, and analytics fields such as `businessInsight` and `chartHint`.

The supplied test scripts were used as behavioral references for the live Query Console, ambiguity flow, result views, explorer, audit trail, and visual theme. They were then replaced/extended by the current UI contract test so the final source protects the original team attribution, LinkedIn links, clarification states, analytics payload markers, Tailwind loading, mount contract, focus behavior, and raw interaction classes.

## Final visual delta from the supplied original

The final page keeps the original Querify identity but is not a copy of the original static frontend. The implementation adds a managed Vite/React structure, an explicit JSX mount path, an ErrorBoundary, stable nested-page rendering, a production-safe Vercel build, responsive layout rules, the hackathon-readiness section, the Spring Boot integration boundary, and documented source provenance.

The final visual layer uses warm charcoal surfaces, a subtle rose/slate atmosphere, an asymmetric hero, Manrope/DM Serif Display/IBM Plex Mono typography, accessible focus states, responsive console columns, softer nonuniform corner shapes, and a specificity-safe interaction layer. The existing `.interactive-btn` and `.clarification-pill` classes remain, complemented by the **Surprise me** and **Focus mode** controls and explicit per-result planner/data badges.

The final production release also fixes the Audit Trail search remount bug, removes duplicate legacy mount entries, guarantees the React root exists, mounts through `ReactDOM.createRoot` with `React.StrictMode`, keeps CSS loading through Tailwind v4’s Vite plugin, and verifies the production DOM after JavaScript executes.
