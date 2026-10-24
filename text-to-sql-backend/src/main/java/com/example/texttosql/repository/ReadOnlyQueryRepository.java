package com.example.texttosql.repository;

import com.example.texttosql.exception.ApiExceptions.QueryExecutionException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Repository
public class ReadOnlyQueryRepository {
    private final JdbcTemplate jdbcTemplate;
    public ReadOnlyQueryRepository(JdbcTemplate jdbcTemplate) { this.jdbcTemplate = jdbcTemplate; }

    public QueryResult execute(String sql, int timeoutSeconds) {
        try {
            return jdbcTemplate.query(connection -> {
                var statement = connection.prepareStatement(sql);
                statement.setQueryTimeout(timeoutSeconds);
                return statement;
            }, resultSet -> {
                var metadata = resultSet.getMetaData();
                List<String> columns = new ArrayList<>();
                for (int column = 1; column <= metadata.getColumnCount(); column++) {
                    columns.add(metadata.getColumnLabel(column));
                }
                List<Map<String, Object>> rows = new ArrayList<>();
                while (resultSet.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    for (int column = 1; column <= metadata.getColumnCount(); column++) {
                        row.put(columns.get(column - 1), resultSet.getObject(column));
                    }
                    rows.add(row);
                }
                return new QueryResult(columns, rows);
            });
        } catch (RuntimeException ex) {
            throw new QueryExecutionException("The read-only query could not be executed.", ex);
        }
    }
}
