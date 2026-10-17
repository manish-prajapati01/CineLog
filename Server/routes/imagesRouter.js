const router = require('express').Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinaryConfig');
const admin = require('../middlewares/authMiddlewares');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
 if (!['image/jpeg','image/png','image/webp'].includes(file.mimetype)) { const error=new Error('Use a JPG, PNG or WebP image');error.status=400;return cb(error); } cb(null,true);
} });
router.post('/upload-image', admin, upload.single('image'), async (req,res,next)=>{
 if(!req.file)return res.status(400).json({success:false,message:'Choose an image'});
 try{const result=await new Promise((resolve,reject)=>{const stream=cloudinary.uploader.upload_stream({folder:'cinelog',resource_type:'image'},(error,result)=>error?reject(error):resolve(result));stream.end(req.file.buffer);});res.json({success:true,data:result.secure_url,message:'Image uploaded'});}catch(error){next(error);}
});
module.exports=router;
