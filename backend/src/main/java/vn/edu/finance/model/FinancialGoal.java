package vn.edu.finance.model;
/** Domain data shape corresponding to SQL Server table. */
public record FinancialGoal(long goalId, long userId, String name, java.math.BigDecimal targetAmount, java.time.LocalDate deadline, String status, boolean sampleData) {}
