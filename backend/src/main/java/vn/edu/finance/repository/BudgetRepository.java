package vn.edu.finance.repository;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
/** SQL access for budgets; always require a user ID for owned resources. */
@Repository public class BudgetRepository extends OwnedRepository {
 public BudgetRepository(JdbcTemplate db){super(db);}
 public List<Map<String,Object>> findByUser(long uid){return listOwned("budgets",uid);}
 public boolean belongsTo(long id,long uid){return owned("budgets","budget_id",id,uid);}
}
