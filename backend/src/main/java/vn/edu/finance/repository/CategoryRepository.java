package vn.edu.finance.repository;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
/** SQL access for categories; always require a user ID for owned resources. */
@Repository public class CategoryRepository extends OwnedRepository {
 public CategoryRepository(JdbcTemplate db){super(db);}
 public List<Map<String,Object>> findByUser(long uid){return listOwned("categories",uid);}
 public boolean belongsTo(long id,long uid){return owned("categories","category_id",id,uid);}
}
