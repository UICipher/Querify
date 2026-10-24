package com.example.texttosql.service;

import org.springframework.stereotype.Component;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Small zero-setup context store for the hackathon. Replace with Redis or a
 * database-backed store when running multiple application replicas.
 */
@Component
public class ConversationContextStore {
    private static final Duration TTL = Duration.ofMinutes(15);
    private final Map<String, Context> contexts = new ConcurrentHashMap<>();

    public String create(String originalQuery) {
        evictExpired();
        String id = UUID.randomUUID().toString();
        contexts.put(id, new Context(originalQuery, Instant.now()));
        return id;
    }

    public String getOriginalQuery(String conversationId) {
        if (conversationId == null || conversationId.isBlank()) return null;
        Context context = contexts.get(conversationId);
        if (context == null || context.createdAt().plus(TTL).isBefore(Instant.now())) {
            contexts.remove(conversationId);
            return null;
        }
        return context.originalQuery();
    }

    public void remove(String conversationId) {
        if (conversationId != null) contexts.remove(conversationId);
    }

    private void evictExpired() {
        Instant cutoff = Instant.now().minus(TTL);
        contexts.entrySet().removeIf(entry -> entry.getValue().createdAt().isBefore(cutoff));
    }

    private record Context(String originalQuery, Instant createdAt) { }
}
