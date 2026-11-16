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
@Service public class ReportService extends DomainSupport {
 public ReportService(JdbcTemplate db,OwnedRepository repo){super(db,repo);}
public Map<String,Object> report(long uid,String start,String end){LocalDate s,e;try{s=LocalDate.parse(start);e=LocalDate.parse(end);}catch(Exception ex){throw bad("Định dạng ngày không hợp lệ");}if(s.isAfter(e))throw bad("Khoảng ngày không hợp lệ");var totals=db.queryForList("SELECT type,SUM(amount) AS total FROM dbo.transactions WHERE user_id=? AND is_sample_data=0 AND transaction_date BETWEEN ? AND ? GROUP BY type",uid,s,e);var byCategory=db.queryForList("SELECT c.name,SUM(t.amount) AS total FROM dbo.transactions t LEFT JOIN dbo.categories c ON t.category_id=c.category_id WHERE t.user_id=? AND t.is_sample_data=0 AND t.type='CHI' AND t.transaction_date BETWEEN ? AND ? GROUP BY c.name ORDER BY total DESC",uid,s,e);return Map.of("totals",totals,"expense_by_category",byCategory);}
public List<Map<String,Object>> monthly(long uid,int year){if(year<2000||year>2100)throw bad("Năm không hợp lệ");return db.queryForList("SELECT MONTH(transaction_date) AS month,type,SUM(amount) AS total FROM dbo.transactions WHERE user_id=? AND is_sample_data=0 AND transaction_date>=? AND transaction_date<? GROUP BY MONTH(transaction_date),type ORDER BY month",uid,LocalDate.of(year,1,1),LocalDate.of(year+1,1,1));}
 /** Budget review works on a single owned budget, to avoid double-counting overlapping periods. */
 public Map<String,Object> review(long uid,long bid){
  require("budgets",bid,uid);
  var budget=db.queryForMap("SELECT * FROM dbo.budgets WHERE budget_id=?",bid);
  var totals=db.queryForList("SELECT type,COALESCE(SUM(amount),0) AS total FROM dbo.transactions WHERE user_id=? AND is_sample_data=0 AND transaction_date BETWEEN ? AND ? GROUP BY type",uid,budget.get("start_date"),budget.get("end_date"));
  BigDecimal income=BigDecimal.ZERO, expense=BigDecimal.ZERO;
  for(var r:totals){if("THU".equals(r.get("type")))income=(BigDecimal)r.get("total");else if("CHI".equals(r.get("type")))expense=(BigDecimal)r.get("total");}
  BigDecimal limit=(BigDecimal)budget.get("total_limit");
  var plan=db.queryForList("SELECT expected_income,planned_saving FROM dbo.budget_plans WHERE budget_id=?",bid);
  Map<String,Object> result=new LinkedHashMap<>();result.put("budget",budget);result.put("income_actual",income);result.put("expense_actual",expense);result.put("net_cashflow",income.subtract(expense));result.put("variance",limit.subtract(expense));result.put("usage_rate",FinanceCalculations.percentage(expense,limit));result.put("categories",db.queryForList("SELECT c.name,bi.limit_amount,COALESCE(SUM(t.amount),0) AS spent_amount FROM dbo.budget_items bi JOIN dbo.categories c ON c.category_id=bi.category_id LEFT JOIN dbo.transactions t ON t.category_id=bi.category_id AND t.user_id=? AND t.type='CHI' AND t.is_sample_data=0 AND t.transaction_date BETWEEN ? AND ? WHERE bi.budget_id=? GROUP BY c.name,bi.limit_amount ORDER BY c.name",uid,budget.get("start_date"),budget.get("end_date"),bid));
  if(!plan.isEmpty()){result.putAll(plan.get(0));result.put("income_variance",income.subtract((BigDecimal)plan.get(0).get("expected_income")));}
  String advice=expense.compareTo(limit)>0?"Chi tiêu vượt kế hoạch. Hãy xem lại các danh mục chi linh hoạt trước kỳ tới.":income.compareTo(expense)<0?"Chi tiêu đang lớn hơn thu nhập thực tế. Hãy rà soát nguồn thu và khoản chi thiết yếu.":"Bạn đang trong hạn mức chi. Hãy đánh giá khoản dự phòng trước khi tăng chi tiêu.";
  result.put("recommendation",advice);result.put("lesson_slug",expense.compareTo(limit)>0?"needs-wants":"end-of-month");
  var excess=db.queryForList("SELECT c.name,bi.limit_amount,COALESCE(SUM(t.amount),0) AS spent FROM dbo.budget_items bi JOIN dbo.categories c ON c.category_id=bi.category_id LEFT JOIN dbo.transactions t ON t.user_id=? AND t.category_id=bi.category_id AND t.is_sample_data=0 AND t.type=N'CHI' AND t.transaction_date BETWEEN ? AND ? WHERE bi.budget_id=? GROUP BY c.name,bi.limit_amount HAVING COALESCE(SUM(t.amount),0)>bi.limit_amount ORDER BY spent DESC",uid,budget.get("start_date"),budget.get("end_date"),bid);
  result.put("over_limit_categories",excess);
  var saved=db.queryForList("SELECT reason,improvement_action,status,updated_at FROM dbo.budget_reviews WHERE budget_id=? AND user_id=?",bid,uid);
  if(!saved.isEmpty())result.put("reflection",saved.get(0));
  return result;
 }

}
