package com.example.texttosql.service;

import com.example.texttosql.dto.QueryDtos.ClarificationOption;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Locale;

@Service
public class QueryUnderstandingService {
    public boolean needsClarification(String query, String answer) {
        if (answer != null && !answer.isBlank()) return false;
        String normalized = query.toLowerCase(Locale.ROOT);
        return normalized.matches(".*\\b(show|list|get|find|display)\\s+(me\\s+)?sales\\b.*")
                || normalized.matches(".*\\brevenue\\s+report\\b.*")
                || normalized.matches(".*\\btop\\s+customers?\\b.*")
                || normalized.matches(".*\\bperformance\\b.*");
    }

    public String questionFor(String query) {
        String normalized = query.toLowerCase(Locale.ROOT);
        if (normalized.contains("revenue") || normalized.contains("sales")) {
            return "What time period should this report cover?";
        }
        if (normalized.contains("customer")) return "Should customers be ranked by revenue, order count, or recency?";
        return "Which metric and time period should I use?";
    }

    public List<ClarificationOption> optionsFor(String query) {
        String normalized = query.toLowerCase(Locale.ROOT);
        if (normalized.contains("revenue") || normalized.contains("sales")) return List.of(
                new ClarificationOption("this_month", "This Month", "revenue by month for the current month"),
                new ClarificationOption("last_month", "Last Month", "revenue for the previous month"),
                new ClarificationOption("all_time", "All Time", "revenue grouped by month for all available history"));
        return List.of(
                new ClarificationOption("revenue", "Revenue", "rank by revenue"),
                new ClarificationOption("count", "Order Count", "rank by number of orders"),
                new ClarificationOption("recent", "Most Recent", "rank by latest activity"));
    }
}
