import { useEffect, useRef } from 'react';
export default function useDialog(open, onClose) {
 const ref=useRef(null), close=useRef(onClose);close.current=onClose;
 useEffect(()=>{
  if(!open)return;
  const previous=document.activeElement, overflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const dialog=ref.current;
  const controls=()=>[...(dialog?.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]')||[])];
  controls()[0]?.focus();
  function key(e){if(e.key==='Escape'){e.preventDefault();close.current();}if(e.key==='Tab'){const all=controls(),first=all[0],last=all[all.length-1];if(!first){e.preventDefault();return;}if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}
  document.addEventListener('keydown',key);
  return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',key);previous?.focus();};
 },[open]);return ref;
}
