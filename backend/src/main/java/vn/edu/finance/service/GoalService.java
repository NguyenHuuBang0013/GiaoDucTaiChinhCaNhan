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

import vn.edu.finance.repository.GoalRepository;
import org.springframework.stereotype.Service;
/** goals business rules and transactional operations. */
@Service public class GoalService extends DomainSupport {
 private final GoalRepository domainRepository;
 public GoalService(JdbcTemplate db,OwnedRepository repo,GoalRepository domainRepository){super(db,repo);this.domainRepository=domainRepository;}
 public List<Map<String,Object>> list(long uid){return domainRepository.findByUser(uid);}
 @Transactional public void save(long uid,Long id,Map<String,Object> b){
 boolean edit=id!=null;
 named(str(b,"name"),150);var target=money(b,"target_amount",true);var dl=date(b,"deadline");if(edit){require("goals",id,uid);db.update("UPDATE dbo.financial_goals SET name=?,target_amount=?,deadline=? WHERE goal_id=?",str(b,"name"),target,dl,id);refreshGoal(uid,id);}else db.update("INSERT INTO dbo.financial_goals(user_id,name,target_amount,deadline,status) VALUES(?,?,?,?,?)",uid,str(b,"name"),target,dl,dl.isBefore(LocalDate.now())?"Overdue":"Planned");
 }
 @Transactional public void delete(long uid,long id){
 require("goals",id,uid);
 db.update("DELETE FROM dbo.goal_contributions WHERE goal_id=?",id);
 
 db.update("DELETE FROM dbo.financial_goals WHERE goal_id=? AND user_id=?",id,uid);
 }
 public List<Map<String,Object>> contributions(long uid,long goal){require("goals",goal,uid);return db.queryForList("SELECT * FROM dbo.goal_contributions WHERE goal_id=? ORDER BY contribution_date DESC,contribution_id DESC",goal);}
@Transactional public void addContribution(long uid,long goal,Map<String,Object>b){require("goals",goal,uid);db.update("INSERT INTO dbo.goal_contributions(goal_id,amount,contribution_date,note) VALUES(?,?,?,?)",goal,money(b,"amount",true),date(b,"contribution_date"),str(b,"note"));refreshGoal(uid,goal);}
@Transactional public void updateContribution(long uid,long goal,long id,Map<String,Object>b){require("goals",goal,uid);int count=db.update("UPDATE dbo.goal_contributions SET amount=?,contribution_date=?,note=? WHERE goal_id=? AND contribution_id=?",money(b,"amount",true),date(b,"contribution_date"),str(b,"note"),goal,id);if(count==0)throw bad("Khoản đóng góp không tồn tại");refreshGoal(uid,goal);}
@Transactional public void deleteContribution(long uid,long goal,long id){require("goals",goal,uid);db.update("DELETE FROM dbo.goal_contributions WHERE goal_id=? AND contribution_id=?",goal,id);refreshGoal(uid,goal);}
private void refreshGoal(long uid,long goal){var m=goalTracking(uid,goal);db.update("UPDATE dbo.financial_goals SET status=? WHERE goal_id=?",m.get("computed_status"),goal);}
public Map<String,Object> goalTracking(long uid,long goal){require("goals",goal,uid);var g=db.queryForMap("SELECT * FROM dbo.financial_goals WHERE goal_id=?",goal);var sum=db.queryForObject("SELECT COALESCE(SUM(amount),0) FROM dbo.goal_contributions WHERE goal_id=?",BigDecimal.class,goal);BigDecimal target=(BigDecimal)g.get("target_amount");Map<String,Object> result=new LinkedHashMap<>(g);result.put("current_amount",sum);result.put("progress",FinanceCalculations.percentage(sum,target));result.put("computed_status",sum.compareTo(target)>=0?"Achieved":LocalDate.now().isAfter(toLocalDate(g.get("deadline")))?"Overdue":sum.signum()==0?"Planned":"InProgress");return result;}
}
