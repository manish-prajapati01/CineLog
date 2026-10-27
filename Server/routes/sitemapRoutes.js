const router=require('express').Router();
const Title=require('../models/TitleIdentity');
router.get('/',async(req,res,next)=>{try{
 const site=(process.env.PUBLIC_SITE_URL||'https://cinelog-two.vercel.app').replace(/\/$/,'');
 const rows=await Title.find().sort({updatedAt:-1}).limit(10000).select('type tmdbId').lean();
 const urls=['/','/movies','/tv','/upcoming','/indian-cinema','/privacy','/terms',...rows.filter(r=>['movie','tv'].includes(r.type)&&Number.isSafeInteger(r.tmdbId)&&r.tmdbId>0).map(r=>`/${r.type}/${r.tmdbId}`)];
 const escape=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
 res.set('Cache-Control','public,max-age=300');res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(path=>`<url><loc>${escape(site+path)}</loc></url>`).join('')}</urlset>`);
 }catch(e){next(e);}});
module.exports=router;
