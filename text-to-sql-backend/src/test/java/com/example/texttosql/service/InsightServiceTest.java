package com.example.texttosql.service;

import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

class InsightServiceTest {
    private final InsightService service = new InsightService();

    @Test void createsInsightAndLineChartHint() {
        var columns = List.of("month", "revenue");
        var rows = List.of(Map.<String, Object>of("month", "2026-10", "revenue", 100),
                Map.<String, Object>of("month", "2026-11", "revenue", 150));
        assertTrue(service.summarize(columns, rows).contains("2 record(s)"));
        var hint = service.suggest("revenue trend by month", columns, rows);
        assertEquals("line", hint.chartType());
        assertEquals("month", hint.xAxis());
        assertEquals("revenue", hint.yAxis());
    }
}
