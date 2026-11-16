package vn.edu.finance.service;
import java.time.LocalDate;
import java.util.*;
import java.math.BigDecimal;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
@Service public class RecurringService {
 private final JdbcTemplate db;
 public RecurringService(JdbcTemplate db){this.db=db;}
 private Long parseCategory(Object value){try{return Long.parseLong(Objects.toString(value));}catch(Exception e){throw bad("Mã danh mục không hợp lệ");}}
 public List<Map<String,Object>> list(long uid){return db.queryForList("SELECT * FROM dbo.recurring_transactions WHERE user_id=? ORDER BY next_date, recurring_id",uid);}
 @Transactional public void create(long uid,Map<String,Object> b){
  String type=Objects.toString(b.get("type"),"");if(!List.of("THU","CHI").contains(type))throw bad("Loại giao dịch không hợp lệ");
  String frequency=Objects.toString(b.get("frequency"),"");if(!List.of("WEEKLY","MONTHLY").contains(frequency))throw bad("Chu kỳ không hợp lệ");
  BigDecimal amount;LocalDate day;try{amount=new BigDecimal(Objects.toString(b.get("amount")));day=LocalDate.parse(Objects.toString(b.get("next_date")));}catch(Exception e){throw bad("Số tiền hoặc ngày không hợp lệ");}
  if(amount.signum()<=0||amount.scale()>2)throw bad("Số tiền phải lớn hơn 0 và tối đa 2 chữ số thập phân");
  Object raw=b.get("category_id");Long category=raw==null||Objects.toString(raw).isBlank()?null:parseCategory(raw);
  if(type.equals("CHI")&&category==null)throw bad("Khoản chi định kỳ phải có danh mục");
  if(category!=null&&db.queryForList("SELECT 1 FROM dbo.categories WHERE category_id=? AND user_id=? AND category_type=? AND is_sample_data=0",category,uid,type).isEmpty())throw bad("Danh mục không hợp lệ");
  db.update("INSERT INTO dbo.recurring_transactions(user_id,category_id,type,amount,note,next_date,frequency) VALUES(?,?,?,?,?,?,?)",uid,category,type,amount,Objects.toString(b.get("note"),""),day,frequency);
 }
 @Transactional public void delete(long uid,long id){if(db.queryForList("SELECT 1 FROM dbo.recurring_transactions WHERE recurring_id=? AND user_id=?",id,uid).isEmpty())throw bad("Không tìm thấy giao dịch định kỳ");if(db.queryForList("SELECT 1 FROM dbo.recurring_postings WHERE recurring_id=?",id).isEmpty())db.update("DELETE FROM dbo.recurring_transactions WHERE recurring_id=? AND user_id=?",id,uid);else db.update("UPDATE dbo.recurring_transactions SET active=0 WHERE recurring_id=? AND user_id=?",id,uid);}
 @Transactional public Map<String,Object> postDue(long uid){
  var rows=db.queryForList("SELECT * FROM dbo.recurring_transactions WITH (UPDLOCK, HOLDLOCK) WHERE user_id=? AND active=1 AND next_date<=?",uid,LocalDate.now());int posted=0;
  for(var r:rows){long id=((Number)r.get("recurring_id")).longValue();LocalDate day=(r.get("next_date") instanceof LocalDate local?local:((java.sql.Date)r.get("next_date")).toLocalDate());String freq=r.get("frequency").toString();int count=0;
   while(!day.isAfter(LocalDate.now()) && count<24){
    // posting uniqueness enforced by PK(recurring_id, occurrence_date)
    if(db.queryForList("SELECT 1 FROM dbo.recurring_postings WHERE recurring_id=? AND occurrence_date=?",id,day).isEmpty()){
     Long tid=db.queryForObject("INSERT INTO dbo.transactions(user_id,category_id,type,amount,transaction_date,note) OUTPUT INSERTED.transaction_id VALUES(?,?,?,?,?,?)",Long.class,uid,r.get("category_id"),r.get("type"),r.get("amount"),day,r.get("note"));
     db.update("INSERT INTO dbo.recurring_postings(recurring_id,occurrence_date,transaction_id) VALUES(?,?,?)",id,day,tid);posted++;
    }
    day=freq.equals("WEEKLY")?day.plusWeeks(1):day.getDayOfMonth()==day.lengthOfMonth()?day.plusMonths(1).withDayOfMonth(day.plusMonths(1).lengthOfMonth()):day.plusMonths(1);count++;
   }
   db.update("UPDATE dbo.recurring_transactions SET next_date=? WHERE recurring_id=? AND user_id=?",day,id,uid);
  }
  return Map.of("created",posted);
 }
 private ResponseStatusException bad(String msg){return new ResponseStatusException(HttpStatus.BAD_REQUEST,msg);}
}
