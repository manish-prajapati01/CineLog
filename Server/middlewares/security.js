function unsafeKeys(value, depth = 0) {
 if (!value || typeof value !== 'object') return false;
 if (depth > 20) return true;
 return Object.keys(value).some(key => key.startsWith('$') || key.includes('.') || ['__proto__','constructor','prototype'].includes(key) || unsafeKeys(value[key],depth+1));
}
function validateInput(req,res,next) {
 if(unsafeKeys(req.body) || unsafeKeys(req.query)) return res.status(400).json({success:false,message:'Invalid request fields.'});
 next();
}
function headers(req,res,next) {
 res.set('X-Content-Type-Options','nosniff');
 res.set('X-Frame-Options','DENY');
 res.set('Referrer-Policy','strict-origin-when-cross-origin');
 res.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
 res.set('Cache-Control','no-store');
 if(process.env.NODE_ENV==='production') {
  res.set('Strict-Transport-Security','max-age=31536000');
  const json=res.json.bind(res);
  res.json=body=>json(res.statusCode>=500?{success:false,message:'Service temporarily unavailable. Please try again.'}:body);
 }
 next();
}
module.exports={headers,validateInput};
