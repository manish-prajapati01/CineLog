const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
process.env.JWT_SECRET = 'isolated-test-secret-not-for-production';
const User = require('../models/User');
const Watchlist = require('../models/Watchlist');
const Movie = require('../models/Movie');
const LegacyMovie = require('../models/movieModels');
const tmdb = require('../services/tmdbService');
let server, base, captured;
const userId = '507f1f77bcf86cd799439011';
let currentUser = { _id: userId, role: 'user', isActive: true };
User.findById = () => ({ select: async () => currentUser });
Watchlist.findOne = async () => ({ items: [], hasItem: () => false });
Watchlist.findOneAndUpdate = async (filter, update, options) => { captured = { filter, update, options }; return { items: [] }; };
const token = () => jwt.sign({ userId }, process.env.JWT_SECRET);
async function request(path, method='GET', body, authenticated=true) {
 const response = await fetch(base+path, { method, headers: { 'Content-Type':'application/json', ...(authenticated ? { Authorization: `Bearer ${token()}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
 return { status: response.status, body: await response.json() };
}
before(async () => {
 const app=express();app.use(express.json());
 app.use('/watchlist',require('../routes/watchlistRoutes'));
 app.use('/artists',require('../routes/artistRoutes'));
 app.use('/discover',require('../routes/discoverRoutes'));
 app.use('/ratings',require('../routes/ratingRoutes'));
 app.use('/auth',require('../routes/authRoutes'));
 app.use((err,req,res,next)=>res.status(err.status||500).json({message:err.message}));
 await new Promise(resolve=>{server=app.listen(0,'127.0.0.1',resolve);});base=`http://127.0.0.1:${server.address().port}`;
});
after(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));});
test('library requires authentication',async()=>assert.equal((await request('/watchlist','GET',null,false)).status,401));
test('regular users cannot create artists',async()=>assert.equal((await request('/artists/add','POST',{})).status,403));
test('deactivated administrators cannot create artists',async()=>{currentUser={_id:userId,role:'admin',isActive:false};assert.equal((await request('/artists/add','POST',{})).status,401);currentUser={_id:userId,role:'user',isActive:true};});
test('reject invalid media types before database writes',async()=>assert.equal((await request('/watchlist','POST',{tmdbId:1,mediaType:'person',title:'Test'})).status,400));
test('library updates are scoped to the current user and exact media type',async()=>{assert.equal((await request('/watchlist/42/tv','PATCH',{status:'watched',collectionName:'Favorites',notes:'A great finale'})).status,200);assert.equal(captured.filter.userId,userId);assert.deepEqual(captured.filter.items.$elemMatch,{tmdbId:42,mediaType:'tv'});assert.equal(captured.update.$set['items.$.status'],'watched');assert.equal(captured.update.$set['items.$.collectionName'],'Favorites');assert.ok(captured.update.$set['items.$.watchedAt'] instanceof Date);assert.equal(captured.options.runValidators,true);});
test('journal rejects future viewing dates',async()=>assert.equal((await request('/watchlist/42/movie','PATCH',{watchedAt:'2999-01-01'})).status,400));
test('deletion preserves another media type with the same numeric ID',async()=>{assert.equal((await request('/watchlist/42/movie','DELETE')).status,200);assert.deepEqual(captured.update.$pull.items,{tmdbId:42,mediaType:'movie'});});
test('missing ratings are rejected before persistence',async()=>assert.equal((await request('/ratings','POST',{tmdbId:42,mediaType:'movie',title:'Test'})).status,400));
test('object-shaped login credentials are rejected',async()=>assert.equal((await request('/auth/login','POST',{email:{$ne:null},password:'invalid'})).status,400));
test('new registrations require at least eight password characters',async()=>assert.equal((await request('/auth/register','POST',{name:'Test',email:'test@example.com',password:'short'})).status,400));
test('discovery forwards validated filters and clamps page',async()=>{let params;tmdb.discoverMovies=async p=>{params=p;return {results:[],total_pages:0};};assert.equal((await request('/discover/movie?page=999&genre=28&language=hi&rating=8&year=2020&sort=vote_average.desc','GET',null,false)).status,200);assert.equal(params.page,500);assert.equal(params.with_genres,'28');assert.equal(params.vote_average_gte,8);assert.equal(params.year,'2020');assert.equal(params.language,'hi');});
test('streaming lookup rejects unexpected media paths',async()=>assert.equal((await request('/discover/person/42/providers','GET',null,false)).status,400));
test('manual catalogue and TMDB references use different collections',()=>assert.notEqual(Movie.collection.name,LegacyMovie.collection.name));
test('movie references do not impose uniqueness on numeric ID alone',()=>assert.equal(Movie.schema.indexes().some(([keys,options])=>keys.tmdbId&&Object.keys(keys).length===1&&options.unique),false));
test('library schema rejects unsupported statuses',()=>{const list=new Watchlist({userId,items:[{tmdbId:1,mediaType:'movie',title:'Test',status:'unknown'}]});assert.ok(list.validateSync());});

test('discovery floors fractional pages and defaults an incompatible series sort', async () => {
 let params; tmdb.discoverTV = async p => { params=p; return {results:[], total_pages:0}; };
 const result=await request('/discover/tv?page=2.9&sort=primary_release_date.desc&genre=18&year=2020&language=ko&rating=7','GET',null,false);
 assert.equal(result.status,200); assert.equal(params.page,2); assert.equal(params.sort_by,'popularity.desc'); assert.equal(params.with_genres,'18'); assert.equal(params.year,undefined); assert.equal(params['air_date.gte'],'2020-01-01'); assert.equal(params['air_date.lte'],'2020-12-31'); assert.equal(params.language,'ko'); assert.equal(params.vote_average_gte,7);
});
test('discovery ignores malformed filters and protects the first page', async () => {
 let params; tmdb.discoverMovies = async p => { params=p; return {results:[], total_pages:0}; };
 await request('/discover/movie?page=-4&sort=broken&genre=oops&year=bad&language=123&rating=12','GET',null,false);
 assert.equal(params.page,1); assert.equal(params.sort_by,'popularity.desc'); assert.equal(params.with_genres,undefined); assert.equal(params.year,undefined); assert.equal(params.language,undefined); assert.equal(params.vote_average_gte,undefined);
});

test('discovery includes low-vote titles for both movies and series', async () => {
 for (const type of ['movie','tv']) {
  let params;
  tmdb[type === 'movie' ? 'discoverMovies' : 'discoverTV'] = async p => { params=p; return {results:[],total_pages:0}; };
  await request(`/discover/${type}?language=hi&year=2026&genre=${type === 'movie' ? 28 : 10759}`,'GET',null,false);
  assert.equal(params.vote_count_gte,undefined);
  assert.equal(params.language,'hi');
  if (type === 'tv') { assert.equal(params.year,undefined); assert.equal(params['air_date.gte'],'2026-01-01'); assert.equal(params['air_date.lte'],'2026-12-31'); }
  else assert.equal(params.year,'2026');
 }
});

test('individual ratings are public independently of profile privacy and expose no email',async()=>{
 const Rating=require('../models/Rating');let projection;
 const query={select(value){projection=value;return this;},populate(){return this;},sort(){return this;},skip(){return this;},limit(){return this;},lean:async()=>[{_id:'rating',score:8,updatedAt:'2026-01-01',userId:{_id:userId,name:'Member',isActive:true,email:'hidden@example.com'},demographics:{gender:'private'}}]};
 Rating.find=()=>query;Rating.countDocuments=async()=>1;
 const r=await request('/ratings/community/42/movie','GET',null,false);assert.equal(r.status,200);assert.equal(r.body.data[0].score,8);assert.equal(r.body.data[0].user.email,undefined);assert.equal(r.body.data[0].demographics,undefined);assert.equal(projection,'score userId updatedAt');assert.equal((await request('/ratings/community/42/person','GET',null,false)).status,400);
});
