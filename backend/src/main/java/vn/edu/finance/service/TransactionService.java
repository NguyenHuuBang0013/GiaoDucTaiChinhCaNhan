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

import vn.edu.finance.repository.TransactionRepository;
import org.springframework.stereotype.Service;
/** transactions business rules and transactional operations. */
@Service public class TransactionService extends DomainSupport {
 private final TransactionRepository domainRepository;
 public TransactionService(JdbcTemplate db,OwnedRepository repo,TransactionRepository domainRepository){super(db,repo);this.domainRepository=domainRepository;}
 public List<Map<String,Object>> list(long uid){return domainRepository.findByUser(uid);}
 @Transactional public void save(long uid,Long id,Map<String,Object> b){
 boolean edit=id!=null;
 String type=str(b,"type");if(!List.of("THU","CHI").contains(type))throw bad("Loại phải THU/CHI");Object c=b.get("category_id");Long cid=c==null||Objects.toString(c).isBlank()?null:lid(c);if("CHI".equals(type)&&cid==null)throw bad("Chi tiêu phải có danh mục");if(cid!=null)category(uid,cid,type);
    var amount=money(b,"amount",true);var day=date(b,"transaction_date");String note=str(b,"note");
    if(edit){require("transactions",id,uid);db.update("UPDATE dbo.transactions SET category_id=?,type=?,amount=?,transaction_date=?,note=? WHERE transaction_id=?",cid,type,amount,day,note,id);}
    else db.update("INSERT INTO dbo.transactions(user_id,category_id,type,amount,transaction_date,note) VALUES(?,?,?,?,?,?)",uid,cid,type,amount,day,note);
 }
 @Transactional public void delete(long uid,long id){
 require("transactions",id,uid);
 
 
 db.update("DELETE FROM dbo.recurring_postings WHERE transaction_id=?",id);
 db.update("DELETE FROM dbo.transactions WHERE transaction_id=? AND user_id=?",id,uid);
 }
 
 @Transactional public Map<String,Object> importBatch(long uid,List<Map<String,Object>> entries){if(entries==null||entries.isEmpty()||entries.size()>300)throw bad("Chọn 1-300 giao dịch mỗi lần nhập");for(Map<String,Object> item:entries)save(uid,null,item);return Map.of("imported",entries.size());}
}
