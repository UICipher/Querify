package com.example.texttosql.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.sql")
public class SqlProperties {
    private int maxRows = 100;
    private int queryTimeoutSeconds = 5;
    public int getMaxRows() { return maxRows; }
    public void setMaxRows(int maxRows) { this.maxRows = Math.max(1, Math.min(maxRows, 1000)); }
    public int getQueryTimeoutSeconds() { return queryTimeoutSeconds; }
    public void setQueryTimeoutSeconds(int seconds) { this.queryTimeoutSeconds = Math.max(1, Math.min(seconds, 60)); }
}
