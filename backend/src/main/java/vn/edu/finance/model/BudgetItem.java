package vn.edu.finance.model;
/** Domain data shape corresponding to SQL Server table. */
public record BudgetItem(long budgetItemId, long budgetId, long categoryId, java.math.BigDecimal limitAmount) {}
