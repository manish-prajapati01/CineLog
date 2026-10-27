// Encrypted, lossless BSON export. No plaintext database dump is written to disk.
require('dotenv').config();
const fs=require('node:fs/promises');
const crypto=require('node:crypto');
const zlib=require('node:zlib');
const mongoose=require('mongoose');
const {EJSON}=mongoose.mongo.BSON;
const MAX=128*1024*1024;
async function run(){
 const [mode,file,...args]=process.argv.slice(2);
 if(!['backup','restore'].includes(mode)||!file)throw new Error('Usage: node scripts/backup.js backup FILE.enc | restore FILE.enc --database=cinelog-restore-NAME [--apply]');
 if(!/^[a-fA-F0-9]{64}$/.test(process.env.BACKUP_ENCRYPTION_KEY||''))throw new Error('BACKUP_ENCRYPTION_KEY must be a securely generated 32-byte hex key. Keep it separately from backups.');
 const key=Buffer.from(process.env.BACKUP_ENCRYPTION_KEY,'hex');const uri=process.env.MONGO_URL||process.env.MONGO_URI;
 if(!uri)throw new Error('Configure MONGO_URL.');
 if(mode==='backup'){
  await mongoose.connect(uri,{dbName:process.env.MONGO_DB_NAME||'movie-review',autoIndex:false,autoCreate:false});
  const collections={};let bytes=0;
  for(const c of await mongoose.connection.db.listCollections().toArray()){
   if(c.name.startsWith('system.')||['ratebuckets','catalogueentries'].includes(c.name))continue;
   collections[c.name]=[];for await(const doc of mongoose.connection.db.collection(c.name).find({})){const size=Buffer.byteLength(EJSON.stringify(doc,{relaxed:false}));bytes+=size;if(bytes>MAX)throw new Error('Database exceeds this 128 MiB export limit. Use managed snapshots or mongodump.');collections[c.name].push(doc);}
  }
  const plain=Buffer.from(EJSON.stringify({format:1,createdAt:new Date(),database:mongoose.connection.name,collections},{relaxed:false}));
  const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key,iv);const payload=Buffer.concat([cipher.update(zlib.gzipSync(plain)),cipher.final()]);
  await fs.writeFile(file,Buffer.concat([Buffer.from('CINELOG1'),iv,cipher.getAuthTag(),payload]),{flag:'wx',mode:0o600});
  console.log(JSON.stringify({success:true,collections:Object.keys(collections).length,bytes:payload.length}));
 }else{
  const stat=await fs.stat(file);if(stat.size>MAX)throw new Error('Backup exceeds safe import size.');
  const data=await fs.readFile(file);if(data.subarray(0,8).toString()!=='CINELOG1')throw new Error('Unsupported backup format.');
  const decipher=crypto.createDecipheriv('aes-256-gcm',key,data.subarray(8,20));decipher.setAuthTag(data.subarray(20,36));
  const decrypted=Buffer.concat([decipher.update(data.subarray(36)),decipher.final()]);
  const archive=EJSON.parse(zlib.gunzipSync(decrypted,{maxOutputLength:MAX}).toString(),{relaxed:false});
  if(Number(archive.format)!==1||!archive.collections)throw new Error('Invalid backup.');
  const target=args.find(x=>x.startsWith('--database='))?.slice(11);
  if(!/^cinelog-restore-[a-zA-Z0-9-]+$/.test(target||''))throw new Error('Restore target must be a NEW database named cinelog-restore-NAME.');
  console.log(JSON.stringify({target,collections:Object.keys(archive.collections),apply:args.includes('--apply')}));
  if(!args.includes('--apply'))return;
  await mongoose.connect(uri,{dbName:target,autoIndex:false,autoCreate:false});
  if((await mongoose.connection.db.listCollections().toArray()).length)throw new Error('Restore target is not empty. Refusing to overwrite data.');
  for(const [name,docs] of Object.entries(archive.collections)){
   if(!/^[a-zA-Z0-9_-]+$/.test(name))throw new Error('Invalid collection name.');
   if(docs.length)await mongoose.connection.db.collection(name).insertMany(docs);
  }
  console.log('Restore finished in the isolated target. Validate data and rebuild indexes before any cutover.');
 }
}
if(require.main===module)run().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>mongoose.disconnect());
