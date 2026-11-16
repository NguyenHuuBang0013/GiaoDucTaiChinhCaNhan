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

/** Common validation and access control; business operations live in domain services. */
public abstract class DomainSupport {
 protected final JdbcTemplate db;
 protected final OwnedRepository repo;
 protected DomainSupport(JdbcTemplate db,OwnedRepository repo){this.db=db;this.repo=repo;}
protected void named(String value,int max){if(value.isBlank()||value.length()>max)throw bad("Tên bắt buộc và tối đa "+max+" ký tự");}
protected String str(Map<String,Object> b,String k){return Objects.toString(b.get(k),"").trim();}
protected BigDecimal money(Map<String,Object> b,String k,boolean positive){try{BigDecimal v=new BigDecimal(Objects.toString(b.get(k),""));if(v.scale()>2 || v.precision()>18 || v.signum()<0||(positive&&v.signum()==0))throw new Exception();return v;}catch(Exception ex){throw bad("Giá trị "+k+" không hợp lệ");}}
protected int integer(Map<String,Object>b,String k){try{return Integer.parseInt(Objects.toString(b.get(k)));}catch(Exception ex){throw bad("Sai số nguyên: "+k);}}
protected LocalDate date(Map<String,Object>b,String k){try{return LocalDate.parse(str(b,k));}catch(Exception ex){throw bad("Ngày "+k+" không hợp lệ (YYYY-MM-DD)");}}
protected ResponseStatusException bad(String s){return new ResponseStatusException(HttpStatus.BAD_REQUEST,s);}
protected long lid(Object o){try{return Long.parseLong(Objects.toString(o));}catch(Exception ex){throw bad("Mã ID không hợp lệ");}}
protected LocalDate toLocalDate(Object o){return o instanceof LocalDate d?d:((java.sql.Date)o).toLocalDate();}
protected void category(long uid,long id,String type){if(db.queryForList("SELECT 1 FROM dbo.categories WHERE category_id=? AND user_id=? AND category_type=? AND is_sample_data=0",id,uid,type).isEmpty())throw bad("Danh mục không thuộc người dùng hoặc sai loại");}
protected String table(String module){return switch(module){case "categories"->"categories";case "transactions"->"transactions";case "budgets"->"budgets";case "goals"->"financial_goals";case "scenarios"->"saving_scenarios";default->throw bad("Module không hợp lệ");};}
protected String key(String module){return switch(module){case "categories"->"category_id";case "transactions"->"transaction_id";case "budgets"->"budget_id";case "goals"->"goal_id";case "scenarios"->"scenario_id";default->throw bad("Module không hợp lệ");};}
protected void require(String module,long id,long uid){if(!repo.owned(table(module),key(module),id,uid))throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Dữ liệu không tồn tại hoặc không thuộc bạn");}
}
