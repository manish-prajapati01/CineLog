import { useEffect, useState } from 'react';
import api from '../services/api';
export default function Sponsor({slot='home'}) {
  const [placement,setPlacement]=useState(null);
  useEffect(()=>{let live=true;api.get(`/sponsors/${slot}`).then(r=>{if(live)setPlacement(r.data);}).catch(()=>{});return ()=>{live=false;};},[slot]);
  const text = placement?.label || (slot==='home' ? import.meta.env.VITE_SPONSOR_TEXT : '');
  const raw = placement?.url || (slot==='home' ? import.meta.env.VITE_SPONSOR_URL : '');
  let url;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol === 'https:') url = parsed.href;
  } catch {
    /* Unconfigured placements remain hidden. */
  }
  if (!text || !url) return null;
  return (
    <aside className='cl-ad' aria-label='Advertisement'>
      <small>ADVERTISEMENT</small>
      <a href={url} target='_blank' rel='sponsored noopener noreferrer'>
        <span>{text}</span>
        <span aria-hidden='true'>↗</span>
      </a>
    </aside>
  );
}
