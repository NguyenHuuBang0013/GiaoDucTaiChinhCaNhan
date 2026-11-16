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
import vn.edu.finance.dto.request.BudgetCreateRequest;

import vn.edu.finance.repository.BudgetRepository;
import org.springframework.stereotype.Service;
/** budgets business rules and transactional operations. */
@Service public class BudgetService extends DomainSupport {
 private final BudgetRepository domainRepository;
 public BudgetService(JdbcTemplate db,OwnedRepository repo,BudgetRepository domainRepository){super(db,repo);this.domainRepository=domainRepository;}
 private void noOverlap(long uid,LocalDate start,LocalDate end,Long except){
  String q="SELECT TOP(1) budget_id FROM dbo.budgets WITH (UPDLOCK,HOLDLOCK) WHERE user_id=? AND is_sample_data=0 AND start_date<=? AND end_date>=?"+(except==null?"":" AND budget_id<>?");
  List<Map<String,Object>> overlaps=except==null?db.queryForList(q,uid,end,start):db.queryForList(q,uid,end,start,except);
  if(!overlaps.isEmpty())throw bad("Đã có ngân sách giao với khoảng ngày này. Hãy điều chỉnh kỳ để tránh tính trùng giao dịch.");
 }
 private BigDecimal nonnegative(Map<String,Object> input,String key){
  Object value=input.get(key);if(value==null||String.valueOf(value).isBlank())return null;
  return money(input,key,false);
 }
 private void setPlan(long bid,Map<String,Object> input){
  BigDecimal income=nonnegative(input,"expected_income"),saving=nonnegative(input,"planned_saving");
  if(income==null && saving==null)return;
  if(income==null||saving==null)throw bad("Cần nhập cả thu nhập dự kiến và số tiền tiết kiệm dự kiến");
  BigDecimal limit=db.queryForObject("SELECT total_limit FROM dbo.budgets WHERE budget_id=?",BigDecimal.class,bid);
  if(income.compareTo(limit.add(saving))<0)throw bad("Thu nhập dự kiến phải đủ cho hạn mức chi và phần tiết kiệm; hãy điều chỉnh kế hoạch");
  db.update("UPDATE dbo.budget_plans SET expected_income=?, planned_saving=? WHERE budget_id=?",income,saving,bid);
  if(db.queryForObject("SELECT COUNT(*) FROM dbo.budget_plans WHERE budget_id=?",Integer.class,bid)==0)
   db.update("INSERT INTO dbo.budget_plans(budget_id,expected_income,planned_saving) VALUES (?,?,?)",bid,income,saving);
 }
 @Transactional public Map<String,Object> updatePlan(long uid,long bid,Map<String,Object> plan){require("budgets",bid,uid);setPlan(bid,plan);return budgetTracking(uid,bid);}
 public List<Map<String,Object>> list(long uid){var rows=domainRepository.findByUser(uid);for(var row:rows){long id=((Number)row.get("budget_id")).longValue();row.put("status",budgetTracking(uid,id).get("computed_status"));}return rows;}
 @Transactional public void save(long uid,Long id,Map<String,Object> b){
 boolean edit=id!=null;
 var start=date(b,"start_date");var end=date(b,"end_date");if(start.isAfter(end))throw bad("Khoảng thời gian không hợp lệ");var total=money(b,"total_limit",true);noOverlap(uid,start,end,id);String name=str(b,"name");named(name,150);if(edit){require("budgets",id,uid);BigDecimal allocated=db.queryForObject("SELECT COALESCE(SUM(limit_amount),0) FROM dbo.budget_items WHERE budget_id=?",BigDecimal.class,id);if(allocated.compareTo(total)>0)throw bad("Hạn mức mới nhỏ hơn tổng phân bổ hiện tại");
 var oldPlan=db.queryForList("SELECT expected_income,planned_saving FROM dbo.budget_plans WHERE budget_id=?",id);
 if(!oldPlan.isEmpty() && !b.containsKey("expected_income") && ((BigDecimal)oldPlan.get(0).get("expected_income")).compareTo(total.add((BigDecimal)oldPlan.get(0).get("planned_saving")))<0)
  throw bad("Hạn mức mới vượt kế hoạch thu nhập và tiết kiệm. Hãy điều chỉnh kế hoạch trước khi sửa hạn mức");}
    if(edit){require("budgets",id,uid);
     BigDecimal oldLimit=db.queryForObject("SELECT total_limit FROM dbo.budgets WHERE budget_id=?",BigDecimal.class,id);
     if(oldLimit.compareTo(total)!=0){
       String reason=Objects.toString(b.getOrDefault("change_reason","Điều chỉnh ngân sách"),"").trim();
       if(reason.isEmpty() || reason.length()>500)throw bad("Lý do điều chỉnh phải có 1–500 ký tự");
       db.update("INSERT INTO dbo.budget_change_history(budget_id,user_id,old_limit,new_limit,reason) VALUES(?,?,?,?,?)",id,uid,oldLimit,total,reason);
     }
     db.update("UPDATE dbo.budgets SET name=?,start_date=?,end_date=?,total_limit=?,status=? WHERE budget_id=?",name,start,end,total,start.isAfter(LocalDate.now())?"Draft":end.isBefore(LocalDate.now())?"Closed":"Active",id);}
    else db.update("INSERT INTO dbo.budgets(user_id,name,start_date,end_date,total_limit,status) VALUES(?,?,?,?,?,?)",uid,name,start,end,total,start.isAfter(LocalDate.now())?"Draft":end.isBefore(LocalDate.now())?"Closed":"Active");
  if(edit)setPlan(id,b);
 }
 @Transactional public void delete(long uid,long id){
 require("budgets",id,uid);
 db.update("DELETE FROM dbo.budget_reviews WHERE budget_id=?",id);
 db.update("DELETE FROM dbo.budget_change_history WHERE budget_id=?",id);
 db.update("DELETE FROM dbo.budget_plans WHERE budget_id=?",id);
 db.update("DELETE FROM dbo.budget_items WHERE budget_id=?",id);
 
 db.update("DELETE FROM dbo.budgets WHERE budget_id=? AND user_id=?",id,uid);
 }
 public List<Map<String,Object>> budgetItems(long uid,long bid){require("budgets",bid,uid);return db.queryForList("SELECT bi.* , c.name AS category_name FROM dbo.budget_items bi JOIN dbo.categories c ON c.category_id=bi.category_id WHERE bi.budget_id=?",bid);}
@Transactional public void addBudgetItem(long uid,long bid,Map<String,Object>b){require("budgets",bid,uid);long cid=lid(b.get("category_id"));category(uid,cid,"CHI");var amount=money(b,"limit_amount",true);ensureAllocation(bid,cid,amount,null);db.update("INSERT INTO dbo.budget_items(budget_id,category_id,limit_amount) VALUES (?,?,?)",bid,cid,amount);}
private void ensureAllocation(long bid,long cid,BigDecimal amount,Long except){
  db.queryForList("SELECT budget_id FROM dbo.budgets WITH (UPDLOCK, HOLDLOCK) WHERE budget_id=?",bid);
  String exclusion=except==null?"":" AND budget_item_id<>?";
  Object[] duplicateArgs=except==null?new Object[]{bid,cid}:new Object[]{bid,cid,except};
  if(!db.queryForList("SELECT 1 FROM dbo.budget_items WHERE budget_id=? AND category_id=?"+exclusion,duplicateArgs).isEmpty())throw bad("Danh mục đã được phân bổ trong ngân sách");
  BigDecimal total=db.queryForObject("SELECT total_limit FROM dbo.budgets WHERE budget_id=?",BigDecimal.class,bid);
  Object[] sumArgs=except==null?new Object[]{bid}:new Object[]{bid,except};
  BigDecimal allocated=db.queryForObject("SELECT COALESCE(SUM(limit_amount),0) FROM dbo.budget_items WHERE budget_id=?"+exclusion,BigDecimal.class,sumArgs);
  if(allocated.add(amount).compareTo(total)>0)throw bad("Tổng phân bổ vượt hạn mức ngân sách");
 }
@Transactional public Map<String,Object> createBudgetWithItems(long uid,BudgetCreateRequest request){
  Map<String,Object> b=new HashMap<>();
  b.put("name",request.name());
  b.put("start_date",request.start_date().toString());
  b.put("end_date",request.end_date().toString());
  b.put("total_limit",request.total_limit());
  List<Map<String,Object>> items=new ArrayList<>();
  if(request.items()!=null)for(BudgetCreateRequest.Allocation a:request.items()){
   items.add(Map.of("category_id",a.category_id(),"limit_amount",a.limit_amount()));
  }
  b.put("items",items);
  b.put("expected_income",request.expected_income());b.put("planned_saving",request.planned_saving());
  return persistBudgetWithItems(uid,b);
 }
 private Map<String,Object> persistBudgetWithItems(long uid,Map<String,Object>b){
  String name=str(b,"name");named(name,150);
  LocalDate start=date(b,"start_date"),end=date(b,"end_date");
  if(start.isAfter(end))throw bad("Ngày kết thúc phải sau ngày bắt đầu");
  BigDecimal total=money(b,"total_limit",true);
  noOverlap(uid,start,end,null);
  Object raw=b.get("items");
  if(!(raw instanceof List<?> items))throw bad("items phải là một danh sách");
  Set<Long> ids=new HashSet<>();BigDecimal sum=BigDecimal.ZERO;
  for(Object o:items){
   if(!(o instanceof Map<?,?> rawItem))throw bad("Khoản phân bổ không hợp lệ");
   Map<String,Object> item=new HashMap<>();rawItem.forEach((k,v)->item.put(String.valueOf(k),v));
   long cid=lid(item.get("category_id"));
   if(!ids.add(cid))throw bad("Danh mục phân bổ bị trùng");
   category(uid,cid,"CHI");sum=sum.add(money(item,"limit_amount",true));
  }
  if(sum.compareTo(total)>0)throw bad("Tổng phân bổ vượt ngân sách");
  Long bid=db.queryForObject("INSERT INTO dbo.budgets(user_id,name,start_date,end_date,total_limit,status) OUTPUT INSERTED.budget_id VALUES(?,?,?,?,?,?)",Long.class,uid,name,start,end,total,start.isAfter(LocalDate.now())?"Draft":end.isBefore(LocalDate.now())?"Closed":"Active");
  for(Object o:items){Map<?,?> item=(Map<?,?>)o;db.update("INSERT INTO dbo.budget_items(budget_id,category_id,limit_amount) VALUES(?,?,?)",bid,lid(item.get("category_id")),new BigDecimal(String.valueOf(item.get("limit_amount"))));}
  setPlan(bid,b);
  return Map.of("budget_id",bid,"items_created",items.size());
 }
@Transactional public void updateBudgetItem(long uid,long bid,long itemId,Map<String,Object>b){require("budgets",bid,uid);if(db.queryForList("SELECT 1 FROM dbo.budget_items WHERE budget_id=? AND budget_item_id=?",bid,itemId).isEmpty())throw bad("Khoản phân bổ không tồn tại");long cid=lid(b.get("category_id"));category(uid,cid,"CHI");var amt=money(b,"limit_amount",true);ensureAllocation(bid,cid,amt,itemId);db.update("UPDATE dbo.budget_items SET category_id=?,limit_amount=? WHERE budget_id=? AND budget_item_id=?",cid,amt,bid,itemId);}
@Transactional public void deleteBudgetItem(long uid,long bid,long item){require("budgets",bid,uid);db.update("DELETE FROM dbo.budget_items WHERE budget_id=? AND budget_item_id=?",bid,item);}
public Map<String,Object> budgetTracking(long uid,long bid){require("budgets",bid,uid);var b=db.queryForMap("SELECT * FROM dbo.budgets WHERE budget_id=?",bid);var used=db.queryForObject("SELECT COALESCE(SUM(t.amount),0) FROM dbo.transactions t WHERE t.user_id=? AND t.type='CHI' AND t.is_sample_data=0 AND t.transaction_date BETWEEN ? AND ?",BigDecimal.class,uid,b.get("start_date"),b.get("end_date"));BigDecimal limit=(BigDecimal)b.get("total_limit");Map<String,Object> out=new LinkedHashMap<>(b);var plan=db.queryForList("SELECT expected_income,planned_saving FROM dbo.budget_plans WHERE budget_id=?",bid);if(!plan.isEmpty())out.putAll(plan.get(0));out.put("budget_used",used);out.put("remaining",limit.subtract(used));out.put("usage_rate",FinanceCalculations.percentage(used,limit));out.put("computed_status",LocalDate.now().isBefore(toLocalDate(b.get("start_date")))?"Draft":LocalDate.now().isAfter(toLocalDate(b.get("end_date")))?"Closed":used.compareTo(limit)>=0?"Exceeded":"Active");out.put("items",db.queryForList("SELECT bi.budget_item_id,c.name,bi.limit_amount,COALESCE(SUM(t.amount),0) AS spent_amount FROM dbo.budget_items bi JOIN dbo.categories c ON c.category_id=bi.category_id LEFT JOIN dbo.transactions t ON t.category_id=bi.category_id AND t.user_id=? AND t.type='CHI' AND t.is_sample_data=0 AND t.transaction_date BETWEEN ? AND ? WHERE bi.budget_id=? GROUP BY bi.budget_item_id,c.name,bi.limit_amount",uid,b.get("start_date"),b.get("end_date"),bid));return out;}
}
