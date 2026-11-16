import {useCallback,useEffect,useState} from 'react';
import {api} from '../services/api';
import {sampleCount,sampleFinanceData} from '../utils/sampleFinance';
export function useSampleMode(userId){
 const [mode,setModeState]=useState('real'),[preview,setPreview]=useState(null),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const refreshSample=useCallback(async()=>{if(!userId)return null;setLoading(true);try{const p=await api('/api/data/sample-summary');setPreview(p);setError('');return p;}catch(e){setError(e.message);setPreview(null);return null;}finally{setLoading(false)}},[userId]);
 useEffect(()=>{if(!userId){setModeState('real');setPreview(null);return;}const k='financelab-data-mode-'+userId;try{setModeState(localStorage.getItem(k)==='sample'?'sample':'real');}catch{setModeState('real');}refreshSample();},[userId,refreshSample]);
 const setMode=useCallback(next=>{const value=next==='sample'?'sample':'real';setModeState(value);try{localStorage.setItem('financelab-data-mode-'+userId,value)}catch{};if(value==='sample')refreshSample();},[userId,refreshSample]);
 const data=sampleFinanceData(preview);
 return {mode,setMode,preview,refreshSample,loading,error,hasSamples:sampleCount(preview)>0,data};
}
