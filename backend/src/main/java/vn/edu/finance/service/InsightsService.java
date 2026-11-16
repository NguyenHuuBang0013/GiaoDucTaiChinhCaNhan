package vn.edu.finance.service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
@Service public class InsightsService {
 private final JdbcTemplate db;
 public InsightsService(JdbcTemplate db){this.db=db;}
 public List<Map<String,Object>> alerts(long uid){
  List<Map<String,Object>> out=new ArrayList<>();LocalDate now=LocalDate.now();
  var budgets=db.queryForList("SELECT budget_id,name,start_date,end_date,total_limit FROM dbo.budgets WHERE user_id=? AND is_sample_data=0 AND start_date<=? AND end_date>=?",uid,now,now);
  for(var b:budgets){BigDecimal used=db.queryForObject("SELECT COALESCE(SUM(amount),0) FROM dbo.transactions WHERE user_id=? AND is_sample_data=0 AND type=N'CHI' AND transaction_date BETWEEN ? AND ?",BigDecimal.class,uid,b.get("start_date"),b.get("end_date"));BigDecimal limit=(BigDecimal)b.get("total_limit");double ratio=used.doubleValue()/limit.doubleValue();if(ratio>=.8){out.add(Map.of("kind",ratio>=1?"danger":"warning","title",ratio>=1?"Ngân sách đã vượt hoặc đạt hạn mức":"Ngân sách gần vượt hạn mức","detail",b.get("name")+": đã sử dụng "+Math.round(ratio*100)+"% tổng hạn mức","lesson_slug","needs-wants","route","learning"));}}
  var goals=db.queryForList("SELECT goal_id,name,deadline,target_amount FROM dbo.financial_goals WHERE user_id=? AND is_sample_data=0 AND deadline BETWEEN ? AND ?",uid,now,now.plusDays(30));
  for(var g:goals){BigDecimal saved=db.queryForObject("SELECT COALESCE(SUM(amount),0) FROM dbo.goal_contributions WHERE goal_id=?",BigDecimal.class,g.get("goal_id"));if(saved.compareTo((BigDecimal)g.get("target_amount"))<0)out.add(Map.of("kind","info","title","Mục tiêu sắp đến hạn","detail",g.get("name")+" - hạn "+g.get("deadline"),"lesson_slug","emergency-fund","route","learning"));}
  return out;
 }
}
