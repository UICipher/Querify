package com.example.texttosql.dto;

import java.util.List;

public final class SchemaDtos {
    private SchemaDtos() { }
    public record Table(String name, List<String> columns) { }
    public record SchemaResponse(String status, List<Table> tables) { }
}
