# QueryFile Hackathon Demo Guide

## 90-second winning demo

1. Open the schema explorer: `GET /api/v1/schema`.
2. Submit `revenue report` with `execute:false`.
3. Show the clarification card: This Month, Last Month, All Time.
4. Submit the selected option using only `conversationId` and `clarificationAnswer`.
5. Show validated SQL, columns, rows, business insight, chart hint, and execution time.
6. Attempt `SELECT * FROM orders; DROP TABLE orders` and show that the API rejects it.
7. Show `/actuator/health` and the `X-Request-Id` response header to demonstrate production readiness.

## Run with Docker

```bash
docker compose up --build
```

## Environment configuration

- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`: database credentials
- `SQL_MAX_ROWS`: maximum returned rows, hard-capped by application configuration
- `SQL_QUERY_TIMEOUT_SECONDS`: JDBC timeout
- `API_RATE_LIMIT`: requests per client IP per minute
- `APP_ALLOWED_ORIGINS`: comma-separated frontend origins

For a multi-replica deployment, replace the in-memory conversation context and rate limiter with Redis, put the service behind an API gateway, and connect secrets through a cloud secret manager.
