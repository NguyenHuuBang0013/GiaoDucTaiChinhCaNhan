package vn.edu.finance.model;
/** Domain data shape corresponding to SQL Server table. */
public record Transaction(long transactionId, long userId, Long categoryId, String type, java.math.BigDecimal amount, java.time.LocalDate transactionDate, String note, boolean sampleData) {}
