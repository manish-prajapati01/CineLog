const { isIP } = require('node:net');
// Group IPv6 clients by /64 so rotating an address does not reset the limit.
function clientKey(ip = 'unknown') {
 ip = ip.toLowerCase().replace(/^::ffff:/, '');
 if (isIP(ip) !== 6) return ip;
 const [left, right = ''] = ip.split('::');
 const a = left ? left.split(':') : [], b = right ? right.split(':') : [];
 const groups = ip.includes('::') ? [...a, ...Array(8-a.length-b.length).fill('0'), ...b] : a;
 return groups.slice(0,4).map(x => x.padStart(4,'0')).join(':');
}
module.exports = ({ limit = 30, windowMs = 15 * 60 * 1000, maxClients = 20000, namespace = 'general', skip = () => false, now = Date.now } = {}) => {
 const clients = new Map();
 const timer = setInterval(() => { for (const [key, value] of clients) if (value.reset <= now()) clients.delete(key); }, Math.min(windowMs,60000)); timer.unref();
 const shared = async (req,res,next) => {
  const crypto=require('node:crypto'), Bucket=require('../models/RateBucket');
  const time=now(), reset=(Math.floor(time/windowMs)+1)*windowMs;
  const id=crypto.createHash('sha256').update(`${namespace}:${clientKey(req.ip)}:${Math.floor(time/windowMs)}`).digest('hex');
  try {
   let entry;
   try {entry=await Bucket.findOneAndUpdate({_id:id},{$inc:{count:1},$setOnInsert:{expiresAt:new Date(reset)}},{upsert:true,new:true});}
   catch(e){if(e.code!==11000)throw e;entry=await Bucket.findOneAndUpdate({_id:id},{$inc:{count:1}},{new:true});}
   res.set('RateLimit-Limit',String(limit));res.set('RateLimit-Remaining',String(Math.max(0,limit-entry.count)));res.set('RateLimit-Reset',String(Math.ceil((reset-time)/1000)));
   if(entry.count>limit){res.set('Retry-After',String(Math.ceil((reset-time)/1000)));return res.status(429).json({success:false,message:'Too many requests. Please try again shortly.'});}
   next();
  } catch {res.set('Retry-After','30');res.status(503).json({success:false,message:'Service temporarily unavailable. Please try again.'});}
 };
 return (req, res, next) => {
  if(req.method === 'OPTIONS' || skip(req)) return next();
  if(process.env.NODE_ENV==='production' && process.env.RATE_LIMIT_STORE!=='memory') return shared(req,res,next);
  const time=now(), key=clientKey(req.ip); let entry=clients.get(key);
  if(!entry || entry.reset<=time){
   if(!entry && clients.size>=maxClients){res.set('Retry-After','60');return res.status(429).json({success:false,message:'Service is busy. Please try again shortly.'});}
   entry={count:0,reset:time+windowMs};clients.set(key,entry);
  }
  entry.count++;
  const remaining=Math.max(0,limit-entry.count), reset=Math.ceil((entry.reset-time)/1000);
  res.set('RateLimit-Limit',String(limit));res.set('RateLimit-Remaining',String(remaining));res.set('RateLimit-Reset',String(reset));
  if(entry.count>limit){res.set('Retry-After',String(reset));return res.status(429).json({success:false,message:'Too many attempts. Please try again later.'});}
  next();
 };
};
