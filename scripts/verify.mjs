import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const data=JSON.parse(await readFile(new URL('../data.json',import.meta.url),'utf8'));
const errors=[];let cards=[];
class Element {
 constructor(){this.textContent='';this.value='';this.hidden=false;this.listeners={};this.attrs={};this.classes=new Set();this.classList={toggle:c=>{if(this.classes.has(c)){this.classes.delete(c);return false;}this.classes.add(c);return true;}};}
 set innerHTML(value){this.html=value;if(this===elements.cards)cards=[...value.matchAll(/<article class="probe-card"[\s\S]*?<\/article>/g)].map(m=>{const e=new Element();e.html=m[0];e.dataset={question:m[0].match(/data-question="([^"]*)"/)[1]};e.action=new Element();return e;});}
 get innerHTML(){return this.html||'';}
 addEventListener(type,fn){this.listeners[type]=fn;}
 setAttribute(key,value){this.attrs[key]=value;}
 querySelector(selector){assert.equal(selector,'.action');return this.action;}
}
const elements=Object.fromEntries([...html.matchAll(/id="([a-z-]+)"/g)].map(m=>[m[1],new Element()]));
const document={getElementById:id=>elements[id],querySelectorAll:s=>{assert.equal(s,'.probe-card');return cards;}};
const requests=[];
const context=vm.createContext({document,window:{},console:{error:(...args)=>errors.push(args)},fetch:async url=>{requests.push(url);return{ok:true,json:async()=>data};}});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
await context.window.driftwatchReady;
assert.deepEqual(errors,[]);assert.deepEqual(requests,['./data.json']);assert.equal(cards.length,data.probes.length);assert.equal(cards.length,8);
let rounds=0;
for(const [i,card] of cards.entries()){
 const p=data.probes[i];assert.ok(card.html.includes(p.question));
 const expected=p.rounds.slice(1).filter((r,j)=>r.answer!==p.rounds[j].answer).length;
 assert.equal([...card.html.matchAll(/class="round round-changed"/g)].length,expected);
 const score=Number(card.html.match(/class="stability-score">(\d+)%/)[1]);assert.equal(score,Math.round((1-expected/(p.rounds.length-1))*100));
 rounds += [...card.html.matchAll(/class="round /g)].length;
 for(const r of p.rounds){assert.ok(card.html.includes(r.timestamp));assert.ok(card.html.includes(r.answer.replaceAll('&','&amp;')));}
 card.listeners.click({target:{closest:()=>null}});assert.ok(card.classes.has('expanded'));assert.equal(card.attrs['aria-expanded'],'true');
 card.listeners.keydown({key:'Enter',preventDefault(){}});assert.ok(!card.classes.has('expanded'));
}
assert.equal(rounds,40);
elements.search.value='CAPITAL';elements.search.listeners.input();assert.equal(cards.filter(c=>!c.hidden).length,1);assert.ok(cards[1].hidden===false);
elements.search.value='no matching question';elements.search.listeners.input();assert.equal(cards.filter(c=>!c.hidden).length,0);assert.equal(elements.empty.hidden,false);
elements.search.value='';elements.search.listeners.input();assert.equal(cards.filter(c=>!c.hidden).length,8);
assert.ok(vm.runInContext("diffText('one two', 'one three')",context).includes('<del>two</del>'));
assert.ok(vm.runInContext("diffText('one two', 'one three')",context).includes('<ins>three</ins>'));
assert.equal(vm.runInContext("escapeHTML('<script>')",context),'&lt;script&gt;');
for(const [,ref] of html.matchAll(/(?:src|href)="([^"]+)"/g)){if(!ref.startsWith('data:'))await readFile(new URL('../'+ref,import.meta.url));}
assert.ok(html.replace(/<script>[\s\S]*?<\/script>|<style>[\s\S]*?<\/style>|<[^>]+>/g,'').trim().length>10);
console.log(`PASS: ${cards.length} cards, ${rounds} rounds, scores and change classes match data; search, empty state, click/keyboard expansion, escaped text, diffs, and local references verified.`);
console.log(`Initial summary: ${elements.overall.textContent} stability; ${elements.changes.textContent} changes.`);

const failedContext=vm.createContext({document,window:{},console:{error:(...args)=>errors.push(args)},fetch:async()=>{throw Error('deliberate test failure');}});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],failedContext);
await failedContext.window.driftwatchReady;
assert.ok(elements.cards.innerHTML.includes('Unable to load this snapshot'));
assert.equal(errors.length,1);
console.log('PASS: failed dataset load produces visible error and console error.');
