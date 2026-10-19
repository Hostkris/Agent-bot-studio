import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../src/server.js';
import { extractAnswer, generate } from '../src/xai.js';

const SECRET='1234567890abcdefghijklmnopqrstuv';

async function withServer(secret,ai,fn) {
  const server=createServer({secret,ai});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  try{await fn(base);}finally{await new Promise(resolve=>server.close(resolve));}
}
test('health check returns safe status',async()=>{
  await withServer(SECRET,async()=>({answer:'ok'}),async base=>{
    const r=await fetch(base+'/health'); const b=await r.json();
    assert.equal(r.status,200);assert.equal(b.ok,true);assert.equal(b.app,'Agent Bot Studio');
    assert.equal(Object.hasOwn(b,'accessToken'),false);
  });
});
test('unauthorized requests are rejected',async()=>{
  await withServer(SECRET,async()=>({answer:'ok'}),async base=>{
    const r=await fetch(base+'/api/respond',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({brandBrief:'',messages:[{role:'user',content:'Hi'}]})});
    assert.equal(r.status,401);
  });
});
test('task draft uses mocked model and requires no live credentials',async()=>{
  await withServer(SECRET,async p=>({answer:'DRAFT: '+p.task.title}),async base=>{
    const r=await fetch(base+'/api/respond',{method:'POST',
      headers:{'Content-Type':'application/json',Authorization:'Bearer '+SECRET},
      body:JSON.stringify({brandBrief:'Coffee shop',task:{title:'Launch',goal:'Draft posts',platform:'Instagram'}})});
    const b=await r.json();
    assert.equal(r.status,200);assert.equal(b.answer,'DRAFT: Launch');
  });
});
test('invalid task body fails validation',async()=>{
  await withServer(SECRET,async()=>({answer:'ok'}),async base=>{
    const r=await fetch(base+'/api/respond',{method:'POST',
      headers:{'Content-Type':'application/json',Authorization:'Bearer '+SECRET},
      body:JSON.stringify({brandBrief:'',task:{title:'',platform:'X',goal:'Hi'}})});
    assert.equal(r.status,400);
  });
});
test('xAI output parser returns joined output text',()=>{
  assert.equal(extractAnswer({output:[{type:'message',content:[{type:'output_text',text:'Draft ready'}]}]}),'Draft ready');
});
test('xAI client uses correct request path',async()=>{
  let requested='';
  const fetcher=async(url,opts)=>{
    requested=url;
    const body=JSON.parse(opts.body);
    assert.equal(body.model,'grok-4.7');
    return {ok:true,json:async()=>({model:'grok-4.7',output:[{type:'message',content:[{type:'output_text',text:'Hello'}]}]})};
  };
  const r=await generate({brandBrief:'Test',messages:[{role:'user',content:'Hi'}]},
    {fetcher,apiKey:'test-key',model:'grok-4.7'});
  assert.equal(requested,'https://api.x.ai/v1/responses');
  assert.equal(r.answer,'Hello');
});
