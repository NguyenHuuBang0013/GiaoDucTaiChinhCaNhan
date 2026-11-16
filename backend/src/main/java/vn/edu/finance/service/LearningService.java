package vn.edu.finance.service;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
@Service public class LearningService {
 private final JdbcTemplate db;
 public LearningService(JdbcTemplate db){this.db=db;}
 public List<Map<String,Object>> lessons(long uid){return db.queryForList("SELECT l.lesson_id,l.slug,l.title,l.summary,l.content,l.question,l.choice_a,l.choice_b,l.choice_c,l.sort_order,l.topic_key, (SELECT COUNT(*) FROM dbo.learning_attempts a WHERE a.lesson_id=l.lesson_id AND a.user_id=? AND a.is_correct=1) AS correct_attempts FROM dbo.learning_lessons l ORDER BY l.sort_order",uid);}
 @Transactional public Map<String,Object> answer(long uid,int id,String selected){
  if(selected==null||!List.of("A","B","C").contains(selected))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Đáp án không hợp lệ");
  var matches=db.queryForList("SELECT answer, explanation FROM dbo.learning_lessons WHERE lesson_id=?",id);
  if(matches.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy bài học");
  Map<String,Object> lesson=matches.get(0);boolean correct=selected.equals(lesson.get("answer"));
  db.update("INSERT INTO dbo.learning_attempts(user_id,lesson_id,selected_answer,is_correct) VALUES(?,?,?,?)",uid,id,selected,correct);
  return Map.of("correct",correct,"correct_answer",lesson.get("answer"),"explanation",lesson.get("explanation"));
 }
 public List<Map<String,Object>> questions(long uid,int lessonId){
  if(db.queryForObject("SELECT COUNT(*) FROM dbo.learning_lessons WHERE lesson_id=?",Integer.class,lessonId)==0)
   throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy bài học");
  return db.queryForList("SELECT question_id,lesson_id,question_text,choice_a,choice_b,choice_c FROM dbo.learning_questions WHERE lesson_id=? ORDER BY question_id",lessonId);
 }
 @Transactional public Map<String,Object> answerQuestion(long uid,long questionId,String selected){
  if(selected==null||!List.of("A","B","C").contains(selected))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Đáp án không hợp lệ");
  var found=db.queryForList("SELECT answer,explanation,lesson_id FROM dbo.learning_questions WHERE question_id=?",questionId);
  if(found.isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy câu hỏi");
  var q=found.get(0);boolean correct=selected.equals(q.get("answer"));
  db.update("INSERT INTO dbo.learning_question_attempts(user_id,question_id,selected_answer,is_correct) VALUES(?,?,?,?)",uid,questionId,selected,correct);
  return Map.of("correct",correct,"correct_answer",q.get("answer"),"explanation",q.get("explanation"));
 }
 public Map<String,Object> progress(long uid){
  Integer total=db.queryForObject("SELECT COUNT(*) FROM dbo.learning_questions",Integer.class);
  Integer mastered=db.queryForObject("SELECT COUNT(DISTINCT a.question_id) FROM dbo.learning_question_attempts a WHERE a.user_id=? AND a.is_correct=1",Integer.class,uid);
  var byLesson=db.queryForList("SELECT l.lesson_id,l.slug,l.title,COUNT(q.question_id) AS total_questions,COUNT(DISTINCT CASE WHEN a.is_correct=1 THEN a.question_id END) AS correct_questions FROM dbo.learning_lessons l LEFT JOIN dbo.learning_questions q ON q.lesson_id=l.lesson_id LEFT JOIN dbo.learning_question_attempts a ON a.question_id=q.question_id AND a.user_id=? GROUP BY l.lesson_id,l.slug,l.title ORDER BY l.lesson_id",uid);
  return Map.of("total_questions",total,"mastered_questions",mastered,"lessons",byLesson);
 }

}
