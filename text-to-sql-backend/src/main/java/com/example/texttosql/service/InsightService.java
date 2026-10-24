package com.example.texttosql.service;

import com.example.texttosql.dto.QueryDtos.ChartHint;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** Generates deterministic, explainable UI metadata without exposing database internals. */
@Service
public class InsightService {
    public String summarize(List<String> columns, List<Map<String, Object>> rows) {
        if (rows.isEmpty()) return "No matching records were found for this query.";
        String numericColumn = firstNumericColumn(columns, rows);
        if (numericColumn == null) return "The query returned " + rows.size() + " record(s).";
        BigDecimal total = rows.stream().map(row -> toDecimal(row.get(numericColumn)))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return "The query returned " + rows.size() + " record(s). The total "
                + humanize(numericColumn) + " is " + total.stripTrailingZeros().toPlainString() + ".";
    }

    public ChartHint suggest(String query, List<String> columns, List<Map<String, Object>> rows) {
        if (columns.size() < 2 || rows.isEmpty()) return new ChartHint("table", "Query results", null, null);
        String numeric = firstNumericColumn(columns, rows);
        String category = columns.stream().filter(column -> !column.equals(numeric)).findFirst().orElse(columns.get(0));
        String type = query.toLowerCase(Locale.ROOT).contains("month") || query.toLowerCase(Locale.ROOT).contains("trend")
                ? "line" : "bar";
        return new ChartHint(type, humanize(numeric == null ? columns.get(1) : numeric) + " by " + humanize(category), category, numeric);
    }

    private String firstNumericColumn(List<String> columns, List<Map<String, Object>> rows) {
        return columns.stream().filter(column -> rows.stream().anyMatch(row -> row.get(column) instanceof Number)).findFirst().orElse(null);
    }

    private BigDecimal toDecimal(Object value) {
        return value instanceof BigDecimal decimal ? decimal : value instanceof Number number
                ? BigDecimal.valueOf(number.doubleValue()) : BigDecimal.ZERO;
    }

    private String humanize(String value) {
        if (value == null) return "value";
        return value.replace('_', ' ');
    }
}
