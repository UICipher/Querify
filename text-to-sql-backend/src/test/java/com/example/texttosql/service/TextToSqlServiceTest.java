package com.example.texttosql.service;

import com.example.texttosql.config.SqlProperties;
import com.example.texttosql.dto.QueryDtos.QueryRequest;
import com.example.texttosql.dto.QueryDtos.QueryResponse;
import com.example.texttosql.repository.QueryResult;
import com.example.texttosql.repository.ReadOnlyQueryRepository;
import com.example.texttosql.security.SqlSecurityGuard;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class TextToSqlServiceTest {
    @Test void preservesOriginalQueryAcrossClarificationTurn() {
        var generator = mock(SqlGenerationService.class);
        var repository = mock(ReadOnlyQueryRepository.class);
        var guard = new SqlSecurityGuard();
        var properties = new SqlProperties();
        var service = new TextToSqlService(new QueryUnderstandingService(), generator, guard, repository,
                new ConversationContextStore(), new InsightService(), properties);

        QueryResponse clarification = service.process(new QueryRequest("Show sales", null, null, false));
        assertEquals("clarification_needed", clarification.status());
        assertNotNull(clarification.conversationId());
        assertEquals("Show sales", clarification.originalQuery());
        assertEquals(3, clarification.options().size());

        when(generator.generate("Show sales", "revenue by month for the current month"))
                .thenReturn("SELECT order_id, total_amount FROM orders");
        when(repository.execute("SELECT order_id, total_amount FROM orders LIMIT 100", 5))
                .thenReturn(new QueryResult(List.of("order_id", "total_amount"), List.of(Map.of("order_id", 1, "total_amount", 10))));

        QueryResponse result = service.process(new QueryRequest(null,
                "revenue by month for the current month", clarification.conversationId(), true));
        assertEquals("success", result.status());
        assertEquals("Show sales", result.originalQuery());
        assertTrue(result.resolvedQuery().contains("Clarification:"));
        assertEquals(List.of("order_id", "total_amount"), result.columns());
        assertNotNull(result.businessInsight());
        assertNotNull(result.chartHint());
        verify(generator).generate("Show sales", "revenue by month for the current month");
    }
}
