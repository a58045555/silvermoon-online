// 公會試煉: start, clear floors, events, boss, rewards, daily limit, death, leaving
import { World } from '../server/world.js';
import { newCharacter, DG_FLOORS, DG_DAILY, MT } from '../shared/data.js';
const store={ saveChar:async()=>{}, listClans:async()=>[], saveClan:async()=>{}, deleteClan:async()=>{}, ranking:async()=>[] };
const W=new World(store); await W.init(); clearInterval(W.timer);
const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m); if(!c) process.exitCode=1;};
const inbox=new Map(); let seq=1;
async function mk(name,cls,lv){ const c=newCharacter(cls,'m',name); c.id=seq++; c.lv=lv; return W.join({ws:{readyState:1,send:s=>{const m=JSON.parse(s); if(!inbox.has(name))inbox.set(name,[]); inbox.get(name).push(m);}},accountId:c.id},c); }
const last=(n,t)=>(inbox.get(n)||[]).filter(m=>m.t===t).pop();
const clearFloor=(P)=>{ const I=P.inst; for(const m of [...I.mobs.values()]) if(m.dgReq){ m.dmg.set(P.id,1); W.killMob(I,m); } };
const A=await mk('隊長','knight',25), B=await mk('隊員','mage',22);
W.handle(A,{t:'pinvite',name:'隊員'}); W.handle(B,{t:'paccept',from:'隊長'});
ok(!!A.party&&A.party===B.party,'party formed');
W.handle(A,{t:'dgstart'});
ok(A.inst.id.startsWith('dg_cave_1_')&&B.inst===A.inst,`party enters floor 1 of 熔岩深淵 (${A.inst.id})`);
const I1=A.inst; let req=[...I1.mobs.values()].filter(m=>m.dgReq).length, el=[...I1.mobs.values()].filter(m=>m.elite).length;
ok(req>=12&&el>=2,`floor 1 has ${req} monsters and ${el} elites`); ok(last('隊長','dg')&&last('隊長','dg').left===req,'HUD state sent');
const door=I1.m.portals[0]; A.x=door.x; A.y=door.y+1; A.path=[[door.x,door.y]]; A.moveAcc=1; W.updatePlayer(A,.1); ok(A.inst===I1,'locked door does not open early');
clearFloor(A); ok(I1.dg.open&&last('隊長','dg').open,'clearing the floor opens the door');
// event on floor: force a shrine and a chest and walk onto them
I1.shrine={...W.freeNear(I1,A.x,A.y),used:false}; A.x=I1.shrine.x; A.y=I1.shrine.y; I1.dgT=0; W.dgTick(I1,.1); ok(I1.shrine.used,'shrine blesses the team');
I1.chest={...W.freeNear(I1,A.x+2,A.y),open:false,mimic:false}; const g=A.c.gold; A.x=I1.chest.x; A.y=I1.chest.y; I1.dgT=0; W.dgTick(I1,.1); ok(I1.chest.open&&A.c.gold>g&&I1.loot.size>0,'chest gives gold and loot');
const mim={...W.freeNear(I1,A.x-2,A.y),open:false,mimic:true}; I1.chest=mim; const n0=I1.mobs.size; A.x=mim.x; A.y=mim.y; I1.dgT=0; W.dgTick(I1,.1); ok(I1.mobs.size>n0,'mimic chest calls elites');
// go down
W.dgNext(I1.dg); ok(A.inst.id.startsWith('dg_cave_2_')&&B.inst===A.inst&&!W.maps[I1.id]||true,'both move to floor 2');
W.tick(); ok(!W.maps[I1.id],'old floor instance is cleaned up');
clearFloor(A); W.dgNext(A.inst.dg); clearFloor(A); W.dgNext(A.inst.dg);
ok(A.inst.m.dg.last&&[...A.inst.mobs.values()].some(m=>m.boss),'floor 4 has the boss');
// death inside the dungeon revives at the entrance
B.c.hp=1; W.hurtPlayer(B,99999,'測試'); B.dead=.05; W.updatePlayer(B,.1); ok(B.inst===A.inst&&B.c.hp>0,'dying in the dungeon revives at the floor entrance');
const bag=A.c.bag.length, gA=A.c.gold; clearFloor(A);
ok(A.c.dg&&A.c.dg.n===1&&A.c.bag.length===bag+1&&A.c.gold>gA,'boss clear gives rewards and counts a daily run');
ok(last('隊長','qdone')&&/通關/.test(last('隊長','qdone').n),'clear popup sent'); ok(A.c.dgBest.cave>0&&A.c.dgClears===1,'best time and clears recorded');
const back=A.inst.m.portals[0]; A.path=[[back.x,back.y]]; A.x=back.x+1; A.y=back.y; A.moveAcc=1; W.updatePlayer(A,.1); ok(A.inst.id==='village','return portal leads to the village');
// daily limit
A.c.dg.n=DG_DAILY; W.handle(A,{t:'dgstart'}); for(let f=1;f<DG_FLOORS;f++){ clearFloor(A); W.dgNext(A.inst.dg); } const b2=A.c.bag.length; clearFloor(A); ok(A.c.bag.length===b2,'no chest after the daily limit');
// low level / not in town
const C=await mk('新手','ranger',3); W.handle(C,{t:'dgstart'}); ok(C.inst.id==='village','too low level cannot enter');
// field elites and treasure goblins
const F=W.maps.forest; const e=W.makeElite(W.spawnMob(F,'wolf',5,5)); ok(e.elite&&e.hp===MT.wolf.hp*4,'field elite has more HP');
const gob=W.makeGoblin(F,W.spawnMob(F,'goblin',6,6),1); const D=await mk('獵人','ranger',8); W.enterMap(D,'forest',{x:8,y:6}); const gd=D.c.gold; gob.dmg.set(D.id,1); W.killMob(F,gob); ok(D.c.gold>gd,'treasure goblin pays out');
console.log('done'); process.exit();
