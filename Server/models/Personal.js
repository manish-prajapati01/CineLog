const mongoose = require('mongoose');
const item = new mongoose.Schema({tmdbId: {type:Number,required:true}, mediaType:{type:String,enum:['movie','tv'],required:true}, title:{type:String,required:true,maxlength:300}, posterPath:String,originalLanguage:String}, {_id:false});
const collection = new mongoose.Schema({name:{type:String,required:true,maxlength:80},description:{type:String,maxlength:500,default:''}, visibility:{type:String,enum:['private','public'],default:'private'},items:[item]}, {timestamps:true});
const schema = new mongoose.Schema({
 _id:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
 profilePublic:{type:Boolean,default:false}, bio:{type:String,maxlength:300,default:''},
 showRatings:{type:Boolean,default:false},showReviews:{type:Boolean,default:false},
 collections:[collection],
 episodes:{type:[String],default:[]},
}, {timestamps:true});
module.exports = mongoose.model('Personal',schema);
