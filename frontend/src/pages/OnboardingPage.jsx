import React,{useEffect,useState} from 'react';
import {api} from '../services/api';
import Button from '../components/Button';

const goals=[['BUDGET','Lập ngân sách'],['SAVE','Tiết kiệm'],['DEBT','Hiểu về nợ'],['SAFETY','An toàn tài chính']];
const levels=[['BEGINNER','Mới bắt đầu'],['BASIC','Đã biết cơ bản'],['INTERMEDIATE','Đã từng quản lý ngân sách']];
const priorities=[['CONTROL_SPENDING','Kiểm soát chi'],['EMERGENCY_FUND','Tạo quỹ dự phòng'],['SAVE_FOR_GOAL','Tiết kiệm cho mục tiêu']];
export default function OnboardingPage({onNavigate}){
 const [form,setForm]=useState({learning_goal:'BUDGET',skill_level:'BEGINNER',monthly_income:'0',primary_priority:'CONTROL_SPENDING'});
 const [saved,setSaved]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{api('/api/education/profile').then(p=>{if(p.onboarding_completed)setForm(p)}).catch(e=>setError(e.message));},[]);
 async function submit(e){e.preventDefault();setBusy(true);setError('');try{await api('/api/education/profile','PUT',form);setSaved(true)}catch(e){setError(e.message)}finally{setBusy(false)}}
 return <div className="edu-workspace onboarding-workspace"><section className="onboarding-intro"><span className="eyebrow">THIẾT LẬP BAN ĐẦU</span><h2>Học theo mục tiêu của bạn</h2><p>Bốn thông tin này giúp hệ thống gợi ý bài học phù hợp. Thu nhập khai báo chỉ dùng để lập kế hoạch, không tạo giao dịch thực.</p></section>
 <section className="data-panel"><h2>Thông tin học tập</h2><form className="edu-form-grid" onSubmit={submit}>
 <label>Mục tiêu muốn học<select value={form.learning_goal} onChange={e=>setForm(v=>({...v,learning_goal:e.target.value}))}>{goals.map(([k,l])=><option value={k} key={k}>{l}</option>)}</select></label>
 <label>Kiến thức hiện tại<select value={form.skill_level} onChange={e=>setForm(v=>({...v,skill_level:e.target.value}))}>{levels.map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></label>
 <label>Thu nhập dự kiến mỗi tháng (VNĐ)<input type="number" min="0" step="0.01" value={form.monthly_income} onChange={e=>setForm(v=>({...v,monthly_income:e.target.value}))}/></label>
 <label>Ưu tiên trước mắt<select value={form.primary_priority} onChange={e=>setForm(v=>({...v,primary_priority:e.target.value}))}>{priorities.map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></label>
 <div className="quick-btns"><Button type="submit" disabled={busy}>{busy?'Đang lưu':'Lưu mục tiêu học'}</Button>{saved&&<Button kind="outline" type="button" onClick={()=>onNavigate('learning')}>Tiếp tục học tài chính →</Button>}</div>
 </form>{error&&<p role="alert">{error}</p>}{saved&&<p role="status" className="edu-success">Đã lưu khảo sát. Bạn có thể làm bài đánh giá đầu vào trên trang Học tài chính.</p>}</section></div>;
}
