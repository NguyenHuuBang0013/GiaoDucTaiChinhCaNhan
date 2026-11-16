import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
test('profile and practice both show the owner-scoped sample preview',()=>{
 const profile=read('../src/pages/ProfilePage.jsx');
 const practice=read('../src/pages/PracticePage.jsx');
 assert.match(profile,/<SampleDataPanel\s+(?:onSamplesChanged=\{onSamplesChanged\})\s*\/>/);
 assert.match(practice,/<SampleDataPanel\s+(?:onSamplesChanged=\{onSamplesChanged\})\s*\/>/);
 assert.doesNotMatch(profile,/act\(\(\)=>api\('\/api\/data\/sample','POST'\)\)/);
});
test('sample preview checks created/deleted counts before announcing success',()=>{
 const panel=read('../src/components/SampleDataPanel.jsx');
 assert.match(panel,/count===0/);
 assert.match(panel,/method==='DELETE'/);
 assert.match(panel,/role="alert"/);
 assert.match(panel,/await load\(\)/);
});
test('backend returns sample records scoped to authenticated owner',()=>{
 const backend=read('../../backend/src/main/java/vn/edu/finance/service/SampleDataService.java');
 for(const table of ['dbo.transactions t','dbo.budgets','dbo.financial_goals','dbo.saving_scenarios'])assert.ok(backend.includes(table));
 for(const key of ['"transactions"','"budgets"','"goals"','"scenarios"'])assert.ok(backend.includes(`result.put(${key}`));
 assert.match(backend,/WHERE t\.user_id=\? AND t\.is_sample_data=1/);
 assert.match(backend,/WHERE user_id=\? AND is_sample_data=1/);
});
