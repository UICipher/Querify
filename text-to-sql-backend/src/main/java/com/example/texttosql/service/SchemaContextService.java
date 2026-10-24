package com.example.texttosql.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.sql.DatabaseMetaData;
import java.util.LinkedHashMap;
import java.util.Map;

/** Reads only table/column metadata; values are never included in a generation prompt. */
@Service
public class SchemaContextService {
    private final JdbcTemplate jdbcTemplate;
    public SchemaContextService(JdbcTemplate jdbcTemplate) { this.jdbcTemplate = jdbcTemplate; }

    public Map<String, String> availableColumns() {
        return jdbcTemplate.execute((java.sql.Connection connection) -> {
            DatabaseMetaData metadata = connection.getMetaData();
            Map<String, String> result = new LinkedHashMap<>();
            try (var tables = metadata.getTables(null, null, "%", new String[]{"TABLE"})) {
                while (tables.next()) {
                    String table = tables.getString("TABLE_NAME");
                    String schema = tables.getString("TABLE_SCHEM");
                    // Keep vendor system tables out of the generated schema context.
                    if (table == null || "INFORMATION_SCHEMA".equalsIgnoreCase(schema)
                            || "PG_CATALOG".equalsIgnoreCase(schema)
                            || table.startsWith("SYSTEM_") || table.startsWith("PG_")
                            || table.startsWith("SQL_")) continue;
                    try (var columns = metadata.getColumns(null, null, table, "%")) {
                        StringBuilder names = new StringBuilder();
                        while (columns.next()) {
                            if (names.length() > 0) names.append(", ");
                            names.append(columns.getString("COLUMN_NAME"));
                        }
                        if (names.length() > 0) result.put(table.toLowerCase(), names.toString());
                    }
                }
            }
            return result;
        });
    }
}
