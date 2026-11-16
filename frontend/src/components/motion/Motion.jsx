import React,{useEffect,useRef,useState} from 'react';

export function useReducedMotion(){
 const [reduced,setReduced]=useState(()=>typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{const mq=window.matchMedia('(prefers-reduced-motion: reduce)');const change=()=>setReduced(mq.matches);mq.addEventListener?.('change',change);return()=>mq.removeEventListener?.('change',change);},[]);
 return reduced;
}
export function PageMotion({children,page}){return <div key={page} className="motion-page" data-motion-page={page}>{children}</div>;}
export function MotionNumber({value=0,format,precision=0,className=''}){
 const end=Number(value)||0;const reduced=useReducedMotion();const [display,setDisplay]=useState(end);const prior=useRef(end);
 useEffect(()=>{const start=prior.current;prior.current=end;if(reduced){setDisplay(end);return;}
 let frame;const begin=performance.now();const duration=520;
 function tick(t){const x=Math.min(1,(t-begin)/duration);const eased=1-Math.pow(1-x,3);setDisplay(start+(end-start)*eased);if(x<1)frame=requestAnimationFrame(tick);}
 frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[end,reduced]);
 return <span className={className} aria-label={format?format(end):String(end)}>{format?format(display):display.toLocaleString('vi-VN',{minimumFractionDigits:precision,maximumFractionDigits:precision})}</span>;
}
export function MotionProgress({value=0,max=100,label,className=''}){
 const percent=Math.max(0,Math.min(100,max>0?Number(value)/max*100:0));
 return <div className={'motion-progress '+className} role="progressbar" aria-label={label||'Tiến độ'} aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}><span style={{width:`${percent}%`}}/></div>;
}
export function MotionStatus({children,kind='success'}){return <div className={'motion-status motion-status-'+kind} role="status">{children}</div>;}

export function LoadingSkeleton({label='Đang tải dữ liệu'}){return <div className="motion-loading" role="status" aria-label={label}><div className="motion-skeleton motion-skeleton-title"/><div className="motion-skeleton motion-skeleton-line"/><div className="motion-skeleton motion-skeleton-line short"/><span>{label}…</span></div>;}
