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

import vn.edu.finance.repository.ScenarioRepository;
import org.springframework.stereotype.Service;
/** scenarios business rules and transactional operations. */
@Service public class ScenarioService extends DomainSupport {
 private final ScenarioRepository domainRepository;
 public ScenarioService(JdbcTemplate db,OwnedRepository repo,ScenarioRepository domainRepository){super(db,repo);this.domainRepository=domainRepository;}
 public List<Map<String,Object>> list(long uid){return domainRepository.findByUser(uid);}
 @Transactional public void save(long uid,Long id,Map<String,Object> b){
 boolean edit=id!=null;
 named(str(b,"name"),150);var income=money(b,"income_per_period",false);var expense=money(b,"expense_per_period",false);var initial=money(b,"initial_saving",false);int duration=integer(b,"duration");if(duration<=0)throw bad("Số kỳ phải lớn hơn 0");String period=str(b,"period_unit");if(!List.of("DAILY","WEEKLY","MONTHLY","YEARLY").contains(period))throw bad("Đơn vị kỳ không hợp lệ");
    if(edit){require("scenarios",id,uid);db.update("UPDATE dbo.saving_scenarios SET name=?,income_per_period=?,expense_per_period=?,initial_saving=?,duration=?,period_unit=? WHERE scenario_id=?",str(b,"name"),income,expense,initial,duration,period,id);}
    else db.update("INSERT INTO dbo.saving_scenarios(user_id,name,income_per_period,expense_per_period,initial_saving,duration,period_unit) VALUES(?,?,?,?,?,?,?)",uid,str(b,"name"),income,expense,initial,duration,period);
 }
 @Transactional public void delete(long uid,long id){
 require("scenarios",id,uid);
 db.update("DELETE FROM dbo.saving_scenarios WHERE scenario_id=? AND user_id=?",id,uid);
 }
 public Map<String,Object> simulate(long uid,long id){require("scenarios",id,uid);var b=db.queryForMap("SELECT * FROM dbo.saving_scenarios WHERE scenario_id=?",id);BigDecimal per=((BigDecimal)b.get("income_per_period")).subtract((BigDecimal)b.get("expense_per_period"));BigDecimal estimated=FinanceCalculations.projectedSaving((BigDecimal)b.get("income_per_period"),(BigDecimal)b.get("expense_per_period"),(BigDecimal)b.get("initial_saving"),((Number)b.get("duration")).intValue());return Map.of("scenario",b,"saving_per_period",per,"estimated_saving",estimated);}
public List<Map<String,Object>> compare(long uid,List<Long> ids){if(ids==null||ids.size()<2||ids.size()!=new HashSet<>(ids).size())throw bad("Cần chọn ít nhất hai kịch bản khác nhau");return ids.stream().map(id->simulate(uid,id)).toList();}
}
