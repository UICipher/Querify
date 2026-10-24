package com.example.texttosql.service;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class QueryUnderstandingServiceTest {
    private final QueryUnderstandingService service = new QueryUnderstandingService();

    @Test void detectsAmbiguousSalesQueryWithTimeOptions() {
        assertTrue(service.needsClarification("Show sales", null));
        assertFalse(service.needsClarification("Show sales", "This Month"));
        assertEquals("What time period should this report cover?", service.questionFor("Show sales"));
        assertEquals("This Month", service.optionsFor("Show sales").get(0).label());
    }

    @Test void detectsRevenueReportAsAmbiguous() {
        assertTrue(service.needsClarification("revenue report", null));
        assertEquals(3, service.optionsFor("revenue report").size());
    }
}
