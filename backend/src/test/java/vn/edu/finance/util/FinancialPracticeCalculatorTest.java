package vn.edu.finance.util;

import static org.junit.jupiter.api.Assertions.*;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class FinancialPracticeCalculatorTest {
 private BigDecimal value(String s){return new BigDecimal(s);}
 @Test void balancedBudgetWithFlexibleReductionScoresWell(){
  var result=FinancialPracticeCalculator.evaluate(value("2000000"),value("1500000"),value("600000"),value("1100000"),value("600000"),"REDUCE_FLEXIBLE");
  assertEquals(new BigDecimal("200000"),result.get("unallocated"));
  assertEquals(100,result.get("score"));
 }
 @Test void overallocatedBudgetIsFlagged(){
  var result=FinancialPracticeCalculator.evaluate(value("3500000"),value("2000000"),value("600000"),value("1200000"),value("600000"),"BORROW");
  assertTrue(((BigDecimal)result.get("unallocated")).signum()<0);
  assertTrue(((Integer)result.get("score"))<100);
 }
 @Test void invalidInputsAreRejected(){
  assertThrows(IllegalArgumentException.class,()->FinancialPracticeCalculator.evaluate(value("-1"),value("0"),value("0"),value("0"),value("0"),"BORROW"));
  assertThrows(IllegalArgumentException.class,()->FinancialPracticeCalculator.evaluate(value("1"),value("0"),value("0"),value("0"),value("0"),"INVALID"));
 }
}
