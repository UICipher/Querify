package com.example.texttosql.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** Single-node limiter for the hackathon. Use a shared gateway/Redis limiter when scaled horizontally. */
@Component
public class RateLimitFilter extends OncePerRequestFilter {
    private final Map<String, Window> windows = new ConcurrentHashMap<>();
    private final int limit;
    public RateLimitFilter(@Value("${app.rate-limit.requests-per-minute:60}") int limit) { this.limit = Math.max(1, limit); }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        if (!request.getRequestURI().startsWith("/api/")) { chain.doFilter(request, response); return; }
        String client = request.getRemoteAddr();
        Window window = windows.compute(client, (key, current) -> {
            Instant now = Instant.now();
            if (current == null || now.isAfter(current.started().plusSeconds(60))) return new Window(now, 1);
            return new Window(current.started(), current.count() + 1);
        });
        if (window.count() > limit) {
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"code\":\"rate_limit_exceeded\",\"message\":\"Too many requests. Please retry shortly.\"}");
            return;
        }
        chain.doFilter(request, response);
    }
    private record Window(Instant started, int count) { }
}
