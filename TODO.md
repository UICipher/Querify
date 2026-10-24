# Querify delivery outcomes

## Clarification engine and frontend sync
- When a user enters an ambiguous query such as `revenue report`, the system returns `clarification_needed`, asks a precise natural follow-up question, renders clickable options including This Month, Last Month, and All Time, preserves `conversationId`, and merges the selected answer into the final SQL turn.
- The frontend renders the clarification state without layout shift and consumes the final SQL, rows, columns, `businessInsight`, and `chartHint` payload.

## SQL security boundary
- Only a single SELECT statement is accepted.
- Semicolons, SQL comments including `--`, and stacked queries are rejected with HTTP 422.
- DROP, DELETE, UPDATE, INSERT, ALTER, TRUNCATE, CREATE, GRANT, REVOKE, MERGE, CALL, EXECUTE, COPY, VACUUM, ANALYZE, and SELECT INTO are blocked.
- The JDBC connection is read-only, result rows are capped, and statement query timeouts are enforced.

## Premium responsive product surface
- Querify uses a dark/slate charcoal SaaS aesthetic with crisp typography, clean SQL formatting, interactive table/chart views, loading feedback, responsive mobile-to-desktop layout, and stable empty/result states.
- Footer branding identifies Muhammad Umar Imran and the exact contact email `umerimran1882@gmail.com`.

## Developer attribution
- Preserve original team/designer names exactly where present in the source design; no source contributor names were present in the extracted assets, so no additional names are fabricated.
