package com.example.texttosql.controller;

import com.example.texttosql.dto.SchemaDtos.SchemaResponse;
import com.example.texttosql.dto.SchemaDtos.Table;
import com.example.texttosql.service.SchemaContextService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/schema")
public class SchemaController {
    private final SchemaContextService schema;
    public SchemaController(SchemaContextService schema) { this.schema = schema; }

    /** Returns safe table/column metadata for the frontend schema explorer. */
    @GetMapping
    public ResponseEntity<SchemaResponse> schema() {
        List<Table> tables = schema.availableColumns().entrySet().stream()
                .map(entry -> new Table(entry.getKey(), List.of(entry.getValue().split(", "))))
                .toList();
        return ResponseEntity.ok(new SchemaResponse("success", tables));
    }
}
