require('dotenv').config();
const mongoose=require('mongoose');
async function run(){
 const names=['RateBucket','CatalogueEntry','TitleIdentity','Sponsorship'];
 if(!process.argv.includes('--apply')){console.log('Plan: create indexes for '+names.join(', ')+'. Pass --apply after checking database configuration.');return;}
 await mongoose.connect(process.env.MONGO_URL||process.env.MONGO_URI,{dbName:process.env.MONGO_DB_NAME||'movie-review',autoIndex:false,autoCreate:false});
 for(const name of names)await require(`../models/${name}`).createIndexes();
 console.log('Operational indexes created. Existing rating/review migrations remain separate.');
}
run().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>mongoose.disconnect());
