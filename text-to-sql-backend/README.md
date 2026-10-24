# QueryFile — Text-to-SQL with Intelligent Clarification Engine

QueryFile is a Spring Boot 3 / Java 21 backend for a secure natural-language analytics workflow. It detects underspecified intent, preserves clarification context across turns, maps approved intent to relational schema metadata, validates generated SQL, executes bounded read-only queries, and returns frontend-ready business insight and chart metadata. It also includes a safe schema explorer (`GET /api/v1/schema`), request correlation through `X-Request-Id`, configurable API rate protection, Actuator health checks, and Docker assets for a polished hackathon demo.

## Run instantly

Requires Java 21 and Maven 3.9+.

```bash
mvn spring-boot:run
```

The default profile uses an in-memory H2 database in PostgreSQL compatibility mode and creates the demo `orders` and `order_items` tables. For a real database, set `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`. The application marks Hikari connections read-only and never accepts write SQL from the API.

## Multi-turn API

`POST /api/v1/query`

Initial request:

```json
{
  "query": "revenue report",
  "execute": false
}
```

Response:

```json
{
  "status": "clarification_needed",
  "conversationId": "<opaque-id>",
  "originalQuery": "revenue report",
  "question": "What time period should this report cover?",
  "options": [
    {"id":"this_month","label":"This Month","value":"revenue by month for the current month"},
    {"id":"last_month","label":"Last Month","value":"revenue for the previous month"},
    {"id":"all_time","label":"All Time","value":"revenue grouped by month for all available history"}
  ]
}
```

Follow-up request can omit the original query because the short-lived context store preserves it:

```json
{
  "conversationId": "<opaque-id>",
  "clarificationAnswer": "revenue by month for the current month",
  "execute": true
}
```

A successful response contains `resolvedQuery`, validated `sql`, `columns`, raw `rows`, `rowCount`, `businessInsight`, and `chartHint`:

```json
{
  "status": "success",
  "resolvedQuery": "revenue report Clarification: revenue by month for the current month",
  "columns": ["month", "revenue"],
  "rows": [],
  "rowCount": 0,
  "businessInsight": "No matching records were found for this query.",
  "chartHint": {"chartType":"table","title":"Query results","xAxis":null,"yAxis":null}
}
```

Set `execute:false` to preview the validated SQL without accessing the database.

Successful responses include `executionTimeMs` for frontend performance telemetry. Every API response includes an `X-Request-Id` header for traceable debugging.

## Security boundary

- Only one statement is accepted and it must begin with `SELECT`.
- Semicolons, SQL comments (`--`, `/* */`, `#`), `SELECT INTO`, and stacked queries are blocked.
- Mutating/admin keywords including `DROP`, `DELETE`, `UPDATE`, `INSERT`, `ALTER`, `TRUNCATE`, `CREATE`, `GRANT`, `REVOKE`, `MERGE`, `CALL`, `EXECUTE`, `COPY`, `VACUUM`, and `ANALYZE` are blocked.
- A missing `LIMIT` is automatically capped; a client/generator-supplied limit above the configured maximum is rejected.
- JDBC query timeout is enforced per statement and HikariCP is configured read-only.
- Exception responses are sanitized and never include stack traces, SQL text, credentials, or internal exception details.

## Architecture

- `controller`: HTTP contract and validation boundary
- `service`: clarification, conversation context, schema metadata, SQL generation, insight, and orchestration
- `security`: SQL allow-list guard and row-limit enforcement
- `repository`: read-only JDBC execution and column/row extraction
- `config`: bounded timeout and row-limit properties
- `exception`: consistent sanitized error responses
- `GET /api/v1/schema`: safe table and column metadata for the frontend schema explorer
- `GET /actuator/health`: container/orchestrator health probe

`SqlGenerationService` is a deterministic, schema-aware provider for zero-setup execution. An LLM provider can replace it behind the same service boundary and receive only the allow-listed output of `SchemaContextService`, never unrestricted database contents.

The in-memory conversation store is intentionally dependency-free for the hackathon. For a horizontally scaled production deployment, replace it with Redis or a database-backed context repository and add authentication, authorization, rate limiting, audit logging, and secret-manager integration.
