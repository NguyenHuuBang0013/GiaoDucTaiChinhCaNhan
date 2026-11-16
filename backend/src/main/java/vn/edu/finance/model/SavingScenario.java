package vn.edu.finance.model;
/** Domain data shape corresponding to SQL Server table. */
public record SavingScenario(long scenarioId, long userId, String name, java.math.BigDecimal incomePerPeriod, java.math.BigDecimal expensePerPeriod, String periodUnit, int duration, java.math.BigDecimal initialSaving, boolean sampleData) {}
