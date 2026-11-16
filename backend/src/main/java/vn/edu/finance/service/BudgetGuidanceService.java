package vn.edu.finance.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Transparent budgeting suggestions and persistent end-of-period reflection. */
@Service
public class BudgetGuidanceService {
    private final JdbcTemplate db;
    public BudgetGuidanceService(JdbcTemplate db) {this.db=db;}
    private ResponseStatusException bad(String m){return new ResponseStatusException(HttpStatus.BAD_REQUEST,m);}
    private BigDecimal number(Object value) {
        try {BigDecimal v=new BigDecimal(String.valueOf(value));if(v.signum()<0||v.scale()>2||v.precision()>18)throw new Exception();return v;}
        catch(Exception e){throw bad("Số tiền không hợp lệ");}
    }
    public Map<String,Object> suggest(long uid,Map<String,Object> body) {
        BigDecimal income=number(body.get("income"));
        if(income.signum()==0)throw bad("Thu nhập dự kiến cần lớn hơn 0");
        BigDecimal saving=body.get("saving")==null?income.multiply(new BigDecimal("0.20")).setScale(2,RoundingMode.HALF_UP):number(body.get("saving"));
        if(saving.compareTo(income)>0)throw bad("Khoản dự phòng không được vượt thu nhập dự kiến");
        BigDecimal budget=income.subtract(saving);
        var categories=db.queryForList("SELECT category_id,name,spending_group,cost_nature FROM dbo.categories WHERE user_id=? AND category_type=N'CHI' AND is_sample_data=0 ORDER BY category_id",uid);
        if(categories.isEmpty())throw bad("Hãy tạo danh mục chi trước khi đề xuất phân bổ");
        int needs=0,wants=0;
        for(var c:categories)if("WANT".equals(c.get("spending_group")))wants++;else needs++;
        BigDecimal plannedNeeds=budget.multiply(new BigDecimal("0.625")).setScale(2,RoundingMode.HALF_UP);
        if(needs==0)plannedNeeds=BigDecimal.ZERO;
        if(wants==0)plannedNeeds=budget;
        BigDecimal plannedWants=budget.subtract(plannedNeeds);
        int usedNeed=0,usedWant=0;
        BigDecimal assigned=BigDecimal.ZERO;
        List<Map<String,Object>> suggestions=new ArrayList<>();
        for(var c:categories) {
            boolean want="WANT".equals(c.get("spending_group"));
            BigDecimal amount;
            if(want) {
                usedWant++;
                amount=usedWant==wants?plannedWants.subtract(plannedWants.divide(BigDecimal.valueOf(wants),2,RoundingMode.DOWN).multiply(BigDecimal.valueOf(wants-1)))
                    :plannedWants.divide(BigDecimal.valueOf(wants),2,RoundingMode.DOWN);
            } else {
                usedNeed++;
                amount=usedNeed==needs?plannedNeeds.subtract(plannedNeeds.divide(BigDecimal.valueOf(needs),2,RoundingMode.DOWN).multiply(BigDecimal.valueOf(needs-1)))
                    :plannedNeeds.divide(BigDecimal.valueOf(needs),2,RoundingMode.DOWN);
            }
            assigned=assigned.add(amount);
            Map<String,Object> item=new LinkedHashMap<>(c);
            item.put("recommended_limit",amount);
            item.put("reason",want?"Ước tính trong nhóm mong muốn, có thể điều chỉnh trước khi giảm chi thiết yếu.":"Ước tính trong nhóm nhu cầu, hãy bảo đảm chi phí thực tế bắt buộc được đáp ứng.");
            suggestions.add(item);
        }
        return Map.of("expected_income",income,"planned_saving",saving,"recommended_total_limit",budget,
                "items",suggestions,"explanation","Dùng 20% thu nhập để dự phòng và gợi ý phân bổ phần còn lại theo nhu cầu/mong muốn. Đây chỉ là điểm khởi đầu. Số tiền cố định thực tế có thể cao hơn; hãy sửa các khoản trước khi lưu.");
    }
    public List<Map<String,Object>> history(long uid,long bid) {
        if(db.queryForList("SELECT 1 FROM dbo.budgets WHERE budget_id=? AND user_id=? AND is_sample_data=0",bid,uid).isEmpty())
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy ngân sách");
        return db.queryForList("SELECT old_limit,new_limit,reason,changed_at FROM dbo.budget_change_history WHERE user_id=? AND budget_id=? ORDER BY changed_at DESC,change_id DESC",uid,bid);
    }
    public Map<String,Object> reflection(long uid,long bid) {
        if(db.queryForList("SELECT 1 FROM dbo.budgets WHERE budget_id=? AND user_id=? AND is_sample_data=0",bid,uid).isEmpty())
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy ngân sách");
        var result=db.queryForList("SELECT reason,improvement_action,income_actual,expense_actual,status,updated_at FROM dbo.budget_reviews WHERE user_id=? AND budget_id=?",uid,bid);
        return result.isEmpty()?Map.of("exists",false):result.get(0);
    }
    @Transactional public Map<String,Object> saveReflection(long uid,long bid,Map<String,Object> body) {
        var rows=db.queryForList("SELECT start_date,end_date FROM dbo.budgets WHERE budget_id=? AND user_id=? AND is_sample_data=0",bid,uid);
        if(rows.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy ngân sách");
        String reason=Objects.toString(body.get("reason"),"").trim(),action=Objects.toString(body.get("improvement_action"),"").trim();
        if(reason.isBlank()||action.isBlank()||reason.length()>1000||action.length()>1000)
            throw bad("Cần ghi nguyên nhân và hành động cải thiện (tối đa 1000 ký tự)");
        var b=rows.get(0);
        BigDecimal income=db.queryForObject("SELECT COALESCE(SUM(amount),0) FROM dbo.transactions WHERE user_id=? AND is_sample_data=0 AND type=N'THU' AND transaction_date BETWEEN ? AND ?",BigDecimal.class,uid,b.get("start_date"),b.get("end_date"));
        BigDecimal expense=db.queryForObject("SELECT COALESCE(SUM(amount),0) FROM dbo.transactions WHERE user_id=? AND is_sample_data=0 AND type=N'CHI' AND transaction_date BETWEEN ? AND ?",BigDecimal.class,uid,b.get("start_date"),b.get("end_date"));
        LocalDate end=b.get("end_date") instanceof java.sql.Date date?date.toLocalDate():(LocalDate)b.get("end_date");
        String status=end.isBefore(LocalDate.now())?"FINAL":"DRAFT";
        if(db.queryForObject("SELECT COUNT(*) FROM dbo.budget_reviews WHERE budget_id=?",Integer.class,bid)==0)
            db.update("INSERT INTO dbo.budget_reviews(budget_id,user_id,reason,improvement_action,income_actual,expense_actual,status) VALUES(?,?,?,?,?,?,?)",bid,uid,reason,action,income,expense,status);
        else db.update("UPDATE dbo.budget_reviews SET reason=?,improvement_action=?,income_actual=?,expense_actual=?,status=?,updated_at=SYSUTCDATETIME() WHERE budget_id=? AND user_id=?",reason,action,income,expense,status,bid,uid);
        return reflection(uid,bid);
    }
    public List<Map<String,Object>> trends(long uid) {
        return db.queryForList("SELECT b.budget_id,b.name,b.start_date,b.end_date,b.total_limit,COALESCE(x.expense,0) AS expense_actual,COALESCE(x.income,0) AS income_actual,CASE WHEN b.total_limit>0 THEN CAST(100.0*COALESCE(x.expense,0)/b.total_limit AS DECIMAL(9,2)) ELSE 0 END AS usage_rate,r.reason,r.improvement_action,r.status AS review_status FROM dbo.budgets b OUTER APPLY (SELECT SUM(CASE WHEN t.type=N'CHI' THEN t.amount ELSE 0 END) expense,SUM(CASE WHEN t.type=N'THU' THEN t.amount ELSE 0 END) income FROM dbo.transactions t WHERE t.user_id=b.user_id AND t.is_sample_data=0 AND t.transaction_date BETWEEN b.start_date AND b.end_date) x LEFT JOIN dbo.budget_reviews r ON r.budget_id=b.budget_id AND r.user_id=b.user_id WHERE b.user_id=? AND b.is_sample_data=0 ORDER BY b.start_date DESC,b.budget_id DESC",uid);
    }
}
