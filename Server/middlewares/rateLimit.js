module.exports = ({ limit = 30, windowMs = 15 * 60 * 1000 } = {}) => {
 const clients = new Map();
 const timer = setInterval(() => { const now = Date.now(); for (const [key, value] of clients) if (value.reset <= now) clients.delete(key); }, windowMs); timer.unref();
 return (req, res, next) => {
  const now=Date.now(); let entry=clients.get(req.ip);
  if(!entry || entry.reset<=now){entry={count:0,reset:now+windowMs};clients.set(req.ip,entry);}
  if(++entry.count>limit){res.set('Retry-After',String(Math.ceil((entry.reset-now)/1000)));return res.status(429).json({success:false,message:'Too many attempts. Please try again later.'});}
  next();
 };
};
