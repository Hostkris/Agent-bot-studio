import { systemPrompt, cleanHistory, draftInstruction } from './prompt.js';

export function extractAnswer(response) {
  const fragments = [];
  for (const item of response?.output ?? []) {
    if (item?.type === 'message' && Array.isArray(item.content)) {
      for (const part of item.content) {
        if (part?.type === 'output_text' && typeof part.text === 'string') fragments.push(part.text);
      }
    }
  }
  return fragments.join('\n\n').trim();
}

export async function generate({messages,brandBrief,task,search=false}, {
  fetcher=fetch, apiKey=process.env.XAI_API_KEY,
  model=process.env.XAI_MODEL || 'grok-4.7',
  apiBase='https://api.x.ai/v1'
} = {}) {
  if (!apiKey || apiKey.startsWith('replace-'))
    throw Object.assign(new Error('Add XAI_API_KEY to the server .env file.'), {status:503});
  const input = [
    {role:'system',content:systemPrompt(brandBrief)},
    ...(task ? [{role:'user',content:draftInstruction(task)}] : cleanHistory(messages))
  ];
  if (input.length < 2) throw Object.assign(new Error('Provide a message or task.'),{status:400});
  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(),90000);
  try {
    const response = await fetcher(apiBase+'/responses', {
      method:'POST',signal:ac.signal,
      headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},
      body:JSON.stringify({model,input,...(search ? {tools:[{type:'web_search'}]} : {})})
    });
    if (!response.ok) {
      const body=await response.text();
      throw Object.assign(new Error('AI provider returned '+response.status+': '+body.slice(0,300)),{status:502});
    }
    const data=await response.json();
    const answer=extractAnswer(data);
    if(!answer)throw Object.assign(new Error('AI provider returned no text.'),{status:502});
    return {answer,model:data.model||model,usage:data.usage||null,researched:!!search};
  } catch(error) {
    if(error.name==='AbortError')throw Object.assign(new Error('AI request timed out.'),{status:504});
    throw error;
  } finally {clearTimeout(timeout);}
}
