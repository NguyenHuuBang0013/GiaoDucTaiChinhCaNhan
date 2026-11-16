export const headers=['type','category_id','amount','transaction_date','note'];
export function parseCsv(text){
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted}
  else if(c===','&&!quoted){row.push(cell);cell=''}
  else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(s=>s.trim()))rows.push(row);row=[];cell=''}
  else cell+=c;
 }
 if(quoted)throw new Error('CSV thiếu dấu ngoặc kép đóng');row.push(cell);if(row.some(s=>s.trim()))rows.push(row);
 return rows.map(r=>r.map((s,i)=>i===0?s.replace(/^\uFEFF/,'').trim():s.trim()));
}
export function readTransactionsCsv(text){
 const rows=parseCsv(text);if(rows.length<2)throw new Error('CSV phải có dòng tiêu đề và dữ liệu');
 const first=rows[0].map(x=>x.toLowerCase());const index=headers.map(h=>first.indexOf(h));
 if(index.some(i=>i<0))throw new Error('Thiếu cột: '+headers.filter((h,n)=>index[n]<0).join(', '));
 const data=rows.slice(1).map((r,n)=>Object.fromEntries(headers.map((h,i)=>[h,r[index[i]]||''])));
 if(data.length>300)throw new Error('Chỉ nhập tối đa 300 giao dịch mỗi lượt');
 for(const [i,r] of data.entries()){
  if(!['THU','CHI'].includes(r.type)||!Number.isFinite(Number(r.amount))||Number(r.amount)<=0||!/^(\d{4})-(\d{2})-(\d{2})$/.test(r.transaction_date)||r.type==='CHI'&&!r.category_id)throw new Error('Dữ liệu không hợp lệ tại dòng '+(i+2));
 }
 return data.map(r=>({...r,category_id:r.category_id||null}));
}
const safeCell = value => {let v=String(value??'');if(/^[=+@\-\t\r]/.test(v))v="'"+v;return '"'+v.replaceAll('"','""')+'"'};
export function toCsv(rows,columns=headers){return '\uFEFF'+[columns,...rows.map(r=>columns.map(c=>r[c]))].map(x=>x.map(safeCell).join(',')).join('\r\n')}
export function downloadCsv(name,csv){const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
