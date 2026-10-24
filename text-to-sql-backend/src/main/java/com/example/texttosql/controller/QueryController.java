package com.example.texttosql.controller;

import com.example.texttosql.dto.QueryDtos.QueryRequest;
import com.example.texttosql.dto.QueryDtos.QueryResponse;
import com.example.texttosql.service.TextToSqlService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/query")
public class QueryController {
    private final TextToSqlService service;
    public QueryController(TextToSqlService service) { this.service = service; }

    /**
     * Accepts either the initial question or a clarification turn. The query
     * may be omitted on a follow-up when conversationId is supplied.
     */
    @PostMapping
    public ResponseEntity<QueryResponse> query(@Valid @RequestBody QueryRequest request) {
        return ResponseEntity.ok(service.process(request));
    }
}
