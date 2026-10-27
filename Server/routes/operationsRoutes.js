const router=require('express').Router();
const {protect,adminOnly}=require('../middlewares/auth');
router.get('/status',protect,adminOnly,(req,res)=>res.json({success:true,data:{email:require('../services/accountMail').configured(),movieBackup:Boolean(process.env.OMDB_API_KEY),seriesBackup:process.env.TVMAZE_ENABLED!=='false',automaticLanguages:Boolean(process.env.STREAMING_AVAILABILITY_API_KEY),sharedRateLimits:process.env.NODE_ENV==='production'&&process.env.RATE_LIMIT_STORE!=='memory',database:require('mongoose').connection.readyState===1,revision:process.env.RENDER_GIT_COMMIT?.slice(0,12)||'local'}}));
module.exports=router;
