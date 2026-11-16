import React from 'react';
import Button from '../Button';
import useDialogFocus from '../useDialogFocus';
import {today,monthStart,dateOnly} from '../../utils/format';
export function initialForm(row={}){return {...row,transaction_date:dateOnly(row.transaction_date)||today(),start_date:dateOnly(row.start_date)||monthStart(),end_date:dateOnly(row.end_date)||today(),deadline:dateOnly(row.deadline)||today(),period_unit:row.period_unit||'MONTHLY',type:row.type||'CHI',category_type:row.category_type||'CHI'};}
export default function EntityForm({config,value,onChange,onSubmit,onClose,categories=[],busy=false}){
 const dialogRef=useDialogFocus(true,onClose);
 return <div className="overlay" onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
  <form ref={dialogRef} role="dialog" aria-modal="true" aria-label={`${value[config.id]?'Cập nhật':'Thêm'} ${config.label.toLowerCase()}`} tabIndex={-1} className="modal" onSubmit={e=>{e.preventDefault();onSubmit();}}>
   <div className="modal-top"><h2>{value[config.id]?'Cập nhật':'Thêm'} {config.label.toLowerCase()}</h2><button type="button" aria-label="Đóng hộp thoại" onClick={onClose}>×</button></div>
   <div className="form-fields">{config.fields.map(([key,label,type,opts])=><label key={key}>{label}
    {type==='select'?<select value={value[key]??opts[0]} onChange={e=>onChange({...value,[key]:e.target.value})}>{opts.map(v=><option key={v} value={v}>{v}</option>)}</select>:
    type==='category'?<select value={value[key]??''} onChange={e=>onChange({...value,[key]:e.target.value||null})}><option value="">— Không chọn —</option>{categories.filter(c=>c.category_type===(value.type||'CHI')).map(c=><option value={c.category_id} key={c.category_id}>{c.name}</option>)}</select>:
    <input type={type} value={value[key]??''} min={type==='number'?0:undefined} step={type==='number'?'any':undefined} onChange={e=>onChange({...value,[key]:e.target.value})} required={!['note','spending_group','cost_nature'].includes(key)&&!(key==='category_id'&&value.type==='THU')&&!(key==='change_reason'&&!value[config.id])}/>}
   </label>)}</div>
   <div className="modal-actions"><Button kind="outline" type="button" onClick={onClose}>Hủy</Button><Button type="submit" disabled={busy}>Lưu thay đổi</Button></div>
  </form>
 </div>;
}
