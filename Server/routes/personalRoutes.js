const router = require('express').Router();
router.use((req,res,next)=>{res.set('Cache-Control','no-store');next();});
const mongoose = require('mongoose');
const { protect } = require('../middlewares/auth');
const Personal = require('../models/Personal');
const User = require('../models/User');
const Rating = require('../models/Rating');
const Review = require('../models/Review');
const Watchlist = require('../models/Watchlist');
const tmdb = require('../services/tmdbService');
const oid = id => mongoose.isValidObjectId(id);
const validId = id => /^\d+$/.test(String(id)) && Number.isSafeInteger(Number(id)) && Number(id)>0;
const fail = (message,status=400) => Object.assign(new Error(message),{status});
const wrap = fn => (req,res,next) => Promise.resolve(fn(req,res)).catch(next);
const publicCollection = c => ({id:String(c._id),name:c.name,description:c.description,items:c.items.map(i=>({tmdbId:i.tmdbId,mediaType:i.mediaType,title:i.title,posterPath:i.posterPath,originalLanguage:i.originalLanguage}))});
async function ownerActive(id) { return User.findOne({_id:id,isActive:true}).select('name'); }
router.get('/people/:id',wrap(async(req,res)=>{
 if(!oid(req.params.id)) throw fail('Profile not available',404);
 const settings=await Personal.findById(req.params.id);
 if(!settings?.profilePublic) throw fail('This profile is private or unavailable.',404);
 const owner=await ownerActive(req.params.id); if(!owner)throw fail('Profile not available',404);
 const ratings=settings.showRatings?await Rating.find({userId:req.params.id}).sort({updatedAt:-1}).limit(30).select('tmdbId mediaType title posterPath score'):[];
 const reviews=settings.showReviews?await Review.find({userId:req.params.id,isApproved:true}).sort({createdAt:-1}).limit(20).select('tmdbId mediaType movieTitle title content containsSpoilers'):[];
 res.json({success:true,data:{name:owner.name,bio:settings.bio,ratings,reviews,collections:settings.collections.filter(c=>c.visibility==='public').map(publicCollection)}});
}));
router.get('/shared/:owner/:collection',wrap(async(req,res)=>{
 if(!oid(req.params.owner)||!oid(req.params.collection))throw fail('Collection not available',404);
 const settings=await Personal.findById(req.params.owner);
 const collection=settings?.collections.id(req.params.collection);
 if(!collection||collection.visibility!=='public'||!await ownerActive(req.params.owner))throw fail('This collection is private or unavailable.',404);
 res.json({success:true,data:publicCollection(collection)});
}));
router.use(protect);
router.get('/',wrap(async(req,res)=>{res.json({success:true,data:await Personal.findById(req.userId)||{profilePublic:false,bio:'',showRatings:false,showReviews:false,collections:[],episodes:[]}});}));
router.patch('/privacy',wrap(async(req,res)=>{
 const update={};
 for(const key of ['profilePublic','showRatings','showReviews'])if(req.body[key]!==undefined){if(typeof req.body[key]!=='boolean')throw fail('Invalid privacy option');update[key]=req.body[key];}
 if(req.body.bio!==undefined){if(typeof req.body.bio!=='string'||req.body.bio.length>300)throw fail('Bio must be 300 characters or fewer');update.bio=req.body.bio.trim();}
 const data=await Personal.findByIdAndUpdate(req.userId,{$set:update},{upsert:true,new:true,runValidators:true});
 res.json({success:true,data});
}));
router.post('/collections',wrap(async(req,res)=>{
 if(typeof req.body.name!=='string'||!req.body.name.trim()||req.body.name.length>80)throw fail('Enter a collection name up to 80 characters');
 try { await Personal.updateOne({_id:req.userId},{$setOnInsert:{collections:[]}},{upsert:true}); } catch(e) { if(e.code!==11000)throw e; }
 const data=await Personal.findOneAndUpdate({_id:req.userId,'collections.49':{$exists:false}},{$push:{collections:{name:req.body.name.trim(),items:[],visibility:'private'}}},{new:true,runValidators:true});
 if(!data)throw fail('You can keep up to 50 collections.');res.status(201).json({success:true,data});
}));
router.patch('/collections/:id',wrap(async(req,res)=>{
 if(!oid(req.params.id))throw fail('Invalid collection');
 const update={};
 for(const [key,max] of [['name',80],['description',500]])if(req.body[key]!==undefined){if(typeof req.body[key]!=='string'||req.body[key].length>max||(key==='name'&&!req.body[key].trim()))throw fail('Invalid collection details');update[`collections.$.${key}`]=req.body[key].trim();}
 if(req.body.visibility!==undefined){if(!['public','private'].includes(req.body.visibility))throw fail('Invalid visibility');update['collections.$.visibility']=req.body.visibility;}
 const data=await Personal.findOneAndUpdate({_id:req.userId,'collections._id':req.params.id},{$set:update},{new:true,runValidators:true});
 if(!data)throw fail('Collection not found',404);res.json({success:true,data});
}));
router.put('/collections/:id/items/:type/:tmdbId',wrap(async(req,res)=>{
 const {id,type,tmdbId}=req.params;
 if(!oid(id)||!['movie','tv'].includes(type)||!validId(tmdbId))throw fail('Invalid title or collection');
 const details=await (type==='movie'?tmdb.getMovieDetails(Number(tmdbId)):tmdb.getTVDetails(Number(tmdbId)));
 const data=await Personal.findOneAndUpdate({_id:req.userId,collections:{$elemMatch:{_id:id,'items.99':{$exists:false},items:{$not:{$elemMatch:{mediaType:type,tmdbId:Number(tmdbId)}}}}}},{$push:{'collections.$.items':{tmdbId:Number(tmdbId),mediaType:type,title:details.title||details.name,posterPath:details.poster_path,originalLanguage:details.original_language}}},{new:true,runValidators:true});
 if(!data)throw fail('Title is already saved, collection is full, or collection is unavailable.',409);res.json({success:true,data});
}));
router.delete('/collections/:id/items/:type/:tmdbId',wrap(async(req,res)=>{
 if(!oid(req.params.id)||!validId(req.params.tmdbId)||!['movie','tv'].includes(req.params.type))throw fail('Invalid title');
 const data=await Personal.findOneAndUpdate({_id:req.userId,'collections._id':req.params.id},{$pull:{'collections.$.items':{tmdbId:Number(req.params.tmdbId),mediaType:req.params.type}}},{new:true});
 if(!data)throw fail('Collection not found',404);res.json({success:true,data});
}));
router.delete('/collections/:id',wrap(async(req,res)=>{
 if(!oid(req.params.id))throw fail('Invalid collection');
 const data=await Personal.findByIdAndUpdate(req.userId,{$pull:{collections:{_id:req.params.id}}},{new:true});res.json({success:true,data});
}));
router.put('/episodes/:id/:season/:episode',wrap(async(req,res)=>{
 const {id,season,episode}=req.params;
 if(!validId(id)||!validId(season)||!validId(episode)||typeof req.body.watched!=='boolean')throw fail('Invalid episode');
 const key=`${id}:${season}:${episode}`;
 if(req.body.watched){
 const details=await tmdb.getTVSeasonDetails(Number(id),Number(season));
 const found=details.episodes?.find(e=>e.episode_number===Number(episode));
 if(!found?.air_date||found.air_date>new Date().toISOString().slice(0,10))throw fail('Only released episodes can be marked watched');
 }
 const data=await Personal.findByIdAndUpdate(req.userId,req.body.watched?{$addToSet:{episodes:key}}:{$pull:{episodes:key}},{upsert:true,new:true});
 res.json({success:true,data});
}));
router.put('/seasons/:id/:season',wrap(async(req,res)=>{
 const {id,season}=req.params;
 if(!validId(id)||!validId(season)||typeof req.body.watched!=='boolean')throw fail('Invalid season');
 const details=await tmdb.getTVSeasonDetails(Number(id),Number(season));
 const keys=(details.episodes||[]).filter(e=>e.air_date&&e.air_date<=new Date().toISOString().slice(0,10)).map(e=>`${id}:${season}:${e.episode_number}`);
 if(!keys.length)throw fail('This season has no released episodes to track.');
 const update=req.body.watched?{$addToSet:{episodes:{$each:keys}}}:{$pull:{episodes:{$in:keys}}};
 const data=await Personal.findByIdAndUpdate(req.userId,update,{upsert:true,new:true});res.json({success:true,data});
}));
router.get('/progress',wrap(async(req,res)=>{
 const personal=await Personal.findById(req.userId);const keys=personal?.episodes||[];
 const ids=[...new Set(keys.map(k=>Number(k.split(':')[0])))];
 const offset=Math.max(0,Math.floor(Number(req.query.offset)||0));const data=[];let failed=0;
 const batch=ids.slice(offset,offset+20);
 for(let n=0;n<batch.length;n+=4)await Promise.all(batch.slice(n,n+4).map(async id=>{try{
 const title=await tmdb.getCalendarTitle('tv',id);
 data.push({id,title:title.name,poster_path:title.poster_path,watched:keys.filter(k=>k.startsWith(`${id}:`)).length,total:title.number_of_episodes,original_language:title.original_language});
 }catch{failed++;}}));
 res.json({success:true,data,failed,nextOffset:offset+20<ids.length?offset+20:null});
}));
router.get('/calendar',wrap(async(req,res)=>{
 const start=req.query.start||new Date().toISOString().slice(0,7);
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(start))throw fail('Invalid month');
 const settings=await Personal.findById(req.userId);
 const library=await Watchlist.findOne({userId:req.userId});
 const tracked=[...(library?.items||[]).map(i=>({id:i.tmdbId,type:i.mediaType})),...(settings?.episodes||[]).map(e=>({id:Number(e.split(':')[0]),type:'tv'}))];
 const unique=[...new Map(tracked.map(i=>[`${i.type}:${i.id}`,i])).values()];
 const offset=Math.max(0,Math.floor(Number(req.query.offset)||0));const batch=unique.slice(offset,offset+20);
 const events=[];let failed=0;
 // Bounded batches avoid flooding the catalogue API for large libraries.
 for(let n=0;n<batch.length;n+=4)await Promise.all(batch.slice(n,n+4).map(async i=>{try{
  const detail=await tmdb.getCalendarTitle(i.type,i.id);
  if(i.type==='movie'){if(detail.release_date?.startsWith(start))events.push({id:`movie-${i.id}`,tmdbId:i.id,mediaType:i.type,title:detail.title,date:detail.release_date,label:'Film release'});}
  else {if(detail.last_air_date && detail.last_air_date < `${start}-01` && !detail.next_episode_to_air?.air_date?.startsWith(start))return;const seasons=(detail.seasons||[]).filter(s=>s.season_number>0&&(!s.air_date||s.air_date<=`${start}-31`));
   for(const s of seasons){const season=await tmdb.getTVSeasonDetails(i.id,s.season_number);for(const e of season.episodes||[])if(e.air_date?.startsWith(start))events.push({id:`tv-${i.id}-${s.season_number}-${e.episode_number}`,tmdbId:i.id,mediaType:'tv',title:detail.name,date:e.air_date,label:`S${s.season_number} E${e.episode_number} · ${e.name}`});}
  }
 }catch{failed++;}}));
 res.json({success:true,data:events.sort((a,b)=>a.date.localeCompare(b.date)),failed,nextOffset:offset+20<unique.length?offset+20:null,total:unique.length});
}));
module.exports=router;
