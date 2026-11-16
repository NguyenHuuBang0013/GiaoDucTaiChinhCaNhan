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

import vn.edu.finance.repository.CategoryRepository;
import org.springframework.stereotype.Service;
/** categories business rules and transactional operations. */
@Service public class CategoryService extends DomainSupport {
 private final CategoryRepository domainRepository;
 public CategoryService(JdbcTemplate db,OwnedRepository repo,CategoryRepository domainRepository){super(db,repo);this.domainRepository=domainRepository;}
 public List<Map<String,Object>> list(long uid){return domainRepository.findByUser(uid);}
 @Transactional public void save(long uid,Long id,Map<String,Object> b){
 boolean edit=id!=null;
 named(str(b,"name"),100);String type=str(b,"category_type");if(!List.of("THU","CHI").contains(type))throw bad("Danh mục phải THU hoặc CHI");
 String group=type.equals("CHI")?str(b,"spending_group"):"";
 String nature=type.equals("CHI")?str(b,"cost_nature"):"";
 if(!group.isEmpty() && !List.of("NEED","WANT").contains(group))throw bad("Nhóm chi chỉ có NEED hoặc WANT");
 if(!nature.isEmpty() && !List.of("FIXED","VARIABLE").contains(nature))throw bad("Tính chất chi không hợp lệ");
 Object g=group.isEmpty()?null:group, n=nature.isEmpty()?null:nature;
    if(edit){require("categories",id,uid);if(!db.queryForList("SELECT 1 FROM dbo.recurring_transactions WHERE category_id=? AND type<>?",id,type).isEmpty())throw bad("Không thể đổi loại danh mục đang được giao dịch định kỳ sử dụng");db.update("UPDATE dbo.categories SET name=?, category_type=?, spending_group=?, cost_nature=? WHERE category_id=?",str(b,"name"),type,g,n,id);}
    else db.update("INSERT INTO dbo.categories(user_id,name,category_type,spending_group,cost_nature) VALUES(?,?,?,?,?)",uid,str(b,"name"),type,g,n);
 }
 @Transactional public void delete(long uid,long id){
 require("categories",id,uid);
 
 if(!db.queryForList("SELECT 1 FROM dbo.transactions WHERE category_id=?",id).isEmpty()||!db.queryForList("SELECT 1 FROM dbo.budget_items WHERE category_id=?",id).isEmpty()||!db.queryForList("SELECT 1 FROM dbo.recurring_transactions WHERE category_id=?",id).isEmpty())throw bad("Danh mục đang được sử dụng");
 db.update("DELETE FROM dbo.categories WHERE category_id=? AND user_id=?",id,uid);
 }
 
}
