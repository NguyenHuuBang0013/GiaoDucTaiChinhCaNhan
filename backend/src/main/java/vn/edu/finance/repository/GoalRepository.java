package vn.edu.finance.repository;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
/** SQL access for goals; always require a user ID for owned resources. */
@Repository public class GoalRepository extends OwnedRepository {
 public GoalRepository(JdbcTemplate db){super(db);}
 public List<Map<String,Object>> findByUser(long uid){return listOwned("financial_goals",uid);}
 public boolean belongsTo(long id,long uid){return owned("financial_goals","goal_id",id,uid);}
}
