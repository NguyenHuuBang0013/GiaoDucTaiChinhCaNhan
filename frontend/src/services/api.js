let csrfCache = null;
let csrfPending = null;

async function csrfToken(){
 if(csrfCache)return csrfCache;
 if(!csrfPending){
  csrfPending=(async()=>{
   const res=await fetch('/api/csrf',{credentials:'include'});
   if(!res.ok)throw new Error('Không thể tải mã xác thực CSRF');
   const value=await res.json();
   if(!value?.headerName||!value?.token)throw new Error('Phản hồi CSRF không hợp lệ');
   csrfCache=value;
   return value;
  })().finally(()=>{csrfPending=null;});
 }
 return csrfPending;
}

export async function api(path,method='GET',body){
 const verb=method.toUpperCase();
 const mutation=!['GET','HEAD','OPTIONS'].includes(verb);
 const request=async()=>{
  const headers={};
  if(body!==undefined)headers['Content-Type']='application/json';
  if(mutation){const token=await csrfToken();headers[token.headerName]=token.token;}
  return fetch(path,{method:verb,credentials:'include',headers,body:body===undefined?undefined:JSON.stringify(body)});
 };
 let res=await request();
 // A cached CSRF token can expire when the server session changes.
 // Retry one time only if the server explicitly rejects the stale token.
 if(mutation&&res.status===403){csrfCache=null;res=await request();}
 const data=await res.json().catch(()=>({}));
 if(!res.ok){
  if(res.status===403)csrfCache=null;
  const err=new Error(data.error||data.message||data.detail||`HTTP ${res.status}`);
  err.status=res.status;
  throw err;
 }
 return data;
}

export async function logout(){
 // Do not redirect on network/CSRF failure: doing so falsely indicates logout.
 try{
  const token=await csrfToken();
  let response=await fetch('/logout',{method:'POST',credentials:'include',redirect:'manual',headers:{[token.headerName]:token.token}});
  if(response.status===403){
   csrfCache=null;
   const renewed=await csrfToken();
   response=await fetch('/logout',{method:'POST',credentials:'include',redirect:'manual',headers:{[renewed.headerName]:renewed.token}});
  }
  // Spring Security's logout success redirect is a 302; redirect:manual
  // prevents fetching the frontend landing page as part of the POST.
  if(!(response.ok||response.type==='opaqueredirect'||response.status===0))throw new Error(`Đăng xuất thất bại (HTTP ${response.status}). Vui lòng thử lại.`);
  csrfCache=null;
  window.location.assign('/');
 }catch(err){csrfCache=null;throw err;}
}
