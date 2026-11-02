
/* =====================================================================
   Online client logic
   ===================================================================== */
const maps={};
function getMap(id){ if(!maps[id]){ const m=buildMap(id); m.mobs=[]; m.corpses=[]; renderGround(m); maps[id]=m; } return maps[id]; }
const ents=new Map(); // id -> entity (players + mobs) in current map
let myTargetId=null, pendingAct=null, auto=false, armed=null, bagSel=null, chatCh='map', lastTrade=null, logs=[];
function myTarget(){ return myTargetId?ents.get(myTargetId)||null:null; }
const CLSI={knight:0,ranger:1,mage:2,darkelf:3};
const INVI={pot:57,big:58,blue:59,ret:60,ws:61,as:62};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- assets ---------- */
async function loadAssets(){
  const man=await (await fetch('assets/manifest.json')).json();
  ASSETS=man.assets; MOBS=man.mobs; SHEETS=man.sheets; NPCIMG=man.npcs; ICONS=man.icons;
  const ps=[]; const load=(store,k,src)=>{const im=new Image();store[k]=im;ps.push(new Promise(r=>{im.onload=im.onerror=r;}));im.src=src;};
  for(const k in ASSETS)load(AIMG,k,ASSETS[k].src);
  for(const k in MOBS)load(MOBI,k,MOBS[k].src);
  for(const k in SHEETS)load(SHIMG,k,SHEETS[k].src);
  for(const k in NPCIMG)load(NPCI,k,NPCIMG[k].src);
  const st=document.createElement('style');st.textContent=`.ic{background-image:url(${ICONS.src})}`;document.head.appendChild(st);
  await Promise.race([Promise.all(ps),new Promise(r=>setTimeout(r,8000))]);
}
function icon(idx){ const x=(idx%ICONS.cols)*ICONS.sz,y=Math.floor(idx/ICONS.cols)*ICONS.sz; return `<span class="ic" style="background-position:-${x}px -${y}px"></span>`; }
function iconIdx(it,cls){ if(it.s==='w')return CLSI[cls||ME.cls]*5+it.t; const o={a:20,h:25,c:30,g:35,b:40,s:45}[it.s]; if(o!=null)return o+it.t; if(it.s==='n')return 50+[0,0,1,1,2][it.t]; if(it.s==='r')return 53+it.t; return 63; }
const itIcon=(it,cls)=>icon(iconIdx(it,cls));
function itemCls(it){ if(!it)return''; if(it.en>=7)return'e7'; if(it.q===2)return't4'; if(it.q===1)return't2'; return['','','','t3','t4'][it.t]||''; }

/* ---------- network ---------- */
let ws=null, reconnectT=0, inGame=false;
const TOKEN_KEY='silvermoon_online_token';
const getToken=()=>{try{return localStorage.getItem(TOKEN_KEY);}catch{return null;}};
const setToken=t=>{try{t?localStorage.setItem(TOKEN_KEY,t):localStorage.removeItem(TOKEN_KEY);}catch{}};
function send(m){ if(ws&&ws.readyState===1) ws.send(JSON.stringify(m)); }
function connect(){
  const url=(location.protocol==='https:'?'wss://':'ws://')+location.host+'/ws';
  ws=new WebSocket(url); setStatus('連線中…');
  ws.onopen=()=>{ setStatus(''); const t=getToken(); if(t) send({t:'resume',token:t}); else showLogin(); };
  ws.onclose=()=>{ inGame=false; setStatus('與伺服器的連線中斷，3 秒後重新連線…'); setTimeout(connect,3000); };
  ws.onmessage=ev=>{ let m; try{m=JSON.parse(ev.data);}catch{return;} onMsg(m); };
}
function setStatus(t){ const el=$('#status'); el.textContent=t; el.hidden=!t; }
function onMsg(m){
  switch(m.t){
    case 'auth': if(m.ok){ setToken(m.token); } else { if(m.expired||m.loggedOut) setToken(null); showLogin(m.err); } return;
    case 'chars': showChars(m.list); return;
    case 'err': toast(m.msg); return;
    case 'kick': inGame=false; toast(m.msg); return;
    case 'map': enterMapClient(m.id,m.x,m.y); return;
    case 'me': onMe(m.c); return;
    case 's': onSnapshot(m); return;
    case 'log': addLog(m.msg); return;
    case 'chat': addChat(m); return;
    case 'ask': showAsk(m); return;
    case 'trade': onTrade(m); return;
    case 'clan': openPanel('clan',m.clan); return;
    case 'rank': openPanel('rank',m.list); return;
    case 'who': openPanel('who',m.list); return;
    case 'ench': SFX[m.ok?'ok':'boom'](); if(curPanel==='smith') openPanel('smith',{c:m.ok?'ok':'boom',t:m.msg}); addLog(m.msg); return;
  }
}

/* ---------- login & character select ---------- */
function showScreen(html){ $('#screen').innerHTML=html; $('#screen').hidden=false; }
function hideScreen(){ $('#screen').hidden=true; }
function showLogin(err){
  inGame=false; hideScreen();
  showScreen(`<div class="card"><h1>銀月大陸 <small>Online</small></h1><p class="ds">原創類天堂線上 RPG</p>
    <form id="fLogin"><label for="iUser">帳號</label><input id="iUser" autocomplete="username" maxlength="16" required>
    <label for="iPass">密碼</label><input id="iPass" type="password" autocomplete="current-password" maxlength="64" required>
    ${err?`<p class="err">${esc(err)}</p>`:''}
    <div class="row2"><button class="btn" type="submit" data-mode="login">登入</button><button class="btn" type="submit" data-mode="register">註冊新帳號</button></div></form>
    <p class="ds">帳號用英文字母或數字，密碼 6 個字以上。換手機登入同一個帳號就能繼續玩。</p></div>`);
  let mode='login'; for(const b of document.querySelectorAll('#fLogin button')) b.onclick=()=>{mode=b.dataset.mode;};
  $('#fLogin').onsubmit=e=>{ e.preventDefault(); audioOn(); send({t:mode,user:$('#iUser').value.trim(),pass:$('#iPass').value}); };
}
let charList=[], createCls=null, createG='m';
function showChars(list){
  charList=list; if(inGame) return;
  const cards=Object.keys(CLS).map(c=>{ const d=CLS[c], ch=list.find(x=>x.cls===c);
    const pv=g=>{const k=g==='f'?c+'_f':c;return SHEETS[k]?.prev||SHEETS[c]?.prev||'';};
    if(ch) return `<div class="ccard2"><img class="pv" src="${pv(ch.g)}" alt=""><div class="cinfo"><div class="nm">${esc(ch.name)}</div><div class="ds">${d.n} Lv.${ch.lv}${ch.clan?'・'+esc(ch.clan):''}</div>
      <div class="gsel"><button class="btn" data-enter="${c}" data-g="${ch.g}">進入遊戲</button><button class="btn ghost" data-enter="${c}" data-g="${ch.g==='f'?'m':'f'}">換成${ch.g==='f'?'男':'女'}生進入</button></div></div></div>`;
    const sel=createCls===c;
    return `<div class="ccard2 ${sel?'sel':''}"><img class="pv" src="${pv(sel?createG:'m')}" alt=""><div class="cinfo"><div class="nm">${d.n}</div><div class="ds">${d.d}</div><div class="ds">主屬性 ${d.main}・技能「${d.sk.n}」</div>
      ${sel?`<form id="fCreate"><div class="gsel"><button type="button" class="btn ${createG==='m'?'on':''}" data-gender="m">男</button><button type="button" class="btn ${createG==='f'?'on':''}" data-gender="f">女</button></div>
      <label for="iName">角色名稱（2～12 字）</label><input id="iName" maxlength="12" required><button class="btn" type="submit">建立${d.n}</button></form>`
      :`<button class="btn" data-new="${c}">建立這個職業</button>`}</div></div>`; }).join('');
  showScreen(`<div class="card wide"><h1>選擇角色</h1><p class="ds">每個帳號每種職業可以建立一個角色，角色名稱全伺服器唯一。</p><div class="classes">${cards}</div><button class="btn ghost" id="bLogout">登出</button></div>`);
  $('#screen').onclick=e=>{ const b=e.target.closest('button'); if(!b) return; audioOn();
    if(b.dataset.enter){ send({t:'enter',cls:b.dataset.enter,g:b.dataset.g}); setStatus('進入遊戲中…'); }
    if(b.dataset.new){ createCls=b.dataset.new; createG='m'; showChars(charList); setTimeout(()=>$('#iName')?.focus(),50); }
    if(b.dataset.gender){ createG=b.dataset.gender; const v=$('#iName').value; showChars(charList); $('#iName').value=v; }
    if(b.id==='bLogout'){ send({t:'logout'}); setToken(null); } };
  const f=$('#fCreate'); if(f) f.onsubmit=e=>{ e.preventDefault(); send({t:'create',cls:createCls,g:createG,name:$('#iName').value.trim()}); createCls=null; };
}

/* ---------- world state ---------- */
function enterMapClient(id,x,y){
  inGame=true; hideScreen(); setStatus('');
  cur=getMap(id); OX=cur.H*HW; ents.clear(); players.clear(); cur.mobs=[]; cur.corpses=[]; projs=[]; parts=[]; floats=[];
  myTargetId=null; pendingAct=null; marker=null; banner={t:3,a:cur.name,b:cur.tip||(id==='village'?'安全區・不能 PK':'')}; SFX.portal();
  if(ME){ P=mkPlayer([ME.id,ME.name,ME.cls,ME.g,x,y,100,ME.lv,0,ME.clan||'',2,ME.eq?.w?.en||0]); }
  closePanel(true);
}
function mkPlayer(a){ const e={id:a[0],isPlayer:true,name:a[1],cls:a[2],g:a[3],x:a[4],y:a[5],rx:a[4],ry:a[5],hpPct:a[6],lv:a[7],flags:a[8],clan:a[9],face:a[10],dir:faceDir(a[10]),eq:{w:{en:a[11]}},walk:0,atkVis:0,lunge:0,hurt:0,dead:0};
  players.set(e.id,e); ents.set(e.id,e); return e; }
const faceDir=f=>[1,1,0,-1,-1,-1,0,1][f]||1;
function onSnapshot(s){
  if(!cur) return;
  const seen=new Set();
  for(const a of s.p){ seen.add(a[0]); let e=players.get(a[0]); if(!e) e=mkPlayer(a);
    const moved=a[4]!==e.x||a[5]!==e.y; e.x=a[4]; e.y=a[5]; e.hpPct=a[6]; e.lv=a[7]; e.flags=a[8]; e.clan=a[9]; if(a[10]!==e.face){e.face=a[10];const d=faceDir(a[10]);if(d)e.dir=d;} e.eq.w.en=a[11]; e.dead=a[8]&4?1:0; e.cls=a[2]; e.g=a[3];
    if(Math.abs(e.x-e.rx)>4||Math.abs(e.y-e.ry)>4){e.rx=e.x;e.ry=e.y;} if(ME&&a[0]===ME.id) P=e; e.party=!!(ME&&ME.party&&ME.party.some(m=>m.id===e.id)); }
  for(const id of [...players.keys()]) if(!seen.has(id)){ players.delete(id); ents.delete(id); }
  const ms=new Set(), list=[];
  for(const a of s.m){ ms.add(a[0]); let e=ents.get(a[0]);
    if(!e){ e={id:a[0],k:a[1],x:a[2],y:a[3],rx:a[2],ry:a[3],boss:!!MT[a[1]].boss,hurt:0,kb:0,kbx:0,kby:0,lg:0,atkAnim:0,lgA:0}; ents.set(e.id,e); }
    e.x=a[2]; e.y=a[3]; e.hp=a[4]; e.maxhp=a[5]; e.face=a[6]; e.dir=a[7]; e.stun=a[8]; e.tele=a[9]/10; list.push(e); }
  for(const m of cur.mobs) if(!ms.has(m.id)) ents.delete(m.id);
  cur.mobs=list;
  for(const e of s.e) onEvent(e);
}
function onEvent(e){
  const k=e[0];
  if(k==='a'){ const A=ents.get(e[1]),T=ents.get(e[2]); if(!A||!T) return; const kind=e[3];
    const near=P&&Math.hypot(A.x-P.x,A.y-P.y)<14;
    if(A.isPlayer){ A.atkVis=.45; const sx=fx(A),sy=bodyY(A);
      if(kind==='slash'||kind==='slashD'||kind==='skill_knight'||kind==='skill_darkelf'){ A.lunge=.15; slash(A,T,kind==='skill_knight'?'#9fe0ff':kind==='skill_darkelf'?'#8a4cff':kind==='slashD'?'#d8b8ff':'#fff'); if(near) (kind.startsWith('skill')?SFX.crit:SFX.swing)(); pendingHit(T,null); }
      else if(kind==='arrow'){ pendingHit(T,shoot({x:sx+A.dir*8,y:sy,tgt:T,kind:'arrow',spd:520})); if(near) SFX.arrow(); }
      else if(kind==='skill_ranger'){ for(let i=0;i<3;i++) pendingHit(T,shoot({x:sx+A.dir*8,y:sy,tgt:T,kind:'arrow',spd:560+i*60,col:'#b8ffb0'})); if(near) SFX.arrow(); }
      else if(kind==='bolt'){ pendingHit(T,shoot({x:sx+A.dir*9,y:sy-22,tgt:T,kind:'bolt',spd:360})); if(near) SFX.bolt(); }
      else if(kind==='skill_mage'){ pendingHit(T,shoot({x:sx+A.dir*9,y:sy-22,tgt:T,kind:'fire',spd:300,aoe:1})); if(near) SFX.fire(); }
    } else { A.atkAnim=.25; A.lg=.18; A.lgA=Math.atan2(fy(T)-fy(A),fx(T)-fx(A));
      if(kind==='spore'||kind==='mfire') pendingHit(T,shoot({x:fx(A),y:bodyY(A),tgt:T,kind:kind==='mfire'?'mfire':'spore',spd:kind==='mfire'?230:180}));
      else { parts.push({back:fy(T)<fy(A)-2,type:'slash',x:(fx(A)+fx(T))/2,y:(bodyY(A)+bodyY(T))/2,ang:A.lgA,t:0,life:.18,c:'#ff6b5e',big:A.boss}); if(near) SFX.swing(); pendingHit(T,null); } }
    return; }
  if(k==='d'){ const T=ents.get(e[1]); if(!T) return; const h={dmg:e[2],flags:e[3],label:e[4]};
    const q=pendingProjFor.get(T.id); if(q&&q.length){ q[0].hits.push(h); return; } showHit(T,h); return; }
  if(k==='k'){ const m=ents.get(e[1]); if(!m) return; cur.corpses.push({m,t:0}); const cx=fx(m),cy=bodyY(m);
    burst(cx,cy,m.boss?60:18,['#ffffff','#e8d8b0','#c8b090'],m.boss?260:150);
    if(P&&Math.hypot(m.x-P.x,m.y-P.y)<10) for(let i=0;i<5;i++) part(cx,cy,{type:'coin',vx:rnd(-90,90),vy:rnd(-160,-60),g:300,life:1.4,s:4,c:'#ffd84a',delay:.35});
    if(m.boss){ doShake(10,.5); SFX.level(); } if(myTargetId===m.id) myTargetId=null; ents.delete(m.id); return; }
  if(k==='l'){ const p=ents.get(e[1]); if(p){ levelFx(p); } return; }
  if(k==='h'){ const p=ents.get(e[1]); if(p){ if(e[2]) float(p,'+'+e[2],'#7fe08a'); else float(p,'完全回復','#7fe08a'); burst(fx(p),fy(p)-10,12,['#7fe08a','#c8ffd0'],70,{g:-70}); if(p===P) SFX.pot(); } return; }
  if(k==='sl'){ const m=ents.get(e[1]); if(m){ burst(fx(m),fy(m),30,['#c9a060','#8a6a3a','#fff'],180); doShake(9,.4); SFX.slam(); } return; }
  if(k==='pd'){ const p=ents.get(e[1]); if(p){ p.dead=1; burst(fx(p),bodyY(p),20,['#c4433a','#ff8a7a'],120); if(p===P){ SFX.die(); myTargetId=null; auto&&toggleAuto(); } } return; }
}
const pendingProjFor=new Map();
function pendingHit(T,proj){ if(!proj) return; let q=pendingProjFor.get(T.id); if(!q){q=[];pendingProjFor.set(T.id,q);} q.push(proj); proj.hits=[]; }
function showHit(T,h){
  const miss=h.flags&2, crit=h.flags&1, isMe=T===P;
  if(miss){ float(T,T.isPlayer?'閃避':'MISS',T.isPlayer?'#9fd0ff':'#aaa'); return; }
  T.hurt=.12; if(!T.isPlayer){ T.kb=T.boss?.3:1; const a=Math.random()*6.28; T.kbx=Math.cos(a)*.3; T.kby=Math.sin(a)*.3; }
  const col=isMe?'#ff6b5e':T.isPlayer?'#ffb070':crit?'#ffd75e':h.label?'#9fe0ff':'#fff';
  float(T,(h.label?h.label+' ':'')+(isMe?'-':'')+h.dmg+(crit?'!':''),col,crit);
  burst(fx(T),bodyY(T),crit?14:6,crit?['#fff6c0','#ffd84a','#ff9a3c']:isMe?['#c4433a','#ff8a7a']:['#fff','#ffe7a3'],crit?200:120);
  if(isMe){ hurtFlash=.25; SFX.hurt(); doShake(3,.12); } else if(P&&Math.hypot(T.x-P.x,T.y-P.y)<12){ crit?SFX.crit():SFX.hit(); if(crit){doShake(5,.15);} }
}
function onMe(c){
  const first=!ME; const prevLv=ME?.lv; ME=c;
  if(P){ P.eq.w.en=c.eq.w.en|0; }
  if(prevLv&&c.lv>prevLv) SFX.level();
  if(curPanel&&['bag','shop','smith','social'].includes(curPanel)) openPanel(curPanel,curArg,true);
  hud(true);
  $('#bPk').classList.toggle('hot',!!c.pk);
}

/* ---------- effects ---------- */
function float(e,txt,col,big){floats.push({x:fx(e)+rnd(-5,5),y:fy(e)-(e.boss?90:e.isPlayer?58:42),txt,col,t:0,big:!!big});}
function part(x,y,o){parts.push(Object.assign({x,y,vx:rnd(-60,60),vy:rnd(-90,-20),g:220,life:.5,t:0,s:3,c:'#fff'},o));}
function burst(x,y,n,cols,sp,o){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=rnd(sp*.3,sp);part(x,y,Object.assign({vx:Math.cos(a)*v,vy:Math.sin(a)*v-30,c:pick(cols),life:rnd(.3,.7),s:pick([2,3,4])},o));}}
function doShake(m,t){shakeMag=Math.max(shakeMag,m);shake=Math.max(shake,t);}
function slash(A,T,col){parts.push({back:fy(T)<fy(A)-2,type:'slash',x:(fx(A)+fx(T))/2,y:(bodyY(A)+bodyY(T))/2,ang:Math.atan2(bodyY(T)-bodyY(A),fx(T)-fx(A)),t:0,life:.18,c:col,big:col!=='#fff'});}
function shoot(p){ const o=Object.assign({t:0,hits:[]},p); projs.push(o); return o; }
function levelFx(p){ float(p,'LEVEL UP!','#ffd86b',true); const x=fx(p),y=fy(p);
  for(let i=0;i<40;i++)part(x+rnd(-14,14),y,{vx:rnd(-10,10),vy:rnd(-220,-80),g:-20,c:pick(['#ffd84a','#fff6c0','#ffe7a3']),life:rnd(.6,1.1),s:pick([2,3])});
  parts.push({type:'ring',x,y:y-14,t:0,life:.5,r:TS*1.6,c:'255,216,74'}); }
function drawPlayer(e,X,Y){
  drawHero(e,X,Y);
  const nameCol=e.flags&1?'#ff6a5a':e.flags&2?'#d08aff':e===P?'#ffe7a3':e.party?'#8fd8ff':'#e4dac0';
  const top=Y-64; label(e.name,X,top,nameCol); if(e.clan) label('〈'+e.clan+'〉',X,top-13,'#9fc4e0');
  if(e!==P&&e.hpPct<100){ ctx.fillStyle=O;ctx.fillRect(X-15,top+3,30,4);ctx.fillStyle='#c4433a';ctx.fillRect(X-14,top+4,28*Math.max(0,e.hpPct)/100,2); }
}
function updateFx(dt){
  for(const p of parts){ if(p.delay){p.delay-=dt;if(p.delay<=0)p.delay=0;} p.t+=dt;
    if(p.type==='coin'&&p.t>.45&&P){ const tx=fx(P),ty=bodyY(P),dx=tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy)||1;p.vx=dx/d*420;p.vy=dy/d*420;p.g=0;if(d<10){p.t=p.life;SFX.coin();} }
    if(!p.type||p.type==='coin'){p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;} }
  parts=parts.filter(p=>p.t<p.life);
  for(const f of floats)f.t+=dt; floats=floats.filter(f=>f.t<1.1);
  for(const p of projs){ p.t+=dt; const tg=ents.get(p.tgt.id)||p.tgt; const tx=fx(tg),ty=bodyY(tg),dx=tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy); p.ang=Math.atan2(dy,dx);
    if(p.kind==='fire'&&Math.random()<.8)part(p.x,p.y,{vx:rnd(-20,20),vy:rnd(-30,10),g:0,c:pick(['#ffd84a','#ff7a2a','#c4301a']),life:.35,s:pick([3,4])});
    if(p.kind==='bolt'&&Math.random()<.6)part(p.x,p.y,{vx:rnd(-15,15),vy:rnd(-15,15),g:0,c:pick(['#bfe8ff','#7ab8ff']),life:.25,s:2});
    if(d<10||p.t>2){ p.done=true; const q=pendingProjFor.get(p.tgt.id); if(q){const i=q.indexOf(p);if(i>=0)q.splice(i,1);}
      if(p.aoe){ burst(tx,ty,26,['#ffd84a','#ff7a2a','#c4301a','#fff2b0'],220); doShake(6,.22); parts.push({type:'ring',x:tx,y:ty,t:0,life:.35,r:TS*1.7,c:'255,150,60'}); }
      for(const h of p.hits) showHit(tg,h); continue; }
    const sp=p.spd*dt; p.x+=dx/d*sp; p.y+=dy/d*sp; }
  projs=projs.filter(p=>!p.done);
  // hits whose target vanished before the projectile landed
  banner.t-=dt; shake-=dt; if(shake<=0)shakeMag=0; hurtFlash-=dt;
  for(const e of ents.values()){ const sp=Math.min(1,dt*(e.isPlayer?11:8)); const mv=Math.abs(e.x-e.rx)+Math.abs(e.y-e.ry)>.05; e.rx+=(e.x-e.rx)*sp; e.ry+=(e.y-e.ry)*sp;
    e.hurt-=dt; if(e.isPlayer){ e.atkVis-=dt; e.lunge-=dt; if(mv)e.walk+=dt; } else { e.kb=Math.max(0,(e.kb||0)-dt*6); e.atkAnim-=dt; e.lg-=dt; } }
  for(const c of cur.corpses)c.t+=dt; cur.corpses=cur.corpses.filter(c=>c.t<.6);
  if(cur.id==='forest'&&Math.random()<dt*2.5)part(cam.x+rnd(0,VW),cam.y-4,{vx:rnd(10,30),vy:rnd(20,40),g:0,c:pick(['#6a9a40','#8ab050','#c8a040']),life:4,s:3,type:'leaf'});
  if(cur.id==='cave'&&Math.random()<dt*10)part(cam.x+rnd(0,VW),cam.y+VH+4,{vx:rnd(-10,10),vy:rnd(-60,-25),g:0,c:pick(['#ff9a3c','#ffd84a','#ff5a2a']),life:3,s:2,type:'leaf'});
  for(const p of parts)if(p.type==='leaf'){p.x+=p.vx*dt;p.y+=p.vy*dt;}
  for(const p of cur.portals)if(Math.random()<dt*8)part(PX(p.x+.5,p.y+.5)+rnd(-14,14),PY(p.x+.5,p.y+.5)+rnd(-4,4),{vx:rnd(-6,6),vy:rnd(-50,-25),g:0,c:pick(['#c9a8ff','#8a5cff','#fff']),life:rnd(.6,1),s:2});
}

/* ---------- input ---------- */
function resize(){const r=$('#stage').getBoundingClientRect(),d=Math.min(2,window.devicePixelRatio||1);VW=Math.max(100,r.width-4);VH=Math.max(100,r.height-4);
  cv.width=Math.round(VW*d);cv.height=Math.round(VH*d);cv.style.width=VW+'px';cv.style.height=VH+'px';ctx.setTransform(d,0,0,d,0,0);ctx.imageSmoothingEnabled=false;lightCv.width=Math.ceil(VW/4);lightCv.height=Math.ceil(VH/4);}
window.addEventListener('resize',resize);
cv.addEventListener('pointerdown',e=>{ audioOn(); if(!P||!cur||P.dead) return;
  const r=cv.getBoundingClientRect(),wx=e.clientX-r.left+cam.x,wy=e.clientY-r.top+cam.y,u=wx-OX;
  const tx=Math.floor((u/HW+wy/HH)/2),ty=Math.floor((wy/HH-u/HW)/2);
  pendingAct=null; marker=null;
  let best=null,bd=30; for(const m of cur.mobs){ const d=Math.hypot(fx(m)-wx,fy(m)-(m.boss?40:14)-wy)/(m.boss?2.2:1); if(d<bd){bd=d;best=m;} }
  for(const p of players.values()){ if(p===P) continue; const d=Math.hypot(fx(p)-wx,fy(p)-28-wy); if(d<bd){bd=d;best=p;} }
  if(best&&!best.isPlayer){ myTargetId=best.id; send({t:'attack',id:best.id}); parts.push({type:'ring',x:fx(best),y:fy(best),t:0,life:.3,r:22,c:'255,90,70'}); return; }
  if(best&&best.isPlayer){ if(ME.pk){ myTargetId=best.id; send({t:'attack',id:best.id}); } else openPanel('player',best); return; }
  myTargetId=null;
  const n=cur.npcs.find(n=>Math.hypot(PX(n.x+.5,n.y+.5)-wx,PY(n.x+.5,n.y+.5)-24-wy)<28);
  if(n){ pendingAct={x:n.x,y:n.y,act:n.act}; send({t:'move',x:n.x,y:n.y}); return; }
  if(cur.heal&&Math.hypot(PX(cur.heal.x+1,cur.heal.y+1)-wx,PY(cur.heal.x+1,cur.heal.y+1)-20-wy)<52){ pendingAct={x:cur.heal.x,y:cur.heal.y,act:'heal',big:1}; send({t:'move',x:cur.heal.x,y:cur.heal.y}); return; }
  if(tx<0||ty<0||tx>=cur.W||ty>=cur.H) return; send({t:'move',x:tx,y:ty}); if(!cur.blk[ty*cur.W+tx]) marker={x:tx,y:ty};
});
window.addEventListener('keydown',e=>{ if(!inGame||!P||e.target.tagName==='INPUT') return; if(!$('#overlay').hidden) return;
  const k={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[e.key];
  if(k){ e.preventDefault(); myTargetId=null; send({t:'move',x:P.x+k[0],y:P.y+k[1]}); }
  if(e.key==='Enter'){ e.preventDefault(); $('#chatIn').focus(); }
  if(e.key==='1') usePot(); if(e.key==='2') send({t:'skill'}); });
function checkPending(){ if(!pendingAct||!P) return; const a=pendingAct, near=a.big?Math.max(Math.abs(P.x-a.x-.5),Math.abs(P.y-a.y-.5))<=1.6:cheb(P,a)<=1;
  if(near&&Math.abs(P.rx-P.x)<.1&&Math.abs(P.ry-P.y)<.1){ pendingAct=null; if(a.act==='heal') send({t:'heal'}); else openPanel(a.act); } }
function usePot(){ if(!ME) return; if(ME.inv.pot) send({t:'use',k:'pot'}); else if(ME.inv.big) send({t:'use',k:'big'}); else addLog('紅色藥水用完了，回村找莉娜買。'); }
$('#bPot').onclick=()=>{audioOn();usePot();};
$('#bSkill').onclick=()=>{audioOn();send({t:'skill'});};
$('#bRet').onclick=()=>{audioOn();if(cur?.id==='village')return addLog('你已經在村子裡了。');send({t:'ret'});};
$('#bBag').onclick=()=>{audioOn();bagSel=null;openPanel('bag');};
$('#bAuto').onclick=()=>{audioOn();toggleAuto();};
$('#bSocial').onclick=()=>{audioOn();openPanel('social');};
$('#bPk').onclick=()=>{ if(!ME) return; if(ME.lv<PK_MIN_LV) return addLog(`Lv.${PK_MIN_LV} 以上才能開啟 PK。`); send({t:'pk',on:!ME.pk}); };

/* ---------- auto hunt (client brain, server validates everything) ---------- */
const autoBlk=new Map(); let autoT=0, potT=0, skillT=0, tgtSince=0, tgtHp=0;
function toggleAuto(){ auto=!auto; $('#bAuto').classList.toggle('on',auto); addLog(auto?'自動狩獵開啟：會自動找怪、放技能、低血喝水。':'自動狩獵關閉。'); }
function autoThink(dt){ if(!auto||!ME||!P||P.dead) return; autoT-=dt; potT-=dt; skillT-=dt;
  const hp=ME.hp/ME.maxHP;
  if(potT<=0&&hp<.45){ if(ME.inv.big&&hp<.3){send({t:'use',k:'big'});potT=.6;} else if(ME.inv.pot){send({t:'use',k:'pot'});potT=.6;} else if(ME.inv.big){send({t:'use',k:'big'});potT=.6;} }
  if(potT<=0&&ME.mp<ME.maxMP*.2&&ME.inv.blue){send({t:'use',k:'blue'});potT=.6;}
  if(cur.id==='village') return;
  if(hp<.3&&!ME.inv.pot&&!ME.inv.big){ if(ME.inv.ret){ send({t:'ret'}); toggleAuto(); addLog('藥水用完了，已自動回村。'); } return; }
  const t=myTarget();
  if(t){ if(t.hp!==tgtHp){tgtHp=t.hp;tgtSince=now;} if(now-tgtSince>7){ autoBlk.set(t.id,now+10); myTargetId=null; send({t:'stop'}); }
    if(skillT<=0&&ME.mp>=CLS[ME.cls].sk.mp&&ME.skCd<=0&&cheb(P,t)<=(CLS[ME.cls].range<=1?1:CLS[ME.cls].range)&&(t.boss||t.hp>ME.atk*2)){ send({t:'skill'}); skillT=1; }
    return; }
  if(autoT>0) return; autoT=.4;
  let best=null,bd=1e9; for(const m of cur.mobs){ if(autoBlk.get(m.id)>now) continue; const t2=MT[m.k]; if(m.boss&&(ME.lv<t2.lv||hp<.7)) continue; if(t2.lv>ME.lv+5) continue;
    const d=Math.hypot(m.x-P.x,m.y-P.y)+(m.boss?6:0); if(d<bd){bd=d;best=m;} }
  if(best){ myTargetId=best.id; tgtSince=now; tgtHp=best.hp; send({t:'attack',id:best.id}); }
}

/* ---------- chat & log ---------- */
const CHN={sys:'系統',all:'全頻',map:'地圖',party:'隊伍',clan:'血盟',w:'私訊'};
function addLine(html){ logs.push(html); if(logs.length>60) logs.shift(); const el=$('#log'); el.innerHTML=logs.slice(-40).join(''); el.scrollTop=el.scrollHeight; }
function addLog(msg){ addLine(`<div class="l-log">${msg}</div>`); }
function addChat(m){ const who=m.ch==='w'?(m.from===ME?.name?`→${esc(m.to)}`:`${esc(m.from)}→你`):esc(m.from);
  addLine(`<div class="l-${m.ch}"><b>[${CHN[m.ch]||m.ch}] ${who}</b>：${esc(m.msg)}</div>`);
  if(m.ch!=='sys'&&m.ch!=='w'){ const e=[...players.values()].find(p=>p.name===m.from); if(e) floats.push({x:fx(e),y:fy(e)-80,txt:m.msg.slice(0,18),col:'#ffffff',t:-.8,big:false}); } }
$('#chatCh').onchange=e=>{chatCh=e.target.value;};
$('#fChat').onsubmit=e=>{ e.preventDefault(); const v=$('#chatIn').value.trim(); if(!v) return; $('#chatIn').value='';
  const w=v.match(/^\/(\S+)\s+(.+)/); if(w) send({t:'chat',ch:'w',to:w[1],msg:w[2]}); else send({t:'chat',ch:chatCh,msg:v}); $('#chatIn').blur(); };
let toastT=null; function toast(msg){ const el=$('#toast'); el.textContent=msg; el.hidden=false; clearTimeout(toastT); toastT=setTimeout(()=>el.hidden=true,3500); }

/* ---------- panels ---------- */
let curPanel=null, curArg=null;
const PT={shop:'雜貨商 莉娜',smith:'鐵匠 巴爾克',bag:'角色',guard:'守衛 艾德',social:'社交',player:'玩家',clan:'血盟',rank:'排行榜',who:'在線玩家',ask:'邀請',trade:'交易'};
function openPanel(k,arg,keep){ if(keep&&curPanel!==k) return; curPanel=k; curArg=arg; const body=$('#pBody'),st=keep?body.scrollTop:0; $('#pTitle').textContent=k==='player'&&arg?arg.name:PT[k]; body.innerHTML=panelHTML(k,arg); $('#overlay').hidden=false; body.scrollTop=st; }
function closePanel(force){ if(curPanel==='trade'&&!force) send({t:'tcancel'}); $('#overlay').hidden=true; curPanel=null; armed=null; }
$('#pClose').onclick=()=>closePanel();
$('#overlay').addEventListener('pointerdown',e=>{if(e.target.id==='overlay')closePanel();});
function panelHTML(k,arg){ const c=ME; if(!c) return '';
  if(k==='guard') return `<p>艾德：「現在村子裡不只你一個冒險者了。記住：村莊是安全區，出了傳送陣就可能被人攻擊。」</p>
    <table><tr><td>哭泣森林</td><td>Lv.1～10・Boss 腐木樹妖</td></tr><tr><td>骸骨荒原</td><td>Lv.10～18・Boss 白骨巨像</td></tr><tr><td>熔岩洞窟</td><td>Lv.18 以上・Boss 熾焰領主</td></tr></table>
    <p style="margin-top:10px">「Lv.${PK_MIN_LV} 以上可以開 PK。殺死沒有紅名的人會變紅名，紅名死掉會掉裝備。打怪可以慢慢把正義值洗回來。」</p><p class="ds">你的正義值：${c.lawful}</p>`;
  if(k==='shop') return `<p>莉娜：「藥水多帶一點，外面的人跟怪一樣兇。」</p>`+SHOP.map(s=>`<div class="row"><div class="bcell" style="width:40px;flex:none">${icon(INVI[s.k])}</div><div class="info"><div class="nm">${s.n}</div><div class="ds">${s.d}・${s.p} 金幣・持有 ${c.inv[s.k]||0}</div></div>${s.q.map(q=>`<button class="btn" data-buy="${s.k}" data-q="${q}" ${c.gold<s.p*q?'disabled':''}>買 ${q}</button>`).join('')}</div>`).join('')+`<div class="sect">你的金幣：${c.gold.toLocaleString()}</div>`;
  if(k==='smith'){ const fx=arg&&arg.c?arg:null;
    const g=sl=>{const it=c.eq[sl];if(!it||['n','r1','r2'].includes(sl))return'';const kind=sl==='w'?'w':'a',sc=kind==='w'?'ws':'as',r=enchRate(kind,it.en),risky=r<1,have=c.inv[sc]||0;
      const label=armed===sl?`再按一次確定衝 +${it.en+1}（失敗會爆）`:`使用${INV_N[sc]}（持有 ${have}）`;
      return`<div class="gear"><div class="gname ${itemCls(it)}">${itemName(it,c.cls)}</div><div class="gstat">${itemStat(it)}</div><div class="rate ${risky?'risk':''}">衝 +${it.en+1} 成功率 ${Math.round(r*100)}%${risky?'，失敗裝備爆掉':'（安全範圍）'}</div><button class="btn ${armed===sl?'hot':''}" data-ench="${sl}" ${have?'':'disabled'}>${label}</button></div>`;};
    const shopGear=SHOP_GEAR.filter(([sl])=>!(sl==='s'&&NOSHIELD[c.cls])).map(([sl,t])=>{const pr=shopPrice(sl,t),it={s:sl,t,en:0};return`<div class="row"><div class="bcell" style="width:40px;flex:none">${itIcon(it)}</div><div class="info"><div class="nm ${itemCls(it)}">${itemBaseName(it,c.cls)}</div><div class="ds">${itemStat(it)}・${pr.toLocaleString()} 金幣</div></div><button class="btn" data-gear="${sl}${t}" ${c.gold<pr?'disabled':''}>購買</button></div>`;}).join('');
    return `<p>巴爾克：「武器 +6、防具 +4 以內不會爆。衝到 +8 全伺服器都會知道。」</p>${SLOTS.map(([sl])=>g(sl)).join('')}<div id="fx" class="${fx?fx.c:''}">${fx?esc(fx.t):''}</div><div class="sect">購買裝備（放進背包）</div>${shopGear}<div class="sect">你的金幣：${c.gold.toLocaleString()}</div>`; }
  if(k==='bag'){ const gs=c.gear||{};
    let det=''; if(bagSel){ const it=bagSel.from==='eq'?c.eq[bagSel.k]:c.bag[bagSel.k]; if(it){ const cmp=bagSel.from==='bag'?c.eq[eqSlotFor(c.eq,it)]:null,ban=it.s==='s'&&NOSHIELD[c.cls];
      det=`<div class="detail"><div class="gname ${itemCls(it)}">${itemName(it,c.cls)}</div><div class="gstat">${SLOTN[it.s]}・${itemStat(it)}${it.q===2?'・稀有':it.q===1?'・魔法':''}</div>${cmp?`<div class="ds">目前裝備：${itemName(cmp,c.cls)}（${itemStat(cmp)}）</div>`:''}${ban?`<div class="ds" style="color:var(--danger)">${CLS[c.cls].n}不能使用盾牌</div>`:''}
      <div class="acts2">${bagSel.from==='bag'?`<button class="btn" data-eq="${bagSel.k}" ${ban?'disabled':''}>裝備</button><button class="btn" data-sell="${bagSel.k}" ${cur.id!=='village'?'disabled':''}>賣出 ${sellP(it)}</button>`:(bagSel.k==='w'||bagSel.k==='a'?'<span class="ds">武器和盔甲不能空著</span>':`<button class="btn" data-uneq="${bagSel.k}">卸下</button>`)}</div></div>`; } }
    const eqg=SLOTS.map(([sl,lab])=>{const it=c.eq[sl];return`<button class="slot ${bagSel&&bagSel.from==='eq'&&bagSel.k===sl?'sel':''}" data-pick="eq:${sl}" aria-label="${lab}">${it?itIcon(it):''}<span class="lb">${lab}</span>${it&&it.en?`<span class="en">+${it.en}</span>`:''}</button>`;}).join('');
    const bg=c.bag.map((it,i)=>`<button class="bcell q${it.q|0} ${bagSel&&bagSel.from==='bag'&&bagSel.k===i?'sel':''}" data-pick="bag:${i}" aria-label="${esc(itemName(it,c.cls))}">${itIcon(it)}${it.en?`<span class="en">+${it.en}</span>`:''}</button>`).join('');
    const st=Object.keys(STATN).map(k=>`<div>${STATN[k]} <span class="ds">${STATD[k]}</span></div><div class="v">${c[k]}${(gs[k]||0)?`<span class="ds"> (裝備+${gs[k]})</span>`:''}</div><button class="btn" data-stat="${k}" ${c.pts>0?'':'disabled'}>＋</button>`).join('');
    return `<table><tr><td>${esc(c.name)}</td><td>${CLS[c.cls].n}（${c.g==='f'?'女':'男'}）Lv.${c.lv}（${c.exp}/${c.need}）</td></tr><tr><td>正義值</td><td style="color:${c.lawful<0?'var(--danger)':'inherit'}">${c.lawful}${c.lawful<0?'（紅名）':''}</td></tr></table>
    <div class="sect">裝備</div><div class="eqgrid">${eqg}</div>${bagSel&&bagSel.from==='eq'?det:''}
    <div class="sect">能力值　剩餘點數 <span style="color:${c.pts?'var(--gold)':'var(--dim)'}">${c.pts}</span></div><div class="stats">${st}</div>${c.pts?`<button class="btn" style="width:100%;margin-top:6px" data-stat="auto">把點數全部加到主屬性（${CLS[c.cls].main}）</button>`:''}
    <div class="derived"><span>攻擊力<b>${c.atk}</b></span><span>防禦力<b>${c.def}</b></span><span>HP<b>${c.maxHP}</b></span><span>MP<b>${c.maxMP}</b></span><span>閃避<b>${Math.round(c.dodge*100)}%</b></span><span>爆擊<b>${Math.round(c.crit*100)}%</b></span></div>
    <div class="sect">背包（${c.bag.length}/${BAGMAX}）</div>${c.bag.length?`<div class="bgrid">${bg}</div>`:'<p class="ds">打怪會掉裝備，也可以跟鐵匠買。</p>'}${bagSel&&bagSel.from==='bag'?det:''}
    <div class="sect">道具</div>${Object.keys(INV_N).map(k=>`<div class="row"><div class="bcell" style="width:40px;flex:none">${icon(INVI[k])}</div><div class="info"><div class="nm">${INV_N[k]}</div></div><span class="num">${c.inv[k]||0}</span>${['pot','big','blue'].includes(k)?`<button class="btn" data-use="${k}" ${c.inv[k]?'':'disabled'}>使用</button>`:''}</div>`).join('')}
    <div class="sect">設定</div><button class="btn wide" data-act="mute">${muted?'開啟音效':'關閉音效'}</button>`; }
  if(k==='social'){ const party=c.party;
    return `<div class="sect">PK 模式</div><button class="btn wide ${c.pk?'hot':''}" data-act="pk">${c.pk?'PK 模式開啟中（點這裡關閉）':'開啟 PK 模式'}</button><p class="ds">Lv.${PK_MIN_LV} 以上可用。村莊是安全區。殺死非紅名玩家會讓你變紅名。</p>
    <div class="sect">隊伍${party?`（${party.length}/8）`:''}</div>${party?party.map(m=>`<div class="row"><div class="info"><div class="nm">${esc(m.name)}${m.id===c.id?'（你）':''}</div><div class="ds">${CLS[m.cls].n} Lv.${m.lv}・HP ${Math.ceil(m.hp)}/${m.maxHP}・${MAPDEF[m.map]?.name||''}</div></div></div>`).join('')+`<button class="btn wide" data-act="pleave">離開隊伍</button>`:'<p class="ds">點地圖上的其他玩家可以邀請組隊。隊伍會平分經驗，人越多加成越多。</p>'}
    <form class="inl" data-form="pinvite"><input id="iPinv" placeholder="輸入角色名稱邀請組隊" maxlength="12"><button class="btn">邀請</button></form>
    <div class="sect">血盟</div>${c.clan?`<p>你在血盟「${esc(c.clan)}」${c.clanLeader?'（盟主）':''}</p><button class="btn wide" data-act="cinfo">查看血盟</button>`:`<p class="ds">Lv.${CLAN_MIN_LV} 以上、${CLAN_COST.toLocaleString()} 金幣可以創立血盟。</p><form class="inl" data-form="ccreate"><input id="iClan" placeholder="血盟名稱（2～10 字）" maxlength="10"><button class="btn">創立</button></form>`}
    <div class="sect">其他</div><div class="row2"><button class="btn" data-act="rank">排行榜</button><button class="btn" data-act="who">在線玩家</button></div>
    <div class="sect">帳號</div><div class="row2"><button class="btn" data-act="switch">換角色</button><button class="btn" data-act="logout">登出</button></div>`; }
  if(k==='player'){ const p=arg; return `<p>${CLS[p.cls].n} Lv.${p.lv}${p.clan?`・血盟「${esc(p.clan)}」`:''}${p.flags&1?'・<span style="color:var(--danger)">紅名</span>':''}</p>
    <div class="row2"><button class="btn" data-pact="pinvite">邀請組隊</button><button class="btn" data-pact="treq">交易</button></div>
    <div class="row2"><button class="btn" data-pact="whisper">私訊</button>${c.clanLeader&&!p.clan?`<button class="btn" data-pact="cinvite">邀請入盟</button>`:''}</div>
    <p class="ds">要攻擊這個玩家，先在「社交」開啟 PK 模式。</p>`; }
  if(k==='ask') return `<p>${esc(arg.msg)}</p><div class="row2"><button class="btn" data-yes="1">接受</button><button class="btn ghost" data-no="1">拒絕</button></div>`;
  if(k==='clan'){ const cl=arg; if(!cl) return '<p>你沒有血盟。</p>';
    return `<p>盟主：${esc(cl.leader)}・成員 ${cl.members.length} 人</p>${cl.notice?`<p class="ds">公告：${esc(cl.notice)}</p>`:''}
    <table>${cl.members.map(m=>`<tr><td>${esc(m.name)}${m.name===cl.leader?'（盟主）':''}</td><td style="color:${m.online?'#9fe09f':'var(--dim)'}">${m.online?'在線':'離線'}</td></tr>`).join('')}</table>
    ${c.clanLeader?`<form class="inl" data-form="cinvite"><input id="iCinv" placeholder="邀請玩家（角色名稱）" maxlength="12"><button class="btn">邀請</button></form><form class="inl" data-form="cnotice"><input id="iNotice" placeholder="血盟公告" maxlength="80"><button class="btn">發布</button></form>`:''}
    <button class="btn wide ${armed==='cleave'?'hot':''}" data-act="cleave">${armed==='cleave'?'再按一次確定退出血盟':'退出血盟'}</button>`; }
  if(k==='rank') return `<table><tr><td>#</td><td>角色</td><td>等級</td></tr>${arg.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.name)} <span class="ds">${CLS[r.cls]?.n||''}${r.clan?'・'+esc(r.clan):''}</span></td><td>Lv.${r.lv}</td></tr>`).join('')}</table>`;
  if(k==='who') return `<p class="ds">目前在線 ${arg.length} 人</p><table>${arg.map(r=>`<tr><td>${esc(r.name)} <span class="ds">${CLS[r.cls]?.n||''}${r.clan?'・'+esc(r.clan):''}</span></td><td>Lv.${r.lv}・${esc(r.map||'')}</td></tr>`).join('')}</table>`;
  if(k==='trade'){ const t=arg; if(!t) return '';
    const sel=new Set(t.mine.idx); const offer=(side,cls)=>side.items.length?side.items.map(it=>`<div class="row"><div class="bcell" style="width:36px;flex:none">${itIcon(it,cls)}</div><div class="info"><div class="nm ${itemCls(it)}">${itemName(it,cls)}</div><div class="ds">${itemStat(it)}</div></div></div>`).join(''):'<p class="ds">（還沒放東西）</p>';
    return `<p>和 <b>${esc(t.with)}</b> 交易。任何一方改動內容，雙方都要重新確認。</p>
    <div class="sect">對方給你 ${t.theirs.ok?'<span style="color:#9fe09f">✓ 已確認</span>':''}</div>${offer(t.theirs,t.theirs.cls)}<p>金幣：${t.theirs.gold.toLocaleString()}</p>
    <div class="sect">你給對方 ${t.mine.ok?'<span style="color:#9fe09f">✓ 已確認</span>':''}</div>${offer(t.mine,c.cls)}
    <form class="inl" data-form="tgold"><input id="iTgold" type="number" min="0" max="${c.gold}" value="${t.mine.gold}" aria-label="給對方的金幣"><button class="btn">設定金幣</button></form>
    <div class="ds">點背包裡的裝備放進交易或拿回來：</div><div class="bgrid">${c.bag.map((it,i)=>`<button class="bcell q${it.q|0} ${sel.has(i)?'sel':''}" data-tput="${i}" aria-label="${esc(itemName(it,c.cls))}">${itIcon(it)}</button>`).join('')}</div>
    <div class="row2" style="margin-top:10px"><button class="btn ${t.mine.ok?'on':''}" data-act="tok">${t.mine.ok?'等待對方確認…':'確認交易'}</button><button class="btn ghost" data-act="tcancel">取消</button></div>`; }
  return ''; }
$('#pBody').addEventListener('submit',e=>{ e.preventDefault(); const f=e.target.dataset.form,v=id=>($(id)?.value||'').trim();
  if(f==='pinvite'&&v('#iPinv')) send({t:'pinvite',name:v('#iPinv')});
  if(f==='ccreate'&&v('#iClan')) send({t:'ccreate',name:v('#iClan')});
  if(f==='cinvite'&&v('#iCinv')) send({t:'cinvite',name:v('#iCinv')});
  if(f==='cnotice') send({t:'cnotice',text:v('#iNotice')});
  if(f==='tgold') send({t:'tput',gold:+v('#iTgold')||0}); });
$('#pBody').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b||b.type==='submit'&&b.form) return; audioOn(); const D=b.dataset;
  if(D.act==='mute'){ muted=!muted; return openPanel('bag'); }
  if(D.act==='pk') return $('#bPk').onclick();
  if(D.act==='pleave') return send({t:'pleave'});
  if(D.act==='cinfo') return send({t:'cinfo'});
  if(D.act==='cleave'){ if(armed!=='cleave'){armed='cleave';return openPanel('clan',curArg);} armed=null; send({t:'cleave'}); return closePanel(); }
  if(D.act==='rank') return send({t:'rank'});
  if(D.act==='who') return send({t:'who'});
  if(D.act==='switch'||D.act==='logout'){ if(D.act==='logout'){ send({t:'logout'}); setToken(null); } try{ws.close();}catch{} closePanel(true); return; }
  if(D.act==='tok') return send({t:'tok'});
  if(D.act==='tcancel') { send({t:'tcancel'}); return closePanel(true); }
  if(D.tput!=null) return send({t:'tput',i:+D.tput});
  if(D.pact){ const p=curArg; if(D.pact==='whisper'){ closePanel(); $('#chatIn').value='/'+p.name+' '; $('#chatIn').focus(); return; } send({t:D.pact,name:p.name}); return closePanel(); }
  if(D.yes||D.no){ const a=curArg; if(D.yes) send({t:a.kind==='party'?'paccept':a.kind==='trade'?'taccept':'caccept',from:a.from,clan:a.from}); return closePanel(); }
  if(D.pick){ const [f,k]=D.pick.split(':'); const key=f==='bag'?+k:k; bagSel=bagSel&&bagSel.from===f&&bagSel.k===key?null:{from:f,k:key}; if(f==='eq'&&!ME.eq[key])bagSel=null; return openPanel('bag'); }
  if(D.stat){ return send({t:'stat',k:D.stat}); }
  if(D.uneq){ bagSel=null; return send({t:'unequip',s:D.uneq}); }
  if(D.eq!=null){ bagSel=null; return send({t:'equip',i:+D.eq}); }
  if(D.sell!=null){ bagSel=null; return send({t:'sell',i:+D.sell}); }
  if(D.use) return send({t:'use',k:D.use});
  if(D.buy) return send({t:'buy',k:D.buy,q:+D.q});
  if(D.gear) return send({t:'buygear',s:D.gear[0],tier:+D.gear[1]});
  if(D.ench){ const sl=D.ench,it=ME.eq[sl],r=enchRate(sl==='w'?'w':'a',it.en); if(r<1&&armed!==sl){ armed=sl; return openPanel('smith'); } armed=null; return send({t:'enchant',s:sl}); }
});
function showAsk(m){ SFX.portal(); openPanel('ask',m); }
function onTrade(m){ if(m.done){ lastTrade=null; if(curPanel==='trade') closePanel(true); return; } lastTrade=m; openPanel('trade',m); }

/* ---------- HUD ---------- */
let hudT=0;
function hud(force,dt=0){ hudT-=dt; if(!force&&hudT>0) return; hudT=.15; if(!ME) return; const c=ME;
  $('#lv').textContent='Lv.'+c.lv; $('#clsName').textContent=c.name;
  $('#hpF').style.width=Math.max(0,c.hp/c.maxHP*100)+'%'; $('#hpT').textContent=Math.max(0,c.hp)+' / '+c.maxHP;
  $('#mpF').style.width=(c.mp/c.maxMP*100)+'%'; $('#mpT').textContent=c.mp+' / '+c.maxMP;
  $('#xpF').style.width=(c.exp/c.need*100)+'%'; $('#gold').textContent=c.gold.toLocaleString();
  $('#cPot').textContent='紅'+c.inv.pot+(c.inv.big?' 濃'+c.inv.big:''); $('#cRet').textContent='×'+c.inv.ret;
  $('#skN').textContent=CLS[c.cls].sk.n; $('#skM').textContent=c.skCd>0?'冷卻中':CLS[c.cls].sk.mp+' MP';
  $('#bPot').classList.toggle('hot',c.hp<c.maxHP*.3&&c.hp>0);
  const bb=$('#bBag small'),lbl=c.pts>0?`點數 ${c.pts}`:'背包'; if(bb.textContent!==lbl){bb.textContent=lbl;bb.style.color=c.pts>0?'var(--gold)':'';}
  $('#online').textContent=players.size>1?`本圖 ${players.size} 人`:'';
}

/* ---------- main loop ---------- */
let last=performance.now();
function frame(t){ const dt=Math.min(.05,(t-last)/1000); last=t; now+=dt;
  if(inGame&&cur&&P){ updateFx(dt); checkPending(); autoThink(dt); draw(); hud(false,dt); }
  requestAnimationFrame(frame); }
resize();
loadAssets().then(()=>{ connect(); requestAnimationFrame(frame); });
// debug / test handle
window.SM={send,toggleAuto,openPanel,get ME(){return ME;},get players(){return players;},get cur(){return cur;},get P(){return P;}};
