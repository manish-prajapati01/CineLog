const router = require('express').Router();
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const { protect } = require('../middlewares/auth');
const rateLimit = require('../middlewares/rateLimit');
const mail = require('../services/accountMail');
const wrap = fn => (req,res,next) => Promise.resolve(fn(req,res)).catch(next);
const fail = (message,status=400) => Object.assign(new Error(message),{status});
const hash = token => crypto.createHash('sha256').update(token).digest('hex');
const validToken = token => typeof token === 'string' && /^[a-f0-9]{64}$/.test(token);
const validPassword = value => typeof value === 'string' && value.length >= 8 && Buffer.byteLength(value,'utf8') <= 72;
const limited = rateLimit({limit:5,windowMs:15*60*1000,namespace:'account-recovery'});
const available = () => mail.configured() || (process.env.NODE_ENV==='test' && process.env.MAIL_TRANSPORT==='test');
async function issue(user,kind) {
 const token=crypto.randomBytes(32).toString('hex'), prefix=kind==='reset'?'passwordReset':'emailVerification';
 const digest=hash(token);
 const issued=await User.findOneAndUpdate({_id:user._id,isActive:true,$or:[{[`${prefix}SentAt`]:{$lt:new Date(Date.now()-60000)}},{[`${prefix}SentAt`]:{$exists:false}}]},{$set:{[`${prefix}SentAt`]:new Date(),[`${prefix}Hash`]:digest,[`${prefix}Expires`]:new Date(Date.now()+(kind==='reset'?30*60*1000:86400000))}});
 if(!issued)return;
 try {await mail.send({to:user.email,kind,token});}
 catch(error){await User.updateOne({_id:user._id,[`${prefix}Hash`]:digest},{$unset:{[`${prefix}Hash`]:1,[`${prefix}Expires`]:1}});throw error;}
}
router.get('/capabilities',(req,res)=>res.json({success:true,emailDelivery:available()}));
router.post('/forgot-password',limited,wrap(async(req,res)=>{
 if(!available())throw fail('Password recovery is not available yet. Please try again later.',503);
 const email=typeof req.body.email==='string'?req.body.email.trim().toLowerCase():'';
 if(!/^\S+@\S+\.\S+$/.test(email)||email.length>254)throw fail('Enter a valid email address.');
 const user=await User.findOne({email,isActive:true});
 // A uniform response avoids revealing whether an email is registered, including delivery failures.
 if(user)try{await issue(user,'reset');}catch{console.error('account_email_delivery_failed');}
 res.json({success:true,message:'If an active account uses that address, a password reset link will be sent.'});
}));
router.post('/reset-password',limited,wrap(async(req,res)=>{
 if(!validToken(req.body.token)||!validPassword(req.body.password))throw fail('Use a valid reset link and a password of at least 8 characters (maximum 72 UTF-8 bytes).');
 const password=await bcrypt.hash(req.body.password,12);
 const user=await User.findOneAndUpdate({passwordResetHash:hash(req.body.token),passwordResetExpires:{$gt:new Date()},isActive:true},{$set:{password},$unset:{passwordResetHash:1,passwordResetExpires:1},$inc:{sessionVersion:1}},{new:true});
 if(!user)throw fail('This reset link has expired or already been used. Request a new link.');
 res.json({success:true,message:'Password changed. Sign in again on your devices.'});
}));
router.post('/send-verification',limited,protect,wrap(async(req,res)=>{
 if(req.user.emailVerifiedAt)return res.json({success:true,message:'Your email is already verified.'});
 if(!available())throw fail('Email verification is not available yet. Please try again later.',503);
 await issue(req.user,'verify');res.json({success:true,message:'Check your inbox for a verification link.'});
}));
router.post('/verify-email',limited,wrap(async(req,res)=>{
 if(!validToken(req.body.token))throw fail('Invalid verification link.');
 const user=await User.findOneAndUpdate({emailVerificationHash:hash(req.body.token),emailVerificationExpires:{$gt:new Date()},isActive:true},{$set:{emailVerifiedAt:new Date()},$unset:{emailVerificationHash:1,emailVerificationExpires:1}},{new:true});
 if(!user)throw fail('This verification link has expired or already been used.');
 res.json({success:true,message:'Your email is verified.'});
}));
router.post('/logout-all',limited,protect,wrap(async(req,res)=>{await User.updateOne({_id:req.userId},{$inc:{sessionVersion:1}});res.json({success:true,message:'Signed out on all devices.'});}));
router.delete('/account',limited,protect,wrap(async(req,res)=>{
 if(req.body.confirmation!=='DELETE' || typeof req.body.password!=='string' || Buffer.byteLength(req.body.password,'utf8')>72)throw fail('Enter your password and type DELETE to confirm.');
 const user=await User.findById(req.userId).select('+password');
 if(!user || !await bcrypt.compare(req.body.password,user.password))throw fail('The password is incorrect.',403);
 const Rating=require('../models/Rating'),Review=require('../models/Review'),Personal=require('../models/Personal'),Watchlist=require('../models/Watchlist');
 const session=await mongoose.startSession();
 try { await session.withTransaction(async()=>{
   await Rating.deleteMany({userId:user._id}).session(session);
   await Review.deleteMany({userId:user._id}).session(session);
   await Review.updateMany({$or:[{likes:user._id},{helpfulVotes:user._id}]},{$pull:{likes:user._id,helpfulVotes:user._id}}).session(session);
   await Personal.deleteOne({_id:user._id}).session(session);
   await Watchlist.deleteMany({userId:user._id}).session(session);
   await User.deleteOne({_id:user._id}).session(session);
 }); } finally {await session.endSession();}
 res.json({success:true,message:'Your account and its ratings, reviews, collections and viewing records have been deleted.'});
}));
module.exports=router;
