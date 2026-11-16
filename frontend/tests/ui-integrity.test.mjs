import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const layout=readFileSync(new URL('../src/layouts/MainLayout.jsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/app/App.jsx',import.meta.url),'utf8');
test('logout from footer and mobile navigation shares error-aware handler',()=>{
 assert.match(layout,/className="workspace-mobile-logout" onClick=\{handleLogout\}/);
 assert.match(layout,/className="workspace-footer"[\s\S]*?onClick=\{handleLogout\}/);
 assert.doesNotMatch(layout,/onClick=\{logout\}/);
});
test('data mode has explicit accessible control and clear context',()=>{
 assert.match(layout,/aria-label="Chế độ dữ liệu"/);
 assert.match(layout,/Đang xem dữ liệu mẫu/);
 assert.match(app,/sampleMode\?samples\.data:data/);
});
test('navigation layouts include tablet and small screen breakpoints',()=>{
 assert.match(css,/@media\(max-width:1010px\)/);
 assert.match(css,/@media\(max-width:660px\)/);
 assert.match(css,/\.workspace-mobile-nav\{top:68px/);
 assert.match(css, /prefers-reduced-motion:reduce/);
});

test('data-mode switch is a single accessible native control without overlapping icon and label borders',()=>{
 assert.match(layout,/<div className=\{"workspace-mode-select/);
 assert.doesNotMatch(layout,/className="mode-icon"/);
 assert.match(css,/V7\.2: single native mode selector/);
 assert.match(css,/\.workspace-mode-select:focus-within\{outline:none\}/);
});
