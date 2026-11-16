import React,{useState} from 'react';
import Button from '../components/Button';
import {api} from '../services/api';
import {readTransactionsCsv,toCsv,downloadCsv,headers} from '../utils/csv';
export default function TransactionTransfer({rows,act}){
 const [preview,setPreview]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const read=async file=>{if(!file)return;setError('');try{setPreview(readTransactionsCsv(await file.text()))}catch(e){setPreview([]);setError(e.message)}};
 const save=async()=>{setBusy(true);const r=await act(()=>api('/api/transactions/import','POST',preview));setBusy(false);if(r.ok)setPreview([])};
 return <section><h2>Nhập / xuất giao dịch (CSV)</h2><p>File CSV phải có các cột <code>{headers.join(', ')}</code>. Mỗi lần nhập tối đa 300 giao dịch, sẽ kiểm tra trước khi lưu.</p>
 <div className="quick-btns"><Button kind="outline" onClick={()=>downloadCsv('transactions.csv',toCsv(rows))}>Xuất giao dịch</Button><label className="csv-upload">Chọn CSV để nhập <input type="file" accept=".csv,text/csv" onChange={e=>read(e.target.files?.[0])}/></label></div>
 {error&&<p role="alert">{error}</p>}{preview.length>0&&<><p>Đã đọc {preview.length} giao dịch. Xem trước dữ liệu:</p><div className="table-wrap"><table><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{preview.slice(0,5).map((r,i)=><tr key={i}>{headers.map(h=><td key={h}>{r[h]}</td>)}</tr>)}</tbody></table></div><Button disabled={busy} onClick={save}>{busy?'Đang nhập…':`Xác nhận nhập ${preview.length} giao dịch`}</Button></>}
 </section>;
}
