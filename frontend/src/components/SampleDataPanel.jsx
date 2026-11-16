import React,{useCallback,useEffect,useState} from 'react';
import Button from './Button';
import {api} from '../services/api';
import {money} from '../utils/format';

/** Owner-scoped, read-only sample preview; never mixes demonstration data with real finances. */
export default function SampleDataPanel({onSamplesChanged}){
 const [preview,setPreview]=useState(null);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const load=useCallback(async()=>{
  const result=await api('/api/data/sample-summary');
  setPreview(result);
  return result;
 },[]);
 useEffect(()=>{let active=true;load().then(()=>{if(active)setLoading(false)}).catch(e=>{if(active){setError(e.message);setLoading(false)}});return()=>{active=false}},[load]);
 const mutate=async method=>{
  if(busy)return;
  if(method==='DELETE'&&!window.confirm('Xóa toàn bộ dữ liệu mẫu? Dữ liệu tài chính thật sẽ được giữ nguyên.'))return;
  setBusy(true);setError('');setNotice('');
  try{
   await api('/api/data/sample',method);
   const result=await load();
   const count=Number(result.sample_transactions||0)+Number(result.sample_budgets||0);
   if(method==='POST' && count===0){setError('Máy chủ phản hồi thành công nhưng chưa tìm thấy dữ liệu mẫu. Vui lòng kiểm tra backend và database.');return;}
   if(method==='DELETE' && (Number(result.sample_transactions||0)+Number(result.sample_budgets||0)+Number(result.sample_goals||0)+Number(result.sample_scenarios||0))>0){setError('Dữ liệu mẫu vẫn còn sau khi xóa. Vui lòng kiểm tra lại.');return;}
   onSamplesChanged?.();
   setNotice(method==='POST'?`Đã tạo ${result.sample_transactions} giao dịch và ${result.sample_budgets} ngân sách mẫu. Chọn “Dữ liệu mẫu” trên thanh điều hướng để xem toàn website; danh sách ở bên dưới cũng đã cập nhật.`:'Đã xóa dữ liệu mẫu; dữ liệu thật vẫn được giữ nguyên.');
  }catch(e){setError(e.message)}finally{setBusy(false)}
 };
 const count=Number(preview?.sample_transactions||0)+Number(preview?.sample_budgets||0)+Number(preview?.sample_goals||0)+Number(preview?.sample_scenarios||0);
 return <section className="sample-viewer" aria-label="Dữ liệu mẫu thực hành">
  <div className="sample-viewer-heading"><div><h3>Dữ liệu thực hành mẫu</h3><p>{preview?.message||'Dữ liệu mẫu tách biệt hoàn toàn với số liệu tài chính thật; chọn “Dữ liệu mẫu” trên thanh điều hướng để xem chúng trong Tổng quan, Thu – chi, Ngân sách và Báo cáo.'}</p></div><span className="sample-viewer-label">CHẾ ĐỘ MINH HỌA</span></div>
  <div className="sample-viewer-actions"><Button kind="outline" disabled={busy||loading} onClick={()=>mutate('POST')}>{busy?'Đang xử lý…':'Tạo dữ liệu mẫu'}</Button><Button kind="outline" disabled={busy||loading||!count} onClick={()=>mutate('DELETE')}>Xóa dữ liệu mẫu</Button><Button kind="outline" disabled={busy||loading} onClick={async()=>{setLoading(true);setError('');try{await load()}catch(e){setError(e.message)}finally{setLoading(false)}}}>Tải lại danh sách</Button></div>
  {notice&&<p className="sample-viewer-success" role="status">{notice}</p>}
  {error&&<p className="sample-viewer-error" role="alert">{error}</p>}
  {loading?<p role="status">Đang kiểm tra dữ liệu mẫu…</p>:<>
   <div className="sample-counts"><span><strong>{preview?.sample_transactions||0}</strong> Giao dịch</span><span><strong>{preview?.sample_budgets||0}</strong> Ngân sách</span><span><strong>{preview?.sample_goals||0}</strong> Mục tiêu</span><span><strong>{preview?.sample_scenarios||0}</strong> Kịch bản</span></div>
   {!count?<p className="sample-viewer-empty">Chưa có dữ liệu mẫu. Nhấn “Tạo dữ liệu mẫu” để tạo một bộ dữ liệu minh họa và xem ngay tại đây.</p>:<>
    <div className="sample-viewer-group"><h4>Giao dịch mẫu <small>(danh sách đã tạo)</small></h4><div className="table-wrap"><table><thead><tr><th>Ngày</th><th>Danh mục</th><th>Loại</th><th>Số tiền</th></tr></thead><tbody>{(preview.transactions||[]).map(t=><tr key={t.transaction_id}><td>{t.transaction_date}</td><td>{t.category_name||t.note||'—'}</td><td>{t.type==='THU'?'Thu':'Chi'}</td><td>{money(t.amount)}</td></tr>)}</tbody></table></div></div>
    <div className="sample-viewer-group"><h4>Ngân sách mẫu</h4><div className="table-wrap"><table><thead><tr><th>Tên ngân sách</th><th>Thời gian</th><th>Hạn mức</th></tr></thead><tbody>{(preview.budgets||[]).map(b=><tr key={b.budget_id}><td>{b.name}</td><td>{b.start_date} – {b.end_date}</td><td>{money(b.total_limit)}</td></tr>)}</tbody></table></div></div>
    <div className="sample-viewer-group"><h4>Mục tiêu và kịch bản mẫu</h4><ul className="sample-viewer-list">{(preview.goals||[]).map(g=><li key={'goal'+g.goal_id}><strong>{g.name}</strong><span>Mục tiêu: {money(g.target_amount)}</span></li>)}{(preview.scenarios||[]).map(s=><li key={'scenario'+s.scenario_id}><strong>{s.name}</strong><span>Thu nhập/kỳ: {money(s.income_per_period)}</span></li>)}</ul></div>
   </>}
  </>}
 </section>;
}
