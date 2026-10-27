const {URL}=require('node:url');
const router=require('express').Router();
const {protect}=require('../middlewares/auth');
const Audio=require('../models/AudioAvailability');
const streamingLanguages=require('../services/streamingLanguages');
const key=(type,id)=>['movie','tv'].includes(type)&&/^\d+$/.test(id)&&Number.isSafeInteger(Number(id))&&Number(id)>0?`${type}:${id}`:null;
router.get('/:type/:id',async(req,res,next)=>{try{const id=key(req.params.type,req.params.id);if(!id)return res.status(400).json({message:'Invalid title'});const [data,automatic]=await Promise.all([Audio.findById(id),streamingLanguages.get(req.params.type,req.params.id)]);const manual=(data?.entries||[]).filter(e=>e.checkedAt && Date.now()-new Date(e.checkedAt).getTime()<30*86400000);const covered=new Set(automatic.entries.map(e=>`${e.region}:${e.provider.toLowerCase()}`));res.json({success:true,data:[...automatic.entries,...manual.filter(e=>!covered.has(`${e.region}:${e.provider.toLowerCase()}`))],providerStatus:automatic.status});}catch(e){next(e);}});
router.put('/:type/:id',protect,async(req,res,next)=>{try{
 if(req.user.role!=='admin')return res.status(403).json({message:'Administrator access required'});
 const id=key(req.params.type,req.params.id);if(!id)return res.status(400).json({message:'Invalid title'});
 const {region,provider,audio,subtitles,source}=req.body;
 if(!/^[A-Z]{2}$/.test(region)||typeof provider!=='string'||!provider.trim()||provider.length>80||![audio,subtitles].every(a=>Array.isArray(a)&&a.length<=50&&a.every(x=>typeof x==='string'&&/^[a-z]{2,3}$/.test(x))))return res.status(400).json({message:'Enter a region, provider and valid language codes'});
 let parsed;try{parsed=new URL(source);}catch{return res.status(400).json({message:'A source URL is required'});}
 if(parsed.protocol!=='https:'||source.length>1000)return res.status(400).json({message:'Use an HTTPS source URL'});
 const entry={region,provider:provider.trim(),audio:[...new Set(audio)],subtitles:[...new Set(subtitles)],source,checkedAt:new Date()};
 const existing=await Audio.findById(id);
 const entries=(existing?.entries||[]).filter(e=>!(e.region===region&&e.provider.toLowerCase()===provider.trim().toLowerCase()));
 if(entries.length>=50)return res.status(400).json({message:'Too many provider entries'});
 entries.push(entry);const result=await Audio.findByIdAndUpdate(id,{$set:{entries}},{upsert:true,new:true,runValidators:true});res.json({success:true,data:result.entries});
}catch(e){next(e);}});
module.exports=router;
