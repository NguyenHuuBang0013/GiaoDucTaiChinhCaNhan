package vn.edu.finance.repository;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
/** SQL access for transactions; always require a user ID for owned resources. */
@Repository public class TransactionRepository extends OwnedRepository {
 public TransactionRepository(JdbcTemplate db){super(db);}
 public List<Map<String,Object>> findByUser(long uid){return listOwned("transactions",uid);}
 public boolean belongsTo(long id,long uid){return owned("transactions","transaction_id",id,uid);}
}
