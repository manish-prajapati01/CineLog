const base=(process.env.SMOKE_API_URL||'http://127.0.0.1:5001').replace(/\/$/,'');
async function run(){
 const today=new Date().toISOString().slice(0,10);
 for(const path of ['/api/ready','/api/discover/movie?upcoming=true&language=hi','/api/discover/tv?upcoming=true&language=en','/api/ratings/community/550/movie','/api/audio/movie/550']){
  const r=await fetch(base+path,{signal:AbortSignal.timeout(45000)}),d=await r.json();
  if(!r.ok||!d.success)throw new Error(`${path}: HTTP ${r.status}`);
  if(path.includes('upcoming=true')&&(d.results||[]).some(x=>(x.release_date||x.first_air_date||'')<today))throw new Error(`${path}: returned past releases`);
  console.log(JSON.stringify({path,status:r.status}));
 }
 if(process.env.SMOKE_SITE_URL){for(const path of ['/robots.txt','/sitemap.xml','/movie/550']){const r=await fetch(process.env.SMOKE_SITE_URL.replace(/\/$/,'')+path,{signal:AbortSignal.timeout(45000)}),text=await r.text();if(!r.ok||path==='/robots.txt'&&!text.includes('User-agent:')||path==='/sitemap.xml'&&!text.includes('<urlset')||path==='/movie/550'&&!text.includes('Fight Club'))throw new Error(`Website check failed: ${path}`);console.log(JSON.stringify({path,status:r.status}));}}
}
run().catch(e=>{console.error(e.message);process.exitCode=1;});
