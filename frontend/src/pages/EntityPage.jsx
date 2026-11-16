import React,{useEffect,useMemo,useState} from 'react';
import {ArrowLeft,ArrowRight,Eye,Filter,Plus,Search,Pencil,Trash2} from 'lucide-react';
import Button from '../components/Button';
import EntityForm,{initialForm} from '../components/finance/EntityForm';
import BudgetCreateWizard from './BudgetCreateWizard';
import {api} from '../services/api';
import {configs} from '../config/modules';
import TransactionTransfer from './TransactionTransfer';
import {money,dateOnly} from '../utils/format';

const PAGE_SIZE=10;
const names={transactions:'giao dịch',categories:'danh mục',budgets:'ngân sách',goals:'mục tiêu'};
const sectionNames={transactions:'Nhật ký thu – chi',categories:'Nhóm giao dịch',budgets:'Các kỳ ngân sách',goals:'Mục tiêu đang theo dõi'};
export default function EntityPage({module,data,act,onDetail,readOnly=false}){
 const config=configs[module];
 const [editing,setEditing]=useState(null),[form,setForm]=useState({}),[busy,setBusy]=useState(false);
 const [query,setQuery]=useState(''),[kind,setKind]=useState('ALL'),[page,setPage]=useState(1);
 const rows=data[module]||[];
 useEffect(()=>{setQuery('');setKind('ALL');setPage(1)},[module]);
 const visible=useMemo(()=>{
  const term=query.trim().toLocaleLowerCase('vi-VN');
  return [...rows].filter(row=>{
   if(kind!=='ALL'&&(module==='transactions'?row.type:row.category_type)!==kind)return false;
   if(!term)return true;
   const category=data.categories?.find(c=>Number(c.category_id)===Number(row.category_id))?.name||'';
   return [category,...Object.values(row)].some(v=>String(v??'').toLocaleLowerCase('vi-VN').includes(term));
  }).sort((a,b)=>{
   const dateA=String(a.transaction_date||a.start_date||a.deadline||'');
   const dateB=String(b.transaction_date||b.start_date||b.deadline||'');
   return dateB.localeCompare(dateA)||Number(b[config.id]||0)-Number(a[config.id]||0);
  });
 },[rows,kind,query,module,config.id,data.categories]);
 const totalPages=Math.max(1,Math.ceil(visible.length/PAGE_SIZE));
 const currentPage=Math.min(page,totalPages);
 const shown=visible.slice((currentPage-1)*PAGE_SIZE,currentPage*PAGE_SIZE);
 const open=(row={})=>{setEditing(module==='budgets'&&!row.budget_id?'budget-wizard':'form');setForm(initialForm(row))};
 const save=async()=>{setBusy(true);const id=form[config.id];const result=await act(()=>api('/api/'+module+(id?'/'+id:''),id?'PUT':'POST',form));setBusy(false);if(result.ok)setEditing(null)};
 const del=async(row)=>{if(window.confirm(`Bạn muốn xóa ${config.label.toLowerCase()} này?`))await act(()=>api(`/api/${module}/${row[config.id]}`,'DELETE'))};
 const fieldList=config.fields.filter(f=>f[0]!=='note'&&f[0]!=='change_reason');
 function displayValue(row,key,type){
  if(type==='date')return dateOnly(row[key]);
  if(type==='category')return data.categories?.find(c=>Number(c.category_id)===Number(row[key]))?.name||'Chưa phân loại';
  if(key==='type'||key==='category_type')return <span className={'table-tag '+(row[key]==='THU'?'is-income':'')}>{row[key]==='THU'?'Thu':row[key]==='CHI'?'Chi':String(row[key]||'—')}</span>;
  if(key==='spending_group')return row[key]==='NEED'?'Thiết yếu':row[key]==='WANT'?'Linh hoạt':'—';
  if(key==='cost_nature')return row[key]==='FIXED'?'Cố định':row[key]==='VARIABLE'?'Biến đổi':'—';
  if(key.includes('amount')||key.includes('limit')||key.includes('saving'))return <span className="table-money">{money(row[key])}</span>;
  return String(row[key]??'—');
 }
 return <div className="list-workspace">
  <section className="list-panel" aria-label={`Danh sách ${config.label.toLowerCase()}`}>
   <div className="list-head"><div><h2>{sectionNames[module]||config.label}</h2><p>{rows.length} mục {readOnly?'trong bộ dữ liệu mẫu':'được lưu trong tài khoản của bạn'}</p></div>{!readOnly&&<Button onClick={()=>open()}><Plus size={16} aria-hidden="true"/> Thêm {names[module]||'mới'}</Button>}</div>
   <div className="list-toolbar">
    <label className="list-search"><span className="list-search-icon" aria-hidden="true"><Search size={18}/></span><span className="sr-only">Tìm kiếm trong danh sách</span><input value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}} placeholder={`Tìm ${config.label.toLowerCase()}...`} /></label>
    {['transactions','categories'].includes(module)&&<label className="list-filter"><Filter size={16} aria-hidden="true"/><span className="sr-only">Lọc theo loại</span><select value={kind} onChange={e=>{setKind(e.target.value);setPage(1)}}><option value="ALL">Tất cả</option><option value="THU">Khoản thu</option><option value="CHI">Khoản chi</option></select></label>}
    <span className="list-count" aria-live="polite">{visible.length} / {rows.length} mục</span>
   </div>
   <p id={`table-cue-${module}`} className="table-scroll-cue">{readOnly?'Vuốt ngang để xem các cột còn lại.':'Vuốt ngang để xem các cột còn lại và thao tác.'}</p>
   <div className="table-wrap" role="region" aria-label={`Bảng ${config.label.toLowerCase()}`} aria-describedby={`table-cue-${module}`} tabIndex={0}>
    <table><thead><tr>{fieldList.map(([key,title])=><th key={key} scope="col">{title}</th>)}{!readOnly&&<th className="table-actions-head" scope="col">Thao tác</th>}</tr></thead>
     <tbody>{shown.map(row=><tr key={row[config.id]}>{fieldList.map(([key,,type])=><td key={key}>{displayValue(row,key,type)}</td>)}
      {!readOnly&&<td className="actions"><div className="row-actions"><button type="button" title="Sửa" aria-label={`Sửa ${config.label.toLowerCase()} ${row.name||row.note||row[config.id]}`} onClick={()=>open(row)}><Pencil size={16}/></button>
       {['budgets','goals','scenarios'].includes(module)&&<button type="button" title="Xem chi tiết" aria-label={`Xem chi tiết ${row.name||row.note||row[config.id]}`} onClick={()=>onDetail(module,row)}><Eye size={16}/></button>}
       <button type="button" className="delete-action" title="Xóa" aria-label={`Xóa ${config.label.toLowerCase()} ${row.name||row.note||row[config.id]}`} onClick={()=>del(row)}><Trash2 size={16}/></button></div></td>}</tr>)}
      {!shown.length&&<tr><td colSpan={fieldList.length+(readOnly?0:1)}><div className="table-empty"><span>{rows.length?'Không tìm thấy kết quả':'Chưa có dữ liệu'}</span><p>{rows.length?'Thử thay đổi từ khóa hoặc bộ lọc.':readOnly?'Chưa có bản ghi mẫu cho nhóm này. Bạn có thể tạo bộ mẫu trong Hồ sơ.':`Tạo ${names[module]||'mục'} đầu tiên để bắt đầu.`}</p>{!rows.length&&!readOnly&&<Button kind="outline" onClick={()=>open()}><Plus size={16}/> Thêm mới</Button>}</div></td></tr>}
     </tbody></table>
   </div>
   {visible.length>PAGE_SIZE&&<div className="list-pagination"><span>Hiển thị {(currentPage-1)*PAGE_SIZE+1}–{Math.min(currentPage*PAGE_SIZE,visible.length)} trên {visible.length}</span><div><button aria-label="Trang trước" disabled={currentPage===1} onClick={()=>setPage(currentPage-1)}><ArrowLeft size={16}/></button><span>Trang {currentPage}/{totalPages}</span><button aria-label="Trang sau" disabled={currentPage===totalPages} onClick={()=>setPage(currentPage+1)}><ArrowRight size={16}/></button></div></div>}
  </section>
  {module==='transactions'&&!readOnly&&<TransactionTransfer rows={rows} act={act}/>}
  {!readOnly&&editing==='budget-wizard'&&<BudgetCreateWizard categories={data.categories||[]} act={act} onClose={()=>setEditing(null)}/>}
  {!readOnly&&editing==='form'&&<EntityForm config={config} value={form} onChange={setForm} onSubmit={save} onClose={()=>setEditing(null)} categories={data.categories||[]} busy={busy}/>}
 </div>;
}
