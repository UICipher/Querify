package com.example.texttosql.security;

import com.example.texttosql.exception.ApiExceptions.UnsafeSqlException;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class SqlSecurityGuardTest {
    private final SqlSecurityGuard guard = new SqlSecurityGuard();

    @Test void allowsSelectAndAddsBoundedLimit() {
        assertEquals("SELECT * FROM orders LIMIT 100", guard.validateAndNormalize("SELECT * FROM orders", 100));
    }
    @Test void rejectsMutations() {
        assertThrows(UnsafeSqlException.class, () -> guard.validateAndNormalize("DELETE FROM orders", 100));
        assertThrows(UnsafeSqlException.class, () -> guard.validateAndNormalize("SELECT * FROM orders; DROP TABLE orders", 100));
        assertThrows(UnsafeSqlException.class, () -> guard.validateAndNormalize("SELECT * FROM orders;", 100));
    }
    @Test void rejectsCommentsAndSelectInto() {
        assertThrows(UnsafeSqlException.class, () -> guard.validateAndNormalize("SELECT * FROM orders -- bypass", 100));
        assertThrows(UnsafeSqlException.class, () -> guard.validateAndNormalize("SELECT * INTO hacked FROM orders", 100));
    }
    @Test void rejectsClientSuppliedLimitAboveMaximum() {
        assertThrows(UnsafeSqlException.class, () -> guard.validateAndNormalize("SELECT * FROM orders LIMIT 10000", 100));
    }
}
