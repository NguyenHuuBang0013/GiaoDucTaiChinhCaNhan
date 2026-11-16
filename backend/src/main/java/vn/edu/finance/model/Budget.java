package vn.edu.finance.model;
/** Domain data shape corresponding to SQL Server table. */
public record Budget(long budgetId, long userId, String name, java.time.LocalDate startDate, java.time.LocalDate endDate, java.math.BigDecimal totalLimit, String status, boolean sampleData) {}
