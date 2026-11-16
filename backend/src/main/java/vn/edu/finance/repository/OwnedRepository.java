package vn.edu.finance.repository;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.context.annotation.Primary;
/** All per-user queries are scoped by the authenticated user ID. */
@Primary @Repository public class OwnedRepository {
 protected final JdbcTemplate db;
 public OwnedRepository(JdbcTemplate db){this.db=db;}
 public boolean owned(String table,String pk,long id,long uid){
  if(!Set.of("categories","transactions","budgets","financial_goals","saving_scenarios").contains(table))throw new IllegalArgumentException("Invalid table");
  if(!Set.of("category_id","transaction_id","budget_id","goal_id","scenario_id").contains(pk))throw new IllegalArgumentException("Invalid key");
  return !db.queryForList("SELECT 1 FROM dbo."+table+" WHERE "+pk+"=? AND user_id=? AND is_sample_data=0",id,uid).isEmpty();
 }
 public List<Map<String,Object>> listOwned(String table,long uid){
  if(!Set.of("categories","transactions","budgets","financial_goals","saving_scenarios").contains(table))throw new IllegalArgumentException("Invalid table");
  return db.queryForList("SELECT * FROM dbo."+table+" WHERE user_id=? AND is_sample_data=0 ORDER BY 1 DESC",uid);
 }
}
