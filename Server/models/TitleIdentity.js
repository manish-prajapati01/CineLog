const mongoose=require('mongoose');
const schema=new mongoose.Schema({_id:String,type:String,tmdbId:Number,imdbId:String,data:mongoose.Schema.Types.Mixed,updatedAt:Date},{versionKey:false});
schema.index({type:1,tmdbId:1},{unique:true});
module.exports=mongoose.model('TitleIdentity',schema);
