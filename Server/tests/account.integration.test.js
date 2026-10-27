const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const mongoose=require('mongoose');
process.env.NODE_ENV='test';process.env.JWT_SECRET='isolated-account-tests-not-a-production-secret';process.env.MAIL_TRANSPORT='test';process.env.PUBLIC_SITE_URL='http://localhost:5173';
const {MongoMemoryReplSet}=require('mongodb-memory-server');
const User=require('../models/User');
const Personal=require('../models/Personal');
const Rating=require('../models/Rating');
const Review=require('../models/Review');
const Watchlist=require('../models/Watchlist');
const mail=require('../services/accountMail');
const tmdb=require('../services/tmdbService');
let db,server,base,ip=1;
async function request(path,{method='GET',body,token,client='127.0.0.2'}={}){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json','X-Forwarded-For':client,...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,body:await r.json()};}
async function register(){const n=ip++;const r=await request('/api/auth/register',{method:'POST',body:{name:`Tester ${n}`,email:`tester${n}@example.test`,password:'Test-password-123!'}});assert.equal(r.status,201);return {...r.body,email:`tester${n}@example.test`};}
before(async()=>{db=await MongoMemoryReplSet.create({replSet:{count:1},binary:{version:'7.0.14'}});await mongoose.connect(db.getUri(),{dbName:'cinelog-integration'});const app=require('../server');app.set('trust proxy',1);await Promise.all([User.init(),Personal.init(),Watchlist.init(),Rating.createIndexes(),Review.createIndexes(),require('../models/RateBucket').createIndexes()]);server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));base=`http://127.0.0.1:${server.address().port}`;},{timeout:180000});
after(async()=>{if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}await mongoose.disconnect();if(db)await db.stop();});
test('password recovery is single-use and revokes existing sessions',async()=>{
 const a=await register(),client='127.0.0.10';
 const known=await request('/api/auth/forgot-password',{method:'POST',body:{email:a.email},client});
 const unknown=await request('/api/auth/forgot-password',{method:'POST',body:{email:'unknown@example.test'},client});assert.deepEqual(known,unknown);
 const token=mail.outbox.at(-1).text.match(/token=([a-f0-9]+)/)[1];const stored=await User.findById(a.user.id).select('+passwordResetHash');assert.notEqual(stored.passwordResetHash,token);
 assert.equal((await request('/api/auth/reset-password',{method:'POST',body:{token,password:'Replacement-password-123!'},client})).status,200);
 assert.equal((await request('/api/auth/reset-password',{method:'POST',body:{token,password:'Other-password-123!'},client})).status,400);
 assert.equal((await request('/api/auth/me',{token:a.token})).status,401);
 assert.equal((await request('/api/auth/login',{method:'POST',body:{email:a.email,password:'Replacement-password-123!'}})).status,200);
});
test('verification is expiring, single-use, and does not expose hashes',async()=>{
 const a=await register(),client='127.0.0.11';await request('/api/auth/send-verification',{method:'POST',token:a.token,client});const token=mail.outbox.at(-1).text.match(/token=([a-f0-9]+)/)[1];
 assert.equal((await request('/api/auth/verify-email',{method:'POST',body:{token},client})).status,200);
 assert.equal((await request('/api/auth/verify-email',{method:'POST',body:{token},client})).status,400);
 const me=await request('/api/auth/me',{token:a.token});assert.ok(me.body.data.emailVerifiedAt);assert.equal(me.body.data.emailVerificationHash,undefined);
});
test('expired reset tokens fail and account email delivery can be explicitly unavailable',async()=>{
 const a=await register(),client='127.0.0.12';await request('/api/auth/forgot-password',{method:'POST',body:{email:a.email},client});const token=mail.outbox.at(-1).text.match(/token=([a-f0-9]+)/)[1];await User.updateOne({_id:a.user.id},{$set:{passwordResetExpires:new Date(0)}});
 assert.equal((await request('/api/auth/reset-password',{method:'POST',body:{token,password:'Replacement-password-123!'},client})).status,400);
 const old=process.env.MAIL_TRANSPORT;delete process.env.MAIL_TRANSPORT;try{assert.equal((await request('/api/auth/forgot-password',{method:'POST',body:{email:a.email},client})).status,503);}finally{process.env.MAIL_TRANSPORT=old;}
});
test('real database privacy, collections, tracking and deletion preserve another account',async()=>{
 const a=await register(),b=await register(),client='127.0.0.13';
 tmdb.getMovieDetails=async()=>({id:550,title:'Fixture film',poster_path:null,original_language:'en'});
 tmdb.getTVSeasonDetails=async()=>({episodes:[{id:1,episode_number:1,name:'Pilot',air_date:'2020-01-01'},{id:2,episode_number:2,name:'Future',air_date:'2999-01-01'}]});
 const c=await request('/api/personal/collections',{method:'POST',body:{name:'My list'},token:a.token});assert.equal(c.status,201);const id=c.body.data.collections[0]._id;
 const path=`/api/personal/shared/${a.user.id}/${id}`;assert.equal((await request(path)).status,404);
 assert.equal((await request(`/api/personal/collections/${id}`,{method:'PATCH',body:{visibility:'public'},token:b.token})).status,404);
 await request(`/api/personal/collections/${id}`,{method:'PATCH',body:{visibility:'public'},token:a.token});
 await request(`/api/personal/collections/${id}/items/movie/550`,{method:'PUT',token:a.token});assert.equal((await request(path)).body.data.items.length,1);
 await request('/api/personal/seasons/1396/1',{method:'PUT',body:{watched:true},token:a.token});assert.deepEqual((await Personal.findById(a.user.id)).episodes.toObject(),['1396:1:1']);
 const common={tmdbId:550,mediaType:'movie',title:'Fixture film',score:8};await Rating.create({...common,userId:a.user.id});await Rating.create({...common,userId:b.user.id});
 await Review.create({userId:a.user.id,tmdbId:550,mediaType:'movie',title:'Review',content:'This is a fixture review.'});
 await Watchlist.create({userId:a.user.id,items:[]});
 assert.equal((await request('/api/personal/people/'+a.user.id)).status,404);
 const ratings=await request('/api/ratings/community/550/movie');assert.equal(ratings.body.data.length,2);assert.ok(ratings.body.data.every(r=>!r.user?.email));
 assert.equal((await request('/api/auth/account',{method:'DELETE',token:a.token,body:{password:'wrong',confirmation:'DELETE'},client})).status,403);
 assert.equal((await request('/api/auth/account',{method:'DELETE',token:a.token,body:{password:'Test-password-123!',confirmation:'DELETE'},client})).status,200);
 for(const model of [Rating,Review,Watchlist])assert.equal(await model.countDocuments({userId:a.user.id}),0);
 assert.equal(await Personal.findById(a.user.id),null);assert.equal(await User.findById(a.user.id),null);assert.ok(await User.findById(b.user.id));assert.equal(await Rating.countDocuments({userId:b.user.id}),1);assert.equal((await request(path)).status,404);
});
test('Mongo-backed rate limits survive middleware recreation and reject overflow',async()=>{
 const factory=require('../middlewares/rateLimit');const old=process.env.NODE_ENV;process.env.NODE_ENV='production';
 const response=()=>({headers:{},set(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(body){this.body=body;}});
 try{let count=0;const req={method:'GET',ip:'192.0.2.15'};await factory({namespace:'integration-shared',limit:1})(req,response(),()=>count++);const r=response();await factory({namespace:'integration-shared',limit:1})(req,r,()=>count++);assert.equal(count,1);assert.equal(r.code,429);assert.ok(r.headers['Retry-After']);}finally{process.env.NODE_ENV=old;}
});
test('sponsor links require admin and remain hidden outside their active dates',async()=>{
 const a=await register();const body={label:'Fixture sponsor',url:'https://example.com',startsAt:'2020-01-01',endsAt:'2999-01-01',enabled:true};
 assert.equal((await request('/api/sponsors/home',{method:'PUT',token:a.token,body})).status,403);await User.updateOne({_id:a.user.id},{$set:{role:'admin'}});
 assert.equal((await request('/api/sponsors/home',{method:'PUT',token:a.token,body:{...body,url:'javascript:alert(1)'}})).status,400);
 assert.equal((await request('/api/sponsors/home',{method:'PUT',token:a.token,body})).status,200);assert.equal((await request('/api/sponsors/home')).body.data.label,'Fixture sponsor');
 await request('/api/sponsors/home',{method:'PUT',token:a.token,body:{...body,enabled:false}});assert.equal((await request('/api/sponsors/home')).body.data,null);
});
test('encrypted backups restore BSON data only into an empty isolated database',async()=>{
 const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
 const execFile=require('node:util').promisify(require('node:child_process').execFile);
 const folder=await fs.mkdtemp(path.join(os.tmpdir(),'cinelog-backup-test-')),file=path.join(folder,'backup.enc');
 const env={...process.env,MONGO_URL:db.getUri(),MONGO_DB_NAME:'cinelog-integration',BACKUP_ENCRYPTION_KEY:crypto.randomBytes(32).toString('hex')};
 const script=path.join(__dirname,'../scripts/backup.js');
 try{
  await execFile(process.execPath,[script,'backup',file],{env});const bytes=await fs.readFile(file);assert.equal(bytes.includes(Buffer.from('tester')),false);
  await execFile(process.execPath,[script,'restore',file,'--database=cinelog-restore-test','--apply'],{env});
  const restored=mongoose.connection.useDb('cinelog-restore-test');const count=await restored.db.collection('users').countDocuments();assert.equal(count,await User.countDocuments());const row=await restored.db.collection('users').findOne();assert.ok(row._id instanceof mongoose.Types.ObjectId);assert.ok(row.createdAt instanceof Date);
  await assert.rejects(execFile(process.execPath,[script,'restore',file,'--database=cinelog-restore-test','--apply'],{env}));
  await assert.rejects(execFile(process.execPath,[script,'restore',file,'--database=movie-review','--apply'],{env}));
  bytes[bytes.length-1]^=1;await fs.writeFile(file,bytes);await assert.rejects(execFile(process.execPath,[script,'restore',file,'--database=cinelog-restore-corrupt','--apply'],{env}));
 }finally{await fs.unlink(file).catch(()=>{});await fs.rmdir(folder);}
});
