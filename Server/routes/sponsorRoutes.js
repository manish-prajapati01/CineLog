const router=require('express').Router();
const Sponsor=require('../models/Sponsorship');
const {protect,adminOnly}=require('../middlewares/auth');
router.get('/admin',protect,adminOnly,async(req,res,next)=>{try{res.json({success:true,data:await Sponsor.find().lean()});}catch(e){next(e);}});
router.get('/:slot',async(req,res,next)=>{try{
 if(!['home','discovery'].includes(req.params.slot))return res.status(404).json({success:false,message:'Unknown placement'});
 const now=new Date();const row=await Sponsor.findOne({slot:req.params.slot,enabled:true,startsAt:{$lte:now},endsAt:{$gt:now}}).select('label url').lean();
 res.json({success:true,data:row?{label:row.label,url:row.url}:null});
}catch(e){next(e);}});
router.put('/:slot',protect,adminOnly,async(req,res,next)=>{try{
 const {label,url,startsAt,endsAt,enabled}=req.body;let link;try{link=new URL(url);}catch{/* validation below */}
 if(!['home','discovery'].includes(req.params.slot)||typeof label!=='string'||!label.trim()||label.length>120||!link||link.protocol!=='https:'||link.username||link.password||url.length>2000||typeof enabled!=='boolean'||!Number.isFinite(Date.parse(startsAt))||!Number.isFinite(Date.parse(endsAt))||new Date(endsAt)<=new Date(startsAt))return res.status(400).json({success:false,message:'Enter a label, HTTPS destination, valid dates and enabled status.'});
 const data=await Sponsor.findOneAndUpdate({slot:req.params.slot},{$set:{label:label.trim(),url:link.href,startsAt,endsAt,enabled}},{upsert:true,new:true,runValidators:true});res.json({success:true,data});
}catch(e){next(e);}});
module.exports=router;
