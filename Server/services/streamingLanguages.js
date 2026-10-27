const axios=require('axios');
const createCache=require('./catalogueCache');
const cache=createCache({freshMs:6*3600000,maxEntries:200});
const normalize=code=>({hin:'hi',eng:'en',tam:'ta',tel:'te',mal:'ml',kan:'kn',mar:'mr',ben:'bn',pan:'pa',guj:'gu',jpn:'ja',kor:'ko',spa:'es',fra:'fr',fre:'fr',deu:'de',ger:'de',zho:'zh',chi:'zh',por:'pt',ita:'it',rus:'ru',ara:'ar'}[code]||code);
const validUrl=value=>{try{return new URL(value).protocol==='https:';}catch{return false;}};
function entries(show){const result=[];for(const [region,options] of Object.entries(show.streamingOptions||{})){
 if(!/^[a-z]{2}$/.test(region))continue;
 for(const option of options){if(!option.service?.name||!validUrl(option.link))continue;
 const codes=values=>[...new Set(values.filter(v=>typeof v==='string'&&/^[a-z]{2,3}$/.test(v)).map(normalize))];
 result.push({_id:`${region}:${option.service.id}:${option.type}:${result.length}`,region:region.toUpperCase(),provider:option.service.name,offerType:option.type,audio:codes((option.audios||[]).map(x=>x.language)),subtitles:codes((option.subtitles||[]).map(x=>x.locale?.language)),source:option.link,checkedAt:new Date().toISOString(),automatic:true});
 }}return result;}
async function get(type,id){if(!process.env.STREAMING_AVAILABILITY_API_KEY)return {entries:[],status:'unconfigured'};
 try {const data=await cache(`${type}:${id}`,async()=>{const rapid=process.env.STREAMING_AVAILABILITY_PLATFORM==='rapidapi';const {data}=await axios.get(`${rapid?'https://streaming-availability.p.rapidapi.com':'https://api.movieofthenight.com/v4'}/shows/${type}/${id}`,{headers:rapid?{'X-RapidAPI-Key':process.env.STREAMING_AVAILABILITY_API_KEY,'X-RapidAPI-Host':'streaming-availability.p.rapidapi.com'}:{'X-API-Key':process.env.STREAMING_AVAILABILITY_API_KEY},params:{series_granularity:'show'},timeout:5000});
 if(data.tmdbId!==`${type}/${id}`)throw new Error('Provider title identity mismatch');return {entries:entries(data),status:'available'};},{allowStale:false});return data;
 }catch{return {entries:[],status:'unavailable'};}}
module.exports={get,entries,normalize};
