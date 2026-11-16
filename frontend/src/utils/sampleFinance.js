export const sampleCount=p=>['sample_transactions','sample_budgets','sample_goals','sample_scenarios'].reduce((n,k)=>n+Number(p?.[k]||0),0);
export const sampleFinanceData=p=>({transactions:p?.transactions||[],categories:p?.categories||[],budgets:p?.budgets||[],goals:p?.goals||[],scenarios:p?.scenarios||[]});
const amount=x=>Number(x)||0;
export function sampleFinancialSummary(p,start,end){
 const rows=(p?.transactions||[]).filter(t=>String(t.transaction_date).slice(0,10)>=start&&String(t.transaction_date).slice(0,10)<=end);
 const totals=['THU','CHI'].map(type=>({type,total:rows.filter(t=>t.type===type).reduce((n,t)=>n+amount(t.amount),0)}));
 const byCategory=new Map();
 for(const t of rows.filter(t=>t.type==='CHI')){const name=t.category_name||'Chưa phân loại';byCategory.set(name,(byCategory.get(name)||0)+amount(t.amount));}
 return {totals,expense_by_category:[...byCategory].map(([name,total])=>({name,total})).sort((a,b)=>b.total-a.total)};
}
export function sampleMonthlySummary(p,year){const map=new Map();for(const t of p?.transactions||[]){if(String(t.transaction_date).slice(0,4)!==String(year))continue;const month=Number(String(t.transaction_date).slice(5,7)),key=month+':'+t.type;map.set(key,(map.get(key)||0)+amount(t.amount));}return [...map].map(([key,total])=>{const [month,type]=key.split(':');return {month:Number(month),type,total}});}
export function sampleBudgetTrends(p){return (p?.budgets||[]).map(b=>{const spent=(p?.transactions||[]).filter(t=>t.type==='CHI'&&String(t.transaction_date).slice(0,10)>=String(b.start_date).slice(0,10)&&String(t.transaction_date).slice(0,10)<=String(b.end_date).slice(0,10)).reduce((n,t)=>n+amount(t.amount),0);const limit=amount(b.total_limit);return {...b,expense_actual:spent,usage_rate:limit?Math.round(spent/limit*100):0,improvement_action:null};});}
export function sampleGoalProgress(p,id){return (p?.contributions||[]).filter(c=>Number(c.goal_id)===Number(id)).reduce((n,c)=>n+amount(c.amount),0);}
export function sampleScenarioComparison(p,ids){return (p?.scenarios||[]).filter(s=>ids.includes(s.scenario_id)).map(s=>{const saving=amount(s.income_per_period)-amount(s.expense_per_period);return {scenario:s,saving_per_period:saving,estimated_saving:amount(s.initial_saving)+saving*amount(s.duration)};});}
export function sampleAlerts(p,now=new Date().toISOString().slice(0,10)){
 const result=[];for(const b of p?.budgets||[]){if(String(b.start_date).slice(0,10)>now||String(b.end_date).slice(0,10)<now)continue;const t=sampleBudgetTrends({...p,budgets:[b]})[0];if(t.usage_rate>=80)result.push({kind:t.usage_rate>=100?'danger':'warning',title:t.usage_rate>=100?'Ngân sách mẫu vượt hạn mức':'Ngân sách mẫu gần hết',detail:`${b.name}: đã dùng ${t.usage_rate}% hạn mức trong kỳ mẫu.`,route:'learning',lesson_slug:'needs-wants'});}
 return result;
}
