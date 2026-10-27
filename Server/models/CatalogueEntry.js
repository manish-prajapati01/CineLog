const mongoose=require('mongoose');
const schema=new mongoose.Schema({_id:String,data:mongoose.Schema.Types.Mixed,at:Date,expiresAt:Date},{versionKey:false});
schema.index({expiresAt:1},{expireAfterSeconds:0});
module.exports=mongoose.model('CatalogueEntry',schema);
