package vn.edu.finance.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import vn.edu.finance.util.FinancialPracticeCalculator;

/** Learner onboarding, curriculum, baseline/outcome tests and decision-making exercises. */
@Service
public class EducationService {
    private final JdbcTemplate db;
    private final ObjectMapper mapper;
    public EducationService(JdbcTemplate db, ObjectMapper mapper) { this.db=db; this.mapper=mapper; }

    private ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
    private String json(Object value) {
        try { return mapper.writeValueAsString(value); }
        catch (JsonProcessingException e) { throw bad("Không thể ghi kết quả học tập"); }
    }
    private BigDecimal amount(Object value) {
        try {
            BigDecimal n = new BigDecimal(String.valueOf(value));
            if(n.signum()<0 || n.scale()>2 || n.precision()>18) throw new Exception();
            return n;
        } catch(Exception ex) { throw bad("Số tiền phải không âm và hợp lệ"); }
    }
    public Map<String,Object> profile(long uid) {
        var rows=db.queryForList("SELECT learning_goal,skill_level,monthly_income,primary_priority,onboarding_completed FROM dbo.learning_profiles WHERE user_id=?",uid);
        return rows.isEmpty()?Map.of("onboarding_completed",false):rows.get(0);
    }
    @Transactional public Map<String,Object> saveProfile(long uid,Map<String,Object> body) {
        String goal=Objects.toString(body.get("learning_goal"),"BUDGET");
        String level=Objects.toString(body.get("skill_level"),"BEGINNER");
        String priority=Objects.toString(body.get("primary_priority"),"CONTROL_SPENDING");
        if(!Set.of("BUDGET","SAVE","DEBT","SAFETY").contains(goal) ||
           !Set.of("BEGINNER","BASIC","INTERMEDIATE").contains(level) ||
           !Set.of("CONTROL_SPENDING","EMERGENCY_FUND","SAVE_FOR_GOAL").contains(priority))
            throw bad("Lựa chọn khảo sát không hợp lệ");
        BigDecimal income=amount(body.getOrDefault("monthly_income",0));
        if(db.queryForObject("SELECT COUNT(*) FROM dbo.learning_profiles WHERE user_id=?",Integer.class,uid)==0)
            db.update("INSERT INTO dbo.learning_profiles(user_id,learning_goal,skill_level,monthly_income,primary_priority,onboarding_completed) VALUES(?,?,?,?,?,1)",uid,goal,level,income,priority);
        else db.update("UPDATE dbo.learning_profiles SET learning_goal=?,skill_level=?,monthly_income=?,primary_priority=?,onboarding_completed=1,updated_at=SYSUTCDATETIME() WHERE user_id=?",goal,level,income,priority,uid);
        return profile(uid);
    }
    public List<Map<String,Object>> topics(long uid) {
        return db.queryForList("SELECT t.topic_key,t.title,t.summary,t.sort_order,COUNT(l.lesson_id) AS total_lessons FROM dbo.learning_topics t LEFT JOIN dbo.learning_lessons l ON l.topic_key=t.topic_key GROUP BY t.topic_key,t.title,t.summary,t.sort_order ORDER BY t.sort_order");
    }
    // Select two stable core questions per topic without leaking their answers.
    public List<Map<String,Object>> assessmentQuestions() {
        return db.queryForList("WITH ranked AS (SELECT q.question_id,q.question_text,q.choice_a,q.choice_b,q.choice_c,l.topic_key,ROW_NUMBER() OVER(PARTITION BY l.topic_key ORDER BY l.sort_order,q.question_id) AS rn FROM dbo.learning_questions q JOIN dbo.learning_lessons l ON l.lesson_id=q.lesson_id WHERE q.question_key LIKE N'%-core') SELECT question_id,question_text,choice_a,choice_b,choice_c,topic_key FROM ranked WHERE rn<=2 ORDER BY topic_key,question_id");
    }
    @Transactional public Map<String,Object> submitAssessment(long uid, Map<String,Object> body) {
        String phase=Objects.toString(body.get("phase"),"");
        if(!Set.of("PRE","POST").contains(phase))throw bad("Bài đánh giá chỉ nhận PRE hoặc POST");
        if(!(body.get("answers") instanceof Map<?,?> answers))throw bad("Cần trả lời đầy đủ câu hỏi");
        List<Map<String,Object>> questions=assessmentQuestions();
        if(questions.size()<3)throw bad("Chưa đủ câu hỏi đánh giá");
        Map<String,Object> submitted=new LinkedHashMap<>();
        int correct=0;
        for(var q:questions) {
            long id=((Number)q.get("question_id")).longValue();
            String answer=Objects.toString(answers.get(String.valueOf(id)),"").toUpperCase(Locale.ROOT);
            if(!Set.of("A","B","C").contains(answer))throw bad("Bạn cần hoàn thành tất cả câu hỏi");
            submitted.put(String.valueOf(id),answer);
            String expected=db.queryForObject("SELECT answer FROM dbo.learning_questions WHERE question_id=?",String.class,id);
            if(answer.equals(expected))correct++;
        }
        db.update("INSERT INTO dbo.learning_assessments(user_id,phase,correct_answers,total_questions,answers_json) VALUES(?,?,?,?,?)",uid,phase,correct,questions.size(),json(submitted));
        return Map.of("phase",phase,"correct_answers",correct,"total_questions",questions.size(),"percent",Math.round(correct*100.0/questions.size()));
    }
    public Map<String,Object> assessments(long uid) {
        var results=db.queryForList("SELECT assessment_id,phase,correct_answers,total_questions,taken_at FROM dbo.learning_assessments WHERE user_id=? ORDER BY taken_at,assessment_id",uid);
        Map<String,Object> out=new LinkedHashMap<>();out.put("history",results);
        for(var item:results){String key=Objects.toString(item.get("phase")).equals("PRE")?"baseline":"latest_post";
            if(key.equals("baseline"))out.putIfAbsent(key,item);else out.put(key,item);}
        if(out.containsKey("baseline")&&out.containsKey("latest_post")){
            var a=(Map<?,?>)out.get("baseline");var b=(Map<?,?>)out.get("latest_post");
            double pre=((Number)a.get("correct_answers")).doubleValue()/((Number)a.get("total_questions")).doubleValue();
            double post=((Number)b.get("correct_answers")).doubleValue()/((Number)b.get("total_questions")).doubleValue();
            out.put("improvement_points",Math.round((post-pre)*100));
        }
        return out;
    }
    @Transactional public Map<String,Object> practice(long uid,Map<String,Object> body) {
        String response=Objects.toString(body.get("response"),"");
        Map<String,Object> result;
        try { result=FinancialPracticeCalculator.evaluate(amount(body.get("housing")),amount(body.get("food")),
                amount(body.get("transport")),amount(body.get("flexible")),amount(body.get("reserve")),response); }
        catch(IllegalArgumentException e){throw bad(e.getMessage());}
        db.update("INSERT INTO dbo.practice_attempts(user_id,scenario_key,choices_json,result_json,score) VALUES(?,?,?,?,?)",
                uid,"MONTHLY_EMERGENCY",json(body),json(result),result.get("score"));
        return result;
    }
    public List<Map<String,Object>> practiceHistory(long uid) {
        return db.queryForList("SELECT TOP(15) scenario_key,score,attempted_at FROM dbo.practice_attempts WHERE user_id=? ORDER BY attempted_at DESC,attempt_id DESC",uid);
    }
    public List<Map<String,Object>> recommendations(long uid) {
        List<Map<String,Object>> out=new ArrayList<>();
        if(!Boolean.TRUE.equals(profile(uid).get("onboarding_completed")))
            out.add(Map.of("title","Bắt đầu hành trình","detail","Chọn mục tiêu học và mức hiểu biết để nhận hướng dẫn phù hợp.","route","start","lesson_slug","budget-basics"));
        var budgets=db.queryForList("SELECT TOP(1) budget_id,total_limit,start_date,end_date FROM dbo.budgets WHERE user_id=? AND is_sample_data=0 ORDER BY start_date DESC",uid);
        if(budgets.isEmpty())out.add(Map.of("title","Lập ngân sách đầu tiên","detail","Hãy thử lập kế hoạch chi tiêu dựa trên thu nhập của bạn.","route","budgets","lesson_slug","budget-basics"));
        else {
            var b=budgets.get(0);
            BigDecimal spent=db.queryForObject("SELECT COALESCE(SUM(amount),0) FROM dbo.transactions WHERE user_id=? AND is_sample_data=0 AND type=N'CHI' AND transaction_date BETWEEN ? AND ?",BigDecimal.class,uid,b.get("start_date"),b.get("end_date"));
            if(spent.compareTo(((BigDecimal)b.get("total_limit")).multiply(new BigDecimal("0.8")))>=0)
                out.add(Map.of("title","Rà soát hạn mức","detail","Bạn đã sử dụng ít nhất 80% hạn mức kỳ gần nhất. Hãy đọc cách điều chỉnh các khoản linh hoạt.","route","budget-coach","lesson_slug","needs-wants"));
        }
        var weak=db.queryForList("SELECT TOP(1) l.slug,l.title FROM dbo.learning_question_attempts a JOIN dbo.learning_questions q ON q.question_id=a.question_id JOIN dbo.learning_lessons l ON l.lesson_id=q.lesson_id WHERE a.user_id=? AND a.is_correct=0 AND NOT EXISTS (SELECT 1 FROM dbo.learning_question_attempts ok WHERE ok.user_id=a.user_id AND ok.question_id=a.question_id AND ok.is_correct=1) ORDER BY a.attempted_at DESC",uid);
        if(!weak.isEmpty())out.add(Map.of("title","Ôn lại: "+weak.get(0).get("title"),"detail","Có câu hỏi bạn chưa làm đúng; xem giải thích và thử lại.","route","learning","lesson_slug",weak.get(0).get("slug")));
        if(out.isEmpty())out.add(Map.of("title","Duy trì thói quen tốt","detail","Tổng kết kỳ ngân sách và thực hành bài học tình huống để tiếp tục cải thiện.","route","budget-coach","lesson_slug","end-of-month"));
        return out;
    }
}
