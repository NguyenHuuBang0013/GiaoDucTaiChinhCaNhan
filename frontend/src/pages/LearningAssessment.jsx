import React,{useEffect,useState} from 'react';
import {api} from '../services/api';
import Button from '../components/Button';

export default function LearningAssessment(){
 const [questions,setQuestions]=useState([]),[history,setHistory]=useState({}),[phase,setPhase]=useState('PRE'),[answers,setAnswers]=useState({}),[result,setResult]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const reload=async()=>{const [q,h]=await Promise.all([api('/api/education/assessment-questions'),api('/api/education/assessments')]);setQuestions(q);setHistory(h);setPhase(h.baseline?'POST':'PRE');};
 useEffect(()=>{reload().catch(e=>setError(e.message));},[]);
 async function submit(e){e.preventDefault();setBusy(true);setError('');try{const r=await api('/api/education/assessments','POST',{phase,answers});setResult(r);setAnswers({});await reload();}catch(e){setError(e.message)}finally{setBusy(false)}}
 const answered=questions.filter(q=>answers[String(q.question_id)]).length;
 return <section className="data-panel" id="learning-assessment"><div className="section-head"><div><span className="eyebrow">ĐO SỰ TIẾN BỘ</span><h2>Kiểm tra kiến thức trước và sau học</h2><p>Đánh giá cùng những kiến thức nền tảng để theo dõi tiến bộ. Điểm số không phải đánh giá tài sản hay mức độ giàu nghèo.</p></div></div>
 <div className="edu-badges"><span>Đầu vào: {history.baseline?`${history.baseline.correct_answers}/${history.baseline.total_questions}`:'Chưa làm'}</span><span>Sau học: {history.latest_post?`${history.latest_post.correct_answers}/${history.latest_post.total_questions}`:'Chưa làm'}</span>{history.improvement_points!==undefined&&<span>Thay đổi: {history.improvement_points>=0?'+':''}{history.improvement_points} điểm %</span>}</div>
 <form onSubmit={submit}><p><strong>{phase==='PRE'?'Đánh giá đầu vào':'Đánh giá sau khi học'}:</strong> {answered}/{questions.length} câu</p>{questions.map((q,i)=><fieldset className="edu-question" key={q.question_id}><legend><strong>{i+1}. {q.question_text}</strong></legend>{['A','B','C'].map(k=><label className="quiz-choice" key={k}><input type="radio" name={'assess-'+q.question_id} checked={answers[String(q.question_id)]===k} onChange={()=>setAnswers(v=>({...v,[String(q.question_id)]:k}))}/>{k}. {q['choice_'+k.toLowerCase()]}</label>)}</fieldset>)}
 <div className="quick-btns"><Button disabled={busy||!questions.length||answered!==questions.length} type="submit">{busy?'Đang chấm':'Nộp bài '+(phase==='PRE'?'đầu vào':'sau học')}</Button>{history.baseline&&<Button kind="outline" type="button" onClick={()=>{setPhase(phase==='PRE'?'POST':'PRE');setAnswers({});setResult(null)}}>Đổi dạng đánh giá</Button>}</div></form>
 {result&&<p role="status" className="edu-success">Kết quả {result.correct_answers}/{result.total_questions} ({result.percent}%). Tiếp tục học, thực hành và thử đánh giá lại để so sánh.</p>}{error&&<p role="alert">{error}</p>}</section>;
}
