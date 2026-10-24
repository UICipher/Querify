package com.example.texttosql.exception;

public final class ApiExceptions {
    private ApiExceptions() { }

    public static class UnsafeSqlException extends RuntimeException {
        public UnsafeSqlException(String message) { super(message); }
    }
    public static class QueryExecutionException extends RuntimeException {
        public QueryExecutionException(String message, Throwable cause) { super(message, cause); }
    }
    public static class QueryGenerationException extends RuntimeException {
        public QueryGenerationException(String message) { super(message); }
    }
}
