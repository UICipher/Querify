# Querify

Querify is an enterprise Text-to-SQL workspace with an Intelligent Clarification Engine. It turns business intent into governed, explainable SQL without making users learn a query language.

## What is included

The `client/` application is a responsive Vite + React workspace with a dark slate operations-desk aesthetic. It provides natural-language query composition, multi-turn clarification, generated SQL formatting, interactive result/table/chart views, business insight copy, query metadata, and developer attribution. The preview ships with a deterministic demo adapter so the interaction is complete even when the Java service is offline; replace `buildDemoResponse` in `client/src/pages/Home.tsx` with a fetch to the documented API when wiring the live service.

The `text-to-sql-backend/` service is a Java 21 / Spring Boot API. Its `POST /api/v1/query` contract returns `clarification_needed` with an opaque conversation id and clickable options for underspecified intent, then returns `success` with `resolvedQuery`, validated `sql`, `columns`, raw `rows`, `businessInsight`, and `chartHint`. `GET /api/v1/schema` exposes safe schema metadata.

## Security boundary

`SqlSecurityGuard` accepts only one SELECT statement. Semicolons, SQL comments, stacked queries, mutation/admin keywords, and SELECT INTO are rejected. Unsafe SQL is surfaced as HTTP 422. The JDBC data source is configured read-only, row counts are capped, and each prepared statement receives a query timeout.

## Run locally

```bash
pnpm install --frozen-lockfile
pnpm run dev:static
```

The frontend preview listens on port 3000. For the backend:

```bash
cd text-to-sql-backend
mvn spring-boot:run
```

The included checks are `pnpm exec tsx test-querify-ui.cjs`, `pnpm run check`, `pnpm run build:static`, and `mvn test` from `text-to-sql-backend/`.

## Attribution

Designed and built by Muhammad Umar Imran. Contact: umerimran1882@gmail.com.
