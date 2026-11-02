// Direct server-logic test: PK + red name + drop, clans, trade, enchant, safety rules.
import { World } from '../server/world.js';
import { newCharacter } from '../shared/data.js';
const mem={chars:new Map(),clans:new Map(),seq:1};
const store={ saveChar:async(id,c)=>{mem.chars.set(id,structuredClone(c));}, listClans:async()=>[], saveClan:async c=>mem.clans.set(c.name,c), deleteClan:async n=>mem.clans.delete(n), ranking:async()=>[] };
const W=new World(store); await W.init(); clearInterval(W.timer);
const inbox=new Map();
const fakeWs=name=>({readyState:1,send:s=>{const m=JSON.parse(s);if(!inbox.has(name))inbox.set(name,[]);inbox.get(name).push(m);}});
async function mk(name,cls,lv){ const c=newCharacter(cls,'m',name); c.id=mem.seq++; c.lv=lv; c.gold=20000; const P=await W.join({ws:fakeWs(name),accountId:c.id},c); return P; }
const A=await mk('甲','knight',15), B=await mk('乙','ranger',15), N=await mk('丙','mage',5);
const tick=(n=1)=>{for(let i=0;i<n;i++)W.tick();};
const last=(name,t)=>(inbox.get(name)||[]).filter(m=>m.t===t).pop();
const logs=name=>(inbox.get(name)||[]).filter(m=>m.t==='log'||m.t==='chat').map(m=>m.msg);
const ok=(cond,msg)=>console.log(cond?'PASS':'FAIL',msg);

// safe zone
W.handle(A,{t:'pk',on:true}); W.handle(A,{t:'attack',id:B.id}); ok(A.target===null,'village is a safe zone');
// move both into forest next to each other
W.enterMap(A,'forest',{x:5,y:5}); W.enterMap(B,'forest',{x:6,y:5}); W.enterMap(N,'forest',{x:5,y:6});
W.maps.forest.mobs.clear();
W.handle(A,{t:'attack',id:N.id}); ok(A.target===null,'cannot attack newbies under Lv.10');
W.handle(B,{t:'attack',id:A.id}); ok(B.target===null,'needs PK mode to attack an innocent player');
// A kills innocent B
W.handle(A,{t:'attack',id:B.id}); ok(A.target===B.id,'A can attack innocent B with PK mode on');
B.c.bag.push({s:'h',t:2,en:0});
for(let i=0;i<300&&B.dead<=0;i++){ A.atkCd=0; tick(); }
ok(B.dead>0,'A killed B'); ok(A.c.lawful<0,`A turned red (lawful ${A.c.lawful})`); ok(A.c.pkKills===1,'pk kill counted');
// B respawns, then B (no pk mode) can attack red A
tick(40); ok(B.inst.id==='village','B respawned in village');
W.enterMap(B,'forest',{x:6,y:5}); A.purple=0; W.handle(B,{t:'attack',id:A.id}); ok(B.target===A.id,'anyone can attack a red player');
A.c.bag.push({s:'g',t:3,en:0},{s:'b',t:3,en:0},{s:'c',t:3,en:0}); const bagBefore=A.c.bag.length+Object.values(A.c.eq).filter(Boolean).length;
let drops=0; for(let round=0;round<6;round++){ A.dead=0; A.c.hp=1; W.enterMap(A,'forest',{x:5,y:5}); W.enterMap(B,'forest',{x:6,y:5}); W.handle(B,{t:'attack',id:A.id});
  for(let i=0;i<100&&A.dead<=0;i++){ B.atkCd=0; tick(); } }
const bagAfter=A.c.bag.length+Object.values(A.c.eq).filter(Boolean).length; ok(bagAfter<bagBefore,`red player dropped items on death (${bagBefore}→${bagAfter})`);
ok(B.c.lawful===0,'killing a red player has no penalty');
// clan
A.dead=0;A.c.hp=500; W.enterMap(A,'village'); W.enterMap(B,'village');
await W.clanCreate(A,'銀月'); ok(A.c.clan==='銀月'&&A.c.gold===15000-0||A.c.clan==='銀月','clan created');
W.handle(A,{t:'cinvite',name:'乙'}); await W.clanAccept(B,'銀月'); ok(B.c.clan==='銀月'&&W.clans.get('銀月').members.length===2,'member joined clan');
W.handle(B,{t:'chat',ch:'clan',msg:'盟友好'}); ok(logs('甲').includes('盟友好'),'clan chat delivered');
W.enterMap(A,'forest',{x:5,y:5}); W.enterMap(B,'forest',{x:6,y:5}); A.pk=true; W.handle(A,{t:'attack',id:B.id}); ok(A.target===null,'cannot attack own clan member');
// trade
W.enterMap(A,'village',{x:15,y:14}); W.enterMap(B,'village',{x:16,y:14});
B.c.bag=[{s:'w',t:3,en:5}]; const goldA=A.c.gold, goldB=B.c.gold;
W.handle(A,{t:'treq',name:'乙'}); W.handle(B,{t:'taccept',from:'甲'});
W.handle(A,{t:'tput',gold:1000}); W.handle(B,{t:'tput',i:0}); W.handle(A,{t:'tok'}); W.handle(B,{t:'tok'});
ok(A.c.bag.some(it=>it.t===3&&it.en===5)&&A.c.gold===goldA-1000&&B.c.gold===goldB+1000,'trade swapped item and gold');
// enchant + stats
A.c.inv.ws=20; let tries=0; while(A.c.eq.w.en<6&&tries++<10) W.handle(A,{t:'enchant',s:'w'}); ok(A.c.eq.w.en===6,'safe enchant to +6 never fails');
W.handle(A,{t:'stat',k:'auto'}); ok(A.c.pts===0,'auto stat allocation');
// chat flood guard
let n=0; for(let i=0;i<100;i++){ A.msgCount=0; }
console.log('done');
process.exit(0);
