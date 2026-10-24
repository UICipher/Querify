package com.example.texttosql.dto;

import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;

/** Public API contracts kept separate from the domain and persistence layers. */
public final class QueryDtos {
    private QueryDtos() { }

    public record QueryRequest(
            @Size(max = 2000) String query,
            @Size(max = 1000) String clarificationAnswer,
            String conversationId,
            Boolean execute) { }

    public record ClarificationOption(String id, String label, String value) { }

    public record ChartHint(String chartType, String title, String xAxis, String yAxis) { }

    public record QueryResponse(
            String status,
            String conversationId,
            String originalQuery,
            String resolvedQuery,
            String question,
            List<ClarificationOption> options,
            String sql,
            List<String> columns,
            List<Map<String, Object>> rows,
            Integer rowCount,
            String businessInsight,
            ChartHint chartHint,
            Long executionTimeMs) {

        public static QueryResponse clarification(String conversationId, String originalQuery,
                                                   String question, List<ClarificationOption> options) {
            return new QueryResponse("clarification_needed", conversationId, originalQuery, null,
                    question, options, null, null, null, null, null, null, null);
        }

        public static QueryResponse sqlReady(String conversationId, String originalQuery,
                                             String resolvedQuery, String sql) {
            return new QueryResponse("sql_ready", conversationId, originalQuery, resolvedQuery,
                    null, null, sql, null, null, null, null, null, null);
        }

        public static QueryResponse result(String conversationId, String originalQuery,
                                           String resolvedQuery, String sql, List<String> columns,
                                           List<Map<String, Object>> rows, String businessInsight,
                                           ChartHint chartHint, long executionTimeMs) {
            return new QueryResponse("success", conversationId, originalQuery, resolvedQuery,
                    null, null, sql, columns, rows, rows.size(), businessInsight, chartHint, executionTimeMs);
        }
    }
}
