const mongoose=require('mongoose');
module.exports=mongoose.model('AudioAvailability',new mongoose.Schema({
 _id:String, entries:[{region:String,provider:String,audio:[String],subtitles:[String],source:String,checkedAt:Date}],
},{timestamps:true}));
