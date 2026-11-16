package vn.edu.finance.model;
/** Domain data shape corresponding to SQL Server table. */
public record GoalContribution(long contributionId, long goalId, java.math.BigDecimal amount, java.time.LocalDate contributionDate, String note) {}
