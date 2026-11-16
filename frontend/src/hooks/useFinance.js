import {useCallback,useEffect,useState} from 'react';
import {api} from '../services/api';
import {configs} from '../config/modules';
export function useFinance(){
 const [me,setMe]=useState(undefined);
 const [connectionError,setConnectionError]=useState(null);
 const [data,setData]=useState({});
 const [message,setMessage]=useState('');
 const refresh=useCallback(async()=>{
  try {
   // Public endpoint returns 200 for guest instead of generating expected /api/me 401 errors.
   const session=await api('/api/session');
   if(!session.authenticated){setMe(null);setData({});setConnectionError(null);return;}
   setMe(session.profile);setConnectionError(null);
   const results=await Promise.allSettled(Object.keys(configs).map(async key=>[key,await api('/api/'+key)]));
   const successful=results.filter(r=>r.status==='fulfilled').map(r=>r.value);
   setData(Object.fromEntries(successful));
   const failed=results.filter(r=>r.status==='rejected');
   if(failed.length){setMessage(`Không thể tải ${failed.length} nhóm dữ liệu. Hãy kiểm tra Backend và chọn tải lại.`);}
  }catch(e){
   if(e.status===401){setMe(null);setConnectionError(null);setData({});}
   else {setMe(undefined);setConnectionError('Không thể kết nối máy chủ: '+e.message);}
  }
 },[]);
 useEffect(()=>{refresh()},[refresh]);
 const act=async(fn)=>{try{const value=await fn();setMessage('Thao tác thành công.');await refresh();return {ok:true,value};}catch(e){setMessage(e.message);return {ok:false};}};
 return {me,data,message,setMessage,refresh,act,connectionError};
}
