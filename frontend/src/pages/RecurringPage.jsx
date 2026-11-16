import React,{useEffect,useState} from 'react';
import {ArrowRight,CalendarClock,Plus,StopCircle} from 'lucide-react';
import Button from '../components/Button';
import {api} from '../services/api';
import {today,money,dateOnly} from '../utils/format';
export default function RecurringPage({data,act,sampleMode=false}){
 const [rows,setRows]=useState([]),[form,setForm]=useState({type:'CHI',category_id:'',amount:'',note:'',next_date:today(),frequency:'MONTHLY'});
 const [loading,setLoading]=useState(true),[error,setError]=useState('');
 const set=(key,val)=>setForm(f=>({...f,[key]:val}));
 const load=async()=>{try{const items=await api('/api/recurring');setRows(Array.isArray(items)?items:[]);setError('')}catch(e){setError(e.message)}finally{setLoading(false)}};
 useEffect(()=>{if(!sampleMode)load();else setLoading(false)},[sampleMode]);
 const mutate=async(fn)=>{const r=await act(fn);if(r.ok)await load();return r};
 const submit=async e=>{e.preventDefault();const result=await mutate(()=>api('/api/recurring','POST',form));if(result.ok)setForm({type:'CHI',category_id:'',amount:'',note:'',next_date:today(),frequency:'MONTHLY'})};
 const active=rows.filter(r=>r.active).length;
 if(sampleMode)return <section className="data-panel"><h2>Giao dịch định kỳ trong dữ liệu mẫu</h2><p>Bộ dữ liệu thực hành hiện chưa có lịch giao dịch định kỳ. Chế độ mẫu không tạo khoản định kỳ thật hoặc ghi nhận giao dịch vào tài khoản cá nhân.</p><p>Chuyển sang “Dữ liệu thật” trên thanh điều hướng nếu muốn sử dụng chức năng quản lý định kỳ.</p></section>;
 return <div className="recurring-workspace">
  <div className="recurring-intro"><div><span className="section-overline">TỰ ĐỘNG HÓA CÓ KIỂM SOÁT</span><h2>Các khoản lặp lại</h2><p>FinanceLab chỉ ghi giao dịch khi bạn chủ động chọn “Ghi nhận kỳ đến hạn”. Mỗi kỳ được xử lý một lần.</p></div><div className="recurring-count"><strong>{active}</strong><span>khoản đang hoạt động</span></div></div>
  <div className="recurring-grid"><section className="data-panel recurring-form-panel"><div className="section-title-row"><div><h2>Thêm khoản định kỳ</h2><p>Điền thông tin cơ bản để chuẩn bị cho kỳ tiếp theo.</p></div><Plus size={19} aria-hidden="true"/></div><form className="form-fields" onSubmit={submit}>
    <label>Loại giao dịch<select value={form.type} onChange={e=>{set('type',e.target.value);set('category_id','')}}><option value="CHI">Chi</option><option value="THU">Thu</option></select></label>
    <label>Danh mục<select value={form.category_id} onChange={e=>set('category_id',e.target.value)} required={form.type==='CHI'}><option value="">Chọn danh mục</option>{(data.categories||[]).filter(c=>c.category_type===form.type).map(c=><option key={c.category_id} value={c.category_id}>{c.name}</option>)}</select></label>
    <label>Số tiền (VNĐ)<input type="number" min="0.01" step="0.01" required value={form.amount} onChange={e=>set('amount',e.target.value)}/></label>
    <label>Ngày bắt đầu<input type="date" required value={form.next_date} onChange={e=>set('next_date',e.target.value)}/></label>
    <label>Chu kỳ<select value={form.frequency} onChange={e=>set('frequency',e.target.value)}><option value="WEEKLY">Hàng tuần</option><option value="MONTHLY">Hàng tháng</option></select></label>
    <label>Ghi chú<input maxLength={500} value={form.note} onChange={e=>set('note',e.target.value)} placeholder="Ví dụ: Tiền thuê nhà"/></label>
    <div className="recurring-form-actions"><Button type="submit"><Plus size={16}/> Thêm giao dịch định kỳ</Button></div>
   </form></section>
   <section className="recurring-list"><div className="section-title-row"><div><h2>Danh sách đã thiết lập</h2><p>{rows.length} khoản định kỳ</p></div><Button kind="outline" onClick={()=>mutate(()=>api('/api/recurring/post-due','POST'))}>Ghi nhận kỳ đến hạn <ArrowRight size={15}/></Button></div>
    {loading&&<p role="status" className="quiet-meta">Đang tải danh sách…</p>}
    {error&&<p role="alert" className="report-error">{error}</p>}
    {!loading&&!rows.length&&<div className="subtle-empty"><CalendarClock size={26}/><h3>Chưa có khoản định kỳ</h3><p>Thêm khoản thu hoặc chi lặp lại ở biểu mẫu bên cạnh.</p></div>}
    {rows.map(r=><div className="recurring-entry" key={r.recurring_id}><div><strong>{r.note|| (r.type==='THU'?'Khoản thu định kỳ':'Khoản chi định kỳ')}</strong><small>{r.frequency==='MONTHLY'?'Hàng tháng':'Hàng tuần'} · Kỳ tới {dateOnly(r.next_date)}</small><span className={'recurring-status '+(r.active?'':'is-paused')}>{r.active?'Đang hoạt động':'Đã dừng'}</span></div><div className="recurring-entry-actions"><strong>{money(r.amount)}</strong>{Boolean(r.active)&&<button type="button" onClick={()=>window.confirm('Dừng giao dịch định kỳ này?')&&mutate(()=>api(`/api/recurring/${r.recurring_id}`,'DELETE'))}><StopCircle size={15}/> Dừng</button>}</div></div>)}
   </section></div>
 </div>;
}
