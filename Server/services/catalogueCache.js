// Public catalogue responses only. Never use this cache for account or availability data.
module.exports = function createCatalogueCache({now=Date.now,freshMs=3600000,staleMs=86400000,maxEntries=500,store=null}={}) {
 const entries=new Map(), pending=new Map();
 const request = async function request(key,load,{allowStale=true}={}) {
  const cached=entries.get(key) || (store ? await store.get(key) : null),age=cached?now()-cached.at:Infinity;
  if(age<freshMs)return structuredClone(cached.data);
  if(pending.has(key))return structuredClone(await pending.get(key));
  const task=(async()=>{
   try {
    const data=await load();
    if(!entries.has(key)&&entries.size>=maxEntries)entries.delete(entries.keys().next().value);
    entries.delete(key);entries.set(key,{data:structuredClone(data),at:now()});
    if(store && !data._catalogue)await store.set(key,{data,at:now()});
    return data;
   }catch(error){
    if(allowStale && cached && age<staleMs && error.transient) return {...structuredClone(cached.data),_catalogue:{stale:true,checkedAt:new Date(cached.at).toISOString()}};
    throw error;
   }
  })();
  pending.set(key,task);
  try{return structuredClone(await task);}finally{pending.delete(key);}
 };
 request.clear=()=>entries.clear();
 return request;
};
