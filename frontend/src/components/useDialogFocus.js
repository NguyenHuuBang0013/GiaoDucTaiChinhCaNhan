import {useEffect,useRef} from 'react';

/** Keep keyboard focus inside an active modal, restore focus to the opener on close. */
export default function useDialogFocus(open,onClose){
 const ref=useRef(null);
 const closeRef=useRef(onClose);
 closeRef.current=onClose;
 useEffect(()=>{
  if(!open||!ref.current)return;
  const previous=document.activeElement;
  const node=ref.current;
  const previousOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const selector='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  const available=()=>Array.from(node.querySelectorAll(selector)).filter(el=>el.getClientRects().length>0);
  const initial=available()[0];
  (initial||node).focus({preventScroll:true});
  const onKey=e=>{
   if(e.key==='Escape'){e.stopPropagation();closeRef.current();return;}
   if(e.key!=='Tab')return;
   const elements=available();if(!elements.length){e.preventDefault();node.focus();return;}
   const first=elements[0],last=elements[elements.length-1];
   if(e.shiftKey&&(document.activeElement===first||!node.contains(document.activeElement))){e.preventDefault();last.focus()}
   else if(!e.shiftKey&&(document.activeElement===last||!node.contains(document.activeElement))){e.preventDefault();first.focus()}
  };
  document.addEventListener('keydown',onKey);
  return()=>{document.body.style.overflow=previousOverflow;document.removeEventListener('keydown',onKey);if(previous?.isConnected)previous.focus({preventScroll:true})};
 },[open]);
 return ref;
}
