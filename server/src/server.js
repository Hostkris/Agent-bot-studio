import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { generate } from './xai.js';

function json(res,status,object) {
  const data=JSON.stringify(object);
  res.writeHead(status,{
    'Content-Type':'application/json; charset=utf-8',
    'Content-Length':Buffer.byteLength(data),
    'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'
  });
  res.end(data);
}
async function readJson(req) {
  let input='';
  for await(const chunk of req) {
    input+=chunk;
    if(input.length>80000)throw Object.assign(new Error('Request too large'),{status:413});
  }
  try{return JSON.parse(input||'{}');}
  catch{throw Object.assign(new Error('Invalid JSON'),{status:400});}
}
export function createServer({secret=process.env.APP_ACCESS_TOKEN,ai=generate}={}) {
  return http.createServer(async(req,res)=>{
    if(req.method==='GET'&&req.url==='/health') {
      return json(res,200,{
        ok:true,app:'Agent Bot Studio',
        aiConfigured:Boolean(process.env.XAI_API_KEY&&!process.env.XAI_API_KEY.startsWith('replace-'))
      });
    }
    if(req.url!=='/api/respond'||req.method!=='POST')
      return json(res,404,{error:'Not found'});
    if(!secret||secret.startsWith('replace-')||secret.length<24)
      return json(res,503,{error:'APP_ACCESS_TOKEN needs a strong value on the server.'});
    if(req.headers.authorization!=='Bearer '+secret)
      return json(res,401,{error:'Invalid access token.'});
    try {
      const data=await readJson(req);
      if(typeof data.brandBrief!=='string'||data.brandBrief.length>6000)
        return json(res,400,{error:'Invalid business brief.'});
      if(data.task) {
        const t=data.task;
        if(typeof t!=='object'||typeof t.title!=='string'||!t.title.trim()
          ||t.title.length>160||typeof t.goal!=='string'||t.goal.length>1200
          ||typeof t.platform!=='string'||t.platform.length>80)
          return json(res,400,{error:'Invalid task details.'});
      } else if(!Array.isArray(data.messages)||data.messages.length<1||data.messages.length>50
        ||!data.messages.some(x=>x.role==='user'&&typeof x.content==='string'&&x.content.trim()))
        return json(res,400,{error:'Invalid messages.'});
      return json(res,200,await ai({
        messages:data.messages,brandBrief:data.brandBrief,task:data.task,search:data.search===true
      }));
    } catch(error) {
      const status=Number(error.status)||502;
      const message=status===502?'AI service is unavailable. Check server logs and model credentials.':error.message;
      if(status>=500)console.error('[AgentBotStudio]',error.message);
      return json(res,status,{error:message});
    }
  });
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]) {
  const server=createServer();
  const port=Number(process.env.PORT||8787);
  server.listen(port,process.env.HOST||'0.0.0.0',()=>console.log('Agent Bot Studio listening on port '+port));
}
