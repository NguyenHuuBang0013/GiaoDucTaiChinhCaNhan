import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sampleCount,sampleFinanceData,sampleFinancialSummary,sampleMonthlySummary,sampleBudgetTrends,sampleGoalProgress,sampleScenarioComparison,sampleAlerts} from '../src/utils/sampleFinance.js';
const src=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const data={sample_transactions:3,sample_budgets:1,sample_goals:1,sample_scenarios:1,
 transactions:[{transaction_id:1,category_id:3,type:'THU',amount:600,date:'',transaction_date:'2026-11-02'},
 {transaction_id:2,category_id:1,type:'CHI',amount:200,transaction_date:'2026-11-04',category_name:'Ăn uống'},
 {transaction_id:3,category_id:2,type:'CHI',amount:100,transaction_date:'2026-10-25',category_name:'Đi lại'}],
 categories:[{category_id:1,name:'Ăn uống'},{category_id:2,name:'Đi lại'}],
 budgets:[{budget_id:11,name:'Tháng 11',start_date:'2026-11-01',end_date:'2026-11-30',total_limit:250}],
 goals:[{goal_id:9,target_amount:500}],contributions:[{goal_id:9,amount:150}],
 scenarios:[{scenario_id:5,initial_saving:50,income_per_period:700,expense_per_period:500,duration:3}]};
test('sample count includes all sample entity types',()=>assert.equal(sampleCount(data),6));
test('sample finance dataset contains no unrelated real records',()=>{
 const state=sampleFinanceData(data);assert.equal(Object.keys(state).length,5);
 assert.equal(state.transactions.length,3);assert.deepEqual(sampleFinanceData(null).budgets,[]);
});
test('sample report calculates period totals and category totals without personal APIs',()=>{
 const r=sampleFinancialSummary(data,'2026-11-01','2026-11-30');assert.equal(r.totals.find(x=>x.type==='THU').total,600);assert.equal(r.totals.find(x=>x.type==='CHI').total,200);assert.deepEqual(r.expense_by_category,[{name:'Ăn uống',total:200}]);
 const months=sampleMonthlySummary(data,'2026');assert.equal(months.find(x=>x.month===10&&x.type==='CHI').total,100);
});
test('budget usage is limited to matching date range and sample contributions are isolated',()=>{
 const r=sampleBudgetTrends(data);assert.equal(r[0].expense_actual,200);assert.equal(r[0].usage_rate,80);assert.equal(sampleGoalProgress(data,9),150);
});
test('scenario prediction and sample alerts use sample-only records',()=>{
 assert.equal(sampleScenarioComparison(data,[5])[0].estimated_saving,650);
 assert.equal(sampleAlerts(data,'2026-11-15').length,1);
});
test('all sample financial routes are guarded read-only',()=>{
 const app=src('../src/app/App.jsx');const entity=src('../src/pages/EntityPage.jsx');
 assert.match(app,/readOnly=\{sampleMode\}/);assert.match(entity,/!readOnly&&<Button/);
 assert.match(entity,/!readOnly&&<TransactionTransfer/);
 assert.match(src('../src/pages/ScenariosPage.jsx'),/if\(readOnly\)/);
 assert.match(src('../src/pages/RecurringPage.jsx'),/if\(sampleMode\)return/);
});
test('shared mode selected per user and persisted without storing tokens',()=>{
 const hook=src('../src/hooks/useSampleMode.js');assert.match(hook,/financelab-data-mode-/);
 assert.match(hook,/localStorage\.setItem/);assert.doesNotMatch(hook,/access_token|id_token|jwt/);
 assert.match(src('../src/layouts/MainLayout.jsx'),/value=\{mode\}/);
});
