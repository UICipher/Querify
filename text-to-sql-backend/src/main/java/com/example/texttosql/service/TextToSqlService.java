package com.example.texttosql.service;

import com.example.texttosql.config.SqlProperties;
import com.example.texttosql.dto.QueryDtos.QueryRequest;
import com.example.texttosql.dto.QueryDtos.QueryResponse;
import com.example.texttosql.repository.QueryResult;
import com.example.texttosql.repository.ReadOnlyQueryRepository;
import com.example.texttosql.security.SqlSecurityGuard;
import org.springframework.stereotype.Service;

@Service
public class TextToSqlService {
    private final QueryUnderstandingService understanding;
    private final SqlGenerationService generation;
    private final SqlSecurityGuard guard;
    private final ReadOnlyQueryRepository repository;
    private final ConversationContextStore conversations;
    private final InsightService insights;
    private final SqlProperties properties;

    public TextToSqlService(QueryUnderstandingService understanding, SqlGenerationService generation,
                            SqlSecurityGuard guard, ReadOnlyQueryRepository repository,
                            ConversationContextStore conversations, InsightService insights,
                            SqlProperties properties) {
        this.understanding = understanding;
        this.generation = generation;
        this.guard = guard;
        this.repository = repository;
        this.conversations = conversations;
        this.insights = insights;
        this.properties = properties;
    }

    public QueryResponse process(QueryRequest request) {
        long started = System.nanoTime();
        String originalQuery = resolveOriginalQuery(request);
        String answer = clean(request.clarificationAnswer());
        if (answer == null && understanding.needsClarification(originalQuery, null)) {
            String conversationId = clean(request.conversationId());
            if (conversationId == null) conversationId = conversations.create(originalQuery);
            return QueryResponse.clarification(conversationId, originalQuery,
                    understanding.questionFor(originalQuery), understanding.optionsFor(originalQuery));
        }

        String resolvedQuery = answer == null ? originalQuery : originalQuery + " Clarification: " + answer;
        String safeSql = guard.validateAndNormalize(generation.generate(originalQuery, answer), properties.getMaxRows());
        String conversationId = clean(request.conversationId());
        if (conversationId != null) conversations.remove(conversationId);
        if (Boolean.FALSE.equals(request.execute())) {
            return QueryResponse.sqlReady(conversationId, originalQuery, resolvedQuery, safeSql);
        }

        QueryResult result = repository.execute(safeSql, properties.getQueryTimeoutSeconds());
        return QueryResponse.result(conversationId, originalQuery, resolvedQuery, safeSql,
                result.columns(), result.rows(), insights.summarize(result.columns(), result.rows()),
                insights.suggest(resolvedQuery, result.columns(), result.rows()), elapsedMs(started));
    }

    private String resolveOriginalQuery(QueryRequest request) {
        String query = clean(request.query());
        if (query != null) return query;
        String stored = conversations.getOriginalQuery(request.conversationId());
        if (stored == null) throw new IllegalArgumentException("A query is required unless a valid conversationId is supplied.");
        return stored;
    }

    private String clean(String value) {
        if (value == null) return null;
        String cleaned = value.trim();
        return cleaned.isEmpty() ? null : cleaned;
    }

    private long elapsedMs(long started) {
        return Math.max(0, (System.nanoTime() - started) / 1_000_000);
    }
}
