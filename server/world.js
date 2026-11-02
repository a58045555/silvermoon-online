// Authoritative game world: one shared instance per map, ticking at 10 Hz.
import { SKILLS, QUESTS, dailyFor, makeLegend, LEGEND_W, RARN, itemBaseName } from '../shared/data.js';
import { CLS, MT, MAPDEF, SHOP, INV_N, BAGMAX, PK_MIN_LV, CLAN_COST, CLAN_MIN_LV, DIRS, NOSHIELD, SHOP_GEAR,
  buildMap, arrivalPoint, inSafeZone, findPath, calcStats, expNeed, enchRate, sellP, shopPrice, makeItem, randomSlot,
  itemName, eqSlotFor, cheb, dist, NAME_RE } from '../shared/data.js';

const TICK = 100; // ms
const rnd = (a,b)=>a+Math.random()*(b-a), ri = (a,b)=>Math.floor(rnd(a,b+1)), pick = a=>a[Math.floor(Math.random()*a.length)];
const MOB_COUNT = 26, BOSS_RESPAWN = 600, AUTOSAVE = 30, LOOT_OWN = 20, LOOT_LIFE = 60;
const today = ()=>new Date(Date.now()+8*3600e3).toISOString().slice(0,10); // Taipei day

export class World {
  constructor(store){
    this.store = store; this.maps = {}; this.players = new Map(); this.byName = new Map();
    this.nextId = 1; this.parties = new Map(); this.clans = new Map(); this.trades = new Map(); this.rankCache = null; this.rankT = 0; this.eclipse = {on:false,end:0,warned:false,forced:false}; this.evT = 0;
    for(const id of Object.keys(MAPDEF)) this.maps[id] = this.makeInstance(id);
  }
  async init(){ for(const c of await this.store.listClans()) this.clans.set(c.name,c); this.timer = setInterval(()=>this.tick(), TICK);
    if(+process.env.ECLIPSE_MIN>0) this.setEclipse(true,Date.now()+process.env.ECLIPSE_MIN*60e3,true); }
  makeInstance(id){ const m = buildMap(id); return { id, m, def:MAPDEF[id], players:new Set(), mobs:new Map(), spawnT:0, bossT:0, ev:[], tg:[], loot:new Map(), lootDirty:true }; }

  // ---------- sessions ----------
  async join(session, charRow){
    if(this.byName.has(charRow.name.toLowerCase())) { const old = this.byName.get(charRow.name.toLowerCase()); this.send(old,{t:'kick',msg:'這個角色從別的裝置登入了。'}); await this.leave(old); try{old.ws.close();}catch{} }
    const c = charRow; delete c.accountId;
    c.inv = Object.assign({pot:0,big:0,blue:0,ret:0,ws:0,as:0}, c.inv||{});
    if(c.clan && !this.clans.has(c.clan)) c.clan = null;
    const P = { id:'p'+(this.nextId++), ws:session.ws, accountId:session.accountId, charId:c.id, c, name:c.name,
      x:c.x, y:c.y, path:[], moveAcc:0, target:null, atkCd:0, skCd:0, cds:{}, buff:{iron:0,haste:0,shadow:0,nc:false}, lastHit:-99, dead:0, face:2, dir:1,
      party:null, pk:false, purple:0, chatT:0, saveT:AUTOSAVE, inst:null, dirty:true, msgCount:0 };
    delete c.id;
    if(c.mq==null) c.mq=0; if(c.mqp==null) c.mqp=0; this.checkDaily(P);
    P.stats = calcStats(c);
    if(!c.hp || c.hp>P.stats.maxHP) c.hp = P.stats.maxHP; if(c.mp==null || c.mp>P.stats.maxMP) c.mp = P.stats.maxMP;
    this.players.set(P.id,P); this.byName.set(P.name.toLowerCase(),P); session.player = P;
    let mapId = MAPDEF[c.map] ? c.map : 'village';
    this.enterMap(P, mapId, MAPDEF[c.map] ? {x:c.x,y:c.y} : null);
    this.sysTo(P, `歡迎來到銀月大陸，${P.name}。目前在線 ${this.players.size} 人。`);
    if(this.eclipse.on) this.send(P,{t:'event',k:'eclipse',on:true,end:this.eclipse.end});
    if(c.mq<QUESTS.length) this.send(P,{t:'quest',story:QUESTS[c.mq].story,n:QUESTS[c.mq].n,silent:c.mq>0});
    if(c.clan){ const cl=this.clans.get(c.clan); if(cl&&cl.notice) this.sysTo(P,`【血盟公告】${cl.notice}`); this.clanBroadcast(c.clan,{t:'chat',ch:'clan',from:'系統',msg:`${P.name} 上線了。`}); }
    return P;
  }
  async leave(P){
    if(!this.players.has(P.id)) return;
    this.cancelTrade(P,'對方離線了。');
    if(P.party) this.leaveParty(P);
    if(P.inst){ P.inst.players.delete(P); }
    this.players.delete(P.id); this.byName.delete(P.name.toLowerCase());
    await this.saveChar(P);
  }
  async saveChar(P){ const c=P.c; c.x=P.x; c.y=P.y; c.map=P.inst?P.inst.id:'village'; if(P.dead>0){c.map='village';c.x=15;c.y=14;c.hp=P.stats.maxHP;} try{ await this.store.saveChar(P.charId,c); }catch(e){ console.error('save failed',P.name,e.message); } }
  async shutdown(){ clearInterval(this.timer); for(const P of this.players.values()) await this.saveChar(P); }

  // ---------- messaging ----------
  send(P,msg){ try{ if(P.ws.readyState===1) P.ws.send(JSON.stringify(msg)); }catch{} }
  sysTo(P,msg){ this.send(P,{t:'chat',ch:'sys',from:'系統',msg}); }
  logTo(P,msg){ this.send(P,{t:'log',msg}); }
  broadcast(msg){ const s=JSON.stringify(msg); for(const P of this.players.values()) try{ if(P.ws.readyState===1)P.ws.send(s); }catch{} }
  mapBroadcast(inst,msg){ const s=JSON.stringify(msg); for(const P of inst.players) try{ if(P.ws.readyState===1)P.ws.send(s); }catch{} }
  clanBroadcast(name,msg){ for(const P of this.players.values()) if(P.c.clan===name) this.send(P,msg); }
  ev(inst,...e){ inst.ev.push(e); }
  me(P){ P.dirty=true; }

  // ---------- maps ----------
  enterMap(P,mapId,pos,from){
    if(P.inst) P.inst.players.delete(P);
    const inst=this.maps[mapId]; P.inst=inst; inst.players.add(P);
    const p = pos || (from ? arrivalPoint(inst.m,from) : inst.m.spawn);
    P.x=p.x; P.y=p.y; P.path=[]; P.target=null; P.moveAcc=0;
    if(inst.m.blk[P.y*inst.m.W+P.x]){ const s=inst.m.spawn; P.x=s.x; P.y=s.y; }
    if(inst.def.mobs && inst.mobs.size===0){ for(let i=0;i<MOB_COUNT;i++) this.spawnRandom(inst); if(inst.bossT<=0) this.spawnBoss(inst); }
    this.send(P,{t:'map',id:mapId,x:P.x,y:P.y}); inst.lootDirty=true;
    this.me(P);
  }
  occupied(inst,x,y,except){ for(const m of inst.mobs.values()) if(m!==except && m.x===x && m.y===y) return true; return false; }
  spawnMob(inst,k,x,y){ const t=MT[k]; const m={id:'m'+(this.nextId++),k,x,y,hx:x,hy:y,hp:t.hp,maxhp:t.hp,cd:rnd(.5,2),face:1,dir:1,stun:0,tele:0,slamT:6,boss:!!t.boss,dmg:new Map(),tgt:null}; inst.mobs.set(m.id,m); return m; }
  spawnBoss(inst){ const b=inst.m.boss; if(!b) return; this.spawnMob(inst,inst.def.boss,b.x,b.y); }
  spawnRandom(inst){ const M=inst.m,L=inst.def.mobs;
    for(let i=0;i<40;i++){ const k=M.open[ri(0,M.open.length-1)],x=k%M.W,y=k/M.W|0;
      if(this.occupied(inst,x,y) || M.portals.some(p=>p.x===x&&p.y===y)) continue;
      let near=false; for(const P of inst.players) if(Math.hypot(P.x-x,P.y-y)<7){near=true;break;} if(near) continue;
      const dd=Math.hypot(x-M.entry.x,y-M.entry.y); if(dd<6) continue; if(Math.hypot(x-M.boss.x,y-M.boss.y)<4) continue;
      const f=dd/Math.hypot(M.W,M.H),ctr=Math.min(1,f*1.6)*(L.length-1);
      this.spawnMob(inst,L[Math.max(0,Math.min(L.length-1,Math.round(ctr+rnd(-1.3,1.3))))],x,y); return; } }

  // ---------- tick ----------
  // ---------- 月蝕之夜: every Saturday 21:00–21:30 Taipei time ----------
  eclipseCheck(){ const E=this.eclipse; if(E.forced) { if(Date.now()>E.end) this.setEclipse(false); return; }
    const t=new Date(Date.now()+8*3600e3), sat=t.getUTCDay()===6, h=t.getUTCHours(), m=t.getUTCMinutes();
    const inWin=sat&&h===21&&m<30;
    if(sat&&h===20&&m>=55&&!E.warned){ E.warned=true; this.broadcast({t:'chat',ch:'sys',from:'系統',msg:'夜空開始泛紅……5 分鐘後「月蝕之夜」降臨，所有狩獵地怪物加倍、經驗 ×2！'}); }
    if(inWin&&!E.on){ const end=new Date(t); end.setUTCMinutes(30,0,0); this.setEclipse(true,end.getTime()-8*3600e3); }
    if(!inWin&&E.on) this.setEclipse(false); }
  setEclipse(on,end,forced){ const E=this.eclipse; E.on=on; E.end=on?end:0; E.forced=!!(on&&forced); if(!on) E.warned=false;
    this.broadcast({t:'event',k:'eclipse',on,end:E.end});
    this.broadcast({t:'chat',ch:'sys',from:'系統',msg:on?'✦ 月蝕之夜降臨 ✦ 月痕碎片在發熱，怪物從四面八方湧出。30 分鐘內經驗 ×2、稀有掉寶提高！':'月蝕結束了，月光回到大地。'}); }
  tick(){
    const dt=TICK/1000; this.evT-=dt; if(this.evT<=0){ this.evT=1; this.eclipseCheck(); }
    for(const inst of Object.values(this.maps)){
      const active = inst.players.size>0;
      for(const P of inst.players) this.updatePlayer(P,dt);
      if(inst.def.mobs){
        if(active){ this.updateMobs(inst,dt); this.updateTele(inst,dt); }
        this.updateLoot(inst);
        inst.spawnT-=dt; inst.bossT-=dt;
        if(inst.spawnT<=0){ const ec=this.eclipse.on, want=ec?Math.min(120,(MOB_COUNT+inst.players.size*2)*2):Math.min(70,MOB_COUNT+inst.players.size*2); inst.spawnT=ec?.25:want>MOB_COUNT?1:2.5; let n=0; for(const m of inst.mobs.values()) if(!m.boss) n++; if(n<want) this.spawnRandom(inst);
          if(inst.bossT<=0 && ![...inst.mobs.values()].some(m=>m.boss)){ this.spawnBoss(inst); if(active) this.mapBroadcast(inst,{t:'chat',ch:'sys',from:'系統',msg:`遠方傳來低沉的咆哮……${MT[inst.def.boss].n}出現了。`}); } }
      }
      if(active) this.snapshot(inst);
      inst.ev=[];
    }
    for(const P of this.players.values()){
      if(P.dirty){ P.dirty=false; P.stats=calcStats(P.c); this.send(P,{t:'me',c:this.meView(P)}); }
      P.saveT-=dt; if(P.saveT<=0){ P.saveT=AUTOSAVE; this.saveChar(P); }
      P.msgCount=0;
    }
  }
  meView(P){ const c=P.c,s=P.stats; return { id:P.id, name:P.name, cls:c.cls, g:c.g, lv:c.lv, exp:c.exp, need:expNeed(c.lv), gold:c.gold, hp:Math.ceil(c.hp), mp:Math.floor(c.mp),
    maxHP:s.maxHP, maxMP:s.maxMP, atk:s.atk, def:s.def, dodge:s.dodge, crit:s.crit, str:s.str,dex:s.dex,con:s.con,int:s.int,wis:s.wis, gear:s.gear,
    sp:c.sp, pts:c.pts, eq:c.eq, bag:c.bag, inv:c.inv, lawful:c.lawful, pk:P.pk, clan:c.clan||null, clanLeader: c.clan&&this.clans.get(c.clan)?.leader===P.name,
    party: P.party?[...P.party.members].map(m=>({id:m.id,name:m.name,lv:m.c.lv,cls:m.c.cls,hp:m.c.hp,maxHP:m.stats.maxHP,map:m.inst?.id})):null,
    partyLeader: P.party?P.party.leader===P:false, skCd:Math.max(0,P.skCd), dead:P.dead>0,
    cds:(SKILLS[c.cls]||[]).map(k=>Math.max(0,+(P.cds[k.id]||0).toFixed(1))), buff:{iron:Math.max(0,P.buff.iron|0),haste:Math.max(0,P.buff.haste|0),shadow:Math.max(0,P.buff.shadow|0)},
    mq:c.mq, mqp:c.mqp, daily:c.daily }; }
  snapshot(inst){
    const p=[],m=[];
    for(const P of inst.players) p.push([P.id,P.name,P.c.cls,P.c.g,P.x,P.y,Math.round(P.c.hp/P.stats.maxHP*100),P.c.lv,(P.c.lawful<0?1:0)|(P.purple>0?2:0)|(P.dead>0?4:0)|(P.pk?8:0),P.c.clan||'',P.face,P.c.eq.w.en|0]);
    for(const o of inst.mobs.values()) m.push([o.id,o.k,o.x,o.y,o.hp,o.maxhp,o.face,o.dir,o.stun>0?1:0,o.tele>0?Math.round(o.tele*10):0]);
    const msg={t:'s',p,m,e:inst.ev};
    if(inst.lootDirty){ inst.lootDirty=false; const now=Date.now()/1000;
      msg.l=[...inst.loot.values()].map(L=>[L.id,L.x,L.y,L.it?{s:L.it.s,t:L.it.t,q:L.it.q,leg:L.it.leg?1:0}:{k:L.k},L.q,L.name,L.own?[...L.own]:0,Math.max(0,Math.round(L.ownT-now))]); }
    this.mapBroadcast(inst,msg);
  }

  // ---------- players ----------
  updatePlayer(P,dt){
    const c=P.c,inst=P.inst; P.atkCd-=dt; P.skCd-=dt; P.purple=Math.max(0,P.purple-dt);
    for(const k in P.cds) P.cds[k]-=dt; const B=P.buff; for(const k of ['iron','haste','shadow']) if(B[k]>0){ B[k]-=dt; if(B[k]<=0){ B[k]=0; if(k==='shadow') B.nc=false; this.me(P); } }
    if(P.dead>0){ P.dead-=dt; if(P.dead<=0){ c.hp=P.stats.maxHP; c.mp=P.stats.maxMP; this.enterMap(P,'village',{x:15,y:14}); } return; }
    // regen every second
    P.regT=(P.regT||0)+dt; if(P.regT>=1){ P.regT=0; const town=inst.id==='village';
      if(Date.now()/1000-P.lastHit>5) c.hp=Math.min(P.stats.maxHP,c.hp+(town?Math.ceil(P.stats.maxHP*.06):1+c.lv*.15+(P.stats.con-10)*.1));
      c.mp=Math.min(P.stats.maxMP,c.mp+(town?3:(c.cls==='mage'?1.2:.6)+c.lv*.05+(P.stats.wis-10)*.08)); this.me(P); }
    // target handling
    const t=this.resolveTarget(P);
    if(P.target && !t) P.target=null;
    if(t){
      const melee=CLS[c.cls].range<=1, inR=melee?cheb(P,t)<=1:dist(P,t)<=CLS[c.cls].range;
      if(inR){ P.path=[]; this.face(P,t.x-P.x,t.y-P.y); if(P.atkCd<=0){ P.atkCd=CLS[c.cls].spd/(P.buff.haste>0?1.6:1); this.playerAttack(P,t,false); } }
      else if(!P.path.length || (P.repath=(P.repath||0)-dt)<=0){ P.repath=.4; P.path=(melee?findPath(inst.m,P.x,P.y,t.x,t.y,'adj',0,(x,y)=>this.occupied(inst,x,y)):findPath(inst.m,P.x,P.y,t.x,t.y,'range',CLS[c.cls].range,(x,y)=>this.occupied(inst,x,y)))||[]; }
    }
    // movement
    if(P.path.length){ P.moveAcc+=dt;
      while(P.path.length){ const [nx,ny]=P.path[0],diag=nx!==P.x&&ny!==P.y,need=diag?.2:.15; if(P.moveAcc<need) break;
        if(inst.m.blk[ny*inst.m.W+nx]||this.occupied(inst,nx,ny)||Math.max(Math.abs(nx-P.x),Math.abs(ny-P.y))!==1){ P.path=[]; break; }
        P.moveAcc-=need; P.path.shift(); this.face(P,nx-P.x,ny-P.y); P.x=nx; P.y=ny; this.pickAt(P);
        const pt=inst.m.portals.find(o=>o.x===P.x&&o.y===P.y); if(pt){ this.enterMap(P,pt.to,null,inst.id); return; } }
      if(!P.path.length) P.moveAcc=0;
    } else P.moveAcc=0;
  }
  face(e,dx,dy){ const v=dx-dy; if(v) e.dir=v>0?1:-1; const sx=dx-dy,sy=(dx+dy)*.5; if(sx||sy) e.face=(Math.round(Math.atan2(sy,sx)/(Math.PI/4))+8)%8; }
  resolveTarget(P){ if(!P.target) return null; const inst=P.inst;
    if(P.target[0]==='m'){ const m=inst.mobs.get(P.target); return m||null; }
    const o=this.players.get(P.target); if(!o||o.inst!==inst||o.dead>0||!this.canPK(P,o,true)) return null; return o; }
  canPK(A,B,quiet){
    if(A===B) return false;
    const why = inSafeZone(A.inst.m)?'村莊是安全區，不能 PK。':A.c.lv<PK_MIN_LV?`Lv.${PK_MIN_LV} 以上才能 PK。`:B.c.lv<PK_MIN_LV?`不能攻擊 Lv.${PK_MIN_LV} 以下的新手。`:
      (A.party&&A.party===B.party)?'不能攻擊隊友。':(A.c.clan&&A.c.clan===B.c.clan)?'不能攻擊同盟成員。':(!A.pk&&B.c.lawful>=0&&B.purple<=0)?'要先開啟 PK 模式。':null;
    if(why){ if(!quiet) this.logTo(A,why); return false; } return true; }

  // ---------- combat ----------
  rollDmg(P,mult,targetDef,o={}){ const s=P.stats; let crit=o.crit||(!o.nocrit&&Math.random()<s.crit); if(P.buff.nc){ crit=true; P.buff.nc=false; }
    return { dmg:Math.max(1,Math.round(s.atk*rnd(.85,1.15)*mult*(crit?1.7:1))-targetDef), crit }; }
  playerAttack(P,t,skill){
    const inst=P.inst,c=P.c,k=c.cls; this.face(P,t.x-P.x,t.y-P.y);
    const kind=k==='ranger'?'arrow':k==='mage'?'bolt':k==='darkelf'?'slashD':'slash';
    this.ev(inst,'a',P.id,t.id,kind);
    if(Math.random()<.07){ this.ev(inst,'d',t.id,0,2); return; }
    this.hitTarget(P,t,1,{});
  }
  hitTarget(P,t,mult,o){
    if(t.id[0]==='m') return this.damageMob(P,t,mult,o);
    return this.damagePlayer(P,t,mult,o);
  }
  damageMob(P,m,mult,o){ if(!m||m.hp<=0) return; const inst=P.inst,t=MT[m.k];
    const {dmg,crit}=this.rollDmg(P,mult,t.def,o); m.hp-=dmg; m.tgt=P.id; m.dmg.set(P.id,(m.dmg.get(P.id)||0)+dmg);
    if(o.stun) m.stun=o.stun;
    if(o.push&&!m.boss){ const nx=m.x+Math.sign(m.x-P.x),ny=m.y+Math.sign(m.y-P.y); if(!inst.m.blk[ny*inst.m.W+nx]&&!this.occupied(inst,nx,ny)){m.x=nx;m.y=ny;} }
    this.ev(inst,'d',m.id,dmg,(crit?1:0)|(o.label?4:0),o.label||'');
    if(m.hp<=0) this.killMob(inst,m);
  }
  damagePlayer(P,T,mult,o){ if(!this.canPK(P,T)) { P.target=null; return; }
    const inst=P.inst; const {dmg:raw,crit}=this.rollDmg(P,mult,T.stats.def,o); let dmg=Math.max(1,Math.round(raw*.5));
    if(Math.random()<this.dodgeOf(T)){ this.ev(inst,'d',T.id,0,2); return; }
    if(T.c.lawful>=0&&T.purple<=0) P.purple=30;
    if(T.buff.iron>0) dmg=Math.max(1,Math.round(dmg*.5));
    T.c.hp-=dmg; T.lastHit=Date.now()/1000; T.lastAttacker=P.id; this.me(T);
    this.ev(inst,'d',T.id,dmg,(crit?1:0)|(o.label?4:0),o.label||'');
    if(T.c.hp<=0) this.killPlayer(T,P);
  }
  useSkill(P,i){ const c=P.c,list=SKILLS[c.cls]; i=Math.max(0,Math.min(2,i|0)); const sk=list[i];
    if(P.dead>0||!sk) return; if(c.lv<sk.lv) return this.logTo(P,`${sk.n}要 Lv.${sk.lv} 才能使用。`);
    if((P.cds[sk.id]||0)>0) return; if(c.mp<sk.mp) return this.logTo(P,'MP 不夠。');
    const inst=P.inst; let t=null;
    if(sk.tgt){ t=this.resolveTarget(P); if(!t) return this.logTo(P,`${sk.n}要先選一個目標。`);
      if(dist(P,t)>(CLS[c.cls].range<=1?1.5:CLS[c.cls].range+.5)) return this.logTo(P,'距離太遠了。'); this.face(P,t.x-P.x,t.y-P.y); }
    c.mp-=sk.mp; P.cds[sk.id]=sk.cd; P.skCd=sk.cd; P.atkCd=Math.max(P.atkCd,.3); this.me(P);
    this.questEv(P,'skill',null,1);
    const live=()=>t.id[0]==='m'?inst.mobs.get(t.id):(t.dead>0?null:t);
    const near=(r,fn)=>{ for(const m of [...inst.mobs.values()]) if(Math.hypot(m.x-P.x,m.y-P.y)<=r) fn(m); };
    switch(sk.id){
      case 'k1': this.ev(inst,'a',P.id,t.id,'skill_knight'); this.hitTarget(P,t,2.5,{label:'衝擊斬',stun:1.3,push:1}); break;
      case 'k2': this.ev(inst,'fx',P.id,'whirl'); near(1.6,m=>this.damageMob(P,m,1.7,{label:'旋風斬'})); break;
      case 'k3': P.buff.iron=8; this.ev(inst,'fx',P.id,'iron'); this.logTo(P,'鐵壁：8 秒內受到的傷害減半。'); break;
      case 'r1': this.ev(inst,'a',P.id,t.id,'skill_ranger'); for(let k=0;k<3;k++){ const tt=live(); if(!tt) break; this.hitTarget(P,tt,1.1,{label:'三連射'}); } break;
      case 'r2': { this.ev(inst,'a',P.id,t.id,'pierce'); this.hitTarget(P,t,3.2,{label:'穿雲箭',crit:true});
        // pierce: also hit mobs standing on the line behind the target
        const dx=t.x-P.x,dy=t.y-P.y,L=Math.hypot(dx,dy)||1; for(const m of [...inst.mobs.values()]){ if(m.id===t.id) continue; const px=m.x-P.x,py=m.y-P.y,proj=(px*dx+py*dy)/L; if(proj<L||proj>L+3) continue; if(Math.abs(px*dy-py*dx)/L<=.8) this.damageMob(P,m,1.8,{label:'穿雲箭'}); } break; }
      case 'r3': P.buff.haste=8; this.ev(inst,'fx',P.id,'haste'); this.logTo(P,'疾風步：8 秒內攻速 +60%、閃避 +15%。'); break;
      case 'm1': { this.ev(inst,'a',P.id,t.id,'skill_mage'); const cx=t.x,cy=t.y;
        if(t.id[0]==='m'){ for(const m of [...inst.mobs.values()]) if(Math.hypot(m.x-cx,m.y-cy)<=1.7) this.damageMob(P,m,m===t?2.1:1.5,{label:m===t?'火球術':''}); }
        else this.hitTarget(P,t,2.1,{label:'火球術'}); break; }
      case 'm2': this.ev(inst,'fx',P.id,'nova'); near(2.6,m=>this.damageMob(P,m,1.4,{label:'冰霜新星',stun:2})); break;
      case 'm3': { const amt=Math.round(30+P.stats.int*3+c.lv*4); const tg=P.party?[...P.party.members].filter(o=>o.inst===inst&&o.dead<=0&&dist(o,P)<=6):[P];
        for(const o of tg){ o.c.hp=Math.min(o.stats.maxHP,o.c.hp+amt); this.ev(inst,'h',o.id,amt); this.me(o); } break; }
      case 'd1': this.ev(inst,'a',P.id,t.id,'skill_darkelf'); this.hitTarget(P,t,1.5,{label:'暗影突襲'}); { const tt=live(); if(tt) this.hitTarget(P,tt,1.6,{label:'暗影突襲',crit:true}); } break;
      case 'd2': this.ev(inst,'a',P.id,t.id,'skill_darkelf'); this.hitTarget(P,t,1.1,{label:'毒刃'});
        { const tt=live(); if(tt&&tt.id[0]==='m'){ tt.poison={t:6,d:Math.max(1,Math.round(P.stats.atk*.5)),by:P.id,tick:1}; this.ev(inst,'ps',tt.id,6); } } break;
      case 'd3': P.buff.shadow=6; P.buff.nc=true; this.ev(inst,'fx',P.id,'shadow'); this.logTo(P,'影遁：6 秒內閃避 +40%，下一擊必定爆擊。'); break;
    }
  }
  killMob(inst,m){ const t=MT[m.k]; inst.mobs.delete(m.id); this.ev(inst,'k',m.id);
    // who gets credit: top damage dealer (and their party)
    let best=null,bd=0; for(const [pid,d] of m.dmg){ const P=this.players.get(pid); if(P&&P.inst===inst&&d>bd){bd=d;best=P;} }
    if(m.boss){ inst.bossT=BOSS_RESPAWN; inst.tg=inst.tg.filter(g=>g.by!==m.id); }
    if(m.summon||!best) return;
    const group = best.party ? [...best.party.members].filter(o=>o.inst===inst&&o.dead<=0&&Math.hypot(o.x-m.x,o.y-m.y)<16) : [best];
    const bonus = 1+.1*(group.length-1), totalExp=Math.round(t.exp*bonus*(this.eclipse.on?2:1)), lvSum=group.reduce((a,o)=>a+o.c.lv,0);
    const gold=ri(t.g[0],t.g[1]), share=Math.max(1,Math.floor(gold/group.length));
    for(const o of group){ const e=Math.max(1,Math.round(totalExp*o.c.lv/lvSum)); this.gainExp(o,e); o.c.gold+=share; o.c.kills=(o.c.kills||0)+1;
      o.c.lawful=Math.min(32767,(o.c.lawful||0)+Math.max(1,Math.round(t.lv/2))); if(m.boss) o.c.bossKills=(o.c.bossKills||0)+1;
      this.logTo(o,`打倒${t.n}，經驗 +${e}、金幣 +${share}`); this.me(o);
      this.questEv(o,'kill',m.k,1); if(group.length>1) this.questEv(o,'party',null,1); }
    if(m.boss){ // everyone who hit the boss gets boss credit for dailies
      const hitters=new Set(group); for(const pid of m.dmg.keys()){ const o=this.players.get(pid); if(o&&o.inst===inst) hitters.add(o); }
      for(const o of hitters){ this.questEv(o,'boss',null,1); if(!group.includes(o)) this.questEv(o,'kill',m.k,1); } }
    const owners=new Set(group.map(o=>o.id)), tier=inst.def.tier;
    const drop=(L)=>this.dropLoot(inst,m.x,m.y,L,owners,best);
    if(m.boss){ drop({k:'ws',n:2}); drop({k:'as',n:2}); drop({k:'big',n:3});
      drop({it:makeItem(Math.random()<.5?'w':randomSlot(),Math.min(4,tier+1))}); drop({it:makeItem(randomSlot(),Math.min(4,tier+1))}); if(Math.random()<.5) drop({it:makeItem(randomSlot(),tier)});
      const legP = m.k==='firelord'?.25:m.k==='colossus'?.12:.06; if(Math.random()<legP) drop({it:makeLegend(Math.random()<.7?'w':'n')});
      this.broadcast({t:'chat',ch:'sys',from:'系統',msg:`${group.map(o=>o.name).join('、')} 擊倒了 ${t.n}！`}); }
    else{ if(Math.random()<.22) drop({k:'pot'}); if(Math.random()<.04+tier*.01) drop({k:'ws'}); if(Math.random()<.05+tier*.01) drop({k:'as'}); if(Math.random()<.06) drop({k:'blue'});
      const ec=this.eclipse.on;
      if(Math.random()<(ec?.12:.07)){ const it=makeItem(randomSlot(),Math.random()<.7?tier:Math.max(0,tier-1)); if(ec&&(it.q|0)<2&&Math.random()<.25){ it.q=2; it.bon=Object.assign(it.bon||{},{str:1+tier,con:1+tier}); } drop({it}); }
      if(Math.random()<.0015*tier*(ec?3:1)) drop({it:makeLegend(Math.random()<.7?'w':'n')}); }
  }
  // ---------- ground loot ----------
  dropLoot(inst,x,y,L,owners,by){ const now=Date.now()/1000, M=inst.m;
    // scatter around the corpse
    let px=x,py=y; for(let i=0;i<12;i++){ const nx=x+ri(-1,1),ny=y+ri(-1,1); if(nx>=0&&ny>=0&&nx<M.W&&ny<M.H&&!M.blk[ny*M.W+nx]&&![...inst.loot.values()].some(o=>o.x===nx&&o.y===ny)){px=nx;py=ny;break;} }
    const q = L.it ? (L.it.q||0) : (L.k==='ws'||L.k==='as'?1:0);
    const name = L.it ? (L.it.leg?itemBaseName(L.it,by.c.cls):itemName(L.it,by.c.cls)) : INV_N[L.k]+(L.n>1?'×'+L.n:'');
    const o={id:'l'+(this.nextId++),x:px,y:py,it:L.it||null,k:L.k||null,n:L.n||1,q,name,own:owners,ownT:now+LOOT_OWN,exp:now+LOOT_LIFE};
    inst.loot.set(o.id,o); inst.lootDirty=true; this.ev(inst,'ld',o.id,q);
    if(q>=3){ this.broadcast({t:'chat',ch:'sys',from:'系統',msg:`✦ 傳說 ✦ ${inst.def.name}的${by.name}眼前落下了一道金色光柱……`}); }
    else if(q===2) this.mapBroadcast(inst,{t:'chat',ch:'sys',from:'系統',msg:`${by.name} 打出了稀有裝備！`});
    return o; }
  updateLoot(inst){ const now=Date.now()/1000; for(const L of inst.loot.values()){ if(now>L.exp){ inst.loot.delete(L.id); inst.lootDirty=true; } else if(L.own&&now>L.ownT){ L.own=null; inst.lootDirty=true; } } }
  canPick(P,L){ return !L.own||L.own.has(P.id); }
  pickAt(P){ const inst=P.inst; for(const L of [...inst.loot.values()]) if(L.x===P.x&&L.y===P.y) this.pickUp(P,L,true); }
  pickUp(P,L,quiet){ const inst=P.inst,c=P.c; if(P.dead>0||!inst.loot.has(L.id)) return;
    if(!this.canPick(P,L)){ if(!quiet) this.logTo(P,'這是別人打到的寶物，20 秒後才能撿。'); return; }
    if(L.it){ if(c.bag.length>=BAGMAX){ if(!quiet) this.logTo(P,'背包滿了。'); return; } c.bag.push(L.it); }
    else c.inv[L.k]=(c.inv[L.k]||0)+L.n;
    inst.loot.delete(L.id); inst.lootDirty=true; this.ev(inst,'lp',L.id,P.id,L.q);
    const nm=L.it?(L.it.leg?`【傳說】${itemName(L.it,c.cls)}`:itemName(L.it,c.cls)+(L.q===2?'【稀有】':L.q===1?'【魔法】':'')):L.name;
    this.logTo(P,`撿到 ${nm}`); this.me(P); this.questEv(P,'pick',null,1);
    if(L.q>=3) this.broadcast({t:'chat',ch:'sys',from:'系統',msg:`✦ ${P.name} 獲得了傳說${L.it.s==='w'?'武器':'飾品'}「${itemBaseName(L.it,c.cls)}」！`});
    if(P.party) for(const o of P.party.members) if(o!==P&&o.inst===inst) this.logTo(o,`${P.name} 撿到 ${nm}`); }
  // ---------- telegraphed attacks (red circles) ----------
  tele(inst,m,x,y,r,delay,mult,kind){ inst.tg.push({x,y,r,t:delay,by:m.id,k:m.k,mult,kind}); this.ev(inst,'tg',x,y,r,delay,kind); }
  updateTele(inst,dt){ if(!inst.tg.length) return; const keep=[];
    for(const g of inst.tg){ g.t-=dt; if(g.t>0){ keep.push(g); continue; } const t=MT[g.k];
      this.ev(inst,'tb',g.x,g.y,g.r,g.kind);
      for(const P of inst.players) if(P.dead<=0&&Math.hypot(P.x-g.x,P.y-g.y)<=g.r+.3){ const a=t.atk*g.mult; this.hurtPlayer(P,Math.max(Math.ceil(a*.3),Math.round(a*rnd(.9,1.1))-P.stats.def),t.n); } }
    inst.tg=keep; }
  bossAI(inst,m,T,dt){ const t=MT[m.k], pct=m.hp/m.maxhp;
    if(m.tele>0){ m.tele-=dt; return true; } // channelling: stand still
    m.slamT-=dt; m.mechT=(m.mechT??8)-dt;
    if(m.k==='treant'){ for(const th of [.66,.33]) if(pct<th&&!(m.sum||[]).includes(th)){ (m.sum=m.sum||[]).push(th);
        this.mapBroadcast(inst,{t:'chat',ch:'sys',from:'腐木樹妖',msg:'「森林的孩子們……醒來！」'});
        for(let i=0;i<5;i++){ const nx=m.x+ri(-3,3),ny=m.y+ri(-3,3); if(nx<0||ny<0||nx>=inst.m.W||ny>=inst.m.H||inst.m.blk[ny*inst.m.W+nx]||this.occupied(inst,nx,ny)) continue; const a=this.spawnMob(inst,pick(['mush','boar','wolf']),nx,ny); a.summon=true; a.tgt=T.id; } }
      if(m.mechT<=0){ m.mechT=rnd(7,9); // root burst under every nearby player
        for(const P of inst.players) if(P.dead<=0&&dist(P,m)<=8) this.tele(inst,m,P.x,P.y,1.3,1.4,1.3,'root'); m.tele=.6; return true; } }
    if(m.k==='colossus'&&m.mechT<=0){ m.mechT=rnd(6,8); // bone spikes: one circle under each player plus random ones
      for(const P of inst.players) if(P.dead<=0&&dist(P,m)<=9){ this.tele(inst,m,P.x,P.y,1.2,1.3,1.5,'bone'); this.tele(inst,m,P.x+ri(-2,2),P.y+ri(-2,2),1.2,1.6,1.5,'bone'); } m.tele=.5; return true; }
    if(m.k==='firelord'){ if(pct<.3&&!m.enr){ m.enr=true; this.mapBroadcast(inst,{t:'chat',ch:'sys',from:'卡爾薩',msg:'「我也曾經守護過這片大地……現在，燒吧！」'}); this.ev(inst,'fx',m.id,'enrage'); }
      if(m.mechT<=0){ m.mechT=m.enr?rnd(4,5):rnd(6.5,8); const ps=[...inst.players].filter(P=>P.dead<=0&&dist(P,m)<=10);
        for(const P of ps) this.tele(inst,m,P.x,P.y,1.5,1.5,1.4,'fire'); for(let i=0;i<(m.enr?7:4);i++) this.tele(inst,m,m.x+ri(-5,5),m.y+ri(-5,5),1.5,1.2+Math.random()*.8,1.4,'fire'); m.tele=.6; return true; } }
    if(m.slamT<=0&&dist(m,T)<=4){ m.slamT=rnd(5.5,7.5); this.tele(inst,m,m.x,m.y,2.6,1.1,1.7,'slam'); this.ev(inst,'sl',m.id); m.tele=1.1; return true; }
    return false; }
  // ---------- quests ----------
  checkDaily(P){ const c=P.c,d=today(); if(!c.daily||c.daily.day!==d){ c.daily={day:d,list:dailyFor(d),bonus:false}; this.me(P); } }
  questEv(P,type,k,n){ const c=P.c; this.checkDaily(P);
    const q=QUESTS[c.mq];
    if(q&&q.type===type&&(type!=='kill'||q.k.includes(k))){ c.mqp=Math.min(q.n,(c.mqp||0)+n); this.me(P); if(c.mqp>=q.n) this.completeQuest(P); }
    const dk = type==='kill'?'kill':type;
    let changed=false; for(const dq of c.daily.list){ if(dq.done||dq.k!==dk) continue; dq.p=Math.min(dq.n,dq.p+n); changed=true;
      if(dq.p>=dq.n){ dq.done=true; const e=Math.round(expNeed(c.lv)*.12), g=200+c.lv*40; this.gainExp(P,e); c.gold+=g; c.inv.ws=(c.inv.ws||0)+(dq.k==='boss'?1:0); c.inv.big=(c.inv.big||0)+2;
        this.send(P,{t:'qdone',daily:1,n:dq.d,r:`經驗 +${e}、金幣 +${g}、強力藥水 ×2${dq.k==='boss'?'、武器強化卷軸':''}`}); } }
    if(changed){ if(!c.daily.bonus&&c.daily.list.every(x=>x.done)){ c.daily.bonus=true; c.inv.ws=(c.inv.ws||0)+1; c.inv.as=(c.inv.as||0)+1; c.gold+=1000;
      this.send(P,{t:'qdone',daily:1,n:'今日任務全部完成',r:'武器、防具強化卷軸各 1、金幣 +1000'}); } this.me(P); } }
  completeQuest(P){ const c=P.c,q=QUESTS[c.mq]; if(!q) return; const r=q.r,parts=[];
    if(r.exp){ this.gainExp(P,r.exp); parts.push(`經驗 +${r.exp}`); } if(r.gold){ c.gold+=r.gold; parts.push(`金幣 +${r.gold}`); }
    for(const k of ['pot','big','blue','ret','ws','as']) if(r[k]){ c.inv[k]=(c.inv[k]||0)+r[k]; parts.push(`${INV_N[k]} ×${r[k]}`); }
    c.mq++; c.mqp=0; const nx=QUESTS[c.mq];
    this.send(P,{t:'qdone',n:q.n,r:parts.join('、'),story:nx?nx.story:null,next:nx?nx.n:null}); this.me(P);
    if(!nx) this.broadcast({t:'chat',ch:'sys',from:'系統',msg:`${P.name} 完成了主線「新月之誓」！`}); }
  gainExp(P,e){ const c=P.c; c.exp+=e;
    while(c.exp>=expNeed(c.lv)){ c.exp-=expNeed(c.lv); c.lv++; c.pts=(c.pts||0)+1; P.stats=calcStats(c); c.hp=P.stats.maxHP; c.mp=P.stats.maxMP;
      this.ev(P.inst,'l',P.id); this.logTo(P,`升級了！現在是 Lv.${c.lv}，獲得 1 點能力點數`);
      if(c.lv%5===0) this.broadcast({t:'chat',ch:'sys',from:'系統',msg:`${P.name} 升到了 Lv.${c.lv}！`}); } }
  dodgeOf(T){ return T.stats.dodge+(T.buff.haste>0?.15:0)+(T.buff.shadow>0?.4:0); }
  hurtPlayer(T,dmg,byName){ if(T.dead>0) return; if(T.buff.iron>0) dmg=Math.max(1,Math.round(dmg*.5)); T.c.hp-=dmg; T.lastHit=Date.now()/1000; this.me(T); this.ev(T.inst,'d',T.id,dmg,0,''); if(T.c.hp<=0) this.killPlayer(T,null,byName); }
  killPlayer(T,killer,byName){
    const c=T.c; c.hp=0; T.dead=3; T.target=null; T.path=[]; this.ev(T.inst,'pd',T.id); this.cancelTrade(T,'對方倒下了。');
    if(killer){ const wasInnocent = c.lawful>=0 && T.purple<=0;
      if(wasInnocent){ killer.c.lawful=(killer.c.lawful||0)-1000; killer.c.pkKills=(killer.c.pkKills||0)+1; this.logTo(killer,`你殺死了無辜的 ${T.name}，正義值 -1000。${killer.c.lawful<0?'你變成了紅名！':''}`); }
      else this.logTo(killer,`你打倒了 ${T.name}。`);
      this.me(killer);
      if(c.lawful<0){ // red players can drop gear
        const pool=[...c.bag.map((it,i)=>({from:'bag',i,it})),...['h','c','g','b','s','n','r1','r2'].filter(s=>c.eq[s]).map(s=>({from:'eq',s,it:c.eq[s]}))];
        if(pool.length&&Math.random()<.5){ const d=pick(pool); if(d.from==='bag') c.bag.splice(d.i,1); else c.eq[d.s]=null;
          if(killer.c.bag.length<BAGMAX){ killer.c.bag.push(d.it); this.logTo(killer,`${T.name} 掉落了 ${itemName(d.it,killer.c.cls)}！`); }
          this.logTo(T,`你是紅名，死亡時掉落了 ${itemName(d.it,c.cls)}。`); } }
      this.broadcast({t:'chat',ch:'sys',from:'系統',msg:`${killer.name} 在${T.inst.def.name}擊殺了 ${T.name}。`});
    } else {
      const loss=Math.min(c.exp,Math.round(expNeed(c.lv)*.05)); c.exp-=loss; this.logTo(T,`你被${byName||'怪物'}打倒了，損失 ${loss} 經驗。`);
    }
    this.me(T);
  }
  updateMobs(inst,dt){
    const now=Date.now()/1000;
    for(const m of [...inst.mobs.values()]){ const t=MT[m.k]; m.cd-=dt; m.stun-=dt;
      if(m.poison){ const ps=m.poison; ps.t-=dt; ps.tick-=dt; if(ps.tick<=0){ ps.tick=1; const P=this.players.get(ps.by);
          m.hp-=ps.d; this.ev(inst,'d',m.id,ps.d,8,''); if(P){ m.dmg.set(P.id,(m.dmg.get(P.id)||0)+ps.d); m.tgt=m.tgt||P.id; }
          if(m.hp<=0){ this.killMob(inst,m); continue; } } if(ps.t<=0) m.poison=null; }
      if(m.stun>0) continue;
      // pick target: current aggro target if valid else nearest player in sight
      let T=m.tgt?this.players.get(m.tgt):null; if(T&&(T.inst!==inst||T.dead>0||cheb(m,T)>(m.boss?10:9))) { T=null; m.tgt=null; }
      if(!T){ let bd=1e9; const sight=m.boss?8:(t.sight||6); for(const P of inst.players){ if(P.dead>0) continue; const d=cheb(m,P); if(d<=sight&&d<bd){bd=d;T=P;} } if(T) m.tgt=T.id; }
      if(m.boss&&T&&this.bossAI(inst,m,T,dt)) continue;
      if(T){ const d=cheb(m,T);
        if(t.ranged&&d<=t.ranged&&d>1){ if(m.cd<=0){ m.cd=1.6; this.face(m,T.x-m.x,T.y-m.y); this.ev(inst,'a',m.id,T.id,m.k==='cultist'?'mfire':'spore'); this.mobHit(m,T); } }
        else if(d<=1){ this.face(m,T.x-m.x,T.y-m.y); if(m.cd<=0){ m.cd=(m.boss?1.4:1.15)*(m.enr?.7:1); this.ev(inst,'a',m.id,T.id,'claw'); this.mobHit(m,T); } }
        else if(m.cd<=0){ m.cd=t.spd; this.stepToward(inst,m,T.x,T.y); }
      } else if(m.cd<=0){ m.cd=rnd(1.2,3); if(!m.boss){ const [dx,dy]=pick(DIRS),nx=m.x+dx,ny=m.y+dy;
        if(!inst.m.blk[ny*inst.m.W+nx]&&!this.occupied(inst,nx,ny)&&Math.abs(nx-m.hx)<=4&&Math.abs(ny-m.hy)<=4){ this.face(m,dx,dy); m.x=nx; m.y=ny; } } }
    }
  }
  mobHit(m,T){ const t=MT[m.k]; if(Math.random()<this.dodgeOf(T)){ this.ev(T.inst,'d',T.id,0,2); return; }
    const atk=t.atk*(m.enr?1.4:1); this.hurtPlayer(T,Math.max(Math.ceil(atk*.3),Math.round(atk*rnd(.8,1.2))-T.stats.def),t.n); }
  stepToward(inst,m,tx,ty){ let best=null,bd=1e9; const M=inst.m;
    for(const [dx,dy] of DIRS){ const nx=m.x+dx,ny=m.y+dy; if(nx<0||ny<0||nx>=M.W||ny>=M.H||M.blk[ny*M.W+nx]||this.occupied(inst,nx,ny,m)) continue;
      if(dx&&dy&&(M.blk[m.y*M.W+m.x+dx]||M.blk[(m.y+dy)*M.W+m.x])) continue; const d=Math.hypot(nx-tx,ny-ty); if(d<bd){bd=d;best=[nx,ny];} }
    if(best){ this.face(m,best[0]-m.x,best[1]-m.y); m.x=best[0]; m.y=best[1]; } }

  // ---------- commands from clients ----------
  handle(P,msg){
    if(++P.msgCount>40) return; // flood guard
    const c=P.c, inst=P.inst, town=inst.id==='village';
    switch(msg.t){
      case 'move': { if(P.dead>0) return; const x=msg.x|0,y=msg.y|0; P.target=null; if(x<0||y<0||x>=inst.m.W||y>=inst.m.H) return;
        const solid=inst.m.blk[y*inst.m.W+x]; P.path=findPath(inst.m,P.x,P.y,x,y,solid?'adj':'exact',0,(a,b)=>this.occupied(inst,a,b))||[]; P.moveAcc=Math.min(P.moveAcc,.15); return; }
      case 'attack': { if(P.dead>0) return; const id=String(msg.id||'');
        if(id[0]==='p'){ const T=this.players.get(id); if(!T||T.inst!==inst) return; if(!this.canPK(P,T)) return; }
        else if(!inst.mobs.has(id)) return;
        P.target=id; P.repath=0; return; }
      case 'stop': P.target=null; P.path=[]; return;
      case 'skill': return this.useSkill(P,msg.i);
      case 'pick': { const L=inst.loot.get(String(msg.id||'')); if(!L) return; if(cheb(P,L)<=1) return this.pickUp(P,L,false);
        P.target=null; P.path=findPath(inst.m,P.x,P.y,L.x,L.y,'exact',0,(x,y)=>this.occupied(inst,x,y))||[]; return; }
      case 'qtalk': { const q=QUESTS[c.mq]; if(!town||!q||q.type!=='talk') return; return this.completeQuest(P); }
      case 'use': return this.useItem(P,msg.k);
      case 'ret': if(P.dead>0||town) return; if(!c.inv.ret) return this.logTo(P,'沒有回村卷軸了。'); c.inv.ret--; this.enterMap(P,'village',{x:15,y:14}); return this.logTo(P,'卷軸的光芒把你送回晨霧村。');
      case 'heal': if(!town) return; c.hp=P.stats.maxHP; c.mp=P.stats.maxMP; this.ev(inst,'h',P.id); this.me(P); return this.logTo(P,'泉水的光芒治癒了你。');
      case 'buy': { if(!town) return; const s=SHOP.find(x=>x.k===msg.k),q=msg.q|0; if(!s||!s.q.includes(q)) return; if(c.gold<s.p*q) return this.logTo(P,'金幣不夠。'); c.gold-=s.p*q; c.inv[s.k]=(c.inv[s.k]||0)+q; this.me(P); return; }
      case 'buygear': { if(!town) return; const ok=SHOP_GEAR.some(([s,t])=>s===msg.s&&t===msg.tier); if(!ok) return; const pr=shopPrice(msg.s,msg.tier);
        if(c.bag.length>=BAGMAX) return this.logTo(P,'背包滿了。'); if(c.gold<pr) return this.logTo(P,'金幣不夠。'); c.gold-=pr; c.bag.push({s:msg.s,t:msg.tier,en:0}); this.me(P); return this.logTo(P,'買好了，到角色頁裝備。'); }
      case 'sell': { if(!town) return this.logTo(P,'要在村莊才能賣東西。'); const i=msg.i|0,it=c.bag[i]; if(!it) return; c.bag.splice(i,1); c.gold+=sellP(it); this.me(P); return this.logTo(P,`賣掉 ${itemName(it,c.cls)}`); }
      case 'equip': { const i=msg.i|0,it=c.bag[i]; if(!it) return; if(it.s==='s'&&NOSHIELD[c.cls]) return this.logTo(P,`${CLS[c.cls].n}不能使用盾牌。`);
        const sl=eqSlotFor(c.eq,it),old=c.eq[sl]; c.eq[sl]=it; c.bag.splice(i,1); if(old) c.bag.push(old); P.stats=calcStats(c); c.hp=Math.min(c.hp,P.stats.maxHP); c.mp=Math.min(c.mp,P.stats.maxMP); this.me(P); return; }
      case 'unequip': { const sl=String(msg.s); if(sl==='w'||sl==='a'||!(sl in c.eq)||!c.eq[sl]) return; if(c.bag.length>=BAGMAX) return this.logTo(P,'背包滿了。');
        c.bag.push(c.eq[sl]); c.eq[sl]=null; P.stats=calcStats(c); c.hp=Math.min(c.hp,P.stats.maxHP); c.mp=Math.min(c.mp,P.stats.maxMP); this.me(P); return; }
      case 'stat': { if(!(c.pts>0)) return; if(msg.k==='auto'){ const ks=c.cls==='knight'?['str']:c.cls==='ranger'?['dex']:c.cls==='mage'?['int']:['str','dex']; let i=0; while(c.pts>0){ c.sp[ks[i%ks.length]]++; c.pts--; i++; } }
        else if(['str','dex','con','int','wis'].includes(msg.k)){ c.sp[msg.k]++; c.pts--; } this.me(P); return; }
      case 'enchant': { if(!town) return; const sl=String(msg.s); const it=c.eq[sl]; if(!it||['n','r1','r2'].includes(sl)) return; const kind=sl==='w'?'w':'a',sc=kind==='w'?'ws':'as';
        if(!c.inv[sc]) return this.logTo(P,'沒有強化卷軸。'); c.inv[sc]--; const r=enchRate(kind,it.en),before=itemName(it,c.cls); this.questEv(P,'enchant',null,1);
        if(Math.random()<r){ it.en++; this.send(P,{t:'ench',ok:true,msg:`成功！${itemName(it,c.cls)}`}); if(it.en>=8) this.broadcast({t:'chat',ch:'sys',from:'系統',msg:`${P.name} 把 ${before} 衝到了 +${it.en}！`}); }
        else { c.eq[sl]=(sl==='w'||sl==='a')?{s:sl,t:0,en:0}:null; this.send(P,{t:'ench',ok:false,msg:`${before} 爆掉了…`}); if(it.en>=6) this.broadcast({t:'chat',ch:'sys',from:'系統',msg:`${P.name} 的 ${before} 在鐵匠鋪化為碎片。`}); }
        this.me(P); return; }
      case 'pk': P.pk=!!msg.on; this.logTo(P,P.pk?'PK 模式開啟：點其他玩家就會攻擊。':'PK 模式關閉。'); this.me(P); return;
      case 'chat': return this.chat(P,msg);
      case 'pinvite': return this.partyInvite(P,String(msg.name||''));
      case 'paccept': return this.partyAccept(P,String(msg.from||''));
      case 'pleave': return this.leaveParty(P);
      case 'treq': return this.tradeRequest(P,String(msg.name||''));
      case 'taccept': return this.tradeAccept(P,String(msg.from||''));
      case 'tput': return this.tradePut(P,msg);
      case 'tok': return this.tradeOk(P);
      case 'tcancel': return this.cancelTrade(P,`${P.name} 取消了交易。`);
      case 'ccreate': return this.clanCreate(P,String(msg.name||''));
      case 'cinvite': return this.clanInvite(P,String(msg.name||''));
      case 'caccept': return this.clanAccept(P,String(msg.clan||''));
      case 'cleave': return this.clanLeave(P);
      case 'cnotice': { const cl=this.clans.get(c.clan); if(!cl||cl.leader!==P.name) return; cl.notice=String(msg.text||'').slice(0,80); this.store.saveClan(cl); return this.clanBroadcast(cl.name,{t:'chat',ch:'clan',from:'公告',msg:cl.notice}); }
      case 'cinfo': { const cl=this.clans.get(c.clan); if(!cl) return this.send(P,{t:'clan',clan:null}); return this.send(P,{t:'clan',clan:{name:cl.name,leader:cl.leader,notice:cl.notice||'',members:cl.members.map(n=>({name:n,online:this.byName.has(n.toLowerCase())}))}}); }
      case 'rank': return this.sendRank(P);
      case 'who': return this.send(P,{t:'who',list:[...this.players.values()].map(o=>({name:o.name,lv:o.c.lv,cls:o.c.cls,map:o.inst?.def.name,clan:o.c.clan||null})).slice(0,100)});
    }
  }
  useItem(P,k){ const c=P.c; if(P.dead>0) return;
    if(k==='pot'||k==='big'){ if(!c.inv[k]) return this.logTo(P,`${INV_N[k]}用完了。`); if(c.hp>=P.stats.maxHP) return; c.inv[k]--; const v=k==='pot'?50:160; c.hp=Math.min(P.stats.maxHP,c.hp+v); this.ev(P.inst,'h',P.id,v); this.me(P); }
    else if(k==='blue'){ if(!c.inv.blue) return this.logTo(P,'藍色藥水用完了。'); if(c.mp>=P.stats.maxMP) return; c.inv.blue--; c.mp=Math.min(P.stats.maxMP,c.mp+40); this.me(P); } }

  // ---------- chat ----------
  chat(P,msg){ const text=String(msg.msg||'').replace(/[\u0000-\u001f]/g,'').trim().slice(0,120); if(!text) return;
    if(process.env.DEV_CMDS==='1'&&text[0]==='!'){ const [cmd,arg,arg2]=text.slice(1).split(/\s+/),c=P.c;
      if(cmd==='lv'){ c.lv=Math.max(1,Math.min(60,arg|0)); c.pts=0; this.me(P); }
      if(cmd==='tp'&&MAPDEF[arg]){ const b=this.maps[arg].m.boss; this.enterMap(P,arg,arg2==='boss'&&b?{x:b.x+3,y:b.y+3}:null); }
      if(cmd==='drop'){ const q=arg|0; this.dropLoot(P.inst,P.x+1,P.y+1,q===3?{it:makeLegend('w')}:q?{it:Object.assign(makeItem('h',3),{q,bon:{str:2}})}:{k:'pot'},new Set([P.id]),P); }
      if(cmd==='eclipse'){ if(arg==='off') this.setEclipse(false); else this.setEclipse(true,Date.now()+(+arg||30)*60e3,true); }
      if(cmd==='god'){ c.hp=P.stats.maxHP=99999; }
      return; }
    const now=Date.now(); if(now-P.chatT<700) return this.logTo(P,'說話太快了。'); P.chatT=now;
    const out={t:'chat',ch:msg.ch,from:P.name,msg:text};
    if(msg.ch==='all'){ if(now-(P.allT||0)<5000) return this.logTo(P,'全頻每 5 秒只能說一次。'); P.allT=now; return this.broadcast(out); }
    if(msg.ch==='map') return this.mapBroadcast(P.inst,out);
    if(msg.ch==='party'){ if(!P.party) return this.logTo(P,'你沒有隊伍。'); for(const o of P.party.members) this.send(o,out); return; }
    if(msg.ch==='clan'){ if(!P.c.clan) return this.logTo(P,'你沒有血盟。'); return this.clanBroadcast(P.c.clan,out); }
    if(msg.ch==='w'){ const T=this.byName.get(String(msg.to||'').toLowerCase()); if(!T) return this.logTo(P,'對方不在線上。'); this.send(T,{...out,to:T.name}); return this.send(P,{...out,to:T.name}); }
  }

  // ---------- party ----------
  partyInvite(P,name){ const T=this.byName.get(name.toLowerCase()); if(!T||T===P) return this.logTo(P,'找不到這個玩家。');
    if(T.party) return this.logTo(P,`${T.name} 已經有隊伍了。`); if(P.party&&P.party.leader!==P) return this.logTo(P,'只有隊長可以邀請。');
    if(P.party&&P.party.members.size>=8) return this.logTo(P,'隊伍滿了（最多 8 人）。');
    T.pinv=P.name; this.send(T,{t:'ask',kind:'party',from:P.name,msg:`${P.name}（Lv.${P.c.lv} ${CLS[P.c.cls].n}）邀請你組隊。`}); this.logTo(P,`已邀請 ${T.name} 組隊。`); }
  partyAccept(P,from){ if(P.pinv!==from) return; P.pinv=null; const L=this.byName.get(from.toLowerCase()); if(!L) return this.logTo(P,'對方已經離線。'); if(P.party) return;
    if(!L.party){ L.party={leader:L,members:new Set([L])}; }
    if(L.party.members.size>=8) return this.logTo(P,'隊伍滿了。');
    L.party.members.add(P); P.party=L.party; for(const o of P.party.members){ this.sysTo(o,`${P.name} 加入了隊伍。`); this.me(o); } }
  leaveParty(P){ const pt=P.party; if(!pt) return; pt.members.delete(P); P.party=null; this.me(P); this.sysTo(P,'你離開了隊伍。');
    if(pt.members.size<=1){ for(const o of pt.members){ o.party=null; this.sysTo(o,'隊伍解散了。'); this.me(o); } return; }
    if(pt.leader===P) pt.leader=[...pt.members][0]; for(const o of pt.members){ this.sysTo(o,`${P.name} 離開了隊伍。`); this.me(o); } }

  // ---------- trade ----------
  tradeRequest(P,name){ const T=this.byName.get(name.toLowerCase()); if(!T||T===P) return this.logTo(P,'找不到這個玩家。');
    if(T.inst!==P.inst||cheb(P,T)>3) return this.logTo(P,'要站在對方旁邊（3 格內）才能交易。'); if(this.trades.has(P.id)||this.trades.has(T.id)) return this.logTo(P,'對方正在交易中。');
    T.tinv=P.name; this.send(T,{t:'ask',kind:'trade',from:P.name,msg:`${P.name} 想跟你交易。`}); this.logTo(P,`已向 ${T.name} 提出交易。`); }
  tradeAccept(P,from){ if(P.tinv!==from) return; P.tinv=null; const A=this.byName.get(from.toLowerCase()); if(!A||A.inst!==P.inst||cheb(A,P)>3) return this.logTo(P,'對方已經離開了。');
    if(this.trades.has(A.id)||this.trades.has(P.id)) return; const tr={a:A,b:P,items:{[A.id]:[],[P.id]:[]},gold:{[A.id]:0,[P.id]:0},ok:{}}; this.trades.set(A.id,tr); this.trades.set(P.id,tr); this.pushTrade(tr); }
  pushTrade(tr){ for(const [me,other] of [[tr.a,tr.b],[tr.b,tr.a]]) this.send(me,{t:'trade',with:other.name,
      mine:{items:tr.items[me.id].map(i=>me.c.bag[i]),idx:tr.items[me.id],gold:tr.gold[me.id],ok:!!tr.ok[me.id]},
      theirs:{items:tr.items[other.id].map(i=>other.c.bag[i]),gold:tr.gold[other.id],ok:!!tr.ok[other.id],cls:other.c.cls}}); }
  tradePut(P,msg){ const tr=this.trades.get(P.id); if(!tr) return; tr.ok={};
    if(msg.gold!=null){ tr.gold[P.id]=Math.max(0,Math.min(P.c.gold,Math.floor(+msg.gold||0))); }
    if(msg.i!=null){ const i=msg.i|0; if(!P.c.bag[i]) return; const arr=tr.items[P.id]; const at=arr.indexOf(i); if(at>=0) arr.splice(at,1); else if(arr.length<10) arr.push(i); }
    this.pushTrade(tr); }
  tradeOk(P){ const tr=this.trades.get(P.id); if(!tr) return; tr.ok[P.id]=true; this.pushTrade(tr);
    if(!(tr.ok[tr.a.id]&&tr.ok[tr.b.id])) return;
    const {a,b}=tr; if(a.inst!==b.inst||cheb(a,b)>3) return this.cancelTrade(a,'距離太遠，交易取消。');
    if(a.c.gold<tr.gold[a.id]||b.c.gold<tr.gold[b.id]) return this.cancelTrade(a,'金幣不足，交易取消。');
    const ia=tr.items[a.id].map(i=>a.c.bag[i]), ib=tr.items[b.id].map(i=>b.c.bag[i]);
    if(ia.some(x=>!x)||ib.some(x=>!x)) return this.cancelTrade(a,'物品有變動，交易取消。');
    if(a.c.bag.length-ia.length+ib.length>BAGMAX||b.c.bag.length-ib.length+ia.length>BAGMAX) return this.cancelTrade(a,'背包空間不足，交易取消。');
    a.c.bag=a.c.bag.filter(x=>!ia.includes(x)); b.c.bag=b.c.bag.filter(x=>!ib.includes(x)); a.c.bag.push(...ib); b.c.bag.push(...ia);
    a.c.gold+=tr.gold[b.id]-tr.gold[a.id]; b.c.gold+=tr.gold[a.id]-tr.gold[b.id];
    this.trades.delete(a.id); this.trades.delete(b.id);
    for(const o of [a,b]){ this.send(o,{t:'trade',done:true}); this.sysTo(o,'交易完成。'); this.me(o); this.saveChar(o); } }
  cancelTrade(P,why){ const tr=this.trades.get(P.id); if(!tr) return; this.trades.delete(tr.a.id); this.trades.delete(tr.b.id);
    for(const o of [tr.a,tr.b]){ this.send(o,{t:'trade',done:true,cancel:true}); this.sysTo(o,why||'交易取消。'); } }

  // ---------- clans ----------
  async clanCreate(P,name){ const c=P.c; name=name.trim();
    if(c.clan) return this.logTo(P,'你已經在血盟裡了。'); if(!NAME_RE.test(name)||name.length>10) return this.logTo(P,'血盟名稱要 2～10 個字，只能用中英文和數字。');
    if(c.lv<CLAN_MIN_LV) return this.logTo(P,`Lv.${CLAN_MIN_LV} 以上才能創立血盟。`); if(c.gold<CLAN_COST) return this.logTo(P,`創立血盟要 ${CLAN_COST} 金幣。`);
    if(this.clans.has(name)) return this.logTo(P,'這個名字已經有人用了。');
    c.gold-=CLAN_COST; const cl={name,leader:P.name,members:[P.name],notice:''}; this.clans.set(name,cl); c.clan=name; await this.store.saveClan(cl); this.me(P); this.saveChar(P);
    this.broadcast({t:'chat',ch:'sys',from:'系統',msg:`${P.name} 創立了血盟「${name}」！`}); }
  clanInvite(P,name){ const cl=this.clans.get(P.c.clan); if(!cl||cl.leader!==P.name) return this.logTo(P,'只有盟主可以邀請。');
    const T=this.byName.get(name.toLowerCase()); if(!T) return this.logTo(P,'對方不在線上。'); if(T.c.clan) return this.logTo(P,'對方已經有血盟了。'); if(cl.members.length>=50) return this.logTo(P,'血盟已滿（50 人）。');
    T.cinv=cl.name; this.send(T,{t:'ask',kind:'clan',from:cl.name,msg:`${P.name} 邀請你加入血盟「${cl.name}」。`}); this.logTo(P,`已邀請 ${T.name}。`); }
  async clanAccept(P,clan){ if(P.cinv!==clan||P.c.clan) return; P.cinv=null; const cl=this.clans.get(clan); if(!cl) return;
    cl.members.push(P.name); P.c.clan=clan; await this.store.saveClan(cl); this.me(P); this.saveChar(P); this.clanBroadcast(clan,{t:'chat',ch:'clan',from:'系統',msg:`${P.name} 加入了血盟。`}); }
  async clanLeave(P){ const cl=this.clans.get(P.c.clan); if(!cl) return; cl.members=cl.members.filter(n=>n!==P.name); const name=cl.name; P.c.clan=null; this.me(P); this.saveChar(P);
    if(!cl.members.length){ this.clans.delete(name); await this.store.deleteClan(name); return this.sysTo(P,`血盟「${name}」解散了。`); }
    if(cl.leader===P.name) cl.leader=cl.members[0]; await this.store.saveClan(cl); this.sysTo(P,`你離開了血盟「${name}」。`); this.clanBroadcast(name,{t:'chat',ch:'clan',from:'系統',msg:`${P.name} 離開了血盟。盟主是 ${cl.leader}。`}); }

  // ---------- ranking ----------
  async sendRank(P){ const now=Date.now(); if(!this.rankCache||now-this.rankT>30000){ for(const o of this.players.values()) await this.saveChar(o); this.rankCache=await this.store.ranking(30); this.rankT=now; } this.send(P,{t:'rank',list:this.rankCache}); }
}
