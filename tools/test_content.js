// Tests for skills, boss mechanics, ground loot and quests.
import { World } from '../server/world.js';
import { newCharacter, QUESTS, SKILLS, MT } from '../shared/data.js';
const store={ saveChar:async()=>{}, listClans:async()=>[], saveClan:async()=>{}, deleteClan:async()=>{}, ranking:async()=>[] };
const W=new World(store); await W.init(); clearInterval(W.timer);
const inbox=new Map();
const fakeWs=name=>({readyState:1,send:s=>{const m=JSON.parse(s);if(!inbox.has(name))inbox.set(name,[]);inbox.get(name).push(m);}});
let seq=1; async function mk(name,cls,lv){ const c=newCharacter(cls,'m',name); c.id=seq++; c.lv=lv; return W.join({ws:fakeWs(name),accountId:c.id},c); }
const tick=(n=1)=>{for(let i=0;i<n;i++)W.tick();};
const msgs=(name,t)=>(inbox.get(name)||[]).filter(m=>m.t===t);
const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m); if(!c) process.exitCode=1;};
const F=W.maps.forest;
const clearF=()=>{F.mobs.clear();F.loot.clear();F.tg=[];};

const K=await mk('騎士','knight',12), R=await mk('遊俠','ranger',12), M=await mk('法師','mage',12), D=await mk('妖精','darkelf',12), L=await mk('新人','knight',1);
ok(msgs('新人','quest').length===1,'new player gets the prologue story');
// talk quest
W.handle(L,{t:'qtalk'}); ok(L.c.mq===1,'prologue completes by talking in village');
// kill quest progress
W.enterMap(L,'forest',{x:10,y:10}); clearF();
for(let i=0;i<10;i++){ const m=W.spawnMob(F,'slime',11,10); m.dmg.set(L.id,1); W.killMob(F,m); }
ok(L.c.mq===2,`chapter-1 kill quest done (mq=${L.c.mq})`); ok(msgs('新人','qdone').length>=2,'quest completion messages sent');
// level gate
L.c.mp=100; W.handle(L,{t:'skill',i:1}); ok(!L.cds.k2,'Lv.1 cannot use Lv.5 skill');
// daily
ok(K.c.daily&&K.c.daily.list.length===3,'daily quests rolled');

// knight whirlwind hits all adjacent
W.enterMap(K,'forest',{x:20,y:20}); clearF(); const ring=[[1,0],[-1,0],[0,1],[1,1]].map(([dx,dy])=>[K.x+dx,K.y+dy]).map(([x,y])=>{const m=W.spawnMob(F,'wolf',x,y);return m;});
K.c.mp=200; W.handle(K,{t:'skill',i:1}); ok(ring.every(m=>m.hp<m.maxhp),'旋風斬 hits every adjacent mob');
W.handle(K,{t:'skill',i:2}); ok(K.buff.iron>0,'鐵壁 buff on'); const hp0=K.c.hp; W.hurtPlayer(K,100,'測試'); ok(hp0-K.c.hp===50,'鐵壁 halves damage');
// mage nova stuns
W.enterMap(M,'forest',{x:30,y:30}); clearF(); const a=W.spawnMob(F,'wolf',31,31), b=W.spawnMob(F,'wolf',29,30);
M.c.mp=200; W.handle(M,{t:'skill',i:1}); ok(a.stun>1.5&&b.stun>1.5,'冰霜新星 freezes nearby mobs');
M.c.hp=10; W.handle(M,{t:'skill',i:2}); ok(M.c.hp>10,'治癒術 heals');
// dark elf poison
W.enterMap(D,'forest',{x:40,y:40}); clearF(); const pm=W.spawnMob(F,'wolf',41,40); pm.hp=pm.maxhp=5000; D.target=pm.id; D.c.mp=200;
W.handle(D,{t:'skill',i:1}); const after=pm.hp; ok(!!pm.poison,'毒刃 applies poison'); D.target=null; tick(25); ok(pm.hp<after,`poison ticks (${after}→${pm.hp})`);
W.handle(D,{t:'skill',i:2}); ok(D.buff.shadow>0&&D.buff.nc,'影遁 on'); const r=W.rollDmg(D,1,0,{nocrit:true}); ok(r.crit&&!D.buff.nc,'影遁 next hit crits');
// ranger haste speeds attacks
W.enterMap(R,'forest',{x:12,y:30}); clearF(); R.c.mp=200; W.handle(R,{t:'skill',i:2}); ok(R.buff.haste>0,'疾風步 on');

// ground loot: ownership window
W.enterMap(K,'forest',{x:20,y:20}); W.enterMap(R,'forest',{x:24,y:20}); clearF();
const lo=W.dropLoot(F,20,20,{k:'ws'},new Set([K.id]),K);
const Rx={x:R.x,y:R.y}; R.x=lo.x;R.y=lo.y; W.pickAt(R); ok(F.loot.has(lo.id),'other players cannot pick during owner window'); R.x=Rx.x;R.y=Rx.y;
const ws0=K.c.inv.ws; K.x=lo.x;K.y=lo.y; W.pickAt(K); ok(!F.loot.has(lo.id)&&K.c.inv.ws===ws0+1,'owner picks up by stepping on it');
const lo2=W.dropLoot(F,20,20,{k:'pot'},new Set([K.id]),K); lo2.ownT=0; W.updateLoot(F); R.x=lo2.x;R.y=lo2.y; W.pickAt(R); ok(!F.loot.has(lo2.id),'after 20s anyone can pick it up');
const lo3=W.dropLoot(F,20,20,{k:'pot'},null,K); lo3.exp=0; W.updateLoot(F); ok(!F.loot.has(lo3.id),'loot despawns after 60s');
// mob kill drops to ground, not bag
clearF(); let n=0; for(let i=0;i<60;i++){ const m=W.spawnMob(F,'wolf',22,22); m.dmg.set(K.id,1); W.killMob(F,m); } ok(F.loot.size>0,`kills drop loot on the ground (${F.loot.size} items)`);

// boss mechanics
for(const [map,k] of [['forest','treant'],['waste','colossus'],['cave','firelord']]){
  const I=W.maps[map]; I.mobs.clear(); I.tg=[]; W.enterMap(K,map,{x:I.m.boss.x+2,y:I.m.boss.y}); K.c.hp=K.stats.maxHP=99999;
  const B=W.spawnMob(I,k,I.m.boss.x,I.m.boss.y); B.tgt=K.id; B.mechT=0;
  let tg=0; for(let i=0;i<30;i++){ W.updateMobs(I,.1); tg=Math.max(tg,I.tg.length); W.updateTele(I,.1); }
  ok(tg>0,`${MT[k].n} casts telegraphed attacks (${tg} circles)`);
  if(k==='treant'){ B.hp=B.maxhp*.6; W.updateMobs(I,.1); ok([...I.mobs.values()].some(m=>m.summon),'樹妖 summons adds below 66%'); }
  if(k==='firelord'){ B.hp=B.maxhp*.2; W.updateMobs(I,.1); ok(B.enr,'卡爾薩 enrages below 30%'); }
  // legendary chance exists on boss
  let leg=0; for(let i=0;i<200;i++){ I.loot.clear(); const b=W.spawnMob(I,k,I.m.boss.x,I.m.boss.y); b.dmg.set(K.id,1); W.killMob(I,b); for(const L of I.loot.values()) if(L.q===3) leg++; }
  ok(leg>0,`${MT[k].n} can drop legendary (${leg}/200)`);
}
ok(SKILLS.knight.length===3&&QUESTS.length>=10,'data tables present');
console.log('done'); process.exit();
