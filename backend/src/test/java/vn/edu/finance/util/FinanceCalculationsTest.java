package vn.edu.finance.util;
import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
class FinanceCalculationsTest {
 @Test void ratioExceeded(){assertEquals(new BigDecimal("110.00"), FinanceCalculations.percentage(new BigDecimal("5500000"),new BigDecimal("5000000")));}
 @Test void savingsProjection(){assertEquals(new BigDecimal("20000000"), FinanceCalculations.projectedSaving(new BigDecimal("10000000"),new BigDecimal("7000000"),new BigDecimal("2000000"),6));}
 @Test void negativeSavingsAllowed(){assertEquals(new BigDecimal("-500"), FinanceCalculations.projectedSaving(new BigDecimal("100"),new BigDecimal("200"),new BigDecimal("0"),5));}
 @Test void zeroBudgetForbidden(){assertThrows(IllegalArgumentException.class,()->FinanceCalculations.percentage(BigDecimal.ONE,BigDecimal.ZERO));}
}
