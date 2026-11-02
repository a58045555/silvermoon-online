
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
  ASSETS=man.assets; MOBS=man.mobs; SHEETS=man.sheets; NPCIMG=man.npcs; ICONS=man.icons; VFX=man.vfx||{}; UI=man.ui; DECOR=man.decor;
  const ps=[]; const load=(store,k,src)=>{const im=new Image();store[k]=im;ps.push(new Promise(r=>{im.onload=im.onerror=r;}));im.src=src;};
  for(const k in ASSETS)load(AIMG,k,ASSETS[k].src);
  for(const k in MOBS)load(MOBI,k,MOBS[k].src);
  for(const k in SHEETS)load(SHIMG,k,SHEETS[k].src);
  for(const k in NPCIMG)load(NPCI,k,NPCIMG[k].src);
  for(const k in VFX) load(VFXI,k,VFX[k].src);
  if(DECOR){ DECORIMG=new Image(); ps.push(new Promise(r=>{DECORIMG.onload=DECORIMG.onerror=r;})); DECORIMG.src=DECOR.src; }
  if(UI){ document.documentElement.style.setProperty('--uisheet',`url(${UI.src})`); requestAnimationFrame(paintIcons); }
  ICONIMG=new Image(); ps.push(new Promise(r=>{ICONIMG.onload=ICONIMG.onerror=r;})); ICONIMG.src=ICONS.src;
  const st=document.createElement('style');st.textContent=`.ic{background-image:url(${ICONS.src})}`;document.head.appendChild(st);
  await Promise.race([Promise.all(ps),new Promise(r=>setTimeout(r,8000))]);
}
// sprite-sheet icons: <i class="uic" style="--i:N"> gets its background set from the 8-column ui sheet
function setUic(el,i){ el.style.setProperty('--i',i); const z=el.clientWidth||32; el.style.backgroundSize=`${8*z}px auto`; el.style.backgroundPosition=`${-(i%8)*z}px ${-Math.floor(i/8)*z}px`; }
function paintIcons(){ for(const el of document.querySelectorAll('.uic')){ const i=parseInt(getComputedStyle(el).getPropertyValue('--i')); if(!isNaN(i)) setUic(el,i); } }
window.addEventListener('resize',()=>requestAnimationFrame(paintIcons));
function icon(idx){ const x=(idx%ICONS.cols)*ICONS.sz,y=Math.floor(idx/ICONS.cols)*ICONS.sz; return `<span class="ic" style="background-position:-${x}px -${y}px"></span>`; }
function iconIdx(it,cls){ if(it.s==='w')return CLSI[cls||ME.cls]*5+it.t; const o={a:20,h:25,c:30,g:35,b:40,s:45}[it.s]; if(o!=null)return o+it.t; if(it.s==='n')return 50+[0,0,1,1,2][it.t]; if(it.s==='r')return 53+it.t; return 63; }
const itIcon=(it,cls)=>icon(iconIdx(it,cls));
function itemCls(it){ if(!it)return''; if(it.q===3)return'leg'; if(it.en>=7)return'e7'; if(it.q===2)return't4'; if(it.q===1)return't2'; return['','','','t3','t4'][it.t]||''; }

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
    case 'quest': if(!m.silent) setTimeout(()=>openPanel('story',{title:m.n,text:m.story}),600); return;
    case 'qdone': onQuestDone(m); return;
    case 'event': if(m.k!=='eclipse') return onWorldEvent(m); eclipse=m.on?{end:m.end-Date.now()+performance.now()}:null; if(m.on){ banner={t:4,a:'✦ 月蝕之夜 ✦',b:'怪物加倍・經驗 ×2・稀有掉寶提高'}; SFX.legend(); doShake(6,.5); } return;
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
    return `<div class="ccard2 ${sel?'sel':''}"><img class="pv" src="${pv(sel?createG:'m')}" alt=""><div class="cinfo"><div class="nm">${d.n}</div><div class="ds">${d.d}</div><div class="ds">主屬性 ${d.main}・技能「${SKILLS[c].map(k=>k.n).join("、")}」</div>
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
  cur=getMap(id); OX=cur.H*HW; ents.clear(); players.clear(); cur.mobs=[]; cur.corpses=[]; projs=[]; parts=[]; floats=[]; tgs=[]; vfxs=[]; loot.clear();
  myTargetId=null; pendingAct=null; marker=null; banner={t:3,a:cur.name,b:cur.tip||(id==='village'?'安全區・不能 PK':'')}; SFX.portal();
  if(ME){ P=mkPlayer([ME.id,ME.name,ME.cls,ME.g,x,y,100,ME.lv,0,ME.clan||'',2,ME.eq?.w?.en||0]); }
  closePanel(true);
  if(id==='village') setTimeout(onArriveVillage,800);
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
    e.x=a[2]; e.y=a[3]; e.hp=a[4]; e.maxhp=a[5]; e.face=a[6]; e.dir=a[7]; e.stun=a[8]; e.tele=a[9]/10; e.nm=a[10]||null; list.push(e); }
  for(const m of cur.mobs) if(!ms.has(m.id)) ents.delete(m.id);
  cur.mobs=list;
  if(s.l){ gone=new Map(loot); loot.clear();
    for(const a of s.l){ const o=gone.get(a[0])||{id:a[0],born:now-1,tries:0}; gone.delete(a[0]);
      Object.assign(o,{x:a[1],y:a[2],it:a[3].s?a[3]:null,k:a[3].k||null,q:a[4],name:a[5],own:a[6]||null,ownEnd:now+a[7]}); loot.set(o.id,o); } }
  for(const e of s.e) onEvent(e);
}
function onEvent(e){
  const k=e[0];
  if(k==='a'){ const A=ents.get(e[1]),T=ents.get(e[2]); if(!A||!T) return; const kind=e[3];
    const near=P&&Math.hypot(A.x-P.x,A.y-P.y)<14;
    if(A.isPlayer){ { let D=kind.startsWith('skill')||kind==='pierce'?.36:Math.min(.45,(CLS[A.cls]?.spd||.6)*.92); if(A.bf&&A.bf.haste>now) D=Math.min(D,(CLS[A.cls]?.spd||.6)/1.6*.92); A.atkDur=D; A.atkVis=D; } const sx=fx(A),sy=bodyY(A);
      if(kind==='slash'||kind==='slashD'||kind==='skill_knight'||kind==='skill_darkelf'){ A.lunge=.15; { const ang=Math.atan2(bodyY(T)-bodyY(A),fx(T)-fx(A)),big=kind.startsWith('skill'); if(VFXI['slash-gold']) vfx(kind==='skill_knight'?'slash-frost':kind==='skill_darkelf'?'shadow':'slash-gold',(fx(A)+fx(T))/2,(bodyY(A)+bodyY(T))/2-4,{s:big?.75:.5,rot:ang+Math.PI/2,flip:Math.random()<.5}); else slash(A,T,kind==='skill_knight'?'#9fe0ff':kind==='skill_darkelf'?'#8a4cff':kind==='slashD'?'#d8b8ff':'#fff'); } if(near) (kind.startsWith('skill')?SFX.crit:SFX.swing)(); pendingHit(T,null); }
      else if(kind==='arrow'){ pendingHit(T,shoot({x:sx+A.dir*8,y:sy,tgt:T,kind:'arrow',spd:520})); if(near) SFX.arrow(); }
      else if(kind==='skill_ranger'){ for(let i=0;i<3;i++) pendingHit(T,shoot({x:sx+A.dir*8,y:sy,tgt:T,kind:'arrow',spd:560+i*60,col:'#b8ffb0'})); if(near) SFX.arrow(); }
      else if(kind==='bolt'){ pendingHit(T,shoot({x:sx+A.dir*9,y:sy-22,tgt:T,kind:'bolt',spd:360})); if(near) SFX.bolt(); }
      else if(kind==='pierce'){ pendingHit(T,shoot({x:sx+A.dir*8,y:sy,tgt:T,kind:'arrow',spd:950,col:'#ffd84a',glow:1})); if(near) SFX.crit(); }
      else if(kind==='skill_mage'){ pendingHit(T,shoot({x:sx+A.dir*9,y:sy-22,tgt:T,kind:'fire',spd:300,aoe:1})); if(near) SFX.fire(); }
    } else { A.atkAnim=.25; A.lg=.18; A.mAtk=.5; A.lgA=Math.atan2(fy(T)-fy(A),fx(T)-fx(A));
      if(kind==='spore'||kind==='mfire') pendingHit(T,shoot({x:fx(A),y:bodyY(A),tgt:T,kind:kind==='mfire'?'mfire':'spore',spd:kind==='mfire'?230:180}));
      else { parts.push({back:fy(T)<fy(A)-2,type:'slash',x:(fx(A)+fx(T))/2,y:(bodyY(A)+bodyY(T))/2,ang:A.lgA,t:0,life:.18,c:'#ff6b5e',big:A.boss}); if(near) SFX.swing(); pendingHit(T,null); } }
    return; }
  if(k==='d'){ const T=ents.get(e[1]); if(!T) return; const h={dmg:e[2],flags:e[3],label:e[4]};
    const q=pendingProjFor.get(T.id); if(q&&q.length){ q[0].hits.push(h); return; } showHit(T,h); return; }
  if(k==='k'){ const m=ents.get(e[1]); if(!m) return; cur.corpses.push({m,t:0}); const cx=fx(m),cy=bodyY(m);
    vfx(m.boss?'explosion':'crit',cx,cy,{s:m.boss?1.6:.55,alpha:.9}); burst(cx,cy,m.boss?60:18,['#ffffff','#e8d8b0','#c8b090'],m.boss?260:150);
    if(P&&Math.hypot(m.x-P.x,m.y-P.y)<10) for(let i=0;i<5;i++) part(cx,cy,{type:'coin',vx:rnd(-90,90),vy:rnd(-160,-60),g:300,life:1.4,s:4,c:'#ffd84a',delay:.35});
    if(m.boss){ doShake(10,.5); SFX.level(); } if(myTargetId===m.id) myTargetId=null; ents.delete(m.id); return; }
  if(k==='l'){ const p=ents.get(e[1]); if(p){ levelFx(p); } return; }
  if(k==='h'){ const p=ents.get(e[1]); if(p){ vfx('heal',fx(p),fy(p)+2,{s:.7,follow:p,foot:true}); if(e[2]) float(p,'+'+e[2],'#7fe08a'); else float(p,'完全回復','#7fe08a'); burst(fx(p),fy(p)-10,12,['#7fe08a','#c8ffd0'],70,{g:-70}); if(p===P) SFX.pot(); } return; }
  if(k==='sl'){ const m=ents.get(e[1]); if(m){ m.mAtk=.5; burst(fx(m),fy(m),30,['#c9a060','#8a6a3a','#fff'],180); doShake(9,.4); SFX.slam(); } return; }
  if(k==='tg'){ tgs.push({x:e[1],y:e[2],r:e[3],t:0,life:e[4],kind:e[5]}); if(P&&Math.hypot(P.x-e[1],P.y-e[2])<=e[3]+.3) SFX.warn(); return; }
  if(k==='tb'){ let bi=-1,bd=1e9; tgs.forEach((g,i)=>{const d=Math.abs(g.x-e[1])+Math.abs(g.y-e[2])+Math.abs(g.r-e[3])+(g.life-g.t);if(d<bd){bd=d;bi=i;}}); if(bi>=0) tgs.splice(bi,1);
    const X=PX(e[1]+.5,e[2]+.5),Y=PY(e[1]+.5,e[2]+.5),kind=e[4],cols=kind==='fire'?['#ffd84a','#ff7a2a','#c4301a']:kind==='bone'?['#f0ead8','#c8bea0','#fff']:kind==='root'?['#6a9a40','#3a5a20','#c8a040']:['#c9a060','#8a6a3a','#fff'];
    if(kind==='fire') vfx('explosion',X,Y-10,{s:.55*e[3]}); else if(kind==='root') vfx('poison',X,Y-8,{s:.9*e[3]}); else vfx('shockwave',X,Y,{s:.42*e[3]});
    burst(X,Y-6,kind==='slam'?34:20,cols,kind==='fire'?200:150,kind==='fire'?{g:-60}:{}); parts.push({type:'ring',x:X,y:Y,t:0,life:.35,r:TS*e[3]*1.4,c:kind==='fire'?'255,140,40':'230,220,190'});
    if(P&&Math.hypot(P.x-e[1],P.y-e[2])<9){ doShake(kind==='slam'?9:5,.25); (kind==='fire'?SFX.fire:SFX.slam)(); } return; }
  if(k==='fx'){ const p=ents.get(e[1]); if(!p) return; const kind=e[2],X=fx(p),Y=fy(p); p.bf=p.bf||{};
    if(kind==='whirl'){ vfx('shockwave',X,Y,{s:.75}); vfx('slash-frost',X,Y-18,{s:.9,rot:0}); vfx('slash-frost',X,Y-14,{s:.9,rot:Math.PI,delay:.08}); freeze(.05); for(let i=0;i<8;i++){ const a=i/8*6.28; parts.push({type:'slash',x:X+Math.cos(a)*30,y:Y-16+Math.sin(a)*15,ang:a+1.57,t:0,life:.25,c:'#9fe0ff',big:true}); } parts.push({type:'ring',x:X,y:Y,t:0,life:.3,r:TS*2.4,c:'160,220,255'}); SFX.crit(); doShake(4,.15); }
    if(kind==='nova'){ vfx('frost-nova',X,Y,{s:1.05}); freeze(.05); parts.push({type:'ring',x:X,y:Y,t:0,life:.45,r:TS*4,c:'170,220,255'}); burst(X,Y-10,40,['#bfe8ff','#ffffff','#7ab8ff'],260,{g:0}); SFX.bolt(); doShake(4,.15); }
    if(kind==='iron'){ vfx('crit',X,Y-24,{s:.8,alpha:.85}); p.bf.iron=now+8; parts.push({type:'ring',x:X,y:Y-14,t:0,life:.5,r:TS*1.8,c:'120,180,255'}); SFX.ok(); }
    if(kind==='haste'){ vfx('shockwave',X,Y,{s:.45}); p.bf.haste=now+8; burst(X,Y-10,24,['#b8ffb0','#7fe08a','#fff'],140,{g:-80}); SFX.portal(); }
    if(kind==='shadow'){ vfx('shadow',X,Y-18,{s:1.1}); p.bf.shadow=now+6; burst(X,Y-14,30,['#3a2a5a','#8a4cff','#1a1028'],120,{g:-40}); SFX.portal(); }
    if(kind==='enrage'){ p.enr=true; burst(X,Y-40,80,['#ff4a1a','#ffd84a','#c4301a'],320); doShake(14,.7); SFX.boom(); banner={t:3,a:'卡爾薩 狂暴化',b:'火雨變得更密集了！'}; }
    return; }
  if(k==='ps'){ const m=ents.get(e[1]); if(m){ m.psEnd=now+e[2]; vfx('poison',fx(m),bodyY(m),{s:.8,follow:m}); } return; }
  if(k==='ld'){ const L=loot.get(e[1]); if(!L) return; L.born=now; const near=P&&Math.hypot(L.x-P.x,L.y-P.y)<14;
    if(e[2]>=3){ SFX.legend(); doShake(8,.5); banner={t:3.5,a:'✦ 傳說掉落 ✦',b:L.name}; burst(PX(L.x+.5,L.y+.5),PY(L.x+.5,L.y+.5)-20,60,['#ffd84a','#ff9a3c','#fff6c0'],300,{g:-40}); }
    else if(e[2]===2&&near){ SFX.rare(); } else if(e[2]===1&&near) SFX.magic(); return; }
  if(k==='lp'){ const L=gone.get(e[1])||loot.get(e[1]),p=ents.get(e[2]); if(L&&p){ const X=PX(L.x+.5,L.y+.5),Y=PY(L.x+.5,L.y+.5)-12; burst(X,Y,L.q>=2?24:8,L.q>=3?['#ffd84a','#ff9a3c']:L.q===2?['#ffd84a','#fff6c0']:L.q===1?['#8fd0ff','#fff']:['#fff','#e8d8b0'],110,{g:-120}); if(p===P){ L.q>=1?SFX.ok():SFX.coin(); } } return; }
  if(k==='pd'){ const p=ents.get(e[1]); if(p){ p.dead=1; burst(fx(p),bodyY(p),20,['#c4433a','#ff8a7a'],120); if(p===P){ SFX.die(); myTargetId=null; auto&&toggleAuto(); } } return; }
}
const pendingProjFor=new Map();
function pendingHit(T,proj){ if(!proj) return; let q=pendingProjFor.get(T.id); if(!q){q=[];pendingProjFor.set(T.id,q);} q.push(proj); proj.hits=[]; }
function showHit(T,h){
  const miss=h.flags&2, crit=h.flags&1, isMe=T===P;
  if(miss){ float(T,T.isPlayer?'閃避':'MISS',T.isPlayer?'#9fd0ff':'#aaa'); return; }
  T.hurt=.12; if(!T.isPlayer){ T.kb=T.boss?.3:1; const a=Math.random()*6.28; T.kbx=Math.cos(a)*.3; T.kby=Math.sin(a)*.3; }
  if(h.flags&8){ float(T,'毒 '+h.dmg,'#9be06a'); burst(fx(T),bodyY(T),4,['#9be06a','#4a8a2a'],50,{g:-60}); return; }
  const col=isMe?'#ff6b5e':T.isPlayer?'#ffb070':crit?'#ffd75e':h.label?'#9fe0ff':'#fff';
  float(T,(h.label?h.label+' ':'')+(isMe?'-':'')+h.dmg+(crit?'!':''),col,crit||(!isMe&&!!h.label));
  burst(fx(T),bodyY(T),crit?14:6,crit?['#fff6c0','#ffd84a','#ff9a3c']:isMe?['#c4433a','#ff8a7a']:['#fff','#ffe7a3'],crit?200:120);
  if(!isMe){ vfx(crit?'crit':'hit',fx(T)+rnd(-4,4),bodyY(T)+rnd(-4,4),{s:crit?(T.boss?1.3:.9):(T.boss?.9:.6)}); if(crit&&P&&Math.hypot(T.x-P.x,T.y-P.y)<12) freeze(T.boss?.09:.06); else if(h.label) freeze(.035); }
  if(isMe){ hurtFlash=.25; SFX.hurt(); doShake(3,.12); } else if(P&&Math.hypot(T.x-P.x,T.y-P.y)<12){ crit?SFX.crit():SFX.hit(); if(crit){doShake(5,.15);} }
}
function onMe(c){
  const first=!ME; const prevLv=ME?.lv; ME=c;
  if(P){ P.eq.w.en=c.eq.w.en|0; }
  if(prevLv&&c.lv>prevLv){ SFX.level(); const L=SKILLS[c.cls].find(k=>k.lv>prevLv&&k.lv<=c.lv); if(L){ banner={t:3.5,a:'學會新技能',b:`${L.n}：${L.d}`}; } }
  (c.cds||[]).forEach((v,i)=>cdEnd[i]=now+v);
  if(curPanel&&['bag','shop','smith','social','quest','guard','auto'].includes(curPanel)) openPanel(curPanel,curArg,true);
  hud(true);
  $('#bPk').classList.toggle('hot',!!c.pk);
}

/* ---------- telegraphs, ground loot, quest tracker ---------- */
let invasion=null, wboss=false, eclipse=null, tgs=[], gone=new Map(), trackRect=null, ICONIMG=null; const loot=new Map(), cdEnd=[0,0,0];
function lootList(){ return loot.values(); }
function canPickLoot(L){ return !L.own||!ME||L.own.includes(ME.id)||now>L.ownEnd; }
function lootIcon(L){ return L.it?iconIdx(L.it,ME?.cls):(INVI[L.k]??63); }
const RCOL=['230,220,200','90,150,255','255,210,80','255,140,30'];
function drawGroundFx(){
  for(const L of loot.values()){ const X=PX(L.x+.5,L.y+.5)-cam.x,Y=PY(L.x+.5,L.y+.5)-cam.y; if(X<-40||X>VW+40||Y<-60||Y>VH+40) continue;
    const age=now-L.born,h=age<.55?Math.sin(age/.55*Math.PI)*(L.q>=2?40:26):0,bob=age>=.55?Math.sin(now*3+L.x)*1.5:0;
    ctx.fillStyle='rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(X,Y,10,4,0,0,7); ctx.fill();
    if(L.q>=1){ const g=ctx.createRadialGradient(X,Y,0,X,Y,22); g.addColorStop(0,`rgba(${RCOL[L.q]},.55)`); g.addColorStop(1,`rgba(${RCOL[L.q]},0)`); ctx.fillStyle=g; ctx.fillRect(X-22,Y-12,44,24); }
    if(ICONIMG&&ICONIMG.naturalWidth){ const i=lootIcon(L),sz=ICONS.sz; ctx.drawImage(ICONIMG,(i%ICONS.cols)*sz,Math.floor(i/ICONS.cols)*sz,sz,sz,Math.round(X-12),Math.round(Y-22-h+bob),24,24); }
    else { ctx.fillStyle='#e8d8b0'; ctx.fillRect(X-5,Y-12-h,10,10); } } }
function drawPillars(){
  if(eclipse){ const a=.16+.04*Math.sin(now*1.5); ctx.fillStyle=`rgba(120,0,40,${a})`; ctx.fillRect(0,0,VW,VH);
    const mx=VW*.6,my=34; if(VW>300){ ctx.fillStyle='rgba(180,30,40,.85)'; ctx.beginPath(); ctx.arc(mx,my,18,0,7); ctx.fill(); ctx.fillStyle='rgba(20,0,10,.9)'; ctx.beginPath(); ctx.arc(mx+7,my-3,16,0,7); ctx.fill(); } }
  for(const g of tgs){ const X=PX(g.x+.5,g.y+.5)-cam.x,Y=PY(g.x+.5,g.y+.5)-cam.y,rx=g.r*HW*1.414,ry=g.r*HH*1.414,k=Math.min(1,g.t/g.life);
    if(X<-rx-20||X>VW+rx+20||Y<-ry-20||Y>VH+ry+20) continue; const col=g.kind==='fire'?'255,90,20':'225,40,30';
    ctx.fillStyle=`rgba(${col},${.1+k*.15})`; ctx.beginPath(); ctx.ellipse(X,Y,rx,ry,0,0,7); ctx.fill();
    ctx.fillStyle=`rgba(${col},${.25+k*.2})`; ctx.beginPath(); ctx.ellipse(X,Y,rx*k,ry*k,0,0,7); ctx.fill();
    ctx.strokeStyle=`rgba(255,${g.kind==='fire'?160:90},70,${.55+.45*Math.abs(Math.sin(now*(8+k*14)))})`; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(X,Y,rx,ry,0,0,7); ctx.stroke(); }
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(const L of loot.values()){ if(!L.q) continue; const X=PX(L.x+.5,L.y+.5)-cam.x,Y=PY(L.x+.5,L.y+.5)-cam.y; if(X<-40||X>VW+40||Y<-260||Y>VH+40) continue;
    const H=[0,90,150,260][L.q],w=[0,8,12,18][L.q],grow=Math.min(1,(now-L.born)/.5),pulse=.75+.25*Math.sin(now*4+L.x*1.7),c=RCOL[L.q],top=Y-H*grow;
    let g=ctx.createLinearGradient(0,top,0,Y); g.addColorStop(0,`rgba(${c},0)`); g.addColorStop(.6,`rgba(${c},${.3*pulse})`); g.addColorStop(1,`rgba(${c},${.6*pulse})`);
    ctx.fillStyle=g; ctx.fillRect(X-w,top,w*2,Y-top);
    g=ctx.createLinearGradient(0,top,0,Y); g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(1,`rgba(255,255,255,${.35*pulse})`); ctx.fillStyle=g; ctx.fillRect(X-w*.3,top+H*.15,w*.6,Y-top-H*.15);
    if(L.q>=3){ ctx.strokeStyle=`rgba(${c},${.5*pulse})`; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(X,Y,26+Math.sin(now*3)*3,12,0,0,7); ctx.stroke(); } }
  ctx.restore();
  drawVfx(); drawAmbient();
  ctx.textAlign='center'; ctx.font='11px '+FONT;
  for(const L of loot.values()){ const X=PX(L.x+.5,L.y+.5)-cam.x,Y=PY(L.x+.5,L.y+.5)-cam.y; if(X<-60||X>VW+60||Y<-40||Y>VH+40) continue;
    if(!L.q&&P&&Math.hypot(L.x-P.x,L.y-P.y)>6) continue; const mine=canPickLoot(L);
    const col=!mine?'#8a8a80':['#e4dac0','#8fd0ff','#ffd86b','#ff9a3c'][L.q]; const t=(L.q>=3?'✦ ':'')+L.name+(!mine?`（${Math.ceil(L.ownEnd-now)}）`:'');
    ctx.fillStyle='rgba(0,0,0,.6)'; const tw=ctx.measureText(t).width; ctx.fillRect(X-tw/2-3,Y+4,tw+6,14); ctx.fillStyle=col; ctx.fillText(t,X,Y+15); } }
function drawAmbient(){ const m=cur; if(!m) return;
  // drifting cloud shadows outdoors in daytime
  if((m.id==='village'||m.id==='forest'||m.id==='waste')&&NIGHT<.2){ for(let i=0;i<3;i++){ const W=900,x=((now*14+i*420)%(W+VW))-W*.5+((i*137)%200),y=((i*263)%Math.max(1,VH))+Math.sin(now*.1+i)*20;
      const g=ctx.createRadialGradient(x,y,0,x,y,220); g.addColorStop(0,'rgba(0,0,0,.10)'); g.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=g; ctx.save(); ctx.scale(1,.5); ctx.fillRect(x-220,y*2-220,440,440); ctx.restore(); } }
  // fireflies in the forest at night, dust in the wastes
  if(m.id==='forest'&&NIGHT>.15&&Math.random()<.5) part(cam.x+rnd(0,VW),cam.y+rnd(VH*.2,VH),{vx:rnd(-8,8),vy:rnd(-8,8),g:0,c:pick(['#e8ff8a','#c8f060']),life:rnd(1.5,3),s:2,type:'leaf'});
  if(m.id==='waste'&&Math.random()<.3) part(cam.x-4,cam.y+rnd(0,VH),{vx:rnd(40,80),vy:rnd(-5,5),g:0,c:'rgba(220,200,160,.5)',life:4,s:2,type:'leaf'});
  // soft vignette
  const g=ctx.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*.45,VW/2,VH/2,Math.max(VW,VH)*.75); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,.35)'); ctx.fillStyle=g; ctx.fillRect(0,0,VW,VH); }
function wrapText(t,maxW){ const out=[]; let line=''; for(const ch of t){ if(ctx.measureText(line+ch).width>maxW&&line){ out.push(line); line=ch; } else line+=ch; } if(line) out.push(line); return out; }
function drawTracker(){ if(!ME) return; const q=QUESTS[ME.mq],maxW=Math.min(220,VW*.46),rows=[];
  ctx.font='12px '+FONT; ctx.textAlign='left';
  if(hideTrack) rows.push(['▸ 任務（點一下展開）','#9a9078']);
  else if(q){ rows.push(['◆ '+q.n,'#e8c46a']); for(const l of wrapText(q.d+(q.type!=='talk'?`（${ME.mqp}/${q.n}）`:''),maxW)) rows.push([l,'#ece2c8']); }
  else rows.push(['◆ 主線完成','#e8c46a']);
  if(ME.daily&&!hideTrack){ const left=ME.daily.list.filter(x=>!x.done); rows.push([left.length?`每日 ${3-left.length}/3・${left[0].d}（${left[0].p}/${left[0].n}）`:'每日任務完成 ✓',left.length?'#9fc4e0':'#7fe08a']); }
  if(eclipse){ const left=Math.max(0,(eclipse.end-performance.now())/1000); if(left<=0) eclipse=null; else rows.unshift([`✦ 月蝕之夜 ${Math.floor(left/60)}:${String(Math.floor(left%60)).padStart(2,'0')}・經驗 ×2`,'#ff7a8a']); }
  if(invasion){ const left=Math.max(0,(invasion.end-performance.now())/1000); rows.unshift([`⚔ 教團入侵・泉水耐久 ${invasion.hp}/100・${Math.floor(left/60)}:${String(Math.floor(left%60)).padStart(2,'0')}`,invasion.hp>40?'#ffb070':'#ff5a4a']); }
  if(wboss) rows.unshift(['🔥 卡爾薩殘火甦醒中（熔岩洞窟）','#ff9a3c']);
  const w=Math.min(maxW,Math.max(...rows.map(r=>ctx.measureText(r[0]).width)))+14,h=rows.length*15+8,x=6,y=30;
  ctx.fillStyle='rgba(0,0,0,.55)'; ctx.fillRect(x,y,w,h); ctx.fillStyle='rgba(216,178,90,.7)'; ctx.fillRect(x,y,2,h);
  rows.forEach((r,i)=>{ ctx.fillStyle=r[1]; ctx.fillText(r[0],x+8,y+16+i*15); }); trackRect={x,y,w,h}; }
function drawAura(e,X,Y){ const b=e.bf; if(b.iron>now){ ctx.strokeStyle=`rgba(120,180,255,${.5+.3*Math.sin(now*6)})`; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(X,Y,18,8,0,0,7); ctx.stroke(); ctx.beginPath(); ctx.ellipse(X,Y-28,16,28,0,0,7); ctx.stroke(); }
  if(b.haste>now){ ctx.fillStyle='rgba(127,224,138,.25)'; ctx.beginPath(); ctx.ellipse(X,Y,20,9,0,0,7); ctx.fill(); if(Math.random()<.3) part(X+cam.x+rnd(-10,10),Y+cam.y-rnd(0,40),{vx:-e.dir*60,vy:0,g:0,c:'#b8ffb0',life:.3,s:2}); }
  if(b.shadow>now&&Math.random()<.4) part(X+cam.x+rnd(-10,10),Y+cam.y-rnd(0,40),{vx:rnd(-10,10),vy:rnd(-30,-10),g:0,c:pick(['#3a2a5a','#8a4cff']),life:.5,s:3}); }
function onWorldEvent(m){
  if(m.k==='invasion'){ const was=invasion; invasion=m.on?{end:m.end-Date.now()+performance.now(),hp:m.hp}:null;
    if(m.on&&!was){ banner={t:4,a:'⚔ 灰燼教團入侵 ⚔',b:'回晨霧村守住治癒之泉！'}; SFX.boom(); doShake(8,.5); }
    else if(m.on&&was&&m.hp<was.hp){ SFX.hurt(); if(cur?.id==='village') doShake(4,.2); }
    else if(!m.on){ banner={t:4,a:m.won?'晨霧村守住了！':'治癒之泉被污染了……',b:m.won?'獎勵已發放':'明天教團還會再來'}; m.won?SFX.legend():SFX.die(); } }
  if(m.k==='wb'){ wboss=m.on; if(m.on){ banner={t:4.5,a:'🔥 卡爾薩殘火 甦醒',b:'熔岩洞窟的世界 Boss・血量 5 倍'}; SFX.boom(); doShake(10,.6); } } }
function onQuestDone(m){
  SFX.ok(); addLine(`<div class="l-sys"><b>[任務完成]</b> ${esc(m.n)}　${esc(m.r||'')}</div>`);
  if(m.daily){ toast(`每日任務完成：${m.n}`); return; }
  banner={t:3.5,a:'任務完成',b:m.n}; P&&levelFx&&parts.push({type:'ring',x:fx(P),y:fy(P)-14,t:0,life:.6,r:TS*2,c:'232,196,106'});
  if(m.story) setTimeout(()=>openPanel('story',{title:m.next,text:m.story,reward:m.r}),1400); else if(curPanel==='guard') closePanel(true); }

/* ---------- sprite effects (PixelLab VFX sheets) ---------- */
// k: effect name, x,y: world px; o: {s:scale, rot:radians, flip, delay, follow:entity, alpha}
function vfx(k,x,y,o={}){ const d=VFX[k]; if(!d||!VFXI[k]) return; vfxs.push(Object.assign({k,x,y,t:-(o.delay||0),s:1},o)); if(vfxs.length>60) vfxs.shift(); }
function updateVfx(dt){ for(const v of vfxs){ v.t+=dt; if(v.follow){ v.x=fx(v.follow); v.y=(v.foot?fy(v.follow):bodyY(v.follow)); } } vfxs=vfxs.filter(v=>v.t<VFX[v.k].dur*VFX[v.k].f.length); }
function drawVfx(){ for(const v of vfxs){ if(v.t<0) continue; const d=VFX[v.k],im=VFXI[v.k]; if(!im||!im.naturalWidth) continue; const fi=Math.min(d.f.length-1,Math.floor(v.t/d.dur)),[sx,sy]=d.f[fi];
    const X=v.x-cam.x,Y=v.y-cam.y; if(X<-150||Y<-150||X>VW+150||Y>VH+150) continue;
    ctx.save(); ctx.translate(Math.round(X),Math.round(Y)); if(v.rot) ctx.rotate(v.rot); ctx.scale((v.flip?-1:1)*v.s,v.s*(v.sy||1)); if(v.alpha!=null) ctx.globalAlpha=v.alpha;
    ctx.drawImage(im,sx,sy,d.w,d.h,-d.ox,-d.oy,d.w,d.h); ctx.restore(); } }
function freeze(t){ hitStop=Math.max(hitStop,t); }

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
      if(p.aoe){ vfx('explosion',tx,ty-6,{s:.9}); freeze(.05); burst(tx,ty,26,['#ffd84a','#ff7a2a','#c4301a','#fff2b0'],220); doShake(6,.22); parts.push({type:'ring',x:tx,y:ty,t:0,life:.35,r:TS*1.7,c:'255,150,60'}); }
      for(const h of p.hits) showHit(tg,h); continue; }
    const sp=p.spd*dt; p.x+=dx/d*sp; p.y+=dy/d*sp; }
  projs=projs.filter(p=>!p.done);
  for(const g of tgs) g.t+=dt; tgs=tgs.filter(g=>g.t<g.life+.3);
  for(const L of loot.values()){ if(L.q>=2&&Math.random()<dt*(L.q>=3?14:4)) part(PX(L.x+.5,L.y+.5)+rnd(-8,8),PY(L.x+.5,L.y+.5)-rnd(0,40),{vx:rnd(-8,8),vy:rnd(-50,-20),g:0,c:L.q>=3?pick(['#ffd84a','#ff9a3c','#fff']):pick(['#ffd84a','#fff6c0']),life:rnd(.5,1),s:2}); }
  for(const m of cur.mobs) if(m.psEnd>now&&Math.random()<dt*5) part(fx(m)+rnd(-8,8),bodyY(m),{vx:rnd(-6,6),vy:rnd(-40,-20),g:0,c:pick(['#9be06a','#5aa03a']),life:.6,s:3});
  // hits whose target vanished before the projectile landed
  banner.t-=dt; shake-=dt; if(shake<=0)shakeMag=0; hurtFlash-=dt;
  for(const e of ents.values()){ const sp=Math.min(1,dt*(e.isPlayer?11:8)); const mv=Math.abs(e.x-e.rx)+Math.abs(e.y-e.ry)>.05; e.rx+=(e.x-e.rx)*sp; e.ry+=(e.y-e.ry)*sp;
    e.hurt-=dt; if(e.isPlayer){ e.atkVis-=dt; e.lunge-=dt; if(mv)e.walk+=dt; } else { e.kb=Math.max(0,(e.kb||0)-dt*6); e.atkAnim-=dt; e.mAtk=(e.mAtk||0)-dt; e.lg-=dt; } }
  for(const c of cur.corpses)c.t+=dt; cur.corpses=cur.corpses.filter(c=>c.t<.6);
  if(cur.id==='forest'&&Math.random()<dt*2.5)part(cam.x+rnd(0,VW),cam.y-4,{vx:rnd(10,30),vy:rnd(20,40),g:0,c:pick(['#6a9a40','#8ab050','#c8a040']),life:4,s:3,type:'leaf'});
  if(cur.id==='cave'&&Math.random()<dt*10)part(cam.x+rnd(0,VW),cam.y+VH+4,{vx:rnd(-10,10),vy:rnd(-60,-25),g:0,c:pick(['#ff9a3c','#ffd84a','#ff5a2a']),life:3,s:2,type:'leaf'});
  for(const p of parts)if(p.type==='leaf'){p.x+=p.vx*dt;p.y+=p.vy*dt;}
  for(const p of cur.portals)if(!p.gate&&Math.random()<dt*8)part(PX(p.x+.5,p.y+.5)+rnd(-14,14),PY(p.x+.5,p.y+.5)+rnd(-4,4),{vx:rnd(-6,6),vy:rnd(-50,-25),g:0,c:pick(['#c9a8ff','#8a5cff','#fff']),life:rnd(.6,1),s:2});
}

/* ---------- input ---------- */
let ZOOM=1; try{ ZOOM=+localStorage.getItem('sm_zoom')||1; }catch{}
let hideTrack=false; try{ hideTrack=localStorage.getItem('sm_track')==='0'; }catch{}
let hideOthers=false; try{ hideOthers=localStorage.getItem('sm_hide')==='1'; }catch{}
const isTouch=matchMedia('(pointer:coarse)').matches||('ontouchstart' in window&&navigator.maxTouchPoints>0); if(isTouch) document.body.classList.add('touch');
function resize(){const r=$('#stage').getBoundingClientRect(),d=Math.min(2,window.devicePixelRatio||1),cw=Math.max(100,r.width-4),ch=Math.max(100,r.height-4);VW=cw/ZOOM;VH=ch/ZOOM;
  cv.width=Math.round(cw*d);cv.height=Math.round(ch*d);cv.style.width=cw+'px';cv.style.height=ch+'px';ctx.setTransform(d*ZOOM,0,0,d*ZOOM,0,0);ctx.imageSmoothingEnabled=false;lightCv.width=Math.ceil(VW/4);lightCv.height=Math.ceil(VH/4);
  $('#bZoom').textContent=Math.round(ZOOM*100)+'%';}
$('#bZoom').onclick=()=>{ ZOOM=ZOOM>=1.5?1:ZOOM>=1.25?1.5:1.25; try{localStorage.setItem('sm_zoom',ZOOM);}catch{} resize(); };
window.addEventListener('resize',resize);
// keep the canvas matched to its box whenever the layout changes; block browser zoom gestures on phones
try{ let rT=0; new ResizeObserver(()=>{ cancelAnimationFrame(rT); rT=requestAnimationFrame(resize); }).observe($('#stage')); }catch{}
for(const ev of ['gesturestart','gesturechange']) document.addEventListener(ev,e=>e.preventDefault(),{passive:false});
document.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});
cv.addEventListener('pointerdown',e=>{ audioOn(); if(!P||!cur||P.dead) return;
  const r=cv.getBoundingClientRect(),wx=(e.clientX-r.left)/ZOOM+cam.x,wy=(e.clientY-r.top)/ZOOM+cam.y,u=wx-OX;
  const tx=Math.floor((u/HW+wy/HH)/2),ty=Math.floor((wy/HH-u/HW)/2);
  const sx0=(e.clientX-r.left)/ZOOM,sy0=(e.clientY-r.top)/ZOOM;
  if(trackRect&&sx0>=trackRect.x&&sx0<=trackRect.x+trackRect.w&&sy0>=trackRect.y&&sy0<=trackRect.y+trackRect.h){ hideTrack=!hideTrack; try{localStorage.setItem('sm_track',hideTrack?'0':'1');}catch{} return; }
  pendingAct=null; marker=null;
  let best=null,bd=30; for(const m of cur.mobs){ const d=Math.hypot(fx(m)-wx,fy(m)-(m.boss?40:14)-wy)/(m.boss?2.2:1); if(d<bd){bd=d;best=m;} }
  for(const p of players.values()){ if(p===P||(hideOthers&&!p.party)) continue; const d=Math.hypot(fx(p)-wx,fy(p)-28-wy); if(d<bd){bd=d;best=p;} }
  if(best&&!best.isPlayer){ myTargetId=best.id; send({t:'attack',id:best.id}); parts.push({type:'ring',x:fx(best),y:fy(best),t:0,life:.3,r:22,c:'255,90,70'}); return; }
  if(best&&best.isPlayer){ if(ME.pk){ myTargetId=best.id; send({t:'attack',id:best.id}); } else openPanel('player',best); return; }
  { let bl=null,bld=24; for(const L of loot.values()){ const d=Math.hypot(PX(L.x+.5,L.y+.5)-wx,PY(L.x+.5,L.y+.5)-10-wy); if(d<bld){bld=d;bl=L;} } if(bl){ myTargetId=null; send({t:'pick',id:bl.id}); marker={x:bl.x,y:bl.y}; return; } }
  myTargetId=null;
  const n=cur.npcs.find(n=>Math.hypot(PX(n.x+.5,n.y+.5)-wx,PY(n.x+.5,n.y+.5)-24-wy)<28);
  if(n){ pendingAct={x:n.x,y:n.y,act:n.act}; send({t:'move',x:n.x,y:n.y}); return; }
  if(cur.heal&&Math.hypot(PX(cur.heal.x+1,cur.heal.y+1)-wx,PY(cur.heal.x+1,cur.heal.y+1)-20-wy)<52){ pendingAct={x:cur.heal.x,y:cur.heal.y,act:'heal',big:1}; send({t:'move',x:cur.heal.x,y:cur.heal.y}); return; }
  if(tx<0||ty<0||tx>=cur.W||ty>=cur.H) return; send({t:'move',x:tx,y:ty}); if(!cur.blk[ty*cur.W+tx]) marker={x:tx,y:ty};
});
window.addEventListener('keydown',e=>{ if(!inGame||!P||e.target.tagName==='INPUT') return; if(!$('#overlay').hidden) return;
  const k={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[e.key];
  if(k){ e.preventDefault(); myTargetId=null; send({t:'move',x:P.x+k[0],y:P.y+k[1]}); }
  if('wasdWASD'.includes(e.key)&&e.key.length===1){ keysDown.add(e.key.toLowerCase()); updKeyJoy(); }
  if(e.key==='+'||e.key==='=') $('#bZoom').onclick();
  if(e.key==='Enter'){ e.preventDefault(); $('#chatIn').focus(); }
  if(e.key===' '){ e.preventDefault(); attackNearest(); }
  if(e.key==='1') usePot(); if(e.key==='2'||e.key==='3'||e.key==='4') castSkill(+e.key-2); });
window.addEventListener('keyup',e=>{ if(e.key&&keysDown.delete(e.key.toLowerCase())) updKeyJoy(); });
window.addEventListener('blur',()=>{ keysDown.clear(); updKeyJoy(); });
/* ---------- joystick (phones) and WASD (computers) ---------- */
const keysDown=new Set(); let joyV=null, joyHold=0, joySendT=0, joyPtr=null, keyJoy=false;
function updKeyJoy(){ const x=(keysDown.has('d')?1:0)-(keysDown.has('a')?1:0), y=(keysDown.has('s')?1:0)-(keysDown.has('w')?1:0);
  if(x||y){ const l=Math.hypot(x,y); joyV={x:x/l,y:y/l}; keyJoy=true; } else if(keyJoy){ keyJoy=false; joyV=null; send({t:'stop'}); } }
{ const J=$('#joy'),K=$('#joyK');
  const upd=e=>{ const r=J.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),l=Math.hypot(dx,dy),m=Math.min(l,46);
    K.style.transform=`translate(${l?dx/l*m:0}px,${l?dy/l*m:0}px)`; joyV=l<10?null:{x:dx/l,y:dy/l}; };
  J.addEventListener('pointerdown',e=>{ audioOn(); e.preventDefault(); joyPtr=e.pointerId; J.setPointerCapture(e.pointerId); upd(e); joySendT=0; });
  J.addEventListener('pointermove',e=>{ if(e.pointerId===joyPtr) upd(e); });
  const end=e=>{ if(e.pointerId!==joyPtr) return; joyPtr=null; joyV=null; K.style.transform=''; send({t:'stop'}); };
  J.addEventListener('pointerup',end); J.addEventListener('pointercancel',end); }
const JDIRS=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
function joyThink(dt){ joyHold-=dt; if(!joyV||!P||P.dead||!cur) return; joyHold=1.2; joySendT-=dt; if(joySendT>0) return; joySendT=.12;
  // screen direction -> isometric grid direction
  const gx=joyV.x/HW+joyV.y/HH, gy=joyV.y/HH-joyV.x/HW, oct=Math.round(Math.atan2(gy,gx)/(Math.PI/4));
  for(const off of [0,1,-1]){ const [dx,dy]=JDIRS[((oct+off)%8+8)%8];
    for(let n=3;n>=1;n--){ const x=P.x+dx*n,y=P.y+dy*n; if(x<0||y<0||x>=cur.W||y>=cur.H||cur.blk[y*cur.W+x]) continue;
      if(myTargetId){ myTargetId=null; } pendingAct=null; marker=null; send({t:'move',x,y}); return; } } }
function checkPending(){ if(!pendingAct||!P) return; const a=pendingAct, near=a.big?Math.max(Math.abs(P.x-a.x-.5),Math.abs(P.y-a.y-.5))<=1.6:cheb(P,a)<=1;
  if(near&&Math.abs(P.rx-P.x)<.1&&Math.abs(P.ry-P.y)<.1){ pendingAct=null; if(a.act==='heal') send({t:'heal'}); else openPanel(a.act); } }
function usePot(){ if(!ME) return; if(ME.inv.pot) send({t:'use',k:'pot'}); else if(ME.inv.big) send({t:'use',k:'big'}); else addLog('紅色藥水用完了，回村找莉娜買。'); }
$('#bPot').onclick=()=>{audioOn();usePot();};
// nearest mob to fight (keeps the current target if it is still alive)
function nearestMob(maxD=30){ const t=myTarget(); if(t&&!t.isPlayer&&cur.mobs.includes(t)) return t;
  let best=null,bd=maxD; for(const m of cur.mobs){ if(autoBlk.get(m.id)>now) continue; const d=Math.hypot(m.x-P.x,m.y-P.y)+(m.boss&&MT[m.k].lv>ME.lv?4:0); if(d<bd){bd=d;best=m;} } return best; }
function attackNearest(){ if(!ME||!P||P.dead) return null; if(cur.id==='village'&&!cur.mobs.length){ addLog('村子裡沒有怪物，從村南傳送陣出去打怪。'); return null; }
  const m=nearestMob(); if(!m){ addLog('附近沒有怪物。'); return null; }
  if(myTargetId!==m.id){ myTargetId=m.id; send({t:'attack',id:m.id}); parts.push({type:'ring',x:fx(m),y:fy(m),t:0,life:.3,r:22,c:'255,90,70'}); } joyHold=0; return m; }
let pendSkill=null;
function skillRange(){ return CLS[ME.cls].range<=1?1:CLS[ME.cls].range; }
function castSkill(i){ if(!ME) return; const sk=SKILLS[ME.cls][i]; if(ME.lv<sk.lv) return addLog(`${sk.n}：Lv.${sk.lv} 解鎖。${sk.d}`); if(cdEnd[i]>now) return;
  if(sk.tgt){ let t=myTarget(); if(!t||t.isPlayer&&!ME.pk) t=attackNearest(); if(!t) return;
    if(cheb(P,t)>skillRange()){ pendSkill={i,until:now+4}; return; } }
  send({t:'skill',i}); }
function pendSkillThink(){ if(!pendSkill) return; const t=myTarget(); if(!t||now>pendSkill.until){ pendSkill=null; return; } if(cheb(P,t)<=skillRange()){ send({t:'skill',i:pendSkill.i}); pendSkill=null; } }
$('#bAtk').onclick=()=>{ audioOn(); attackNearest(); };
for(let i=0;i<3;i++) $('#bS'+i).onclick=()=>{audioOn();castSkill(i);};
$('#bChat').onclick=()=>{ document.body.classList.toggle('chatOpen'); if(document.body.classList.contains('chatOpen')) setTimeout(()=>$('#chatIn').focus(),50); };
$('#bQuest').onclick=()=>{audioOn();openPanel('quest');};
$('#bRet').onclick=()=>{audioOn();if(cur?.id==='village')return addLog('你已經在村子裡了。');send({t:'ret'});};
$('#bBag').onclick=()=>{audioOn();bagSel=null;openPanel('bag');};
$('#bAuto').onclick=()=>{audioOn(); if(auto) toggleAuto(false); else openPanel('auto'); };
$('#bSocial').onclick=()=>{audioOn();openPanel('social');};
$('#bPk').onclick=()=>{ if(!ME) return; if(ME.lv<PK_MIN_LV) return addLog(`Lv.${PK_MIN_LV} 以上才能開啟 PK。`); send({t:'pk',on:!ME.pk}); };

/* ---------- auto hunt (client brain, server validates everything) ---------- */
const autoBlk=new Map(); let autoT=0, potT=0, skillT=0, tgtSince=0, tgtHp=0, autoOrigin=null, resupply=false;
// settings, saved per browser
const AS_DEF={targets:{},hp:45,mp:20,sk:[1,1,1],pick:0,range:0,noPot:'ret',bagFull:'skip',buy:30,boss:0};
let AS=Object.assign({},AS_DEF); try{ Object.assign(AS,JSON.parse(localStorage.getItem('sm_auto')||'{}')); }catch{}
function saveAS(){ try{ localStorage.setItem('sm_auto',JSON.stringify(AS)); }catch{} }
function toggleAuto(force){ auto=force!=null?force:!auto; $('#bAuto').classList.toggle('on',auto); autoOrigin=auto&&P?{x:P.x,y:P.y,map:cur.id}:null;
  addLog(auto?'掛機開始。':'掛機停止。'); if(!auto){ myTargetId=null; } }
function mapMobs(id){ const d=MAPDEF[id]; if(!d||!d.mobs) return []; return [...d.mobs,...(d.boss?[d.boss]:[])]; }
function wantMob(k){ const t=AS.targets[cur.id]; return !t||t.includes(k); }
function wantLoot(L){ if(AS.pick===3) return false; if(L.it){ if(ME.bag.length>=BAGMAX) return false; return (L.q|0)>=[0,1,2][AS.pick]; } return true; }
let dodgeT=0;
function inCircle(x,y){ return tgs.some(g=>Math.hypot(x-g.x,y-g.y)<=g.r+.4); }
function autoSkill(t){ const L=SKILLS[ME.cls],c=ME.cls,hp=ME.hp/ME.maxHP; const ok=i=>AS.sk[i]&&ME.lv>=L[i].lv&&ME.mp>=L[i].mp&&cdEnd[i]<=now;
  const inR=cheb(P,t)<=(CLS[c].range<=1?1:CLS[c].range); const near=cur.mobs.filter(m=>Math.hypot(m.x-P.x,m.y-P.y)<=(c==='mage'?2.6:1.6)).length; const big=t.boss||t.hp>ME.atk*3;
  if(c==='mage'&&ok(2)&&hp<.55) return 2;
  if(c!=='mage'&&ok(2)&&(t.boss||hp<.6)) return 2;
  if((c==='knight'||c==='mage')&&ok(1)&&near>=2) return 1;
  if(c==='ranger'&&ok(1)&&inR&&big) return 1;
  if(c==='darkelf'&&ok(1)&&inR&&big&&!(t.psEnd>now)) return 1;
  if(ok(0)&&inR&&(t.boss||t.hp>ME.atk*2)) return 0;
  return -1; }
function goHome(why){ if(ME.inv.ret){ send({t:'ret'}); resupply=true; } toggleAuto(false); addLog(why); }
function autoThink(dt){ if(!auto||!ME||!P||P.dead||joyHold>0) return; autoT-=dt; potT-=dt; skillT-=dt; dodgeT-=dt;
  // step out of red circles
  if(dodgeT<=0&&inCircle(P.x,P.y)){ let best=null,bd=1e9; for(let dx=-3;dx<=3;dx++)for(let dy=-3;dy<=3;dy++){ const x=P.x+dx,y=P.y+dy; if(x<0||y<0||x>=cur.W||y>=cur.H||cur.blk[y*cur.W+x]||inCircle(x,y)) continue; const d=Math.hypot(dx,dy); if(d<bd){bd=d;best=[x,y];} }
    if(best){ dodgeT=.6; myTargetId=null; send({t:'move',x:best[0],y:best[1]}); return; } }
  if(dodgeT>0) return;
  const hp=ME.hp/ME.maxHP, th=AS.hp/100;
  if(potT<=0&&hp<th){ if(ME.inv.big&&hp<th-.15){send({t:'use',k:'big'});potT=.6;} else if(ME.inv.pot){send({t:'use',k:'pot'});potT=.6;} else if(ME.inv.big){send({t:'use',k:'big'});potT=.6;} }
  if(potT<=0&&ME.mp<ME.maxMP*AS.mp/100&&ME.inv.blue){send({t:'use',k:'blue'});potT=.6;}
  if(cur.id==='village') return;
  if(!ME.inv.pot&&!ME.inv.big&&AS.noPot==='ret'&&hp<.5) return goHome('紅色藥水用完了，自動回村。');
  if(ME.bag.length>=BAGMAX&&AS.bagFull==='ret') return goHome('背包滿了，自動回村。');
  const t=myTarget();
  if(t){ if(t.hp!==tgtHp){tgtHp=t.hp;tgtSince=now;} if(now-tgtSince>7){ autoBlk.set(t.id,now+10); myTargetId=null; send({t:'stop'}); }
    if(skillT<=0){ const i=autoSkill(t); if(i>=0){ send({t:'skill',i}); skillT=.5; } }
    return; }
  const inRange=(x,y)=>!AS.range||!autoOrigin||autoOrigin.map!==cur.id||Math.hypot(x-autoOrigin.x,y-autoOrigin.y)<=AS.range;
  // pick up loot before looking for the next fight
  { let bl=null,bld=11; for(const L of loot.values()){ if(L.tries>5||!canPickLoot(L)||!wantLoot(L)||!inRange(L.x,L.y)) continue; const d=Math.hypot(L.x-P.x,L.y-P.y); if(d<bld){bld=d;bl=L;} }
    if(bl&&autoT<=0){ bl.tries++; autoT=.8; send({t:'pick',id:bl.id}); return; } if(bl) return; }
  if(autoT>0) return; autoT=.4;
  let best=null,bd=1e9; for(const m of cur.mobs){ if(autoBlk.get(m.id)>now||m.nm&&!m.boss&&false) continue; const t2=MT[m.k];
    if(!wantMob(m.k)||!inRange(m.x,m.y)) continue;
    if(m.boss&&(!AS.boss&&(ME.lv<t2.lv||hp<.7))) continue; if(!m.boss&&t2.lv>ME.lv+5&&!AS.targets[cur.id]) continue;
    const d=Math.hypot(m.x-P.x,m.y-P.y)+(m.boss?6:0); if(d<bd){bd=d;best=m;} }
  if(best){ myTargetId=best.id; tgtSince=now; tgtHp=best.hp; send({t:'attack',id:best.id}); }
  else if(AS.range&&autoOrigin&&autoOrigin.map===cur.id&&Math.hypot(P.x-autoOrigin.x,P.y-autoOrigin.y)>3){ send({t:'move',x:autoOrigin.x,y:autoOrigin.y}); autoT=1.5; }
  else { // nothing we want in sight: wander to look for it
    const ox=AS.range&&autoOrigin?autoOrigin.x:P.x, oy=AS.range&&autoOrigin?autoOrigin.y:P.y, r=AS.range||12;
    for(let i=0;i<20;i++){ const x=Math.round(ox+rnd(-r,r)),y=Math.round(oy+rnd(-r,r)); if(x<1||y<1||x>=cur.W-1||y>=cur.H-1||cur.blk[y*cur.W+x]||cur.portals.some(p=>Math.abs(p.x-x)<=1&&Math.abs(p.y-y)<=1)) continue;
      send({t:'move',x,y}); autoT=3; break; } }
}
// after returning home: restock red potions automatically
function onArriveVillage(){ if(!resupply||!ME) return; resupply=false; if(AS.buy>0){ const need=Math.max(0,AS.buy-(ME.inv.pot||0)),can=Math.floor(ME.gold/20),q=Math.min(need,can); if(q>0){ send({t:'buy',k:'pot',q}); addLog(`自動補給：買了 ${q} 瓶紅色藥水。`); } } }
function autoPanelHTML(){ const id=cur&&MAPDEF[cur.id]?.mobs?cur.id:(autoOrigin?.map||'forest'), list=mapMobs(id), sel=AS.targets[id], L=SKILLS[ME.cls];
  const chip=(on,attr,txt)=>`<button class="btn chip ${on?'on':''}" ${attr}>${txt}</button>`;
  const opt=(key,vals,labels)=>vals.map((v,i)=>chip(AS[key]===v,`data-as="${key}" data-v="${v}"`,labels[i])).join('');
  return `<button class="btn wide ${auto?'hot':'on'}" data-act="autogo" style="margin-bottom:8px">${auto?'停止掛機':'開始掛機'}</button>
  <div class="sect">要打的怪（${MAPDEF[id].name}）</div><div class="chips">${chip(!sel,'data-tgt="*"','全部')}${list.map(k=>chip(!sel||sel.includes(k),`data-tgt="${k}"`,`${MT[k].boss?'【王】':''}${MT[k].n} <small>Lv.${MT[k].lv}</small>`)).join('')}</div>
  <div class="chips" style="margin-top:4px">${chip(AS.boss,'data-as="boss" data-v="tog"','主動打 Boss')}</div>
  <div class="sect">活動範圍</div><div class="chips">${opt('range',[0,8,15],['不限','開始位置 8 格內','15 格內'])}</div>
  <div class="sect">喝紅水（HP 低於）</div><div class="chips">${opt('hp',[30,45,60,75],['30%','45%','60%','75%'])}</div>
  <div class="sect">喝藍水（MP 低於）</div><div class="chips">${opt('mp',[0,20,40],['不喝','20%','40%'])}</div>
  <div class="sect">使用技能</div><div class="chips">${L.map((k,i)=>chip(AS.sk[i],`data-sk="${i}"`,`${k.n}${ME.lv<k.lv?` <small>Lv.${k.lv}</small>`:''}`)).join('')}</div>
  <div class="sect">撿東西</div><div class="chips">${opt('pick',[0,1,2,3],['全部','魔法以上裝備','稀有以上裝備','不撿'])}</div><p class="ds">藥水、卷軸一律會撿（選「不撿」除外）。</p>
  <div class="sect">紅水用完時</div><div class="chips">${opt('noPot',['ret','cont'],['回村','繼續打'])}</div>
  <div class="sect">背包滿時</div><div class="chips">${opt('bagFull',['skip','ret'],['不撿裝備','回村'])}</div>
  <div class="sect">回村後自動補紅水到</div><div class="chips">${opt('buy',[0,30,60,100],['不補','30 瓶','60 瓶','100 瓶'])}</div>`; }

/* ---------- chat & log ---------- */
const CHN={sys:'系統',all:'全頻',map:'地圖',party:'隊伍',clan:'血盟',w:'私訊'};
function addLine(html){ logs.push(html); if(logs.length>60) logs.shift(); const el=$('#log'); el.innerHTML=logs.slice(-8).join(''); el.scrollTop=el.scrollHeight; }
function addLog(msg){ addLine(`<div class="l-log">${msg}</div>`); }
function addChat(m){ const who=m.ch==='w'?(m.from===ME?.name?`→${esc(m.to)}`:`${esc(m.from)}→你`):esc(m.from);
  addLine(`<div class="l-${m.ch}"><b>[${CHN[m.ch]||m.ch}] ${who}</b>：${esc(m.msg)}</div>`);
  if(m.ch!=='sys'&&m.ch!=='w'){ const e=[...players.values()].find(p=>p.name===m.from); if(e) floats.push({x:fx(e),y:fy(e)-80,txt:m.msg.slice(0,18),col:'#ffffff',t:-.8,big:false}); } }
$('#chatCh').onchange=e=>{chatCh=e.target.value;};
$('#fChat').onsubmit=e=>{ e.preventDefault(); const v=$('#chatIn').value.trim(); if(!v) return; $('#chatIn').value='';
  document.body.classList.remove('chatOpen');
  const w=v.match(/^\/(\S+)\s+(.+)/); if(w) send({t:'chat',ch:'w',to:w[1],msg:w[2]}); else send({t:'chat',ch:chatCh,msg:v}); $('#chatIn').blur(); };
let toastT=null; function toast(msg){ const el=$('#toast'); el.textContent=msg; el.hidden=false; clearTimeout(toastT); toastT=setTimeout(()=>el.hidden=true,3500); }

/* ---------- panels ---------- */
let curPanel=null, curArg=null;
const PT={auto:'掛機設定',quest:'任務',story:'故事',shop:'雜貨商 莉娜',smith:'鐵匠 巴爾克',bag:'角色',guard:'守衛 艾德',social:'社交',player:'玩家',clan:'血盟',rank:'排行榜',who:'在線玩家',ask:'邀請',trade:'交易'};
function openPanel(k,arg,keep){ if(keep&&curPanel!==k) return; curPanel=k; curArg=arg; const body=$('#pBody'),st=keep?body.scrollTop:0; $('#pTitle').textContent=k==='player'&&arg?arg.name:PT[k]; body.innerHTML=panelHTML(k,arg); $('#overlay').hidden=false; body.scrollTop=st; }
function closePanel(force){ if(curPanel==='trade'&&!force) send({t:'tcancel'}); $('#overlay').hidden=true; curPanel=null; armed=null; }
$('#pClose').onclick=()=>closePanel();
$('#overlay').addEventListener('pointerdown',e=>{if(e.target.id==='overlay')closePanel();});
function panelHTML(k,arg){ const c=ME; if(!c) return '';
  if(k==='guard'){ const q=QUESTS[c.mq]; const qb=q&&q.type==='talk'?`<button class="btn wide on" data-act="qtalk">${c.mq===0?'「我來幫忙。」（接受主線）':'回報：'+esc(q.n)}</button>`:''; return qb+`<p>艾德：「現在村子裡不只你一個冒險者了。記住：村莊是安全區，出了傳送陣就可能被人攻擊。」</p>
    <table><tr><td>哭泣森林</td><td>Lv.1～10・Boss 腐木樹妖</td></tr><tr><td>骸骨荒原</td><td>Lv.10～18・Boss 白骨巨像</td></tr><tr><td>熔岩洞窟</td><td>Lv.18 以上・Boss 熾焰領主</td></tr></table>
    <p style="margin-top:10px">「Lv.${PK_MIN_LV} 以上可以開 PK。殺死沒有紅名的人會變紅名，紅名死掉會掉裝備。打怪可以慢慢把正義值洗回來。」</p><p class="ds">你的正義值：${c.lawful}</p>`; }
  if(k==='shop') return `<p>莉娜：「藥水多帶一點，外面的人跟怪一樣兇。」</p>`+SHOP.map(s=>`<div class="row"><div class="bcell" style="width:40px;flex:none">${icon(INVI[s.k])}</div><div class="info"><div class="nm">${s.n}</div><div class="ds">${s.d}・${s.p} 金幣・持有 ${c.inv[s.k]||0}</div></div>${s.q.map(q=>`<button class="btn" data-buy="${s.k}" data-q="${q}" ${c.gold<s.p*q?'disabled':''}>買 ${q}</button>`).join('')}</div>`).join('')+`<div class="sect">賣東西（背包 ${c.bag.length}/${BAGMAX}）</div>${sellTools(c)}<div class="sect">你的金幣：${c.gold.toLocaleString()}</div>`;
  if(k==='smith'){ const fx=arg&&arg.c?arg:null;
    const g=sl=>{const it=c.eq[sl];if(!it||['n','r1','r2'].includes(sl))return'';const kind=sl==='w'?'w':'a',sc=kind==='w'?'ws':'as',r=enchRate(kind,it.en),risky=r<1,have=c.inv[sc]||0;
      const label=armed===sl?`再按一次確定衝 +${it.en+1}（失敗會爆）`:`使用${INV_N[sc]}（持有 ${have}）`;
      return`<div class="gear"><div class="gname ${itemCls(it)}">${itemName(it,c.cls)}</div><div class="gstat">${itemStat(it)}</div><div class="rate ${risky?'risk':''}">衝 +${it.en+1} 成功率 ${Math.round(r*100)}%${risky?'，失敗裝備爆掉':'（安全範圍）'}</div><button class="btn ${armed===sl?'hot':''}" data-ench="${sl}" ${have?'':'disabled'}>${label}</button></div>`;};
    const shopGear=SHOP_GEAR.filter(([sl])=>!(sl==='s'&&NOSHIELD[c.cls])).map(([sl,t])=>{const pr=shopPrice(sl,t),it={s:sl,t,en:0};return`<div class="row"><div class="bcell" style="width:40px;flex:none">${itIcon(it)}</div><div class="info"><div class="nm ${itemCls(it)}">${itemBaseName(it,c.cls)}</div><div class="ds">${itemStat(it)}・${pr.toLocaleString()} 金幣</div></div><button class="btn" data-gear="${sl}${t}" ${c.gold<pr?'disabled':''}>購買</button></div>`;}).join('');
    return `<p>巴爾克：「武器 +6、防具 +4 以內不會爆。衝到 +8 全伺服器都會知道。」</p>${SLOTS.map(([sl])=>g(sl)).join('')}<div id="fx" class="${fx?fx.c:''}">${fx?esc(fx.t):''}</div><div class="sect">購買裝備（放進背包）</div>${shopGear}<div class="sect">你的金幣：${c.gold.toLocaleString()}</div>`; }
  if(k==='bag'){ const gs=c.gear||{};
    let det=''; if(bagSel){ const it=bagSel.from==='eq'?c.eq[bagSel.k]:c.bag[bagSel.k]; if(it){ const cmp=bagSel.from==='bag'?c.eq[eqSlotFor(c.eq,it)]:null,ban=it.s==='s'&&NOSHIELD[c.cls];
      det=`<div class="detail"><div class="gname ${itemCls(it)}">${itemName(it,c.cls)}</div><div class="gstat">${SLOTN[it.s]}・${itemStat(it)}${it.q===2?'・稀有':it.q===1?'・魔法':''}</div>${cmp?`<div class="ds">目前裝備：${itemName(cmp,c.cls)}（${itemStat(cmp)}）</div>`:''}${ban?`<div class="ds" style="color:var(--danger)">${CLS[c.cls].n}不能使用盾牌</div>`:''}
      <div class="acts2">${bagSel.from==='bag'?`<button class="btn" data-eq="${bagSel.k}" ${ban?'disabled':''}>裝備</button><button class="btn ${it.lock?'on':''}" data-lock="${bagSel.k}">${it.lock?'已鎖定':'鎖定'}</button><button class="btn" data-sell="${bagSel.k}" ${cur.id!=='village'?'disabled':''}>賣出 ${sellP(it)}</button>`:(bagSel.k==='w'||bagSel.k==='a'?'<span class="ds">武器和盔甲不能空著</span>':`<button class="btn" data-uneq="${bagSel.k}">卸下</button>`)}</div></div>`; } }
    const eqg=SLOTS.map(([sl,lab])=>{const it=c.eq[sl];return`<button class="slot ${bagSel&&bagSel.from==='eq'&&bagSel.k===sl?'sel':''}" data-pick="eq:${sl}" aria-label="${lab}">${it?itIcon(it):''}<span class="lb">${lab}</span>${it&&it.en?`<span class="en">+${it.en}</span>`:''}</button>`;}).join('');
    const bg=c.bag.map((it,i)=>`<button class="bcell q${it.q|0} ${bagSel&&bagSel.from==='bag'&&bagSel.k===i?'sel':''}" data-pick="bag:${i}" aria-label="${esc(itemName(it,c.cls))}">${itIcon(it)}${it.en?`<span class="en">+${it.en}</span>`:''}${it.lock?'<span class="lk">鎖</span>':''}</button>`).join('');
    const st=Object.keys(STATN).map(k=>`<div>${STATN[k]} <span class="ds">${STATD[k]}</span></div><div class="v">${c[k]}${(gs[k]||0)?`<span class="ds"> (裝備+${gs[k]})</span>`:''}</div><button class="btn" data-stat="${k}" ${c.pts>0?'':'disabled'}>＋</button>`).join('');
    return `<table><tr><td>${esc(c.name)}</td><td>${CLS[c.cls].n}（${c.g==='f'?'女':'男'}）Lv.${c.lv}（${c.exp}/${c.need}）</td></tr><tr><td>正義值</td><td style="color:${c.lawful<0?'var(--danger)':'inherit'}">${c.lawful}${c.lawful<0?'（紅名）':''}</td></tr></table>
    <div class="sect">裝備</div><div class="eqgrid">${eqg}</div>${bagSel&&bagSel.from==='eq'?det:''}
    <div class="sect">能力值　剩餘點數 <span style="color:${c.pts?'var(--gold)':'var(--dim)'}">${c.pts}</span></div><div class="stats">${st}</div>${c.pts?`<button class="btn" style="width:100%;margin-top:6px" data-stat="auto">把點數全部加到主屬性（${CLS[c.cls].main}）</button>`:''}
    <div class="derived"><span>攻擊力<b>${c.atk}</b></span><span>防禦力<b>${c.def}</b></span><span>HP<b>${c.maxHP}</b></span><span>MP<b>${c.maxMP}</b></span><span>閃避<b>${Math.round(c.dodge*100)}%</b></span><span>爆擊<b>${Math.round(c.crit*100)}%</b></span></div>
    <div class="sect">背包（${c.bag.length}/${BAGMAX}）</div>${sellTools(c)}${c.bag.length?`<div class="bgrid">${bg}</div>`:'<p class="ds">打怪會掉裝備，也可以跟鐵匠買。</p>'}${bagSel&&bagSel.from==='bag'?det:''}
    <div class="sect">道具</div>${Object.keys(INV_N).map(k=>`<div class="row"><div class="bcell" style="width:40px;flex:none">${icon(INVI[k])}</div><div class="info"><div class="nm">${INV_N[k]}</div></div><span class="num">${c.inv[k]||0}</span>${['pot','big','blue'].includes(k)?`<button class="btn" data-use="${k}" ${c.inv[k]?'':'disabled'}>使用</button>`:''}</div>`).join('')}
    <div class="sect">設定</div><button class="btn wide" data-act="mute">${muted?'開啟音效':'關閉音效'}</button>
    <button class="btn wide ${hideOthers?'on':''}" data-act="hide" style="margin-top:6px">${hideOthers?'其他玩家：已隱藏（隊友仍顯示）':'隱藏其他玩家'}</button>
    <button class="btn wide ${hideTrack?'on':''}" data-act="track" style="margin-top:6px">${hideTrack?'任務提醒：已收起（點左上角也能切換）':'收起左上角任務提醒'}</button>
    <button class="btn wide" data-act="zoom" style="margin-top:6px">畫面縮放：${Math.round(ZOOM*100)}%</button>`; }
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
  if(k==='auto') return autoPanelHTML();
  if(k==='story') return `<div class="sect">${esc(arg.title||'')}</div><div class="story">${esc(arg.text||'')}</div>${arg.reward?`<p class="ds">獲得：${esc(arg.reward)}</p>`:''}<button class="btn wide" data-act="qpanel">查看任務</button>`;
  if(k==='quest'){ const q=QUESTS[c.mq];
    const main=q?`<div class="sect">主線・${esc(q.n)}</div><div class="story">${esc(q.story)}</div><p><b>目標</b>：${esc(q.d)}</p>${q.type!=='talk'?`<div class="pbar"><i style="width:${Math.round(c.mqp/q.n*100)}%"></i></div><p class="ds">進度 ${c.mqp}/${q.n}</p>`:`<button class="btn wide on" data-act="goguard">${cur.id==='village'?'去找守衛艾德':'回村找守衛艾德'}</button>`}<p class="ds">章節 ${c.mq+1}/${QUESTS.length}</p>`:`<div class="sect">主線</div><p>你完成了「新月之誓」。北方的血月……就是另一個故事了。</p>`;
    const d=c.daily; const daily=d?`<div class="sect">每日任務（${d.day}，台灣時間午夜重置）</div>`+d.list.map(x=>`<div class="qrow ${x.done?'done':''}"><span>${x.done?'✓ ':''}${esc(x.d)}</span><span>${x.done?'完成':x.p+'/'+x.n}</span></div>`).join('')+`<p class="ds">每完成一個：經驗、金幣、強力藥水 ×2。三個都完成再送武器、防具強化卷軸各 1。</p>`:'';
    const sk=`<div class="sect">技能（快捷鍵 2・3・4）</div>`+SKILLS[c.cls].map(k=>`<div class="qrow ${c.lv>=k.lv?'':'ds'}"><span><b>${k.n}</b>　${esc(k.d)}</span><span>${c.lv>=k.lv?k.mp+' MP':'Lv.'+k.lv}</span></div>`).join('');
    return main+daily+sk; }
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
  if(D.act==='autogo'){ closePanel(); if(cur.id==='village'){ addLog('先出村再開始掛機（掛機只在狩獵地圖運作）。'); } toggleAuto(!auto); return; }
  if(D.tgt!=null){ const id=MAPDEF[cur.id]?.mobs?cur.id:'forest',all=mapMobs(id); if(D.tgt==='*') delete AS.targets[id]; else { let t=AS.targets[id]?[...AS.targets[id]]:[...all]; t=t.includes(D.tgt)?t.filter(x=>x!==D.tgt):[...t,D.tgt]; if(!t.length||t.length===all.length) delete AS.targets[id]; else AS.targets[id]=t; } saveAS(); return openPanel('auto'); }
  if(D.as){ AS[D.as]=D.v==='tog'?(AS[D.as]?0:1):(isNaN(+D.v)?D.v:+D.v); saveAS(); return openPanel('auto'); }
  if(D.sk!=null){ AS.sk[+D.sk]=AS.sk[+D.sk]?0:1; saveAS(); return openPanel('auto'); }
  if(D.act==='sellall'){ if(armed!=='sell'+D.q){ armed='sell'+D.q; return openPanel(curPanel,curArg); } armed=null; return send({t:'sellall',q:+D.q}); }
  if(D.act==='sortbag') return send({t:'sortbag'});
  if(D.act==='autoequip') return send({t:'autoequip'});
  if(D.lock!=null) return send({t:'lock',i:+D.lock});
  if(D.act==='qtalk') return send({t:'qtalk'});
  if(D.act==='qpanel') return openPanel('quest');
  if(D.act==='goguard'){ closePanel(); if(cur.id!=='village') return send({t:'ret'}); const n=cur.npcs.find(n=>n.act==='guard'); if(n){ pendingAct={x:n.x,y:n.y,act:'guard'}; send({t:'move',x:n.x,y:n.y}); } return; }
  if(D.act==='hide'){ hideOthers=!hideOthers; try{localStorage.setItem('sm_hide',hideOthers?'1':'0');}catch{} return openPanel('bag'); }
  if(D.act==='track'){ hideTrack=!hideTrack; try{localStorage.setItem('sm_track',hideTrack?'0':'1');}catch{} return openPanel('bag'); }
  if(D.act==='zoom'){ $('#bZoom').onclick(); return openPanel('bag'); }
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
function sellTools(c){ const town=cur.id==='village', a=q=>armed==='sell'+q;
  return `<div class="row2" style="margin:4px 0 6px"><button class="btn" data-act="autoequip">一鍵換上更好的裝備</button><button class="btn" data-act="sortbag">整理背包</button></div>
  <div class="row2" style="margin:0 0 6px"><button class="btn ${a(0)?'hot':''}" data-act="sellall" data-q="0" ${town?'':'disabled'}>${a(0)?'再按一次確定':'一鍵賣普通裝備'}</button><button class="btn ${a(1)?'hot':''}" data-act="sellall" data-q="1" ${town?'':'disabled'}>${a(1)?'再按一次確定':'賣普通＋魔法'}</button></div>
  <p class="ds">${town?'鎖定的裝備和傳說不會被賣掉。':'一鍵販賣要在村莊裡才能用。'}</p>`; }
function showAsk(m){ SFX.portal(); openPanel('ask',m); }
function onTrade(m){ if(m.done){ lastTrade=null; if(curPanel==='trade') closePanel(true); return; } lastTrade=m; openPanel('trade',m); }

/* ---------- HUD ---------- */
let hudT=0;
function hud(force,dt=0){ hudT-=dt; if(!force&&hudT>0) return; hudT=.15; if(!ME) return; const c=ME;
  $('#lv').textContent='Lv.'+c.lv; $('#clsName').textContent=c.name;
  $('#hpF').style.width=Math.max(0,c.hp/c.maxHP*100)+'%'; $('#hpT').textContent=Math.max(0,c.hp)+' / '+c.maxHP;
  $('#mpF').style.width=(c.mp/c.maxMP*100)+'%'; $('#mpT').textContent=c.mp+' / '+c.maxMP;
  $('#xpF').style.width=(c.exp/c.need*100)+'%'; $('#gold').textContent=c.gold.toLocaleString();
  $('#cPot').textContent=(c.inv.pot||0)+(c.inv.big?'+'+c.inv.big:''); $('#cRet').textContent='×'+c.inv.ret;
  SKILLS[c.cls].forEach((k,i)=>{ const b=$('#bS'+i),lock=c.lv<k.lv,rem=Math.max(0,cdEnd[i]-now), ic=CLSI[c.cls]*3+i, ue=b.querySelector('.ski'); if(ue&&ue.dataset.i!=String(ic)){ ue.dataset.i=ic; setUic(ue,ic); } b.title=k.n;
    b.querySelector('.sn').textContent=k.n; b.querySelector('small').textContent=lock?`Lv.${k.lv}`:rem>0?rem.toFixed(1):k.mp+' MP';
    b.querySelector('.cdv').style.height=(lock?0:rem/k.cd*100)+'%'; b.classList.toggle('lock',lock); b.classList.toggle('ready',!lock&&rem<=0&&c.mp>=k.mp); });
  $('#cQuest').textContent=QUESTS[c.mq]?(QUESTS[c.mq].type==='talk'?'回報':`${c.mqp}/${QUESTS[c.mq].n}`):'完成';
  $('#bPot').classList.toggle('hot',c.hp<c.maxHP*.3&&c.hp>0);
  const bb=$('#bBag small'),lbl=c.pts>0?`點數 ${c.pts}`:'背包'; if(bb.textContent!==lbl){bb.textContent=lbl;bb.style.color=c.pts>0?'var(--gold)':'';}
  $('#online').textContent=players.size>1?`本圖 ${players.size} 人`:'';
}

/* ---------- main loop ---------- */
let last=performance.now();
function frame(t){ const dt=Math.min(.05,(t-last)/1000); last=t; now+=dt;
  let fdt=dt; if(hitStop>0){ hitStop-=dt; fdt=dt*.06; }
  if(inGame&&cur&&P){ updateFx(fdt); updateVfx(fdt); checkPending(); joyThink(dt); pendSkillThink(); autoThink(dt); draw(); hud(false,dt); }
  requestAnimationFrame(frame); }
resize();
loadAssets().then(()=>{ connect(); requestAnimationFrame(frame); });
// debug / test handle
window.SM={send,toggleAuto,openPanel,get ME(){return ME;},get players(){return players;},get cur(){return cur;},get P(){return P;},get tgs(){return tgs.length;},get target(){const t=myTarget();return t?t.k:null;},get dbg(){return {auto,joyHold,mobs:cur.mobs.map(m=>m.k).join(','),AS,P:[P.x,P.y]};},get loot(){return loot;}};
