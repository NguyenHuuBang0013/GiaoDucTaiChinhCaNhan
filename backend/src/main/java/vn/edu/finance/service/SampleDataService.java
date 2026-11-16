package vn.edu.finance.service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import vn.edu.finance.repository.OwnedRepository;
import vn.edu.finance.util.FinanceCalculations;
import org.springframework.stereotype.Service;
@Service public class SampleDataService extends DomainSupport {
 public SampleDataService(JdbcTemplate db,OwnedRepository repo){super(db,repo);}
public Map<String,Object> preview(long uid){
 long transactions=db.queryForObject("SELECT COUNT(*) FROM dbo.transactions WHERE user_id=? AND is_sample_data=1",Long.class,uid);
 long budgets=db.queryForObject("SELECT COUNT(*) FROM dbo.budgets WHERE user_id=? AND is_sample_data=1",Long.class,uid);
 long goals=db.queryForObject("SELECT COUNT(*) FROM dbo.financial_goals WHERE user_id=? AND is_sample_data=1",Long.class,uid);
 long scenarios=db.queryForObject("SELECT COUNT(*) FROM dbo.saving_scenarios WHERE user_id=? AND is_sample_data=1",Long.class,uid);
 var totals=db.queryForList("SELECT type,SUM(amount) AS total FROM dbo.transactions WHERE user_id=? AND is_sample_data=1 GROUP BY type",uid);
 // Read-only, owner-scoped preview. Sample rows never enter genuine personal reports.
 var sampleTransactions=db.queryForList("SELECT t.transaction_id,t.category_id,t.type,t.amount,t.transaction_date,t.note,c.name AS category_name FROM dbo.transactions t LEFT JOIN dbo.categories c ON c.category_id=t.category_id WHERE t.user_id=? AND t.is_sample_data=1 ORDER BY t.transaction_date DESC,t.transaction_id DESC",uid);
 var sampleCategories=db.queryForList("SELECT DISTINCT c.category_id,c.name,c.category_type,c.spending_group,c.cost_nature FROM dbo.categories c WHERE c.user_id=? AND (c.is_sample_data=1 OR EXISTS(SELECT 1 FROM dbo.transactions t WHERE t.user_id=? AND t.is_sample_data=1 AND t.category_id=c.category_id) OR EXISTS(SELECT 1 FROM dbo.budget_items bi JOIN dbo.budgets b ON b.budget_id=bi.budget_id WHERE b.user_id=? AND b.is_sample_data=1 AND bi.category_id=c.category_id)) ORDER BY c.category_id",uid,uid,uid);
 var sampleBudgetItems=db.queryForList("SELECT bi.budget_item_id,bi.budget_id,bi.category_id,bi.limit_amount,c.name AS category_name FROM dbo.budget_items bi JOIN dbo.budgets b ON b.budget_id=bi.budget_id LEFT JOIN dbo.categories c ON c.category_id=bi.category_id WHERE b.user_id=? AND b.is_sample_data=1 ORDER BY bi.budget_id,bi.budget_item_id",uid);
 var sampleContributions=db.queryForList("SELECT gc.contribution_id,gc.goal_id,gc.amount,gc.contribution_date,gc.note FROM dbo.goal_contributions gc JOIN dbo.financial_goals g ON g.goal_id=gc.goal_id WHERE g.user_id=? AND g.is_sample_data=1 ORDER BY gc.contribution_date DESC",uid);
 var sampleBudgets=db.queryForList("SELECT budget_id,name,start_date,end_date,total_limit,status FROM dbo.budgets WHERE user_id=? AND is_sample_data=1 ORDER BY start_date DESC,budget_id DESC",uid);
 var sampleGoals=db.queryForList("SELECT goal_id,name,target_amount,deadline,status FROM dbo.financial_goals WHERE user_id=? AND is_sample_data=1 ORDER BY goal_id DESC",uid);
 var sampleScenarios=db.queryForList("SELECT scenario_id,name,income_per_period,expense_per_period,period_unit,duration,initial_saving FROM dbo.saving_scenarios WHERE user_id=? AND is_sample_data=1 ORDER BY scenario_id DESC",uid);
 Map<String,Object> result=new LinkedHashMap<>();
 result.put("sample_transactions",transactions);result.put("sample_budgets",budgets);
 result.put("sample_goals",goals);result.put("sample_scenarios",scenarios);
 result.put("sample_totals",totals);result.put("categories",sampleCategories);result.put("budget_items",sampleBudgetItems);result.put("contributions",sampleContributions);result.put("transactions",sampleTransactions);
 result.put("budgets",sampleBudgets);result.put("goals",sampleGoals);result.put("scenarios",sampleScenarios);
 result.put("message","Dữ liệu mẫu được lưu riêng để thực hành; bạn có thể xem trên các trang tài chính bằng cách chọn chế độ Dữ liệu mẫu.");
 return result;
}
@Transactional public void sample(long uid){
 // Reproducible, scoped demo set; repeated clicks do not duplicate sample rows.
 if(!db.queryForList("SELECT TOP 1 transaction_id FROM dbo.transactions WHERE user_id=? AND is_sample_data=1",uid).isEmpty())throw bad("Dữ liệu mẫu đã tồn tại. Hãy xóa dữ liệu mẫu trước khi tạo lại.");
 String[] categoryNames={"Ăn uống (mẫu)","Đi lại (mẫu)","Học tập (mẫu)","Thu nhập (mẫu)"};
 long[] ids=new long[categoryNames.length];
 for(int i=0;i<categoryNames.length;i++){
   String type=i==3?"THU":"CHI";
   var rows=db.queryForList("SELECT category_id FROM dbo.categories WHERE user_id=? AND name=? AND category_type=?",Long.class,uid,categoryNames[i],type);
   if(!rows.isEmpty())ids[i]=rows.get(0);
   else ids[i]=db.queryForObject("INSERT INTO dbo.categories(user_id,name,category_type,is_sample_data) OUTPUT INSERTED.category_id VALUES(?,?,?,1)",Long.class,uid,categoryNames[i],type);
 }
 LocalDate base=LocalDate.now().withDayOfMonth(1);
 for(int m=3;m>=0;m--){LocalDate start=base.minusMonths(m);LocalDate end=start.plusMonths(1).minusDays(1);
  db.update("INSERT INTO dbo.transactions(user_id,category_id,type,amount,transaction_date,note,is_sample_data) VALUES(?,?,?,?,?,?,1)",uid,ids[3],"THU",new BigDecimal("8500000"),start.plusDays(1),"Thu nhập tháng (mẫu)");
  for(int c=0;c<3;c++)for(int n=0;n<3;n++){
   BigDecimal amount=new BigDecimal(80000+(c*35000)+(n*12000)+(m*5000));
   db.update("INSERT INTO dbo.transactions(user_id,category_id,type,amount,transaction_date,note,is_sample_data) VALUES(?,?,?,?,?,?,1)",uid,ids[c],"CHI",amount,start.plusDays(3+c*6+n*2),categoryNames[c]+" - thực hành");
  }
  Long budget=db.queryForObject("INSERT INTO dbo.budgets(user_id,name,start_date,end_date,total_limit,status,is_sample_data) OUTPUT INSERTED.budget_id VALUES(?,?,?,?,?,?,1)",Long.class,uid,"Ngân sách thực hành "+start.getMonthValue()+"/"+start.getYear(),start,end,new BigDecimal("4500000"),end.isBefore(LocalDate.now())?"Closed":"Active");
  for(int c=0;c<3;c++)db.update("INSERT INTO dbo.budget_items(budget_id,category_id,limit_amount) VALUES(?,?,?)",budget,ids[c],new BigDecimal(c==0?"2000000":c==1?"1000000":"1500000"));
 }
 Long goal=db.queryForObject("INSERT INTO dbo.financial_goals(user_id,name,target_amount,deadline,status,is_sample_data) OUTPUT INSERTED.goal_id VALUES(?,?,?,?,?,1)",Long.class,uid,"Quỹ dự phòng (mẫu)",new BigDecimal("10000000"),LocalDate.now().plusMonths(8),"InProgress");
 for(int n=2;n>=0;n--)db.update("INSERT INTO dbo.goal_contributions(goal_id,amount,contribution_date,note) VALUES(?,?,?,?)",goal,new BigDecimal("900000"),base.minusMonths(n).plusDays(8),"Đóng góp thực hành");
 db.update("INSERT INTO dbo.saving_scenarios(user_id,name,income_per_period,expense_per_period,period_unit,duration,initial_saving,is_sample_data) VALUES(?,?,?,?,?,?,?,1)",uid,"Tiết kiệm 12 tháng (mẫu)",new BigDecimal("8500000"),new BigDecimal("6500000"),"MONTHLY",12,new BigDecimal("2000000"));
}
@Transactional public void deleteData(long uid,boolean onlySamples){String suffix=onlySamples?" AND is_sample_data=1":"";
  db.update("DELETE FROM dbo.goal_contributions WHERE goal_id IN (SELECT goal_id FROM dbo.financial_goals WHERE user_id=?"+suffix+")",uid);
  db.update("DELETE FROM dbo.budget_reviews WHERE budget_id IN (SELECT budget_id FROM dbo.budgets WHERE user_id=?"+suffix+")",uid);
  db.update("DELETE FROM dbo.budget_change_history WHERE budget_id IN (SELECT budget_id FROM dbo.budgets WHERE user_id=?"+suffix+")",uid);
  db.update("DELETE FROM dbo.budget_plans WHERE budget_id IN (SELECT budget_id FROM dbo.budgets WHERE user_id=?"+suffix+")",uid);
  db.update("DELETE FROM dbo.budget_items WHERE budget_id IN (SELECT budget_id FROM dbo.budgets WHERE user_id=?"+suffix+")",uid);
  db.update("DELETE FROM dbo.recurring_postings WHERE transaction_id IN (SELECT transaction_id FROM dbo.transactions WHERE user_id=?"+suffix+")",uid);
  db.update("DELETE FROM dbo.transactions WHERE user_id=?"+suffix,uid);
  if(!onlySamples){
   db.update("DELETE FROM dbo.recurring_postings WHERE recurring_id IN (SELECT recurring_id FROM dbo.recurring_transactions WHERE user_id=?)",uid);
   db.update("DELETE FROM dbo.recurring_transactions WHERE user_id=?",uid);
  }
  db.update("DELETE FROM dbo.financial_goals WHERE user_id=?"+suffix,uid);
  db.update("DELETE FROM dbo.budgets WHERE user_id=?"+suffix,uid);
  db.update("DELETE FROM dbo.saving_scenarios WHERE user_id=?"+suffix,uid);
  if(!onlySamples)db.update("UPDATE dbo.learning_profiles SET monthly_income=0,onboarding_completed=0,updated_at=SYSUTCDATETIME() WHERE user_id=?",uid);
  // Sample categories may be referenced by genuine transactions, so keep those referenced by surviving records.
  db.update("DELETE c FROM dbo.categories c WHERE c.user_id=?"+suffix+" AND NOT EXISTS(SELECT 1 FROM dbo.transactions t WHERE t.category_id=c.category_id) AND NOT EXISTS(SELECT 1 FROM dbo.budget_items bi WHERE bi.category_id=c.category_id) AND NOT EXISTS(SELECT 1 FROM dbo.recurring_transactions r WHERE r.category_id=c.category_id)",uid);
 }
}
