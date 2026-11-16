package vn.edu.finance.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Pure calculations used by budget tracking, goal progress and savings scenarios. */
public final class FinanceCalculations {
 private FinanceCalculations(){}
 public static BigDecimal percentage(BigDecimal actual, BigDecimal limit) {
  if(limit==null || limit.signum()<=0)throw new IllegalArgumentException("Limit must be positive");
  return actual.multiply(BigDecimal.valueOf(100)).divide(limit,2,RoundingMode.HALF_UP);
 }
 public static BigDecimal projectedSaving(BigDecimal income, BigDecimal expense, BigDecimal initial, int periods) {
  if(periods<=0)throw new IllegalArgumentException("Periods must be positive");
  return initial.add(income.subtract(expense).multiply(BigDecimal.valueOf(periods)));
 }
}
