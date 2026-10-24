package com.example.texttosql.security;

import com.example.texttosql.exception.ApiExceptions.UnsafeSqlException;
import org.springframework.stereotype.Component;
import java.util.Locale;
import java.util.regex.Pattern;

@Component
public class SqlSecurityGuard {
    private static final Pattern STARTS_WITH_SELECT = Pattern.compile("^SELECT\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern FORBIDDEN = Pattern.compile("\\b(DROP|DELETE|UPDATE|INSERT|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|MERGE|CALL|EXEC|EXECUTE|COPY|VACUUM|ANALYZE)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern COMMENT = Pattern.compile("(--|/\\*|\\*/|#)");

    public String validateAndNormalize(String sql, int maxRows) {
        if (sql == null || sql.isBlank()) throw new UnsafeSqlException("SQL must not be empty.");
        String normalized = sql.trim();
        if (normalized.contains(";") || COMMENT.matcher(normalized).find()) throw new UnsafeSqlException("Semicolons, comments, and stacked SQL statements are not allowed.");
        if (!STARTS_WITH_SELECT.matcher(normalized).find()) throw new UnsafeSqlException("Only SELECT statements are permitted.");
        if (FORBIDDEN.matcher(normalized).find()) throw new UnsafeSqlException("The SQL contains a prohibited operation.");
        if (normalized.toLowerCase(Locale.ROOT).contains(" into ")) throw new UnsafeSqlException("SELECT INTO is not permitted.");
        return addLimit(normalized, maxRows);
    }

    private String addLimit(String sql, int maxRows) {
        var limitMatcher = Pattern.compile("\\bLIMIT\\s+(\\d+)\\b", Pattern.CASE_INSENSITIVE).matcher(sql);
        if (limitMatcher.find()) {
            try {
                if (Integer.parseInt(limitMatcher.group(1)) <= maxRows) return sql;
            } catch (NumberFormatException ignored) {
                // An invalid/overflowing limit is rejected below rather than executed.
            }
            throw new UnsafeSqlException("The requested row limit exceeds the configured maximum.");
        }
        return sql + " LIMIT " + maxRows;
    }
}
