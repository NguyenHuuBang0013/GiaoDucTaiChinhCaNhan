import React,{useEffect,useState} from 'react';
import {api} from '../services/api';
import Button from '../components/Button';
import SampleDataPanel from '../components/SampleDataPanel';
import {money} from '../utils/format';

const initial={housing:'2000000',food:'1500000',transport:'600000',flexible:'1100000',reserve:'600000',response:'REDUCE_FLEXIBLE'};
const labels=[['housing','Thuê nhà / chỗ ở'],['food','Ăn uống thiết yếu'],['transport','Đi lại thiết yếu'],['flexible','Chi linh hoạt'],['reserve','Quỹ dự phòng']];
export default function PracticePage({onNavigate,onSamplesChanged}){
 const [values,setValues]=useState(initial),[result,setResult]=useState(null),[history,setHistory]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const load=async()=>{setHistory(await api('/api/education/practice/history'))};
 useEffect(()=>{load().catch(e=>setError(e.message))},[]);
 async function submit(e){e.preventDefault();setBusy(true);setError('');try{setResult(await api('/api/education/practice','POST',values));await load()}catch(e){setError(e.message)}finally{setBusy(false)}}
 const allocated=labels.reduce((a,[key])=>a+Number(values[key]||0),0);
 return <div className="edu-workspace practice-workspace"><section className="practice-intro"><div><span className="eyebrow">TÌNH HUỐNG THỰC HÀNH</span><h2>Một tháng có khoản chi bất ngờ</h2><p>Hãy phân bổ tiền sinh hoạt và xử lý sự cố. Kết quả chỉ dùng cho học tập, không ghi vào giao dịch thật.</p></div><dl className="practice-facts"><div><dt>Thu nhập giả định</dt><dd>{money(6000000)}</dd></div><div><dt>Chi phí sửa xe</dt><dd>{money(900000)}</dd></div></dl></section>
 <section className="data-panel"><h2>Tình huống: cân đối tiền sinh hoạt và sự cố</h2><p>Hãy bảo đảm nhu cầu cần thiết, dành quỹ dự phòng và lựa chọn cách xử lý khoản sửa xe.</p><form className="edu-form-grid" onSubmit={submit}>{labels.map(([key,label])=><label key={key}>{label}<input type="number" required min="0" step="0.01" value={values[key]} onChange={e=>setValues(v=>({...v,[key]:e.target.value}))}/></label>)}<div className="edu-wide"><p>Đã phân bổ: <strong>{money(allocated)}</strong> / 6.000.000đ. Chênh lệch: <strong>{money(6000000-allocated)}</strong></p><label>Chọn cách xử lý khoản sửa xe<select value={values.response} onChange={e=>setValues(v=>({...v,response:e.target.value}))}><option value="RESERVE">Dùng quỹ dự phòng</option><option value="REDUCE_FLEXIBLE">Cắt giảm chi linh hoạt</option><option value="BORROW">Vay thêm để giữ nguyên chi tiêu</option></select></label></div><Button type="submit" disabled={busy}>{busy?'Đang đánh giá':'Xem hậu quả quyết định'}</Button></form>
 {result&&<div role="status" className="edu-feedback"><h3>Điểm thực hành: {result.score}/100</h3><p>{result.feedback}</p><p>Tiền còn lại: {money(result.unallocated)}. Đây là điểm kỹ năng ra quyết định trong tình huống giả lập, không phải đánh giá tài sản của bạn.</p><Button kind="outline" onClick={()=>onNavigate('learning',{lesson:result.recommended_lesson})}>Ôn bài về chi phí bất ngờ</Button></div>}{error&&<p role="alert">{error}</p>}</section>
 <section className="data-panel"><h2>Lịch sử thực hành</h2>{history.length?<div className="table-wrap"><table><thead><tr><th>Thời điểm</th><th>Điểm</th></tr></thead><tbody>{history.map((h,i)=><tr key={i}><td>{new Date(h.attempted_at).toLocaleString('vi-VN')}</td><td>{h.score}/100</td></tr>)}</tbody></table></div>:<p>Chưa có lượt thực hành.</p>}</section>
 <SampleDataPanel onSamplesChanged={onSamplesChanged}/></div>;
}
