module.exports=async(req,res)=>(await import('../Client/api/title.js')).default(req,res);
