
package vn.edu.finance.repository;

import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ScenarioRepository extends OwnedRepository {

    public ScenarioRepository(JdbcTemplate db) {
        super(db);
    }

    public List<Map<String, Object>> findByUser(long uid) {
        return listOwned("saving_scenarios", uid);
    }

    public boolean belongsTo(long id, long uid) {
        return owned("saving_scenarios", "scenario_id", id, uid);
    }
}
