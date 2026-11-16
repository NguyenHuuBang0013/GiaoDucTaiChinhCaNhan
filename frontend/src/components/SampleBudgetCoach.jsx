import React,{useMemo,useState} from 'react';
import {money,dateOnly} from '../utils/format';
import {sampleBudgetTrends,sampleGoalProgress} from '../utils/sampleFinance';
export default function SampleBudgetCoach({preview,onNavigate}){
 const budgets=useMemo(()=>sampleBudgetTrends(preview).sort((a,b)=>String(b.start_date).localeCompare(String(a.start_date))),[preview]);
 const [selectedId,setSelectedId]=useState('');
 const selected=budgets.find(b=>String(b.budget_id)===selectedId)||budgets[0];
 const expenses=(preview?.transactions||[]).filter(t=>selected&&t.type==='CHI'&&String(t.transaction_date).slice(0,10)>=String(selected.start_date).slice(0,10)&&String(t.transaction_date).slice(0,10)<=String(selected.end_date).slice(0,10));
 const categories=(preview?.budget_items||[]).filter(x=>Number(x.budget_id)===Number(selected?.budget_id));
 return <div className="report-workspace"><section className="data-panel"><span className="section-overline">THỰC HÀNH PHÂN TÍCH</span><h2>Đánh giá ngân sách mẫu</h2><p className="sample-analysis-hint">Xem số liệu của một kỳ thực hành. Mọi khoản chi và hạn mức bên dưới đều thuộc dữ liệu mẫu; không ghi nhận kế hoạch hay phản tư vào ngân sách thật.</p>
 {!budgets.length?<p>Chưa có ngân sách mẫu. Vào Hồ sơ để tạo dữ liệu thực hành.</p>:<><label>Chọn kỳ ngân sách <select value={selected?.budget_id||''} onChange={e=>setSelectedId(e.target.value)}>{budgets.map(b=><option key={b.budget_id} value={b.budget_id}>{b.name}</option>)}</select></label>
 <div className="report-summary"><div><span>Hạn mức</span><strong>{money(selected.total_limit)}</strong></div><div><span>Đã chi (mẫu)</span><strong>{money(selected.expense_actual)}</strong></div><div><span>Tỷ lệ sử dụng</span><strong>{selected.usage_rate}%</strong></div></div>
 <p>{selected.usage_rate>=100?'Giả định này đã vượt hạn mức; hãy cân nhắc cắt giảm khoản chi không thiết yếu.':selected.usage_rate>=80?'Bạn đang tiến gần hạn mức; hãy ưu tiên những khoản cần thiết.':'Ngân sách mẫu còn dư địa; hãy xem xét cách duy trì khoản tiết kiệm.'}</p>
 <h3>Phân bổ và chi tiêu theo danh mục</h3><div className="table-wrap"><table><thead><tr><th>Danh mục</th><th>Hạn mức</th><th>Chi tiêu mẫu</th></tr></thead><tbody>{categories.map(c=><tr key={c.budget_item_id}><td>{c.category_name}</td><td>{money(c.limit_amount)}</td><td>{money(expenses.filter(t=>Number(t.category_id)===Number(c.category_id)).reduce((n,t)=>n+Number(t.amount||0),0))}</td></tr>)}</tbody></table></div>
 <p className="sample-analysis-hint">Kỳ {dateOnly(selected.start_date)} – {dateOnly(selected.end_date)}</p></>}
 </section><section className="data-panel"><h2>Tiến độ mục tiêu mẫu</h2>{(preview?.goals||[]).map(g=><p key={g.goal_id}><strong>{g.name}</strong> · {money(sampleGoalProgress(preview,g.goal_id))} / {money(g.target_amount)}</p>)}{!(preview?.goals||[]).length&&<p>Chưa có mục tiêu mẫu.</p>}<button type="button" className="btn outline" onClick={()=>onNavigate('learning')}>Học thêm về lập ngân sách</button></section></div>;
}
