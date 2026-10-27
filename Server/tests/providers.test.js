const {test}=require('node:test');
const assert=require('node:assert/strict');
const axios=require('axios');
const store=require('../services/catalogueStore');
const fallback=require('../services/catalogueFallback');
const streaming=require('../services/streamingLanguages');
test('backup series uses exact IMDb identity and preserves CineLog title ID',async()=>{
 const oldGet=axios.get,oldIdentity=store.identity;
 store.identity=async()=>({imdbId:'tt0903747',data:{original_language:'en'}});
 axios.get=async url=>url.includes('lookup')?{data:{id:169,name:'Breaking Bad',externals:{imdb:'tt0903747'},url:'https://www.tvmaze.com/shows/169/breaking-bad',summary:'<p>A series.</p>'}}:url.endsWith('seasons')?{data:[{number:1,premiereDate:'2008-01-20'}]}:{data:[{id:1,season:1,number:1,name:'Pilot',summary:'<p>Episode</p>',airdate:'2008-01-20'}]};
 try{const title=await fallback('/tv/1396');assert.equal(title.id,1396);assert.equal(title._catalogue.provider,'TVmaze');assert.equal(title.overview,'A series.');const season=await fallback('/tv/1396/season/1');assert.equal(season.episodes[0].episode_number,1);store.identity=async()=>null;assert.equal(await fallback('/tv/999'),null);}finally{axios.get=oldGet;store.identity=oldIdentity;}
});
test('backup provider mismatched identities are rejected',async()=>{
 const oldGet=axios.get,oldIdentity=store.identity;store.identity=async()=>({imdbId:'tt123'});axios.get=async()=>({data:{externals:{imdb:'tt456'}}});try{assert.equal(await fallback('/tv/1'),null);}finally{axios.get=oldGet;store.identity=oldIdentity;}
});
test('audio tracks are normalized without treating missing coverage as a verified absence',()=>{
 const rows=streaming.entries({streamingOptions:{in:[{service:{id:'netflix',name:'Netflix'},type:'subscription',link:'https://www.netflix.com/title/123',audios:[{language:'hin'},{language:'eng'}],subtitles:[{locale:{language:'tam'}}]},{service:{name:'Unsafe'},link:'javascript:alert(1)',audios:[],subtitles:[]}]}});
 assert.equal(rows.length,1);assert.deepEqual(rows[0].audio,['hi','en']);assert.deepEqual(rows[0].subtitles,['ta']);assert.equal(rows[0].region,'IN');assert.deepEqual(streaming.entries({}),[]);
});
test('persistent catalogue cache survives a new cache instance but never serves expired entries',async()=>{
 const cacheFactory=require('../services/catalogueCache');const records=new Map();const adapter={get:async k=>records.get(k),set:async(k,v)=>records.set(k,v)};let now=0;
 await cacheFactory({store:adapter,now:()=>now,freshMs:10,staleMs:100})('title',async()=>({id:1}));now=20;
 const second=cacheFactory({store:adapter,now:()=>now,freshMs:10,staleMs:100});const broken=async()=>{throw Object.assign(new Error('offline'),{transient:true});};assert.equal((await second('title',broken))._catalogue.stale,true);now=101;await assert.rejects(second('title',broken));
});
test('server-rendered metadata escapes content and has a title-specific canonical',async()=>{
 const {renderTitle}=await import('../../Client/api/title.js');const html=renderTitle('<html><head><title>Old</title><meta name="description" content="old"><link rel="canonical" href="old"></head><body><div id="root"></div></body></html>',{type:'movie',id:'550',site:'https://example.com',data:{title:'Film </script><script>bad()</script>',overview:'" onload="bad()',original_language:'en'}});
 assert.ok(html.includes('https://example.com/movie/550'));assert.ok(!html.includes('<script>bad()'));assert.equal((html.match(/rel="canonical"/g)||[]).length,1);assert.ok(html.includes('application/ld+json'));
});
