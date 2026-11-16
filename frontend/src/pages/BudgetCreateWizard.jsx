import React,{useState} from 'react';
import Button from '../components/Button';
import useDialogFocus from '../components/useDialogFocus';
import {api} from '../services/api';
import {monthEnd,monthStart,money} from '../utils/format';
export default function BudgetCreateWizard({categories,act,onClose}){
 const [name,setName]=useState(''),[start,setStart]=useState(monthStart()),[end,setEnd]=useState(monthEnd()),[total,setTotal]=useState(''),[income,setIncome]=useState(''),[saving,setSaving]=useState(''),[items,setItems]=useState([{category_id:'',limit_amount:''}]);
 const [suggesting,setSuggesting]=useState(false),[suggestionText,setSuggestionText]=useState('');
 const dialogRef=useDialogFocus(true,onClose);
 const allocations=items.reduce((sum,i)=>sum+Number(i.limit_amount||0),0);
 const update=(index,key,value)=>setItems(rows=>rows.map((r,j)=>j===index?{...r,[key]:value}:r));
 async function suggest(){
  if(!Number(income)||Number(income)<=0){window.alert('Nhập thu nhập dự kiến trước khi xin gợi ý');return;}
  setSuggesting(true);setSuggestionText('');
  try {const response=await api('/api/budget-guidance/suggest','POST',{income,saving:saving===''?null:saving});
   setTotal(String(response.recommended_total_limit));setSaving(String(response.planned_saving));
   setItems(response.items.filter(x=>Number(x.recommended_limit)>0).map(x=>({category_id:String(x.category_id),limit_amount:String(x.recommended_limit)})));
   setSuggestionText(response.explanation);
  }catch(e){setSuggestionText(e.message)}finally{setSuggesting(false)}
 }
 async function submit(e){e.preventDefault();if(!Number.isFinite(Number(total))||Number(total)<=0){window.alert('Hạn mức phải lớn hơn 0');return;}if(start>end){window.alert('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu');return;}if(allocations>Number(total)){window.alert('Tổng phân bổ vượt hạn mức');return;}
  if(items.some(i=>(i.category_id&&!Number(i.limit_amount))||(!i.category_id&&Number(i.limit_amount)))){window.alert('Hãy nhập đầy đủ danh mục và hạn mức cho từng dòng');return;}
  const selected=items.filter(i=>i.category_id&&Number(i.limit_amount)>0);
  if(new Set(selected.map(i=>i.category_id)).size!==selected.length){window.alert('Danh mục không được phân bổ hai lần');return;}
  if(income!==''&&saving!==''&&Number(income)<Number(total)+Number(saving)){window.alert('Thu nhập dự kiến chưa đủ cho hạn mức chi và khoản tiết kiệm.');return;}
  if((income==='')!==(saving==='')){window.alert('Hãy nhập cả thu nhập và khoản tiết kiệm dự kiến, hoặc để trống cả hai.');return;}
  const result=await act(()=>api('/api/budgets/with-items','POST',{name,start_date:start,end_date:end,total_limit:total,expected_income:income===''?null:income,planned_saving:saving===''?null:saving,items:selected}));if(result.ok)onClose();
 }
 return <div className="overlay motion-overlay" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><form ref={dialogRef} role="dialog" aria-modal="true" aria-label="Tạo ngân sách và phân bổ hạn mức" tabIndex={-1} className="modal motion-dialog" onSubmit={submit}>
  <div className="modal-top"><h2>Tạo ngân sách và phân bổ hạn mức</h2><button type="button" aria-label="Đóng hộp thoại" onClick={onClose}>×</button></div>
  <div className="form-fields"><label>Tên ngân sách<input required maxLength={150} value={name} onChange={e=>setName(e.target.value)}/></label><label>Ngày bắt đầu<input required type="date" value={start} onChange={e=>setStart(e.target.value)}/></label><label>Ngày kết thúc<input required type="date" value={end} onChange={e=>setEnd(e.target.value)}/></label><label>Tổng hạn mức<input required type="number" min="0.01" step="any" value={total} onChange={e=>setTotal(e.target.value)}/></label></div>
  <h3>Kế hoạch dòng tiền (khuyến nghị)</h3><p>Để giáo dục cách cân đối ngân sách, hãy dự kiến khoản thu nhập và tiền dành ra trước khi chi tiêu.</p><div className="form-fields"><label>Thu nhập dự kiến<input type="number" min="0" step="0.01" value={income} onChange={e=>setIncome(e.target.value)}/></label><label>Khoản dự kiến tiết kiệm<input type="number" min="0" step="0.01" value={saving} onChange={e=>setSaving(e.target.value)}/></label></div>{income!==''&&saving!==''&&<p>Khoảng tiền còn lại sau hạn mức và tiết kiệm: <strong>{money(Number(income)-Number(total)-Number(saving))}</strong></p>}
  <div className="edu-feedback"><h3>Đề xuất phân bổ có giải thích</h3><p>Hãy phân loại danh mục CHI thành NEED (thiết yếu) / WANT (linh hoạt) trước khi chọn gợi ý. Hệ thống lấy 20% thu nhập làm tiết kiệm tham khảo, phần còn lại được phân bổ và có thể sửa hoàn toàn.</p><Button type="button" kind="outline" disabled={suggesting||!income} onClick={suggest}>{suggesting?'Đang tính':'Gợi ý phân bổ từ thu nhập'}</Button>{suggestionText&&<p role="status">{suggestionText}</p>}</div><h3>Phân bổ theo danh mục chi</h3>{items.map((item,index)=><div key={index} className="inline-form"><select value={item.category_id} onChange={e=>update(index,'category_id',e.target.value)}><option value="">Chọn danh mục</option>{categories.filter(c=>c.category_type==='CHI').map(c=><option key={c.category_id} value={c.category_id}>{c.name} · {c.spending_group==='WANT'?'Linh hoạt':'Thiết yếu/chưa phân loại'}</option>)}</select><input type="number" min="0" step="any" placeholder="Hạn mức" value={item.limit_amount} onChange={e=>update(index,'limit_amount',e.target.value)}/><button type="button" onClick={()=>setItems(rows=>rows.filter((_,j)=>j!==index))} aria-label="Xóa dòng phân bổ">×</button></div>)}
  <Button kind="outline" type="button" onClick={()=>setItems(rows=>[...rows,{category_id:'',limit_amount:''}])}>Thêm dòng phân bổ</Button><p>Tổng đã phân bổ: <strong>{money(allocations)}</strong> / {money(total)}</p>
  <div className="modal-actions"><Button kind="outline" type="button" onClick={onClose}>Hủy</Button><Button type="submit">Tạo ngân sách</Button></div>
 </form></div>;
}
