const axios=require('axios');
const store=require('./catalogueStore');
const clean=value=>String(value||'').replace(/<[^>]*>/g,'');
// Never guess provider identity from a title: similarly named films and remakes must not share data.
module.exports=async function fallback(endpoint){
 const match=endpoint.match(/^\/(movie|tv)\/(\d+)(?:\/season\/(\d+))?$/);
 if(!match)return null;
 const [,type,id,season]=match, identity=await store.identity(type,id);
 if(!identity?.imdbId)return null;
 if(type==='tv'&&process.env.TVMAZE_ENABLED!=='false'){
  const {data:show}=await axios.get('https://api.tvmaze.com/lookup/shows',{params:{imdb:identity.imdbId},timeout:4000});
  if(show.externals?.imdb!==identity.imdbId)return null;
  const attribution={provider:'TVmaze',url:show.url,license:'CC BY-SA 4.0',partial:true};
  if(season!==undefined){const {data:episodes}=await axios.get(`https://api.tvmaze.com/shows/${show.id}/episodes`,{timeout:4000});return {id:Number(id),season_number:Number(season),episodes:episodes.filter(e=>e.season===Number(season)).map(e=>({id:e.id,episode_number:e.number,name:e.name,overview:clean(e.summary),air_date:e.airdate,runtime:e.runtime})),_catalogue:attribution};}
  const {data:seasons}=await axios.get(`https://api.tvmaze.com/shows/${show.id}/seasons`,{timeout:4000});
  return {id:Number(id),name:show.name,overview:clean(show.summary),original_language:identity.data?.original_language,first_air_date:show.premiered,status:show.status,number_of_seasons:seasons.length,seasons:seasons.map(s=>({season_number:s.number,name:`Season ${s.number}`,air_date:s.premiereDate,episode_count:s.episodeOrder})),credits:{cast:[]},videos:{results:[]},recommendations:{results:[]},_catalogue:attribution};
 }
 if(type==='movie'&&process.env.OMDB_API_KEY){
  const {data}=await axios.get('https://www.omdbapi.com/',{params:{apikey:process.env.OMDB_API_KEY,i:identity.imdbId,plot:'full'},timeout:4000});
  if(data.Response!=='True'||data.imdbID!==identity.imdbId||data.Type!=='movie')return null;
  const date=Date.parse(data.Released);
  return {id:Number(id),title:data.Title,overview:data.Plot==='N/A'?'':data.Plot,original_language:identity.data?.original_language,release_date:Number.isNaN(date)?'':new Date(date).toISOString().slice(0,10),runtime:parseInt(data.Runtime)||null,credits:{cast:[]},videos:{results:[]},recommendations:{results:[]},omdb:{imdbRating:data.imdbRating,awards:data.Awards},_catalogue:{provider:'OMDb',url:'https://www.omdbapi.com/',partial:true}};
 }
 return null;
};
