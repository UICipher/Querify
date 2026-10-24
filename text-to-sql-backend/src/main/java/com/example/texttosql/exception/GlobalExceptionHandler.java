package com.example.texttosql.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String, Object>> validation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream().findFirst()
                .map(error -> error.getField() + ": " + error.getDefaultMessage()).orElse("Invalid request");
        return error(HttpStatus.BAD_REQUEST, "invalid_request", message, request);
    }

    @ExceptionHandler(ApiExceptions.UnsafeSqlException.class)
    ResponseEntity<Map<String, Object>> unsafeSql(ApiExceptions.UnsafeSqlException ex, HttpServletRequest request) {
        return error(HttpStatus.UNPROCESSABLE_ENTITY, "unsafe_sql", ex.getMessage(), request);
    }

    @ExceptionHandler({ConstraintViolationException.class, IllegalArgumentException.class})
    ResponseEntity<Map<String, Object>> badRequest(RuntimeException ex, HttpServletRequest request) {
        return error(HttpStatus.BAD_REQUEST, "invalid_request", ex.getMessage(), request);
    }

    @ExceptionHandler(ApiExceptions.QueryGenerationException.class)
    ResponseEntity<Map<String, Object>> generation(ApiExceptions.QueryGenerationException ex, HttpServletRequest request) {
        return error(HttpStatus.UNPROCESSABLE_ENTITY, "query_not_supported", ex.getMessage(), request);
    }

    @ExceptionHandler(ApiExceptions.QueryExecutionException.class)
    ResponseEntity<Map<String, Object>> execution(ApiExceptions.QueryExecutionException ex, HttpServletRequest request) {
        return error(HttpStatus.BAD_GATEWAY, "query_execution_failed", ex.getMessage(), request);
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<Map<String, Object>> fallback(Exception ex, HttpServletRequest request) {
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "internal_error", "The request could not be completed.", request);
    }

    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String code, String message, HttpServletRequest request) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now());
        body.put("status", status.value());
        body.put("code", code);
        body.put("message", message == null ? "The request is invalid." : message);
        body.put("path", request.getRequestURI());
        return ResponseEntity.status(status).body(body);
    }
}
