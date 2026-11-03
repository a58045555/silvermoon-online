// end-to-end sweep of the high-level content: portals, teleports, selling, bounties, story part 2
import { World } from '../server/world.js';
import { newCharacter, QUESTS, MAPDEF, TELE, makeBounty, sellP, makeItem, makeLegend, MT, dist } from '../shared/data.js';
const store={ saveChar:async()=>{}, listClans:async()=>[], saveClan:async()=>{}, deleteClan:async()=>{}, ranking:async()=>[] };
const W=new World(store); await W.init(); clearInterval(W.timer);
const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m); if(!c) process.exitCode=1;};
let seq=1; async function mk(name,cls,lv){ const c=newCharacter(cls,'m',name); c.id=seq++; c.lv=lv; return W.join({ws:{readyState:1,send(){}},accountId:c.id},c); }
const P=await mk('巡檢','knight',45);
// 1. walk through every portal of the wild chain and check you land beside the way back
for(const [a,b] of [['cave','snow'],['snow','tower'],['tower','snow'],['snow','cave']]){
  const A=W.maps[a].m, pt=A.portals.find(p=>p.to===b); W.enterMap(P,a,{x:pt.x,y:pt.y+1});
  const B=W.maps[b].m; W.enterMap(P,b,null,a); const back=B.portals.find(p=>p.to===a);
  ok(P.inst.id===b&&!B.blk[P.y*B.W+P.x]&&dist(P,back)<=2.5,`${a} -> ${b} lands next to the way back (${P.x},${P.y})`); }
// 2. teleporter: entrances put you at the map's entry, bosses near the boss
for(const T of TELE){ W.enterMap(P,'village',{x:15,y:14}); P.c.gold=1e6; W.handle(P,{t:'tele',to:T.k}); const M=W.maps[T.map].m;
  const tgt=T.boss?M.boss:M.entry; ok(P.inst.id===T.map&&!M.blk[P.y*M.W+P.x]&&dist(P,tgt)<=(T.boss?8:3),`teleport ${T.k} lands at ${T.boss?'the boss':'the entrance'} (${P.x},${P.y})`); }
// 3. tier-6 gear sells for a real price
for(const it of [makeItem('w',5),makeItem('a',5),makeItem('n',5),makeLegend('w')]) ok(Number.isFinite(sellP(it))&&sellP(it)>0,`sell price of tier ${it.t} ${it.s} is ${sellP(it)}`);
W.enterMap(P,'village',{x:15,y:14}); P.c.bag=[makeItem('a',5)]; P.c.bag[0].q=0; const g0=P.c.gold; W.handle(P,{t:'sellall',q:0}); ok(Number.isFinite(P.c.gold)&&P.c.gold>g0,'selling moon gear keeps gold a number');
// 4. bounties at every level point at real monsters on a real map
let bad=0; for(let lv=1;lv<=50;lv++) for(let i=0;i<30;i++){ const b=makeBounty(lv); if(!MAPDEF[b.map]||!MT[b.k]||!(MAPDEF[b.map].mobs.includes(b.k)||MAPDEF[b.map].boss===b.k)) bad++; } ok(bad===0,'bounties are valid at every level');
// 5. play story part 2 start to finish
P.c.mq=11; P.c.mqp=0; let guard=0;
while(P.c.mq<QUESTS.length&&guard++<40){ const q=QUESTS[P.c.mq];
  if(q.type==='talk'){ W.enterMap(P,'village',{x:15,y:14}); W.handle(P,{t:'qtalk'}); continue; }
  if(q.type==='kill'){ const k=q.k[0], map=Object.keys(MAPDEF).find(id=>MAPDEF[id].mobs&&(MAPDEF[id].mobs.includes(k)||MAPDEF[id].boss===k)); W.enterMap(P,map,null,MAPDEF[map].prev); const I=W.maps[map];
    for(let i=0;i<q.need;i++){ const m=W.spawnMob(I,k,P.x+1,P.y); m.dmg.set(P.id,1); W.killMob(I,m); } continue; }
  break; }
ok(P.c.mq===QUESTS.length,`story part 2 can be finished (${P.c.mq}/${QUESTS.length})`);
W.tick(); ok(P.c.ach.mq2,'part 2 achievement unlocked');
// 6. every new ranged monster shoots something
for(const k of ['barbarian','icewraith','specter','ashpriest']) ok(MT[k].ranged>0,`${k} is ranged`);
console.log('done'); process.exit();
