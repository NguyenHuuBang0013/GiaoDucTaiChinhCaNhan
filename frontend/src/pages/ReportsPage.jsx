import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {Download,RefreshCw} from 'lucide-react';
import {ResponsiveContainer,BarChart,Bar,LineChart,Line,XAxis,YAxis,Tooltip,Legend,CartesianGrid} from 'recharts';
import Button from '../components/Button';
import {useReducedMotion} from '../components/motion/Motion';
import {api} from '../services/api';
import {today,monthStart,money} from '../utils/format';
import {sampleFinancialSummary,sampleMonthlySummary,sampleBudgetTrends} from '../utils/sampleFinance';
export default function ReportsPage({sampleMode=false,samplePreview}){
 const reduceMotion=useReducedMotion();
 const [start,setStart]=useState(monthStart()),[end,setEnd]=useState(today());
 const [report,setReport]=useState(null),[monthly,setMonthly]=useState([]),[trends,setTrends]=useState([]);
 const [loading,setLoading]=useState(true),[error,setError]=useState('');
 const load=useCallback(async()=>{
  if(start>end){setError('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.');return;}
  setError('');setLoading(true);
  try{
   if(sampleMode){setReport(sampleFinancialSummary(samplePreview,start,end));setMonthly(sampleMonthlySummary(samplePreview,start.slice(0,4)));setTrends(sampleBudgetTrends(samplePreview));return;}
   const [summary,months,trend]=await Promise.all([
    api(`/api/reports/financial-summary?start=${start}&end=${end}`),
    api(`/api/reports/monthly?year=${start.slice(0,4)}`),
    api('/api/budget-guidance/trends')
   ]);
   setReport(summary);setMonthly(months);setTrends(trend);
  }catch(e){setError(e.message)}finally{setLoading(false)}
 },[start,end,sampleMode,samplePreview]);
 useEffect(()=>{load()},[load]); // refreshes when dataset changes
 const totals=report?.totals||[];
 const income=Number(totals.find(t=>t.type==='THU')?.total||0);
 const expense=Number(totals.find(t=>t.type==='CHI')?.total||0);
 const chart=useMemo(()=>Array.from({length:12},(_,i)=>({month:`T${i+1}`,thu:Number(monthly.find(x=>Number(x.month)===i+1&&x.type==='THU')?.total||0),chi:Number(monthly.find(x=>Number(x.month)===i+1&&x.type==='CHI')?.total||0)})),[monthly]);
 const download=()=>{
  if(!report)return;
  const lines=[['Loại','Tổng tiền'],...totals.map(x=>[x.type,x.total])];
  const csv='\uFEFF'+lines.map(values=>values.map(value=>'"'+String(value??'').replaceAll('"','""')+'"').join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
  const a=document.createElement('a');a.href=url;a.download=`bao-cao-${start}-${end}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 return <div className="report-workspace">
  <section className="report-toolbar" aria-label="Bộ lọc thời gian báo cáo"><div><span className="section-overline">PHÂN TÍCH THEO THỜI GIAN</span><h2>Chọn kỳ xem báo cáo</h2><p>{sampleMode?'Báo cáo minh họa từ giao dịch và ngân sách mẫu, không phải tài chính thật.':'Số liệu cá nhân, không tính giao dịch mẫu.'}</p></div><form className="report-filters" onSubmit={e=>{e.preventDefault();load()}}><label>Từ ngày<input type="date" value={start} max={end} onChange={e=>setStart(e.target.value)}/></label><label>Đến ngày<input type="date" min={start} value={end} onChange={e=>setEnd(e.target.value)}/></label><Button type="submit" disabled={loading}><RefreshCw size={16}/>{loading?'Đang tải':'Áp dụng'}</Button></form></section>
  {error&&<div className="report-error" role="alert">Không thể tải báo cáo: {error} <button type="button" onClick={load}>Thử lại</button></div>}
  {loading&&!report&&<div className="report-loading" role="status">Đang tổng hợp dữ liệu từ hệ thống…</div>}
  {report&&<>
   <section className="report-summary"><div><span>Thu nhập</span><strong>{money(income)}</strong></div><div><span>Chi tiêu</span><strong>{money(expense)}</strong></div><div><span>Chênh lệch thu − chi</span><strong className={income-expense<0?'is-negative':''}>{money(income-expense)}</strong></div><button type="button" onClick={download} className="report-export"><Download size={17}/> Xuất CSV</button></section>
   <div className="report-charts"><section><div className="section-title-row"><div><span className="section-overline">CẤU TRÚC CHI TIÊU</span><h2>Theo danh mục</h2></div></div>{report.expense_by_category?.length?<div className="report-chart"><ResponsiveContainer width="100%" height="100%"><BarChart layout="vertical" data={report.expense_by_category||[]} margin={{top:7,bottom:6,left:12,right:14}}><CartesianGrid stroke="var(--chart-grid)" horizontal={false}/><XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize:10,fill:'var(--chart-label)'}} tickFormatter={v=>v>=1000000?`${+(v/1000000).toFixed(1)}tr`:v}/><YAxis type="category" width={90} dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:10,fill:'var(--chart-label)'}}/><Tooltip formatter={money}/><Bar dataKey="total" fill="var(--chart-income)" radius={[0,4,4,0]} isAnimationActive={!reduceMotion} animationDuration={280}/></BarChart></ResponsiveContainer></div>:<p className="report-empty">Chưa có khoản chi trong kỳ này.</p>}</section>
   <section><div className="section-title-row"><div><span className="section-overline">DÒNG TIỀN</span><h2>Xu hướng {start.slice(0,4)}</h2></div></div><div className="report-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={chart} margin={{top:10,bottom:0,left:0,right:12}}><CartesianGrid stroke="var(--chart-grid)" vertical={false}/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize:10,fill:'var(--chart-label)'}}/><YAxis axisLine={false} tickLine={false} tick={{fontSize:10,fill:'var(--chart-label)'}} tickFormatter={v=>v>=1000000?`${+(v/1000000).toFixed(1)}tr`:v}/><Tooltip formatter={money}/><Legend verticalAlign="bottom" height={30}/><Line isAnimationActive={!reduceMotion} animationDuration={280} name="Thu nhập" dataKey="thu" stroke="var(--chart-income)" strokeWidth={2} dot={false}/><Line isAnimationActive={!reduceMotion} animationDuration={280} name="Chi tiêu" dataKey="chi" stroke="var(--chart-expense)" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></div></section></div>
  </>}
  <section className="report-trends"><div className="section-title-row"><div><span className="section-overline">RÚT KINH NGHIỆM</span><h2>Đánh giá ngân sách qua các kỳ</h2><p>{sampleMode?'Số liệu tính từ các giao dịch thuộc kỳ ngân sách mẫu; chưa có bản phản tư.':'So sánh kế hoạch và thực tế. Các kỳ cũ trùng nhau cần được rà soát riêng.'}</p></div></div><div className="table-wrap" role="region" tabIndex={0} aria-label="Báo cáo ngân sách theo kỳ"><table><thead><tr><th scope="col">Kỳ</th><th scope="col">Hạn mức</th><th scope="col">Chi thực</th><th scope="col">Tỷ lệ dùng</th><th scope="col">Kế hoạch cải thiện</th></tr></thead><tbody>{trends.map(t=><tr key={t.budget_id}><td>{t.name}</td><td>{money(t.total_limit)}</td><td>{money(t.expense_actual)}</td><td>{t.usage_rate}%</td><td>{t.improvement_action||'Chưa ghi nhận'}</td></tr>)}{!trends.length&&<tr><td colSpan="5" className="empty">Chưa có kỳ ngân sách để so sánh.</td></tr>}</tbody></table></div></section>
 </div>;
}
