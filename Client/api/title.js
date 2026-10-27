/* eslint-env node */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderTitle(shell,{type,id,data,site}) {
 const name=data.title||data.name, description=(data.overview||'Explore this title on CineLog.').slice(0,180), url=`${site}/${type}/${id}`;
 const image=data.poster_path?`https://image.tmdb.org/t/p/w500${data.poster_path}`:`${site}/logo.png`;
 const schema=JSON.stringify({'@context':'https://schema.org','@type':type==='movie'?'Movie':'TVSeries',name,description,url,image,inLanguage:data.original_language}).replace(/</g,'\\u003c');
 const tags=`<title>${escape(name)} | CineLog</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="${escape(url)}"><meta name="robots" content="index,follow"><meta property="og:type" content="${type==='movie'?'video.movie':'video.tv_show'}"><meta property="og:title" content="${escape(name)} | CineLog"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${escape(url)}"><meta property="og:image" content="${escape(image)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(name)}"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="${escape(image)}"><script id="title-schema" type="application/ld+json">${schema}</script>`;
 return shell.replace(/<title>[\s\S]*?<\/title>/g,'').replace(/<meta\b[^>]*(?:name="(?:description|robots|twitter:[^"]+)"|property="og:[^"]+")[^>]*>/g,'').replace(/<link\b[^>]*rel="canonical"[^>]*>/g,'').replace('</head>',`${tags}</head>`).replace('<div id="root"></div>',`<div id="root"><main><h1>${escape(name)}</h1><p>${escape(description)}</p><a href="/">Explore CineLog</a></main></div>`);
}
export default async function handler(req,res){
 const {type,id}=req.query||{};
 if(!['movie','tv'].includes(type)||typeof id!=='string'||!/^\d{1,10}$/.test(id))return res.status(404).send('Title not found');
 let shell;for(const relative of ['dist/index.html','Client/dist/index.html'])try{shell=await readFile(join(process.cwd(),relative),'utf8');break;}catch{/* Try the alternative project root. */}
 if(!shell)return res.status(503).send('CineLog is updating. Please retry shortly.');
 const site=(process.env.PUBLIC_SITE_URL||'https://cinelog-two.vercel.app').replace(/\/$/,'');
 const base=(process.env.CINELOG_API_URL||process.env.VITE_API_URL||'https://cinelog-p441.onrender.com').replace(/\/$/,'');
 try{
  const r=await fetch(`${base}/api/${type==='movie'?'movies':'tv'}/${id}`,{signal:AbortSignal.timeout(8000)});
  if(r.status===404){res.setHeader('X-Robots-Tag','noindex');return res.status(404).send(shell);}
  if(!r.ok)throw new Error('Catalogue unavailable');
  const result=await r.json();if(!result.data?.id)throw new Error('Invalid title response');
  res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=600');
  return res.status(200).send(renderTitle(shell,{type,id,data:result.data,site}));
 }catch{res.setHeader('X-Robots-Tag','noindex');res.setHeader('Retry-After','30');res.setHeader('Cache-Control','no-store');return res.status(503).send(shell);}
}
