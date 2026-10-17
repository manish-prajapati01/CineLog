/** Dry-run by default. Back up the database before using --apply. */
require('dotenv').config();
const mongoose = require('mongoose');
async function main() {
 await mongoose.connect(process.env.MONGO_URL || process.env.MONGO_URI, { dbName: 'movie-review', autoIndex: false });
 const db=mongoose.connection.db, source=db.collection('movies');
 const references={tmdbId:{$type:'number'},mediaType:{$in:['movie','tv']}};
 const duplicates=await source.aggregate([{$match:references},{$group:{_id:{tmdbId:'$tmdbId',mediaType:'$mediaType'},count:{$sum:1}}},{$match:{count:{$gt:1}}},{$count:'count'}]).toArray();
 const reviewDuplicates=await db.collection('reviews').aggregate([{$group:{_id:{userId:'$userId',tmdbId:'$tmdbId',mediaType:'$mediaType'},count:{$sum:1}}},{$match:{count:{$gt:1}}},{$count:'count'}]).toArray();
 const indexes=await source.indexes();
 const obsolete=indexes.filter(i=>i.key.tmdbId && Object.keys(i.key).every(k=>['tmdbId','mediaType'].includes(k)));
 const plan={apply:process.argv.includes('--apply'),references:await source.countDocuments(references),duplicateReferences:duplicates[0]?.count||0,duplicateReviews:reviewDuplicates[0]?.count||0,obsoleteIndexes:obsolete.map(i=>i.name)};
 console.log(JSON.stringify(plan,null,2));
 if(!plan.apply)return;
 if(plan.duplicateReferences||plan.duplicateReviews)throw new Error('Resolve duplicate identities before applying this migration.');
 const target=db.collection('media_references');
 for await(const row of source.find(references)) {
  const {_id,...data}=row;
  await target.updateOne({tmdbId:row.tmdbId,mediaType:row.mediaType},{$setOnInsert:data},{upsert:true});
 }
 await target.createIndex({tmdbId:1,mediaType:1},{unique:true});
 await db.collection('reviews').createIndex({userId:1,tmdbId:1,mediaType:1},{unique:true});
 await db.collection('ratings').createIndex({userId:1,tmdbId:1,mediaType:1},{unique:true});
 await db.collection('watchlists').createIndex({userId:1},{unique:true});
 for(const index of obsolete)await source.dropIndex(index.name);
 console.log('Migration completed. Original movie documents retained.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>mongoose.disconnect());
