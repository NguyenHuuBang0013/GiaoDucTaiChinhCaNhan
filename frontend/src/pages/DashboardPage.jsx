import React,{useEffect,useState} from 'react';
import {ArrowDownLeft,ArrowRight,ArrowUpRight,CalendarDays,ChevronRight,Plus,Wallet} from 'lucide-react';
import {api} from '../services/api';
import {money,dateOnly,today} from '../utils/format';
const number=v=>Number(v)||0;
const sum=(rows,key)=>rows.reduce((total,row)=>total+number(row[key]),0);
const percentage=(part,total)=>total>0?Math.round(part/total*100):0;
export default function DashboardPage({me,data,onNavigate,sampleMode=false}){
 const [month,setMonth]=useState(today().slice(0,7));
 const [journey,setJourney]=useState({profile:null,recommendations:[],progress:null,assessments:null});
 const [journeyLoading,setJourneyLoading]=useState(true);
 useEffect(()=>{
  let cancelled=false;setJourneyLoading(true);
  Promise.allSettled([api('/api/education/profile'),api('/api/education/recommendations'),api('/api/learning/progress'),api('/api/education/assessments')]).then(results=>{
   if(cancelled)return;const values=results.map(x=>x.status==='fulfilled'?x.value:null);
   setJourney({profile:values[0],recommendations:Array.isArray(values[1])?values[1]:[],progress:values[2],assessments:values[3]});
   setJourneyLoading(false);
  });
  return()=>{cancelled=true};
 },[me.user_id]);
 const all=data.transactions||[];
 const current=all.filter(t=>String(t.transaction_date||'').slice(0,7)===month);
 const income=sum(current.filter(t=>t.type==='THU'),'amount');
 const expense=sum(current.filter(t=>t.type==='CHI'),'amount');
 const balance=income-expense;
 const first=month+'-01';const last=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0)).toISOString().slice(0,10);
 const budgets=(data.budgets||[]).filter(b=>String(b.start_date||'').slice(0,10)<=last&&String(b.end_date||'').slice(0,10)>=first);
 const selected=budgets.length===1?budgets[0]:null;
 const budgetLimit=selected?number(selected.total_limit):0;
 const budgetUsed=selected?sum(all.filter(t=>t.type==='CHI'&&String(t.transaction_date||'').slice(0,10)>=String(selected.start_date).slice(0,10)&&String(t.transaction_date||'').slice(0,10)<=String(selected.end_date).slice(0,10)),'amount'):0;
 const budgetRate=percentage(budgetUsed,budgetLimit);
 const recent=[...current].sort((a,b)=>String(b.transaction_date||'').localeCompare(String(a.transaction_date||''))).slice(0,5);
 const categories=data.categories||[];
 const categoryName=id=>categories.find(c=>Number(c.category_id)===Number(id))?.name||'Chưa phân loại';
 const hasData=all.length>0||(data.budgets||[]).length>0||(data.goals||[]).length>0;
 const progress=journey.progress;
 const mastered=Number(progress?.mastered_questions||0),total=Number(progress?.total_questions||0);
 const largestExpenses=Object.entries(current.filter(t=>t.type==='CHI').reduce((acc,t)=>{const name=categoryName(t.category_id);acc[name]=(acc[name]||0)+number(t.amount);return acc;},{})).sort((a,b)=>b[1]-a[1]).slice(0,5);
 return <div className="dashboard-overview">
  <div className="dashboard-heading"><div><div className="page-trail">{sampleMode?'TỔNG QUAN THỰC HÀNH':'TỔNG QUAN CÁ NHÂN'}</div><h1 tabIndex={-1}>Tài chính tháng {month.slice(5,7)}/{month.slice(0,4)}</h1><p>{me.display_name?.split(' ').at(-1)||'Bạn'}, {sampleMode?'đây là các số liệu giả lập để bạn thử phân tích ngân sách.':'đây là tình hình thu – chi và các việc cần theo dõi.'}</p></div><label className="month-picker"><CalendarDays size={17} aria-hidden="true"/><span>Tháng</span><input aria-label="Chọn tháng thống kê" type="month" value={month} onChange={e=>setMonth(e.target.value)}/></label></div>
  <section className="balance-summary" aria-label="Tổng quan dòng tiền tháng">
   <div className="balance-main"><span className="section-overline">SỐ DƯ THU − CHI TRONG THÁNG</span><strong className={balance<0?'is-negative':''}>{money(balance)}</strong><p>{balance>=0?'Thu nhập lớn hơn hoặc bằng chi tiêu đã ghi nhận.':'Chi tiêu đang vượt số thu đã ghi nhận.'}</p><button type="button" className="inline-link" onClick={()=>onNavigate('reports')}>Xem báo cáo <ArrowRight size={16}/></button></div>
   <div className="balance-breakdown"><div><span><ArrowDownLeft size={17} aria-hidden="true"/> Tiền vào</span><strong>{money(income)}</strong></div><div><span><ArrowUpRight size={17} aria-hidden="true"/> Tiền ra</span><strong>{money(expense)}</strong></div><small>{sampleMode?'Dữ liệu mẫu':'Dữ liệu trong tài khoản'} · {month.split('-').reverse().join('/')}</small></div>
  </section>
  {!hasData&&<section className="dashboard-get-started"><div><span className="section-overline">BẮT ĐẦU TỪ ĐÂY</span><h2>Thiết lập tài chính theo cách của bạn</h2><p>Chọn một bước nhỏ, không cần nhập mọi thứ cùng lúc.</p></div><div className="getting-started-steps">{[['01','Khảo sát nhu cầu','start'],['02','Học về ngân sách','learning'],['03','Ghi giao dịch đầu tiên','transactions']].map(([n,title,id])=><button type="button" key={id} onClick={()=>onNavigate(id)}><span>{n}</span>{title}<ArrowRight size={17}/></button>)}</div></section>}
  <div className="dashboard-split">
   <section className="dashboard-budget" aria-label="Tình trạng ngân sách"><div className="section-title-row"><div><span className="section-overline">KẾ HOẠCH</span><h2>Ngân sách tháng</h2></div><button className="inline-link" type="button" onClick={()=>onNavigate('budget-coach')}>Đánh giá <ArrowRight size={16}/></button></div>
    {selected?<><div className="budget-name">{selected.name} <span>{dateOnly(selected.start_date)} – {dateOnly(selected.end_date)}</span></div><div className="budget-display"><strong>{budgetRate}%</strong><span>hạn mức đã sử dụng</span></div><div className="budget-track" role="progressbar" aria-label="Hạn mức sử dụng" aria-valuenow={Math.min(100,budgetRate)} aria-valuemin="0" aria-valuemax="100"><div className={budgetRate>100?'over':''} style={{width:`${Math.max(0,Math.min(100,budgetRate))}%`}}/></div><div className="budget-figures"><span>Đã chi <b>{money(budgetUsed)}</b></span><span>Hạn mức <b>{money(budgetLimit)}</b></span></div><p className="budget-comment">{budgetRate>=100?'Hạn mức đã chạm hoặc vượt. Xem lại khoản chi trước khi lập kỳ tiếp theo.':budgetRate>=80?'Ngân sách gần hết. Ưu tiên các khoản thiết yếu trong phần kỳ còn lại.':'Bạn còn khoảng trống để duy trì kế hoạch hiện tại.'}</p></>:
    <div className="subtle-empty"><h3>{budgets.length>1?'Nhiều ngân sách trùng kỳ':'Chưa có ngân sách cho tháng này'}</h3><p>{budgets.length>1?'Kiểm tra các kỳ cũ để tránh đọc nhầm tổng hạn mức.':'Lập hạn mức chi tiêu và dành ra một khoản cho mục tiêu.'}</p><button className="btn outline" type="button" onClick={()=>onNavigate(sampleMode?'profile':'budgets')}>{sampleMode?'Quản lý dữ liệu mẫu':budgets.length>1?'Xem ngân sách':'Tạo ngân sách'} <ArrowRight size={16}/></button></div>}
   </section>
   <section className="dashboard-learning" aria-label="Tiến độ học tài chính"><div className="section-title-row"><div><span className="section-overline">HỌC VÀ ỨNG DỤNG</span><h2>Tiến độ học tập</h2></div><button type="button" className="inline-link" onClick={()=>onNavigate('learning')}>Vào lớp học <ArrowRight size={16}/></button></div>
    <div className="learning-progress"><div><strong>{total?`${mastered}/${total}`:'—'}</strong><span>Câu hỏi đã nắm vững</span></div><div className="learning-progress-track" role="progressbar" aria-label="Tiến độ câu hỏi" aria-valuemin="0" aria-valuemax="100" aria-valuenow={total?percentage(mastered,total):0}><span style={{width:`${Math.min(100,total?percentage(mastered,total):0)}%`}}/></div></div>
    <div className="learning-checkpoints"><div><span>Khảo sát ban đầu</span><strong>{journey.profile?.onboarding_completed?'Đã hoàn thành':'Chưa thực hiện'}</strong></div><div><span>Kiểm tra đầu vào</span><strong>{journey.assessments?.baseline?`${journey.assessments.baseline.correct_answers}/${journey.assessments.baseline.total_questions}`:'Chưa thực hiện'}</strong></div><div><span>Đánh giá sau học</span><strong>{journey.assessments?.latest_post?`${journey.assessments.latest_post.correct_answers}/${journey.assessments.latest_post.total_questions}`:'Chưa thực hiện'}</strong></div></div>
    <button className="learning-secondary-action" type="button" onClick={()=>onNavigate(journey.profile?.onboarding_completed?'practice':'start')}>{journey.profile?.onboarding_completed?'Thử tình huống thực hành':'Hoàn thành khảo sát ban đầu'} <ChevronRight size={16} aria-hidden="true"/></button>
    {journeyLoading&&<span className="quiet-meta" role="status">Đang cập nhật tiến độ…</span>}
   </section>
  </div>
  {journey.recommendations.length>0&&<section className="dashboard-recommendations"><div className="section-title-row"><div><span className="section-overline">GỢI Ý CHO BẠN</span><h2>Tiếp theo nên làm gì?</h2></div><button type="button" className="inline-link" onClick={()=>onNavigate('start')}>Cập nhật mục tiêu <ArrowRight size={16}/></button></div><div className="recommendation-list">{journey.recommendations.slice(0,3).map((rec,index)=><button key={index} type="button" onClick={()=>onNavigate(rec.route,{lesson:rec.lesson_slug})}><span className="recommendation-number">0{index+1}</span><span><strong>{rec.title}</strong><small>{rec.detail}</small></span><ArrowRight size={17}/></button>)}</div></section>}
  <div className="dashboard-split dashboard-bottom">
   <section className="dashboard-recent"><div className="section-title-row"><div><span className="section-overline">NHẬT KÝ</span><h2>Giao dịch gần đây</h2></div><button type="button" className="inline-link" onClick={()=>onNavigate('transactions')}>Xem tất cả <ArrowRight size={16}/></button></div>{recent.length?recent.map(t=><div className="activity" key={t.transaction_id}><div className="activity-label"><strong>{t.note||categoryName(t.category_id)}</strong><small>{categoryName(t.category_id)} · {dateOnly(t.transaction_date)}</small></div><strong className={'transaction-money '+(t.type==='THU'?'income-text':'')}>{t.type==='THU'?'+':'−'}{money(t.amount)}</strong></div>):<div className="subtle-empty"><h3>Chưa có giao dịch tháng này</h3><p>Ghi lại khoản thu hoặc chi đầu tiên để bắt đầu theo dõi.</p><button type="button" className="btn outline" onClick={()=>onNavigate(sampleMode?'profile':'transactions')}><Plus size={16}/> {sampleMode?'Tạo dữ liệu mẫu':'Ghi giao dịch'}</button></div>}</section>
   <section className="dashboard-comparison"><div className="section-title-row"><div><span className="section-overline">CƠ CẤU CHI TIÊU</span><h2>Khoản chi lớn nhất</h2></div><button type="button" className="inline-link" onClick={()=>onNavigate('reports')}>Phân tích chi tiết <ArrowRight size={16} aria-hidden="true"/></button></div>{largestExpenses.length?<ol className="spending-ranking" aria-label="Các danh mục chi tiêu lớn nhất trong tháng">{largestExpenses.map(([name,amount],index)=><li key={name}><div className="spending-ranking-heading"><span><span className="spending-ranking-index">{String(index+1).padStart(2,'0')}</span>{name}</span><strong>{money(amount)}</strong></div><div className="spending-ranking-track" role="meter" aria-label={`Tỷ trọng ${name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100,percentage(amount,expense))}><span style={{width:`${Math.min(100,percentage(amount,expense))}%`}}/></div></li>)}</ol>:<div className="subtle-empty"><h3>Chưa có khoản chi trong tháng</h3><p>Khi có giao dịch, danh mục chi nhiều nhất sẽ xuất hiện tại đây.</p></div>}
   </section>
  </div>
  <div className="dashboard-bottom-cta"><span>Muốn kiểm tra một quyết định trước khi thực hiện?</span><button type="button" onClick={()=>onNavigate('scenarios')}>Thử mô phỏng tiết kiệm <ArrowRight size={16}/></button></div>
 </div>;
}
