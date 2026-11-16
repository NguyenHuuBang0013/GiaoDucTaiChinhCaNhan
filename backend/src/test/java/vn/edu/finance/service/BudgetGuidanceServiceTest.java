package vn.edu.finance.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

class BudgetGuidanceServiceTest {
 @Test void suggestedAllocationsBalanceToIncomeMinusSaving() {
  JdbcTemplate db=mock(JdbcTemplate.class);
  java.util.List<Map<String,Object>> sample=new java.util.ArrayList<>();
  sample.add(new java.util.HashMap<>(Map.of("category_id",1L,"name","Nhà","spending_group","NEED","cost_nature","FIXED")));
  sample.add(new java.util.HashMap<>(Map.of("category_id",2L,"name","Giải trí","spending_group","WANT","cost_nature","VARIABLE")));
  when(db.queryForList(anyString(),eq(7L))).thenReturn(sample);
  var result=new BudgetGuidanceService(db).suggest(7L,Map.of("income","10000000"));
  assertEquals(new BigDecimal("2000000.00"),result.get("planned_saving"));
  assertEquals(new BigDecimal("8000000.00"),result.get("recommended_total_limit"));
  @SuppressWarnings("unchecked")
  var rows=(List<Map<String,Object>>)result.get("items");
  assertEquals(2,rows.size());
  BigDecimal total=rows.stream().map(row->(BigDecimal)row.get("recommended_limit")).reduce(BigDecimal.ZERO,BigDecimal::add);
  assertEquals(new BigDecimal("8000000.00"),total);
 }
 @Test void proposalRejectsSavingAboveIncome() {
  JdbcTemplate db=mock(JdbcTemplate.class);
  assertThrows(org.springframework.web.server.ResponseStatusException.class,
   ()->new BudgetGuidanceService(db).suggest(7L,Map.of("income","1000","saving","1200")));
 }
}
