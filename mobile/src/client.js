export async function runAgent({url,token,messages,brandBrief,task,search=true}) {
  const base=(url||'').trim().replace(/\/+$/,'');
  if(!/^https?:\/\//i.test(base)) throw new Error('Enter an API URL beginning with https:// (or local http:// for development).');
  if(!token)throw new Error('Enter the access token in Settings.');
  const response=await fetch(base+'/api/respond',{
    method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
    body:JSON.stringify({brandBrief,messages,task,search}),
  });
  let body; try{body=await response.json()}catch{throw new Error('Backend did not return JSON. Check the server URL.');}
  if(!response.ok)throw new Error(body.error||'Server error ('+response.status+')');
  if(!body.answer)throw new Error('Server responded without text.');
  return body;
}
export async function checkServer(url){
 const base=(url||'').trim().replace(/\/+$/,'');
 const r=await fetch(base+'/health');
 if(!r.ok)throw new Error('Health check failed.');
 return r.json();
}
