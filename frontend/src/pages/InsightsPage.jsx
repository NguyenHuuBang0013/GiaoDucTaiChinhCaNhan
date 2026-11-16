import React,{useEffect,useState} from 'react';
import {ArrowRight,CheckCircle2} from 'lucide-react';
import {api} from '../services/api';
import {sampleAlerts} from '../utils/sampleFinance';
export default function InsightsPage({onNavigate,sampleMode=false,samplePreview}){
 const [alerts,setAlerts]=useState([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{if(sampleMode){setAlerts(sampleAlerts(samplePreview));setLoading(false);setError('');return;}let current=true;api('/api/insights/alerts').then(rows=>{if(current)setAlerts(rows)}).catch(e=>{if(current)setError(e.message)}).finally(()=>{if(current)setLoading(false)});return()=>{current=false}},[sampleMode,samplePreview]);
 return <div className="insights-workspace"><div className="insights-intro"><span className="section-overline">ĐỌC HIỂU SỐ LIỆU</span><h2>Điều đáng chú ý</h2><p>{sampleMode?'Nhận xét minh họa từ ngân sách thực hành, không dựa trên dữ liệu tài chính cá nhân.':'Những nhận xét tính từ ngân sách và mục tiêu của bạn. Các cảnh báo chỉ cung cấp thông tin, không tự động ngăn giao dịch.'}</p></div>
  {loading&&<p role="status">Đang đánh giá dữ liệu tài chính…</p>}
  {error&&<div role="alert" className="report-error">Không thể tải cảnh báo: {error}</div>}
  {!loading&&!error&&!alerts.length&&<div className="insights-empty"><CheckCircle2 size={30}/><h3>Chưa có cảnh báo cần chú ý</h3><p>Bạn có thể kiểm tra lại ngân sách hoặc học cách chuẩn bị cho những khoản chi bất ngờ.</p></div>}
  <div className="insights-list">{alerts.map((item,i)=><article className={'insight '+item.kind} key={i}><div><h3>{item.title}</h3><p>{item.detail}</p></div><button type="button" onClick={()=>onNavigate(item.route||'learning',{lesson:item.lesson_slug||'needs-wants'})}>Xem bài học liên quan <ArrowRight size={16}/></button></article>)}</div>
  <div className="insights-actions"><button type="button" onClick={()=>onNavigate('learning')}>Học cách điều chỉnh ngân sách <ArrowRight size={16}/></button><button type="button" onClick={()=>onNavigate('budget-coach')}>Đánh giá kỳ ngân sách <ArrowRight size={16}/></button></div>
 </div>;
}
