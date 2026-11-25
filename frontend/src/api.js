export const api=(p,o)=>fetch('/api'+p,o).then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.error||'Request failed');return j})
export const post=(p,b)=>api(p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)})
