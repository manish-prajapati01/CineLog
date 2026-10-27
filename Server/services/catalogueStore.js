const crypto=require('node:crypto');
const mongoose=require('mongoose');
const Entry=require('../models/CatalogueEntry');
const Identity=require('../models/TitleIdentity');
const keyId=key=>crypto.createHash('sha256').update(key).digest('hex');
const ready=()=>mongoose.connection.readyState===1;
module.exports={
 async get(key){if(!ready())return null;try{const row=await Entry.findById(keyId(key)).lean();return row?{data:row.data,at:row.at.getTime()}:null;}catch{return null;}},
 async set(key,value){if(!ready())return;try{await Entry.updateOne({_id:keyId(key)},{$set:{data:value.data,at:new Date(value.at),expiresAt:new Date(value.at+86400000)}},{upsert:true});}catch{console.warn('catalogue_cache_write_failed');}},
 async remember(endpoint,data){if(!ready())return;const match=endpoint.match(/^\/(movie|tv)\/(\d+)$/);if(!match||!data?.id||data._catalogue)return;
  const update={type:match[1],tmdbId:Number(match[2]),data,updatedAt:new Date()};
  const imdb=data.external_ids?.imdb_id||data.imdb_id;if(/^tt\d+$/.test(imdb||''))update.imdbId=imdb;
  try{await Identity.updateOne({_id:`${match[1]}:${match[2]}`},{$set:update},{upsert:true});}catch{console.warn('catalogue_identity_write_failed');}
 },
 async identity(type,id){if(!ready())return null;return Identity.findById(`${type}:${id}`).lean();}
};
