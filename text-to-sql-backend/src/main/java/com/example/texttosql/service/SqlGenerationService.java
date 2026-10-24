package com.example.texttosql.service;

import com.example.texttosql.exception.ApiExceptions.QueryGenerationException;
import org.springframework.stereotype.Service;
import java.util.Locale;
import java.util.Map;

/**
 * Deterministic demo provider. In production, an LLM adapter can implement the
 * same contract and receive only the allow-listed SchemaContextService output.
 */
@Service
public class SqlGenerationService {
    private final SchemaContextService schemaContext;
    public SqlGenerationService(SchemaContextService schemaContext) { this.schemaContext = schemaContext; }

    public String generate(String query, String clarificationAnswer) {
        String input = (query + " " + (clarificationAnswer == null ? "" : clarificationAnswer)).toLowerCase(Locale.ROOT);
        Map<String, String> available = schemaContext.availableColumns();
        if (!available.containsKey("orders")) throw new QueryGenerationException("The configured schema does not expose the orders table.");
        if ((input.contains("revenue") || input.contains("sales")) && input.contains("month")) {
            if (input.contains("current month")) {
                return "SELECT DATE_TRUNC('month', order_date) AS month_start, SUM(total_amount) AS revenue "
                        + "FROM orders WHERE order_date >= CURRENT_DATE - 31 "
                        + "GROUP BY DATE_TRUNC('month', order_date) ORDER BY month_start";
            }
            if (input.contains("previous month")) {
                return "SELECT DATE_TRUNC('month', order_date) AS month_start, SUM(total_amount) AS revenue "
                        + "FROM orders WHERE order_date >= CURRENT_DATE - 62 AND order_date < CURRENT_DATE - 31 "
                        + "GROUP BY DATE_TRUNC('month', order_date) ORDER BY month_start";
            }
            return "SELECT DATE_TRUNC('month', order_date) AS month_start, SUM(total_amount) AS revenue "
                    + "FROM orders GROUP BY DATE_TRUNC('month', order_date) ORDER BY month_start";
        }
        if (input.contains("top product")) {
            requireTable(available, "order_items");
            return "SELECT product_name, SUM(quantity * unit_price) AS revenue FROM order_items "
                    + "GROUP BY product_name ORDER BY revenue DESC";
        }
        if (input.contains("recent") || input.contains("latest")) {
            return "SELECT order_id, customer_id, order_date, total_amount FROM orders ORDER BY order_date DESC";
        }
        if (input.contains("customer") && input.contains("revenue")) {
            return "SELECT customer_id, SUM(total_amount) AS revenue FROM orders GROUP BY customer_id ORDER BY revenue DESC";
        }
        throw new QueryGenerationException("The request could not be mapped to the configured relational schema.");
    }

    private void requireTable(Map<String, String> schema, String table) {
        if (!schema.containsKey(table)) throw new QueryGenerationException("The configured schema does not expose the " + table + " table.");
    }
}
