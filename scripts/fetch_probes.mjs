import { writeFile, rename } from 'node:fs/promises';
export const probes = [
  {id:'arithmetic',category:'Arithmetic',question:'What is 17 × 23? Reply with only the number.'},
  {id:'capital',category:'Fact recall',question:'What is the capital of Japan? Reply with only the city name.'},
  {id:'sort',category:'Structured output',question:'Sort these numbers ascending: 9, 2, 14, 5. Reply with a comma-separated list only.'},
  {id:'definition',category:'Explanation',question:'Explain what an API is in one sentence.'},
  {id:'book',category:'Recommendation',question:'Recommend one novel for someone who enjoys thoughtful science fiction. Give the title and one sentence explaining why.'},
  {id:'weekend',category:'Recommendation',question:'Suggest one low-cost creative activity for a rainy Sunday. Answer in one sentence.'},
  {id:'name',category:'Creative writing',question:'Invent a short name for a neighborhood coffee shop. Reply with only the name.'},
  {id:'priority',category:'Reasoning',question:'A small team has one day to improve a slow website. What should they do first? Answer in one sentence.'}
];
if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error('XAI_API_KEY is required at collection time. Existing data.json has not been changed.');
  const model = process.env.XAI_MODEL || 'grok-4.7';
  const data = {source:'xai-api',model,generatedAt:null,parameters:{temperature:0.7,max_tokens:240},probes:probes.map(p=>({...p,rounds:[]}))};
  for (let round=1;round<=5;round++) {
    for (const probe of data.probes) {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
        body:JSON.stringify({model,messages:[{role:'user',content:probe.question}],...data.parameters}),signal:AbortSignal.timeout(120000)
      });
      if (!response.ok) throw new Error(`xAI returned HTTP ${response.status} for ${probe.id}, round ${round}. Existing dataset preserved.`);
      const result = await response.json();
      const answer = result.choices?.[0]?.message?.content;
      if (typeof answer !== 'string' || !answer.trim() || result.choices[0].finish_reason !== 'stop') throw new Error(`Missing or incomplete answer: ${probe.id}, round ${round}`);
      probe.rounds.push({round,timestamp:new Date().toISOString(),answer});
      console.log(`Collected ${probe.id}: round ${round}/5`);
    }
  }
  data.generatedAt = new Date().toISOString();
  const target=new URL('../data.json',import.meta.url);
  const temporary=new URL('../data.json.tmp',import.meta.url);
  await writeFile(temporary,JSON.stringify(data,null,2)+'\n');
  await rename(temporary,target);
  console.log('Saved 40 real answers to data.json.');
}
