const mongoose=require('mongoose');
module.exports=mongoose.model('Sponsorship',new mongoose.Schema({slot:{type:String,enum:['home','discovery'],unique:true},label:{type:String,maxlength:120},url:String,startsAt:Date,endsAt:Date,enabled:{type:Boolean,default:false}},{timestamps:true}));
