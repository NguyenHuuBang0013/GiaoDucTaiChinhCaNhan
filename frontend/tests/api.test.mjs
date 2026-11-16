import test from 'node:test';
import assert from 'node:assert/strict';
import {api,logout} from '../src/services/api.js';
const response=(status,data={},extra={})=>({status,ok:status>=200&&status<300,type:'basic',json:async()=>data,...extra});

test('GET sends credentials without CSRF request',async()=>{
 const calls=[];globalThis.fetch=async(p,o)=>{calls.push([p,o]);return response(200,{ok:true})};
 assert.deepEqual(await api('/api/items'),{ok:true});
 assert.equal(calls.length,1);assert.equal(calls[0][1].credentials,'include');
});

test('mutations reuse a single CSRF request and send cookie credentials',async()=>{
 let csrf=0,posts=0;globalThis.fetch=async(p,o)=>{
  if(p==='/api/csrf'){csrf++;return response(200,{headerName:'X-CSRF-TOKEN',token:'abc'});}
  posts++;assert.equal(o.headers['X-CSRF-TOKEN'],'abc');assert.equal(o.credentials,'include');return response(201,{saved:true});
 };
 await Promise.all([api('/api/items','POST',{a:1}),api('/api/items','POST',{a:2})]);
 assert.equal(csrf,1);assert.equal(posts,2);
});

test('403 refreshes stale CSRF token once and succeeds',async()=>{
 let csrf=0,mutations=0;globalThis.fetch=async(p,o)=>{
  if(p==='/api/csrf')return response(200,{headerName:'X-CSRF-TOKEN',token:`token-${++csrf}`});
  mutations++;return mutations===1?response(403,{}):response(200,{done:true});
 };
 assert.deepEqual(await api('/api/items','PUT',{a:1}),{done:true});
 assert.equal(mutations,2);
});

test('logout failure never indicates success via redirect',async()=>{
 let navigated=false;globalThis.window={location:{assign(){navigated=true}}};
 globalThis.fetch=async(p)=>p==='/api/csrf'?response(200,{headerName:'X-CSRF-TOKEN',token:'abc'}):response(500,{});
 await assert.rejects(logout(),/Đăng xuất thất bại/);
 assert.equal(navigated,false);
});

test('successful logout navigates away only after server confirms',async()=>{
 let destination='';globalThis.window={location:{assign(value){destination=value}}};
 globalThis.fetch=async(p)=>p==='/api/csrf'?response(200,{headerName:'X-CSRF-TOKEN',token:'abc'}):response(302,{}, {type:'opaqueredirect'});
 await logout();assert.equal(destination,'/');
});
