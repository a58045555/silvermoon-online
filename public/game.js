// 銀月大陸 Online client — built by tools/build_client.py from client/header.js + client/legacy.js + client/client.js
import { MENTOR, ADVQ_NEED, BOUNTY_DAY_MAX, ACH, achValue, CLS, STATN, STATD, MT, MAPDEF, SHOP, INV_N, BAGMAX, SLOTS, SLOTN, NOSHIELD, BIG, SHOP_GEAR, PK_MIN_LV, CLAN_COST, CLAN_MIN_LV,
  SKILLS, QUESTS, LEGEND_W, RARN, ADV, ADV_KEYS, ADV_LV, ADV_COST, TELE, skillsOf, rng, buildMap, itemBase, itemBaseName, itemName, itemStat, eqSlotFor, enchRate, sellP, shopPrice, expNeed, cheb, dist } from '/shared/data.js';

const $ = s=>document.querySelector(s);
const rnd=(a,b)=>a+Math.random()*(b-a), ri=(a,b)=>Math.floor(rnd(a,b+1)), pick=a=>a[Math.floor(Math.random()*a.length)];
const TS=32,S=2,HW=32,HH=16; let OX=0;
const PX=(gx,gy)=>(gx-gy)*HW+OX,PY=(gx,gy)=>(gx+gy)*HH;
const fx=e=>PX(e.rx+.5,e.ry+.5),fy=e=>PY(e.rx+.5,e.ry+.5),bodyY=e=>fy(e)-(e.boss?44:e.isPlayer?24:14);
const sdir=(dx,dy,d)=>{const v=dx-dy;return v>0?1:v<0?-1:d;};
const FONT='"DotGothic16","PingFang TC","Noto Sans TC",sans-serif';
function mk(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}

// shared mutable state used by the drawing code
let now=0, cur=null, P=null, ME=null, cam={x:0,y:0}, VW=0, VH=0;
let floats=[], parts=[], projs=[], marker=null, banner={t:0,a:'',b:''}, shake=0, shakeMag=0, hurtFlash=0;
const players=new Map();
let ASSETS={}, MOBS={}, SHEETS={}, NPCIMG={}, ICONS=null, VFX={}, UI=null, DECOR=null, DECORIMG=null;
const VFXI={}; let vfxs=[], hitStop=0;
const AIMG={}, MOBI={}, NPCI={}, SHIMG={};
function aImg(k){return AIMG[k]&&AIMG[k].naturalWidth?AIMG[k]:null;}
function npcImg(k){const d=NPCIMG[k];if(!d)return null;if(!NPCI[k]){const im=new Image();im.src=d.src;NPCI[k]=im;}return NPCI[k].complete&&NPCI[k].naturalWidth?NPCI[k]:null;}
const cv=document.querySelector('#cv'), ctx=cv.getContext('2d');
const lightCv=mk(10,10), lctx=lightCv.getContext('2d');

/* ---- audio ---- */
/* ================= audio ================= */
let AC=null,muted=false,lastCoin=0;
function audioOn(){if(AC)return;try{AC=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}}
function tone(f,d,type,v,slide){if(!AC||muted)return;const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type=type||'square';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g).connect(AC.destination);o.start(t);o.stop(t+d+.02);}
let NB=null;
function noise(d,v,ff,type){if(!AC||muted)return;if(!NB){NB=AC.createBuffer(1,AC.sampleRate*.6,AC.sampleRate);const a=NB.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;}
  const t=AC.currentTime,s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=NB;f.type=type||'lowpass';f.frequency.value=ff;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(f).connect(g).connect(AC.destination);s.start(t);s.stop(t+d+.02);}
const SFX={
  swing(){noise(.09,.12,3000,'bandpass');},
  hit(){noise(.06,.22,1400);tone(160,.07,'square',.07,-60);},
  crit(){noise(.14,.35,900);tone(110,.16,'sawtooth',.14,-50);},
  hurt(){tone(120,.14,'square',.12,-60);noise(.05,.12,700);},
  arrow(){noise(.07,.1,5000,'highpass');},
  bolt(){tone(700,.14,'sine',.08,500);},
  fire(){noise(.35,.3,500);tone(80,.3,'sawtooth',.1,-30);},
  coin(){const n=performance.now();if(n-lastCoin<70)return;lastCoin=n;tone(1300,.05,'square',.04);setTimeout(()=>tone(1750,.07,'square',.04),55);},
  level(){[523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,.18,'triangle',.12),i*90));},
  pot(){tone(420,.16,'sine',.1,380);},
  ok(){[660,880,1320].forEach((f,i)=>setTimeout(()=>tone(f,.2,'triangle',.12),i*80));},
  boom(){noise(.6,.45,350);tone(70,.5,'sawtooth',.18,-40);},
  slam(){noise(.4,.45,250);tone(55,.35,'square',.16,-20);},
  portal(){tone(300,.4,'sine',.08,600);},
  warn(){tone(880,.08,'square',.06);setTimeout(()=>tone(880,.08,'square',.06),120);},
  magic(){tone(990,.12,'triangle',.07,300);},
  rare(){[784,988,1319].forEach((f,i)=>setTimeout(()=>tone(f,.16,'triangle',.1),i*70));},
  legend(){[523,659,784,1047,1319,1568].forEach((f,i)=>setTimeout(()=>tone(f,.3,'triangle',.13),i*90));setTimeout(()=>noise(.5,.2,4000,'highpass'),500);},
  die(){[300,240,180,120].forEach((f,i)=>setTimeout(()=>tone(f,.2,'triangle',.1),i*120));}
};


/* ---- sprites ---- */
/* ================= sprites ================= */
const O='#17151c';
const HERO={
 knight:{body:[
"......oooo......",
".....oHHhho.....",
".....ohhhho.....",
".....ohsseo.....",
".....ohssso.....",
"......osso......",
"....ccooooo.....",
"...ccoMAAamo....",
"...coMAAaaamo...",
"...coMAaaaamo...",
"...coMaaaaamo...",
"...co.Maaamo....",
"...co.oaaamo....",
"...co.oggggo....",
"...c..oaaaao....",
"...c..oaaaao....",
"......oooooo...."],
 pal:{o:O,H:'#d4d9de',h:'#8f98a2',s:'#d9b08a',e:'#2a1d18',c:'#7e2622',M:'#5f666e',A:'#5a6f96',a:'#3a4a6e',g:'#b89448',l:'#5a6068',L:'#8a9098',f:'#1e1a22'},tint:['A','a']},
 ranger:{body:[
"......oooo......",
".....oGGGgo.....",
"....oGggggo.....",
"....oggsseo.....",
"....oggssso.....",
".....ogsso......",
"...qooooooo.....",
"..qqoTTTttbo....",
"..qqoTTtttbo....",
"..qooTtttttbo...",
"...goTttttto....",
"...go.Ttttto....",
"...go.otttto....",
"...g..obbbbo....",
"...g..otttto....",
"......otttto....",
"......oooooo...."],
 pal:{o:O,G:'#4f7a3e',g:'#33542a',s:'#d9b08a',e:'#2a1d18',T:'#6e7a4a',t:'#4a5432',b:'#5a3e24',q:'#704a28',l:'#4a3b2c',L:'#6b5038',f:'#241c15'},tint:['T','t']},
 mage:{body:[
"........o.......",
".......oPo......",
"......oPpo......",
"......oPppo.....",
".....oPpppo.....",
"...oooooooooo...",
".....osssseo....",
".....ossssso....",
".....owwwwwo....",
"....oRwwwwRo....",
"...oRRrwwrrRo...",
"...oRrrrrrrRo...",
"...oRrrggrrRo...",
"...osRrrrrRso...",
"....oRrrrrrRo...",
"....oRrrrrrRo...",
"....oRrrrrrrRo.."],
 pal:{o:O,P:'#5a4488',p:'#3e2e62',s:'#d9b08a',e:'#2a1d18',w:'#d8d4cc',R:'#46608e',r:'#2e4066',g:'#b89448',f:'#241c15'},tint:['R','r']}
};
HERO.darkelf=HERO.ranger;
const LEGS={a:[".....olloollo...",".....olloollo...",".....oLLooLLo...",".....olloollo...",".....olloollo...",".....olloollo...","....offo.offo..."],
 b:[".....olloollo...",".....ollo.ollo..","....ollo..oLLo..","....oLLo...ollo.","....ollo...ollo.","...ollo.....ollo","...offo.....offo"]};
const ROBE={a:["....oRrrrrrrRo..","....oRrrrrrrRo..","...oRrrrrrrrRo..","...oRrrrrrrrrRo.","...oRrrrrrrrrRo.","...ooooooooooooo","....off...off..."],
 b:["....oRrrrrrrRo..","....oRrrrrrrRo..","...oRrrrrrrrRo..","...oRrrrrrrrrRo.","...oRrrrrrrrrRo.","...ooooooooooooo","...off.....off.."]};
const TIERC=[null,['#c4ccd4','#8a929b'],['#9db4d4','#647a9c'],['#dcf4f7','#8fc4cc'],['#e0604f','#8e2b26']];
const MSPR={
 slime:{r:["................","................","................","................","................","......oooo......","....ooGGGGoo....","...oGWWGGGGGo...","..oGWGGGGGGGGo..","..oGGGeGGGeGGo..",".oGGGGeGGGeGGGo.",".oGGGGGGGGGGGgo.",".ogGGGGGGGGGggo.","..oggggggggggo..","...oooooooooo...","................"],p:{o:O,G:'#7cc257',g:'#4f8f36',W:'#d4f5b0',e:'#13240f'}},
 mush:{r:["................","......oooo......","....ooRRRRoo....","...oRRWRRRRRo...","..oRRRRRRWWRRo..","..oRWWRRRRRRRo..",".oRRRRRRRWRRRRo.",".oooooooooooooo.","....osssssso....","....osesseso....","....osssssso....","...oossssssoo...","...os.ssss.so...","....osssssso....","....oo.oo.oo....","................"],p:{o:O,R:'#c4402f',W:'#f2ead8',s:'#e3d2b0',e:'#2a1a12'}},
 wolf:{r:["................","................","...........o.o..","..........oWoWo.","..........oWWWWo","..o......oWWeWWn",".oWo.....oWWWWoo",".oWWooooooWWWWo.","..oWWWWWWWWWWo..","...oWWWWWWWWWo..","...oWLLLLLLWWo..","...owwooooowwo..","...ow.o...ow.o..","...ow.o...ow.o..","...oo.oo..oo.oo.","................"],p:{o:O,W:'#94938b',w:'#6b6a64',L:'#c4c2b8',e:'#f2d24b',n:'#222'}},
 skel:{r:["................",".....oooooo.....","....oBBBBBBo....","....oBeBBeBo....","....oBBBBBBo....",".....obBBbo.....","......oBBo....s.","....ooBBBBoo..s.","...oB.BbbB.Bo.s.","...oBoBBBBoBoos.","...o..BbbB..o.h.","......oBBo......",".....oB..Bo.....",".....oB..Bo.....","....ooB..Boo....","................"],p:{o:O,B:'#ebe5d2',b:'#bdb6a0',e:'#c43030',s:'#a7b0ba',h:'#6b4a2a'}},
 scorp:{r:["................","..oo............",".oYYo...........",".oYyo...........","..oYYo..........","...oYYo.........","....oYYo........","....oYYooooo....","...oYYYYYYYYo.oo","..oYYYYYYYYYYoYo","..oyYYYYYYYeYYo.","...oyyyyyyyyYYoo","...o.o.o.o.o..oY","..o.o.o.o.o.....","................","................"],p:{o:O,Y:'#d39a45',y:'#9b6a2a',e:'#1a0c06'}},
 ghoul:{r:["................",".....oooooo.....","....oPPPPPPo....","....oPePPePo....","....oPPPPPPo....","....opPooPpo....",".....oPPPPo.....","...ooccccccoo...","..oPocccccco.Po.","..oP.occccco.Po.","..oP.occccco..o.","...o.occccco....",".....oPP.PPo....",".....oP...Po....","....ooP...Poo...","................"],p:{o:O,P:'#9fb08a',p:'#6f7d5e',e:'#ff4030',c:'#5a4632'}},
 bat:{r:["................","................","................","o..............o","of............fo","oFf....oo....fFo","oFFf..oFFo..fFFo",".oFFfoFeFeofFFo.",".oFFFFFFFFFFFFo.","..oFFfFFFFfFFo..","...ofo.FF.ofo...","....o.oyyo.o....",".......oo.......","................","................","................"],p:{o:O,F:'#e2602a',f:'#8e2b16',y:'#ffd34a',e:'#fff3a0'}},
 golem:{r:["................","......oooo......",".....oKkkKo.....",".....oKLLKo.....","...oooKkkKooo...","..oKKkkLLkkKKo..","..oKkkLkkLkkKo..","..oKoKkLLkKoKo..","..oKoKkkkkKoKo..","..oLoKkLkkKoLo..","..ooooKkkKoooo..",".....oKKKKo.....","....oKko.okKo...","....oKko.okKo...","...ooooo.ooooo..","................"],p:{o:O,K:'#4a3e3a',k:'#6b5a52',L:'#ff7a2a'}},
 dknight:{r:["................","......oooo......",".....oDDDDo.....","....oDDDDDDo....","....oDRRDDDo....","....oDDDDDDo..s.","...ccoDDDDo...s.","..ccoSDDDDSo..s.","..cooDdDDdDoo.s.","..co.oDDDDo..hhh","..c..oddddo...h.","..c..oDDDDo.....",".....oDooDo.....",".....oDo.oDo....","....ooDo.oDoo...","................"],p:{o:O,D:'#3a3550',d:'#26223a',R:'#ff3a3a',c:'#5c2a70',S:'#9aa0b8',s:'#c4cad6',h:'#7a5a3a'}},
 treant:{r:["....oooooooo....","..ooLLLLLLLLoo..",".oLLlLLLLLlLLLo.","oLLLLLLlLLLLLLLo","oLlLLLLLLLLLlLLo",".oLLLlLLLLLLLLo.","..oooTTTTTTooo..","....oTeTTeTo....","....oTTTTTTo....","....oTtmmtTo....","...ooTTTTTToo...","..oTToTTTToTTo..",".oTo.oTttTo.oTo.",".o...oTTTTo...o.","....ooT..Too....","...oo......oo..."],p:{o:O,L:'#3f6b2e',l:'#2a4a20',T:'#6b4a2a',t:'#4a3219',e:'#ff5a2a',m:'#1a0f08'}},
 colossus:{r:["....oooooooo....","...oBBBBBBBBo...","..oBBeeBBeeBBo..","..oBBeeBBeeBBo..","..oBBBBBBBBBBo..","...obBoBBoBbo...","..ooobBBBBbooo..",".oBBoBBBBBBoBBo.","oBBo.BbBBbB.oBBo","oBo..BBBBBB..oBo","oBo..BbBBbB..oBo",".o...oBBBBo...o.",".....oBooBo.....","....oBBo.oBBo...","...oBBo...oBBo..","...oooo...oooo.."],p:{o:O,B:'#e6dfc8',b:'#b0a890',e:'#5ad0ff'}},
 firelord:{r:[".h............h.",".ho..y....y..oh.","..hooFy..yFooh..","...oDDDDDDDDo...","..oDDeeDDeeDDo..","..oDDDDDDDDDDo..","...oDDfyyfDDo...",".FooDDDDDDDDooF.","FyFoDfDDDDfDoFyF","FFoDDDfyyfDDDoFF",".oDDoDDFFDDoDDo.",".oDo.DDDDDD.oDo.","..o..oDDDDo..o..",".....oDooDo.....","....oFFo.oFFo...","...oyFFo.oFFyo.."],p:{o:O,h:'#d8cbb0',F:'#ff7a2a',f:'#b02a16',y:'#ffd84a',D:'#3a1c18',e:'#fff6c0'}}
};
const NL=["......olloollo...","......olloollo...","......olloollo...","......olloollo...","......olloollo...","......olloollo...",".....offo.offo..."];
const NPCS={
 smith:{r:["......oooo......",".....okkkko.....",".....osssso.....",".....osseso.....",".....obbbbo.....","......obbo......","....ooooooo.....","...osCCCCCCo..h.","...osCAAAACo..h.","...osCAAAACo..h.","...o.CAAAACo.MMM","...ssCAAAACss.M.","....oCAAAACo....","....oCAAAACo....","....obbbbbbo....","....oCCCCCCo....","....oooooooo...."].concat(NL),p:{o:O,k:'#3a2a20',s:'#c8966e',e:'#2a1d18',b:'#5e3a20',C:'#5a3e28',A:'#2e241c',h:'#5a4232',M:'#8a8a8a',l:'#3a3540',f:'#1e1a22'}},
 merchant:{r:["......oooo......",".....oHHHHo.....","....oHHHHHHo....","....oHsssseo....","....oHssssso....",".....osssso.....","....ooooooo.....","...oGGGGGGGo....","...oGgGGGgGo.bb.","...oGGGGGGGobbbb","...osGGGGGso.bb.","....oGGGGGGo....","....oGgggggo....","....oGGGGGGo....","....oGGGGGGo....","....oGGGGGGo....","....oGGGGGGo....","....oGGGGGGo....","....oGGGGGGo....","....oGGGGGGo....","....oGGGGGGo....","....oGGGGGGo....","....oooooooo....",".....off.ffo...."],p:{o:O,H:'#264a38',s:'#d9b08a',e:'#2a1d18',G:'#34604a',g:'#b89448',b:'#8a6a3a',f:'#1e1a22'}},
 guard:{r:["......oooo....s.",".....oHHhho...s.",".....ohhhho...s.",".....ohsseo...h.",".....ohssso...h.","......osso....h.","....ooooooo...h.","...oRRRRRRo...h.","...oRRggRRRo..h.","...oRRRRRRRo..h.","...osRRRRRRso.h.","....oRRRRRRo..h.","....oRRRRRRo..h.","....oggggggo..h.","....oRRRRRRo..h.","....oRRRRRRo..h.","....oooooooo..h."].concat(NL),p:{o:O,H:'#d4d9de',h:'#8f98a2',s:'#d9b08a',e:'#2a1d18',R:'#7e2e26',g:'#b89448',l:'#5a6068',f:'#1e1a22'}}
};
function spr(rows,pal,sc){sc=sc||S;const h=rows.length,w=Math.max(...rows.map(r=>r.length));const c=mk(w*sc,h*sc),x=c.getContext('2d');
  rows.forEach((r,j)=>{for(let i=0;i<r.length;i++){const col=pal[r[i]];if(!col)continue;x.fillStyle=col;x.fillRect(i*sc,j*sc,sc,sc);}});return c;}
function whiteOf(c){const w=mk(c.width,c.height),x=w.getContext('2d');x.drawImage(c,0,0);x.globalCompositeOperation='source-in';x.fillStyle='#fff';x.fillRect(0,0,w.width,w.height);return w;}
const SC={};
function heroSpr(cls,tier,frame){const k=cls+tier+frame;if(SC[k])return SC[k];const H=HERO[cls],pal=Object.assign({},H.pal);
  if(TIERC[tier]){pal[H.tint[0]]=TIERC[tier][0];pal[H.tint[1]]=TIERC[tier][1];}
  const rows=H.body.concat(cls=='mage'?ROBE[frame]:LEGS[frame]);const n=spr(rows,pal);return SC[k]={n,w:whiteOf(n)};}
function mobSpr(k){if(SC[k])return SC[k];const d=MSPR[k]||MSPR.slime;const n=spr(d.r,d.p,MT[k].boss?5:S);return SC[k]={n,w:whiteOf(n)};}
function npcSpr(k){if(SC['n'+k])return SC['n'+k];const d=NPCS[k];return SC['n'+k]=spr(d.r,d.p);}

/* ================= object art ================= */
function blob(x,ox,oy,w,h,circ,sh,out,R){const gw=w>>1,gh=h>>1,m=new Int16Array(gw*gh).fill(-1);
  for(let gy=0;gy<gh;gy++)for(let gx=0;gx<gw;gx++){const px=gx*2+1,py=gy*2+1;for(let i=0;i<circ.length;i++){const[cx,cy,r]=circ[i];if((px-cx)**2+(py-cy)**2<=r*r){m[gy*gw+gx]=i;break;}}}
  for(let gy=0;gy<gh;gy++)for(let gx=0;gx<gw;gx++){const i=m[gy*gw+gx],px=gx*2+1,py=gy*2+1;
    if(i>=0){const[cx,cy,r]=circ[i];const l=-((px-cx)/r*.6+(py-cy)/r*.8)+(R()-.5)*.55;x.fillStyle=sh[l>.5?3:l>.05?2:l>-.45?1:0];x.fillRect(ox+gx*2,oy+gy*2,2,2);}
    else if(out){const n=(a,b)=>a>=0&&b>=0&&a<gw&&b<gh&&m[b*gw+a]>=0;if(n(gx+1,gy)||n(gx-1,gy)||n(gx,gy+1)||n(gx,gy-1)){x.fillStyle=out;x.fillRect(ox+gx*2,oy+gy*2,2,2);}}}}
const OC={};
function objArt(t,v){const k=t+v;if(OC[k])return OC[k];const R=rng(v*97+t.length*13+7);let c,x;
  const trunk=(x,cx,top,bot,col,dk)=>{x.fillStyle=O;x.fillRect(cx-6,top,12,bot-top+2);x.fillStyle=col;x.fillRect(cx-4,top,8,bot-top);x.fillStyle=dk;x.fillRect(cx+1,top,3,bot-top);};
  switch(t){
    case'tree':case'dtree':{const dark=t=='dtree';c=mk(64,100);x=c.getContext('2d');trunk(x,32,62,98,'#4e3a26','#352617');
      const sh=dark?['#0f1d13','#172d1b','#213e26','#2d5032']:(v%3==2?['#22381c','#2f4c26','#3e6230','#527a3c']:['#1c3219','#284622','#355a2c','#47723a']);
      const s=v%3;blob(x,0,0,64,82,[[32,30,22-s*2],[17,46,14],[47,46,14],[32,56,15],[22,18,12],[42,20,11]],sh,O,R);break;}
    case'rock':{c=mk(32,30);x=c.getContext('2d');blob(x,0,0,32,30,[[16,18,11],[10,21,7],[23,20,7]],['#4a4a46','#62625c','#7e7e76','#9a9a90'],O,R);
      if(v%2){x.fillStyle='#4f7a3a';x.fillRect(10,9,8,2);x.fillRect(12,7,4,2);}break;}
    case'srock':{c=mk(32,32);x=c.getContext('2d');blob(x,0,0,32,32,[[16,18,12],[9,22,7],[24,21,8]],['#7a5a3a','#9a7550','#b8925f','#d1ac74'],O,R);break;}
    case'dead':{c=mk(40,60);x=c.getContext('2d');const p=(a,b,w,h,col)=>{x.fillStyle=col;x.fillRect(a,b,w,h);};
      p(17,20,8,40,O);p(19,20,4,38,'#6e5a44');p(21,20,2,38,'#4e3e2e');p(8,18,12,4,O);p(9,19,10,2,'#6e5a44');p(22,10,12,4,O);p(23,11,10,2,'#6e5a44');p(7,8,4,12,O);p(8,9,2,10,'#6e5a44');p(31,2,4,10,O);p(32,3,2,8,'#6e5a44');p(19,4,4,18,O);p(20,5,2,16,'#6e5a44');break;}
    case'stal':{c=mk(32,52);x=c.getContext('2d');for(let y=0;y<46;y+=2){const w=Math.max(2,Math.round(y/46*22))&~1;const x0=16-w/2;x.fillStyle=O;x.fillRect(x0-2,y,w+4,2);x.fillStyle='#4e423c';x.fillRect(x0,y,w,2);x.fillStyle='#6e5e54';x.fillRect(x0,y,Math.max(2,w/3|0)&~1,2);}x.fillStyle=O;x.fillRect(2,46,28,4);x.fillStyle='#3a312c';x.fillRect(4,44,24,4);break;}
    case'crystal':{c=mk(32,44);x=c.getContext('2d');const sh=(cx,h,w)=>{for(let y=0;y<h;y+=2){const ww=y<6?Math.max(2,(y/6*w)|0)&~1:w;x.fillStyle=O;x.fillRect(cx-ww/2-2,40-h+y,ww+4,2);x.fillStyle=y%6<2?'#bff5ff':'#5ad0f0';x.fillRect(cx-ww/2,40-h+y,ww,2);x.fillStyle='#2b8ab0';x.fillRect(cx,40-h+y,ww/2,2);}};
      sh(16,34,8);sh(8,20,6);sh(24,24,6);break;}
    case'wall':{c=mk(32,46);x=c.getContext('2d');blob(x,0,0,32,46,[[16,22,15],[8,32,9],[24,30,10],[16,10,10]],['#1c1714','#2a221e','#3a302a','#4a3e36'],'#0a0807',R);break;}
    case'fountain':{c=mk(64,60);x=c.getContext('2d');x.fillStyle=O;x.fillRect(2,24,60,34);x.fillStyle='#8a867c';x.fillRect(4,26,56,30);x.fillStyle='#a8a498';x.fillRect(4,26,56,4);x.fillStyle='#3f84bb';x.fillRect(10,32,44,16);x.fillStyle='#5c9fd0';x.fillRect(10,32,44,4);
      x.fillStyle=O;x.fillRect(26,4,12,30);x.fillStyle='#b4b0a4';x.fillRect(28,6,8,28);x.fillStyle='#8a867c';x.fillRect(32,6,4,28);x.fillStyle=O;x.fillRect(20,2,24,6);x.fillStyle='#c4c0b4';x.fillRect(22,3,20,4);break;}
    case'lamp':{c=mk(32,56);x=c.getContext('2d');x.fillStyle=O;x.fillRect(13,14,6,42);x.fillStyle='#3a3540';x.fillRect(14,14,4,40);x.fillStyle=O;x.fillRect(8,2,16,14);x.fillStyle='#f5d27a';x.fillRect(10,4,12,10);x.fillStyle='#fff1c0';x.fillRect(12,6,4,4);x.fillStyle='#3a3540';x.fillRect(8,0,16,3);x.fillRect(10,50,12,6);break;}
    case'barrel':{c=mk(32,34);x=c.getContext('2d');x.fillStyle=O;x.fillRect(6,4,20,28);x.fillStyle='#8a5a30';x.fillRect(8,6,16,24);x.fillStyle='#a8743e';x.fillRect(8,6,6,24);x.fillStyle='#3a3540';x.fillRect(8,10,16,2);x.fillRect(8,24,16,2);x.fillStyle='#5a3a1e';x.fillRect(8,6,16,3);break;}
    case'crate':{c=mk(32,32);x=c.getContext('2d');x.fillStyle=O;x.fillRect(4,6,24,24);x.fillStyle='#a07a48';x.fillRect(6,8,20,20);x.fillStyle='#7a5a32';x.fillRect(6,8,20,2);x.fillRect(6,26,20,2);x.fillRect(6,8,2,20);x.fillRect(24,8,2,20);x.fillRect(14,8,4,20);break;}
  }
  return OC[k]=c;}

/* ---- ground & houses ---- */
const GPAL={g:['#34482b','#3a5030','#2d4026','#46603a'],d:['#5e4e38','#54452f','#6a5940','#4a3d2b'],c:['#6a675f','#5c5952','#7a776f','#4c4943'],s:['#9c8459','#8f7850','#aa9264','#7e6944'],k:['#86704e','#7a6646','#937c58','#6a583c'],f:['#2f2926','#292320','#38312d','#221d1b'],F:['#3d342e','#352d27','#463c35','#2d2620'],w:['#24486a','#285070','#1f4060','#335c80'],l:['#9a3214','#8a2a10','#b03e18','#702208']};
const PATC={};
function pat(ch){if(PATC[ch])return PATC[ch];const c=mk(64,64),x=c.getContext('2d'),R=rng(ch.charCodeAt(0)*31+5),p=GPAL[ch];x.fillStyle=p[0];x.fillRect(0,0,64,64);
  for(let b=0;b<64;b+=2)for(let a=0;a<64;a+=2){const r=R();if(r<.6)continue;x.fillStyle=r<.8?p[1]:r<.94?p[2]:p[3];x.fillRect(a,b,2,2);}
  if(ch=='c'){for(let n=0;n<34;n++){const a=(R()*60)|0,b=(R()*60)|0;x.fillStyle='#3e3c37';x.fillRect(a-1,b-1,12,6);x.fillStyle=pick([p[0],p[2],p[1]]);x.fillRect(a,b,10,4);x.fillStyle=p[2];x.fillRect(a,b,10,1);}}
  return PATC[ch]=x.createPattern(c,'repeat');}
const TKEY={g:['grass'],d:['dirt'],c:['cobble'],s:['sand'],k:['sand'],f:['cavefloor'],F:['cavefloor'],w:['water'],l:['lava']};
function tileFor(ch,m,i,j){let ks=TKEY[ch];if(ch=='g'&&m.id=='forest')ks=['fgrass'];if(!ks)return null;ks=ks.filter(k=>aImg(k));if(!ks.length)return null;return ks[(hash2(i,j)*ks.length)|0];}
const LQ={};function liquidPat(ch,x){if(LQ[ch])return LQ[ch];const k=ch=='w'?'water':'lava',im=aImg(k),a=ASSETS[k];const c=mk(16,8),y=c.getContext('2d');y.drawImage(im,24,a.cy-4,16,8,0,0,16,8);const big=mk(32,16),z=big.getContext('2d');for(let i=0;i<2;i++)for(let j=0;j<2;j++){z.save();z.translate(i*16+(i?16:0),j*8);if(i)z.scale(-1,1);z.drawImage(c,0,0);z.restore();}return LQ[ch]=x.createPattern(big,'repeat');}
function hash2(x,y){let h=(x*374761393+y*668265263)^0x5bd1e995;h=(h^(h>>>13))*1274126177;return((h^(h>>>16))>>>0)/4294967296;}
function renderGroundTiles(m){const W=m.W,H=m.H,ox=H*HW,c=mk((W+H)*HW,(W+H)*HH+40),x=c.getContext('2d');
  for(let i=0;i<W;i++)for(let j=0;j<H;j++)if(!tileFor(m.g[j*W+i],m,i,j))return false;
  const order=[];for(let j=0;j<H;j++)for(let i=0;i<W;i++)order.push([i,j]);order.sort((a,b)=>(a[0]+a[1])-(b[0]+b[1]));
  for(const[i,j]of order){const ch=m.g[j*W+i],k=tileFor(ch,m,i,j),im=aImg(k),a=ASSETS[k],cx=(i-j)*HW+ox,cy=(i+j+1)*HH,low=(ch=='w'||ch=='l')?7:0;
    const flip=hash2(i*7+3,j*5+1)<.5;
    if(low){const bk=m.id=='cave'?'cavefloor':m.id=='forest'?'fgrass':'grass',bi=aImg(bk);if(bi){x.drawImage(bi,cx-bi.width/2,cy-ASSETS[bk].cy);}
      x.save();x.beginPath();x.moveTo(cx,cy-HH-.5);x.lineTo(cx+HW+1,cy);x.lineTo(cx,cy+HH+.5);x.lineTo(cx-HW-1,cy);x.closePath();x.clip();x.fillStyle=ch=='w'?pat('w'):liquidPat(ch,x);x.translate(0,0);x.fillRect(cx-HW,cy-HH,HW*2,HH*2);
      x.restore();continue;}
    x.save();x.translate(cx,cy);if(flip)x.scale(-1,1);x.drawImage(im,-im.width/2,-a.cy);x.restore();}
  const R=rng(m.def.seed*7+1),cen=(i,j)=>[(i-j)*HW+ox,(i+j+1)*HH];
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){const ch=m.g[j*W+i];if(ch!='w'&&ch!='l')continue;const[cx,cy]=cen(i,j),T=[cx,cy-HH],Rr=[cx+HW,cy],B=[cx,cy+HH],L=[cx-HW,cy];
    for(const[di,dj,a,b]of[[1,0,Rr,B],[-1,0,L,T],[0,1,B,L],[0,-1,T,Rr]]){const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>=W||jj>=H)continue;const n=m.g[jj*W+ii];if(n==ch)continue;
      x.strokeStyle=ch=='w'?'rgba(150,190,210,.55)':'rgba(40,10,0,.8)';x.lineWidth=2;x.beginPath();x.moveTo(a[0],a[1]+1);x.lineTo(b[0],b[1]+1);x.stroke();}}
  const tint={village:'#eef2e2',forest:'#c9d6b4',waste:'#f6eedd'}[m.id];
  if(tint){const cp=mk(c.width,c.height);cp.getContext('2d').drawImage(c,0,0);x.globalCompositeOperation='multiply';x.fillStyle=tint;x.fillRect(0,0,c.width,c.height);x.globalCompositeOperation='destination-in';x.drawImage(cp,0,0);x.globalCompositeOperation='source-over';}
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){const ch=m.g[j*W+i],[cx,cy]=cen(i,j),rx=()=>cx+(R()-.5)*40,ry=()=>cy+(R()-.5)*16;
    if(ch=='g'&&m.id=='village'&&R()<.06){const fc=pick(['#c8b860','#b86a80','#d8d4c8','#7a9ac0']);for(let n=0;n<3;n++){x.fillStyle=fc;x.fillRect(rx()|0,ry()|0,3,3);}}}
  m.groundCv=c;return true;}
function renderGround(m){if(renderGroundTiles(m)){finishGround(m);return;}const W=m.W,H=m.H,ox=H*HW,c=mk((W+H)*HW,(W+H)*HH+4),x=c.getContext('2d'),R=rng(m.def.seed*7+1);
  const at=(i,j)=>(i<0||j<0||i>=W||j>=H)?null:m.g[j*W+i],base=m.def.base||'g';
  const cen=(i,j)=>[(i-j)*HW+ox,(i+j+1)*HH];
  const P8=[[0,-1],[.5,-.5],[1,0],[.5,.5],[0,1],[-.5,.5],[-1,0],[-.5,-.5]];
  const dpath=(i,j,g,jit)=>{const[cx,cy]=cen(i,j);x.beginPath();P8.forEach(([a,b],k)=>{const s=1+g+(jit?R()*jit:0);const px=cx+a*HW*s,py=cy+b*HH*s;k?x.lineTo(px,py):x.moveTo(px,py);});x.closePath();};
  x.fillStyle=pat(base);for(let j=0;j<H;j++)for(let i=0;i<W;i++){dpath(i,j,.03,0);x.fill();}
  for(const t of['d','k','F','s','c','w','l']){if(t==base)continue;x.fillStyle=pat(t);
    for(let j=0;j<H;j++)for(let i=0;i<W;i++)if(at(i,j)==t){const crisp=t=='c'||t=='w'||t=='l';dpath(i,j,crisp?.03:.08,crisp?0:.4);x.fill();}}
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){const ch=at(i,j);if(ch!='w'&&ch!='l')continue;const[cx,cy]=cen(i,j);
    const T=[cx,cy-HH],Rr=[cx+HW,cy],B=[cx,cy+HH],L=[cx-HW,cy];x.strokeStyle=ch=='w'?'#5a86a8':'#2a1208';x.lineWidth=3;
    for(const[di,dj,a,b]of[[1,0,Rr,B],[-1,0,L,T],[0,1,B,L],[0,-1,T,Rr]]){const n=at(i+di,j+dj);if(n==ch||n==null)continue;x.beginPath();x.moveTo(a[0],a[1]);x.lineTo(b[0],b[1]);x.stroke();}}
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){const ch=at(i,j),[cx,cy]=cen(i,j),rx=()=>cx+(R()-.5)*44,ry=()=>cy+(R()-.5)*18;
    if(ch=='g'&&R()<.4){const a=rx()|0,b=ry()|0;x.fillStyle='#4c6a3c';x.fillRect(a,b,2,6);x.fillRect(a+3,b+2,2,4);x.fillRect(a-3,b+3,2,3);}
    if(ch=='g'&&m.id=='village'&&R()<.07){const fc=pick(['#c8b860','#b86a80','#d8d4c8','#7a9ac0']);for(let n=0;n<3;n++){const a=rx()|0,b=ry()|0;x.fillStyle=fc;x.fillRect(a,b,3,3);}}
    if(ch=='g'&&m.id=='forest'&&R()<.05){const a=rx()|0,b=ry()|0;x.fillStyle='#8a3a2a';x.fillRect(a,b,4,3);x.fillStyle='#d8cdb8';x.fillRect(a+1,b+3,2,2);}
    if((ch=='s'||ch=='k')&&R()<.06){const a=rx()|0,b=ry()|0;x.fillStyle='#d8d1bc';x.fillRect(a,b,7,5);x.fillStyle='#2a1d12';x.fillRect(a+1,b+2,2,2);x.fillRect(a+4,b+2,2,2);x.fillStyle='#bdb59e';x.fillRect(a+9,b+2,6,2);x.fillRect(a+11,b,2,6);}
    if((ch=='s'||ch=='k')&&R()<.12){const a=rx()|0,b=ry()|0;x.fillStyle='#6e5a3a';x.fillRect(a,b,6,1);x.fillRect(a+5,b+1,5,1);x.fillRect(a+9,b+2,4,1);}
    if((ch=='f'||ch=='F')&&R()<.15){const a=rx()|0,b=ry()|0;x.fillStyle='#4a403a';x.fillRect(a,b,4,3);x.fillStyle='#5a4e46';x.fillRect(a,b,4,1);}}
  m.groundCv=c;finishGround(m);}
const DECOR_SET={village:[0,1,2,3,4,6,10,32,36,39,40,4,0],forest:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,41,42,45,4,5,4],waste:[16,17,18,19,20,21,22,23,24,25,10,25,24],cave:[26,27,28,29,30,31,45,46,47,10,29,30]};
const DECOR_GLOW={15:'120,200,255',26:'255,150,60',27:'255,90,30',28:'255,120,40',31:'255,60,60',46:'255,200,120',47:'255,200,120'};
function decorate(m){ if(!DECORIMG||!DECORIMG.naturalWidth||m.decorated) return; m.decorated=true; const set=DECOR_SET[m.id]; if(!set) return;
  const x=m.groundCv.getContext('2d'),R=rng(m.def.seed*13+5),W=m.W,H=m.H,ox=H*HW,dens={village:.05,forest:.08,waste:.06,cave:.07}[m.id],sz=DECOR.sz;
  const nearPortal=(i,j)=>m.portals.some(p=>Math.abs(p.x-i)<=1&&Math.abs(p.y-j)<=1);
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){ const k=j*W+i,g=m.g[k]; if(m.blk[k]||g=='w'||g=='l'||g=='c'||nearPortal(i,j)) continue; if(R()>dens) continue;
    if(m.heal&&i>=m.heal.x-1&&i<=m.heal.x+m.heal.w&&j>=m.heal.y-1&&j<=m.heal.y+m.heal.h) continue;
    const id=set[Math.floor(R()*set.length)],cx=(i-j)*HW+ox+(R()-.5)*30,cy=(i+j+1)*HH+(R()-.5)*12,s=.7+R()*.25,d=sz*s;
    x.save(); x.translate(Math.round(cx),Math.round(cy)); if(R()<.5) x.scale(-1,1); x.drawImage(DECORIMG,(id%8)*sz,Math.floor(id/8)*sz,sz,sz,-d/2,-d*.8,d,d); x.restore();
    if(DECOR_GLOW[id]&&m.lights.length<80) m.lights.push({x:i+.5,y:j+.5,r:1.1,c:DECOR_GLOW[id],night:m.id!=='cave',h:6}); } }
function finishGround(m){const W=m.W,H=m.H; decorate(m);
  const mm=mk(W*3,H*3),y=mm.getContext('2d');
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){const k=j*W+i,g=m.g[k];y.fillStyle=g=='w'?'#3a6e98':g=='l'?'#c04a1a':m.blk[k]?'#121512':(m.id=='cave'?'#5a4a40':m.id=='waste'?'#a8884b':'#4c7a3a');y.fillRect(i*3,j*3,3,3);}
  m.miniCv=mm;m.anim=[];for(let k=0;k<W*H;k++)if(m.g[k]=='w'||m.g[k]=='l')m.anim.push(k);
}
function houseIso(v,w,h){const key='h'+v;if(OC[key])return OC[key];
  const WH=60,RH=46,pad=14,o=.22,offX=(h+o*2)*HW+pad,offY=WH+RH+pad+30;
  const c=mk((w+h+o*4)*HW+pad*2,(w+h+o*2)*HH+offY+pad),x=c.getContext('2d'),R=rng(v+9);
  const P=(gx,gy,z)=>[(gx-gy)*HW+offX,(gx+gy)*HH-z+offY];
  const poly=(pts,fill,line,lw)=>{x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();if(fill){x.fillStyle=fill;x.fill();}if(line){x.strokeStyle=line;x.lineWidth=lw||2;x.stroke();}};
  const ln=(a,b,col,lw)=>{x.strokeStyle=col;x.lineWidth=lw||2;x.beginPath();x.moveTo(a[0],a[1]);x.lineTo(b[0],b[1]);x.stroke();};
  const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
  const roof=[['#6a2e22','#4a1f17','#844030'],['#2e4668','#1f3250','#405e86'],['#4a5430','#343c22','#606c40'],['#563048','#3c2032','#704060']][v];
  const wallF='#a8977a',wallR='#86775e',tim='#3a2818';
  x.fillStyle='rgba(0,0,0,.3)';x.beginPath();const s1=P(0,h+.4,0),s2=P(w+.5,h+.4,0),s3=P(w+.5,-.1,0),s4=P(w,0,0),s5=P(0,h,0);x.moveTo(...s1);x.lineTo(...s2);x.lineTo(...s3);x.lineTo(...s4);x.lineTo(...s5);x.closePath();x.fill();
  const R1=P(-o,h/2,WH+RH),R2=P(w+o,h/2,WH+RH),E1=P(-o,h+o,WH-8),E2=P(w+o,h+o,WH-8),F1=P(-o,-o,WH-8),F2=P(w+o,-o,WH-8);
  poly([F1,F2,R2,R1],roof[1],O);
  const A=P(0,h,0),B=P(w,h,0),C=P(w,0,0),A2=P(0,h,WH),B2=P(w,h,WH),C2=P(w,0,WH),G=P(w,h/2,WH+RH);
  poly([A,B,B2,A2],wallF,O);poly([B,C,C2,B2,G],wallR,O);
  const fp=(u,z)=>P(w*u,h,z),rp=(u,z)=>P(w,h-h*u,z);
  for(let n=0;n<220;n++){const u=R(),z=R()*WH;const p=n<130?fp(u,z):rp(u,z);x.fillStyle=R()<.5?'rgba(0,0,0,.08)':'rgba(255,240,210,.08)';x.fillRect(p[0]|0,p[1]|0,2,2);}
  for(const u of[0,.33,.67,1]){ln(fp(u,0),fp(u,WH),tim,4);}ln(fp(0,WH*.55),fp(1,WH*.55),tim,3);ln(fp(0,2),fp(1,2),tim,4);
  for(const u of[0,.5,1]){ln(rp(u,0),rp(u,WH),tim,4);}ln(rp(0,WH*.55),rp(1,WH*.55),tim,3);ln(G,rp(.5,WH),tim,3);
  const quad=(f,u1,u2,z1,z2,fill,line)=>poly([f(u1,z1),f(u2,z1),f(u2,z2),f(u1,z2)],fill,line);
  for(const u of[.1,.76]){quad(fp,u,u+.14,WH*.6,WH*.9,'#2a1e12');quad(fp,u+.015,u+.125,WH*.63,WH*.87,'#d8b060');ln(fp(u+.07,WH*.63),fp(u+.07,WH*.87),'#2a1e12',2);}
  quad(rp,.3,.48,WH*.6,WH*.9,'#2a1e12');quad(rp,.315,.465,WH*.63,WH*.87,'#c8a050');
  quad(fp,.42,.58,0,WH*.52,'#2a1a10');quad(fp,.435,.565,0,WH*.48,'#5a3a22');ln(fp(.5,0),fp(.5,WH*.48),'#3a2414',2);
  if(v<2){const sg=fp(.66,WH*.5);x.fillStyle=O;x.fillRect(sg[0]-1,sg[1]-2,22,16);x.fillStyle='#6a4e2c';x.fillRect(sg[0]+1,sg[1],18,12);
    if(v==0){x.fillStyle='#a8acb0';x.fillRect(sg[0]+4,sg[1]+3,12,3);x.fillRect(sg[0]+7,sg[1]+6,6,3);}else{x.fillStyle='#b84a3a';x.fillRect(sg[0]+7,sg[1]+3,6,7);x.fillStyle='#d8d0b8';x.fillRect(sg[0]+8,sg[1]+1,4,2);}}
  poly([E1,E2,R2,R1],roof[0],O);
  for(let t=.1;t<1;t+=.115)ln(lerp(E1,R1,t),lerp(E2,R2,t),roof[1],2);
  for(let u=0;u<=1.001;u+=1/(w*3)){x.globalAlpha=.35;ln(lerp(E1,E2,u),lerp(R1,R2,u),roof[1],1);x.globalAlpha=1;}
  ln(R1,R2,roof[2],3);ln(E1,E2,'#1a120c',3);
  if(v==0){const b=P(w*.72,h*.3,WH+RH*.55);const cw=14,chh=34;x.fillStyle=O;x.fillRect(b[0]-cw/2-2,b[1]-chh-2,cw+4,chh+4);x.fillStyle='#5b5650';x.fillRect(b[0]-cw/2,b[1]-chh,cw,chh);x.fillStyle='#46423d';x.fillRect(b[0],b[1]-chh,cw/2,chh);x.fillStyle='#2a2622';x.fillRect(b[0]-cw/2,b[1]-chh,cw,4);}
  return OC[key]={c,ax:offX,ay:offY};}

/* ---- sheets ---- */
/* ================= PixelLab hero sheets ================= */
const DIR8=['east','south-east','south','south-west','west','north-west','north','north-east'];
function sheetImg(cls){const d=SHEETS[cls];if(!d)return null;if(!SHIMG[cls]){const im=new Image();im.src=d.src;SHIMG[cls]=im;}return SHIMG[cls].complete&&SHIMG[cls].naturalWidth?SHIMG[cls]:null;}
const SPREV={};function sheetPrev(c){if(SPREV[c])return SPREV[c];const im=new Image();im.src=SHEETS[c].prev;const cv2=mk(64,64);SPREV[c]=cv2;im.onload=()=>{cv2.getContext('2d').drawImage(im,0,0);};return cv2;}
function faceM(m,dx,dy){m.dir=sdir(dx,dy,m.dir);const sx=dx-dy,sy=(dx+dy)*.5;if(sx||sy)m.face=(Math.round(Math.atan2(sy,sx)/(Math.PI/4))+8)%8;}

const tintC=mk(128,128),tintX=tintC.getContext('2d');
const SK=E=>E.g=='f'&&SHEETS[E.cls+'_f']?E.cls+'_f':E.cls;
function drawSheetHero(E,X,Y){const sk=SK(E),d=SHEETS[sk],im=sheetImg(sk);if(!d||!im)return false;
  const mv=Math.abs(E.x-E.rx)+Math.abs(E.y-E.ry)>.06,face=E.face==null?2:E.face,dn=DIR8[face];
  let an='idle',fr=0;
  if(E.atkVis>0&&d.anims.attack&&d.anims.attack[dn]){an='attack';const n=d.anims.attack[dn].n,D=E.atkDur||.45;fr=Math.min(n-1,Math.floor((1-E.atkVis/D)*n));}
  else if(mv&&d.anims.walk&&d.anims.walk[dn]){an='walk';const n=d.anims.walk[dn].n;fr=Math.floor(E.walk*11)%n;}
  const a=d.anims[an][dn],fw=d.fw,fh=d.fh,sx=fr*fw,sy=a.row*fh;
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(X,Y,14,6,0,0,7);ctx.fill();
  const dx=Math.round(X-fw/2+(E.lunge>0?E.dir*4:0)),dy=Math.round(Y-d.foot);
  ctx.save();if(E.dead>0)ctx.globalAlpha=.35;
  const en=E.eq.w.en;if(en>=7){ctx.shadowColor=en>=9?'#ff9a3c':'#7ed8ff';ctx.shadowBlur=12+Math.sin(now*5)*4;}
  ctx.drawImage(im,sx,sy,fw,fh,dx,dy,fw,fh);ctx.restore();
  if(E.hurt>0){tintX.clearRect(0,0,96,96);tintX.globalCompositeOperation='source-over';tintX.drawImage(im,sx,sy,fw,fh,0,0,fw,fh);tintX.globalCompositeOperation='source-in';tintX.fillStyle='rgba(255,255,255,.85)';tintX.fillRect(0,0,fw,fh);ctx.drawImage(tintC,0,0,fw,fh,dx,dy,fw,fh);}
  return true;}

/* ---- drawing ---- */
/* ================= drawing ================= */
let NIGHT=0;
function dayInfo(){const cyc=((Date.now()/1000+60)/300)%1,day=.5+.5*Math.cos(cyc*Math.PI*2);return{day,label:day>.6?'白天':day>.3?(cyc<.5?'黃昏':'清晨'):'夜晚'};}
const OBJK={tree:'obj_tree',dtree:'obj_pine',rock:'obj_rock',srock:'obj_srock',dead:'obj_dead',stal:'obj_stal',wall:'obj_stal',crystal:'obj_crystal',lamp:'obj_lamp',barrel:'obj_barrel',crate:'obj_barrel'};
const OBJS={tree:.95,dtree:.95,rock:.9,srock:1,dead:.95,stal:.85,wall:1.05,crystal:.9,lamp:.9,barrel:.95,crate:.95};
function drawObj(o){
  if(o.t=='house'){const hk='obj_house'+(o.v%2),hi=aImg(hk);if(hi){const a=ASSETS[hk],sc=1.28,cx=(PX(o.x+o.w,o.y)+PX(o.x,o.y+o.h))/2-cam.x,by=PY(o.x+o.w,o.y+o.h)-cam.y;
      ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(cx+10,by-40,a.w*.55,40,0,0,7);ctx.fill();
      ctx.save();ctx.translate(Math.round(cx),Math.round(by+4));if(o.v>=2)ctx.scale(-1,1);ctx.scale(sc,sc);ctx.drawImage(hi,-a.w/2,-a.foot);ctx.restore();return;}
    const h=houseIso(o.v,o.w,o.h);ctx.drawImage(h.c,Math.round(PX(o.x,o.y)-cam.x-h.ax),Math.round(PY(o.x,o.y)-cam.y-h.ay));return;}
  if(o.t=='fountain'&&aImg('obj_fountain')){const a=ASSETS.obj_fountain,X=PX(o.x+1,o.y+1)-cam.x,Y=PY(o.x+1,o.y+1)-cam.y;ctx.drawImage(aImg('obj_fountain'),Math.round(X-a.w/2),Math.round(Y+22-a.foot));return;}
  if(o.t=='fountain'){const X=PX(o.x+1,o.y+1)-cam.x,Y=PY(o.x+1,o.y+1)-cam.y;
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(X+4,Y+10,52,24,0,0,7);ctx.fill();
    ctx.fillStyle=O;ctx.beginPath();ctx.ellipse(X,Y+6,48,24,0,0,7);ctx.fill();ctx.fillStyle='#55524b';ctx.beginPath();ctx.ellipse(X,Y+4,46,22,0,0,7);ctx.fill();
    ctx.fillStyle='#7a766c';ctx.beginPath();ctx.ellipse(X,Y-4,46,22,0,0,7);ctx.fill();ctx.fillStyle='#24486a';ctx.beginPath();ctx.ellipse(X,Y-4,38,17,0,0,7);ctx.fill();
    ctx.fillStyle='rgba(120,170,210,.35)';ctx.beginPath();ctx.ellipse(X-8,Y-8,20,6,0,0,7);ctx.fill();
    ctx.fillStyle=O;ctx.fillRect(X-7,Y-46,14,44);ctx.fillStyle='#8a867c';ctx.fillRect(X-5,Y-46,10,42);ctx.fillStyle='#6a665e';ctx.fillRect(X,Y-46,5,42);
    ctx.fillStyle=O;ctx.beginPath();ctx.ellipse(X,Y-48,17,7,0,0,7);ctx.fill();ctx.fillStyle='#9a968c';ctx.beginPath();ctx.ellipse(X,Y-49,15,6,0,0,7);ctx.fill();ctx.fillStyle='#3a6e98';ctx.beginPath();ctx.ellipse(X,Y-49,11,4,0,0,7);ctx.fill();
    for(let i=0;i<8;i++){const ph=(now*1.6+i/8)%1,a=i/8*6.28;ctx.fillStyle=`rgba(190,225,250,${1-ph})`;ctx.fillRect(Math.round(X+Math.cos(a)*(10+ph*22)),Math.round(Y-50+ph*44-Math.sin(ph*3.1)*14+Math.sin(a)*ph*8),2,3);}
    return;}
  const ax=PX(o.x+.5,o.y+.5)-cam.x,ay=PY(o.x+.5,o.y+.5)-cam.y;
  const ok=OBJK[o.t],oi=ok&&aImg(ok);if(oi){const a=ASSETS[ok],flip=(o.x*7+o.y*3)%2==1,sc=OBJS[o.t]*(1+((o.x*13+o.y*7)%5-2)*.04);
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(ax+3,ay+2,a.w*.28*sc,a.w*.12*sc,0,0,7);ctx.fill();
    ctx.save();ctx.translate(Math.round(ax),Math.round(ay+6));if(flip)ctx.scale(-1,1);ctx.scale(sc,sc);ctx.drawImage(oi,-a.w/2,-a.foot);ctx.restore();return;}
  const art=objArt(o.t,o.v);
  ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(ax+3,ay+2,o.t=='tree'||o.t=='dtree'?24:15,o.t=='tree'||o.t=='dtree'?10:7,0,0,7);ctx.fill();
  ctx.drawImage(art,Math.round(ax-art.width/2),Math.round(ay-art.height+6));}
function drawHero(E,X,Y){if(drawSheetHero(E,X,Y))return;const mv=Math.abs(E.x-E.rx)+Math.abs(E.y-E.ry)>.06,fr=mv&&(E.walk*7|0)%2?'b':'a',s=heroSpr(E.cls,E.eq.a.t,fr);
  const lx=E.lunge>0?E.dir*5:0,bob=fr=='b'?-1:0;
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(X,Y,13,5,0,0,7);ctx.fill();
  ctx.save();ctx.translate(X+lx,Y+bob);if(E.dir<0)ctx.scale(-1,1);ctx.translate(-16,-47);if(E.dead>0)ctx.globalAlpha=.35;
  ctx.drawImage(E.hurt>0?s.w:s.n,0,0);
  const t=E.eq.w.t,en=E.eq.w.en,a=E.atkAnim>0?1-E.atkAnim/.25:0;
  ctx.save();if(en>=7){ctx.shadowColor=en>=9?'#ff9a3c':'#7ed8ff';ctx.shadowBlur=10;}
  if(E.cls=='knight'){ctx.translate(23,25);ctx.rotate(E.atkAnim>0?-2.1+a*2.8:-.75);const len=[14,18,20,24,26][t];
    ctx.fillStyle=O;ctx.fillRect(-4,-2,len+7,4);ctx.fillStyle='#4a3420';ctx.fillRect(-4,-1,5,2);ctx.fillStyle='#b89448';ctx.fillRect(1,-4,2,8);
    ctx.fillStyle=['#c4cad0','#d4dae0','#a8aeb4','#8ac4b0','#e8804a'][t];ctx.fillRect(3,-1,len,2);ctx.fillStyle='#eef2f4';ctx.fillRect(3,-1,len,1);}
  else if(E.cls=='ranger'){ctx.translate(25,24);const pull=E.atkAnim>0?Math.sin(a*Math.PI)*4:0;ctx.strokeStyle=O;ctx.lineWidth=4;ctx.beginPath();ctx.arc(-4,0,13,-1.2,1.2);ctx.stroke();
    ctx.strokeStyle=['#6e4a28','#94683a','#3e7a54','#5e98ae','#d8b440'][t];ctx.lineWidth=2;ctx.beginPath();ctx.arc(-4,0,13,-1.2,1.2);ctx.stroke();
    ctx.strokeStyle='#d8d0b8';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-4+13*Math.cos(-1.2),13*Math.sin(-1.2));ctx.lineTo(-4-pull,0);ctx.lineTo(-4+13*Math.cos(1.2),13*Math.sin(1.2));ctx.stroke();}
  else{ctx.translate(25,2);ctx.rotate(E.atkAnim>0?-.3+a*.5:.06);ctx.fillStyle=O;ctx.fillRect(-2,0,4,40);ctx.fillStyle='#5a4028';ctx.fillRect(-1,2,2,38);
    const oc=['#6aa0e0','#a8e0f0','#6ac07a','#a87ae0','#e8c040'][t];ctx.shadowColor=oc;ctx.shadowBlur=12+Math.sin(now*5)*4;ctx.fillStyle=O;ctx.fillRect(-5,-7,10,10);ctx.fillStyle=oc;ctx.fillRect(-3,-5,6,6);ctx.fillStyle='#fff';ctx.fillRect(-2,-4,2,2);}
  ctx.restore();ctx.restore();}
const FACEL={boar:1};
const MIRD={west:'east','south-west':'south-east','north-west':'north-east',east:'west','south-east':'south-west','north-east':'north-west'},MATK=.5;
function mobArt(m){const d=MOBS[m.k],im=MOBI[m.k];if(d&&im&&im.naturalWidth)return{type:'sheet',d,im};const a=ASSETS['mob_'+m.k],ai=aImg('mob_'+m.k);if(a&&ai)return{type:'single',a,im:ai};return null;}
function drawMobArt(m,X,Y,kx,ky,bob,sx,sy){const art=mobArt(m);if(!art)return 0;let im=art.im,fx0=0,fy0=0,fw,fh,foot;
  let mir=false;
  if(art.type=='sheet'){const d=art.d,dn=DIR8[m.face==null?1:m.face],mv=Math.abs(m.x-m.rx)+Math.abs(m.y-m.ry)>.05;
    // missing west-side directions are drawn as the mirrored east side
    const get=an=>{const A=d.anims[an];if(!A)return null;if(A[dn])return[A[dn],false];const md=MIRD[dn];return md&&A[md]?[A[md],true]:null;};
    let g=get('idle')||[d.anims.idle.east,false],a=g[0],fr=0;mir=g[1];
    const ga=m.mAtk>0&&get('attack'),gw=!ga&&mv&&get('walk');
    if(ga){a=ga[0];mir=ga[1];fr=Math.min(a.n-1,Math.floor((1-m.mAtk/MATK)*a.n));}
    else if(gw){a=gw[0];mir=gw[1];fr=Math.floor(now*9+(parseInt(m.id.slice(1))||0))%a.n;}
    fw=d.fw;fh=d.fh;fx0=fr*fw;fy0=a.row*fh;foot=d.foot;}
  else{fw=im.width;fh=im.height;foot=art.a.foot;}
  const flip=art.type=='single'?((m.dir<0)!==!!FACEL[m.k]):mir;
  ctx.save();ctx.translate(X+kx,Y+ky+bob+2);if(flip)ctx.scale(-1,1);ctx.scale(sx,sy);ctx.drawImage(im,fx0,fy0,fw,fh,-fw/2,-foot,fw,fh);ctx.restore();
  if(m.hurt>0){tintX.clearRect(0,0,128,128);tintX.globalCompositeOperation='source-over';tintX.drawImage(im,fx0,fy0,fw,fh,0,0,fw,fh);tintX.globalCompositeOperation='source-in';tintX.fillStyle='rgba(255,255,255,.9)';tintX.fillRect(0,0,fw,fh);
    ctx.save();ctx.translate(X+kx,Y+ky+bob+2);if(flip)ctx.scale(-1,1);ctx.scale(sx,sy);ctx.drawImage(tintC,0,0,fw,fh,-fw/2,-foot,fw,fh);ctx.restore();}
  return Math.round(foot*.92);}
function drawMob(m,X,Y){const t=MT[m.k],s=mobSpr(m.k),mv=Math.abs(m.x-m.rx)+Math.abs(m.y-m.ry)>.05;
  let kx=m.kbx*m.kb*6,ky=m.kby*m.kb*6;if(m.lg>0){const a=(m.lgA||0),l=Math.sin(m.lg/.18*Math.PI)*7;kx+=Math.cos(a)*l;ky+=Math.sin(a)*l;}
  let bob=0,sx=1,sy=1;
  if(m.k=='slime'){const q=Math.sin(now*6+m.id);sx=1+q*.08;sy=1-q*.08;}else if(m.k=='bat'){bob=Math.sin(now*10+m.id)*3-14;sy=1+Math.sin(now*20+m.id)*.1;}else if(mv)bob=-Math.abs(Math.sin(now*12+m.id))*2;
  if(m.atkAnim>0)sx*=1+Math.sin((1-m.atkAnim/.25)*Math.PI)*.15;
  const w=s.n.width;let h=s.n.height;
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(X+kx,Y,m.boss?34:12,m.boss?13:5,0,0,7);ctx.fill();
  if(m.tele>0){const p=1-m.tele/1.1;ctx.strokeStyle=`rgba(255,60,40,${.4+p*.5})`;ctx.fillStyle=`rgba(255,40,20,${.1+p*.2})`;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(X,Y,HW*2.6*p,HH*2.6*p,0,0,7);ctx.fill();ctx.stroke();}
  let h2=drawMobArt(m,X,Y,kx,ky,bob,sx,sy);if(h2){h=h2;}else{ctx.save();ctx.translate(X+kx,Y+ky+bob+2);if(m.dir<0)ctx.scale(-1,1);ctx.scale(sx,sy);ctx.drawImage(m.hurt>0?s.w:s.n,-w/2,-h);ctx.restore();}
  if(m.stun>0){for(let i=0;i<3;i++){const a=now*5+i*2.1;ctx.fillStyle='#ffd84a';ctx.fillRect(X+Math.cos(a)*10-2,Y-h-6+Math.sin(a)*3,4,4);}}
  if(m.hp<m.maxhp||myTarget()===m||m.boss||m.nm){const bw=m.boss?(m.nm?110:70):m.nm?50:28,bx=X-bw/2,by=Y-h-8+(m.k=='bat'?-12:0);
    ctx.fillStyle=O;ctx.fillRect(bx-1,by-1,bw+2,5);ctx.fillStyle='#3a0c0a';ctx.fillRect(bx,by,bw,3);ctx.fillStyle=m.boss?'#ff5a2a':'#d84a3a';ctx.fillRect(bx,by,bw*Math.max(0,m.hp/m.maxhp),3);
    label(m.nm?(m.boss?'【世界BOSS】':'【精英】')+m.nm:(m.boss?'【BOSS】':'')+t.n+' Lv.'+t.lv,X,by-4,m.nm?'#ff7a5a':m.boss?'#ffb070':t.lv>(ME?ME.lv:1)+3?'#ff8a7a':'#e4dac0');}}
function label(txt,X,Y,col){ctx.font='11px '+FONT;ctx.textAlign='center';ctx.fillStyle='rgba(0,0,0,.8)';ctx.fillText(txt,X+1,Y+1);ctx.fillStyle=col||'#ffe7a3';ctx.fillText(txt,X,Y);}
function drawItem(it){const o=it.o;
  if(it.t==4&&o.bf){const X=Math.round(fx(o)-cam.x),Y=Math.round(fy(o)-cam.y);drawAura(o,X,Y);if(o.bf.shadow>now){ctx.globalAlpha=.5;drawPlayer(o,X,Y);ctx.globalAlpha=1;return;}}
  if(it.t==0)drawObj(o);
  else if(it.t==1){const X=PX(o.x+.5,o.y+.5)-cam.x,Y=PY(o.x+.5,o.y+.5)-cam.y;ctx.fillStyle='rgba(0,0,0,.32)';ctx.beginPath();ctx.ellipse(X,Y,12,5,0,0,7);ctx.fill();
    const ni=npcImg(o.k),nd=NPCIMG[o.k];if(ni)ctx.drawImage(ni,Math.round(X-nd.w/2),Math.round(Y-nd.foot));else ctx.drawImage(npcSpr(o.k),Math.round(X-16),Math.round(Y-47-Math.abs(Math.sin(now*2+o.x))*1.2));label(o.name,X,Y-58);if(npcHint(o)){const b=(Math.sin(now*4)+1)*1.5;ctx.fillStyle='#e8c040';ctx.fillRect(X-2,Y-74-b,4,7);ctx.fillRect(X-2,Y-65-b,4,2);}}
  else if(it.t==2)drawMob(o,Math.round(fx(o)-cam.x),Math.round(fy(o)-cam.y));
  else if(it.t==5){const p=o,X=Math.round(PX(p.x+.5,p.y+.5)-cam.x),Y=Math.round(PY(p.x+.5,p.y+.5)-cam.y),g=aImg('gate'),a=ASSETS.gate,sc=p.big?1.15:.8,w=a.w*sc,h=a.h*sc;
    ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(X,Y+4,w*.42,w*.2,0,0,7);ctx.fill();
    ctx.drawImage(g,Math.round(X-w/2),Math.round(Y-a.cy*sc+10),Math.round(w),Math.round(h));
    // living portal glow inside the arch
    const pu=(Math.sin(now*3+p.x)+1)/2;ctx.save();ctx.globalCompositeOperation='lighter';const gx=X-4,gy=Y-h*.42,gr=ctx.createRadialGradient(gx,gy,0,gx,gy,26+pu*6);gr.addColorStop(0,`rgba(190,120,255,${.35+pu*.25})`);gr.addColorStop(1,'rgba(120,60,220,0)');ctx.fillStyle=gr;ctx.fillRect(gx-34,gy-34,68,68);ctx.restore();}
  else if(it.t==6||it.t==7){ // town wall segment / gatehouse, skewed along the isometric x axis
    const w=it.t==6?{x0:o.x,x1:o.x+1,y:o.y}:{x0:o.g0,x1:o.g1+1,y:o.y},k=it.t==6?'wallseg':'gatehouse',im=aImg(k),a=ASSETS[k],tiles=w.x1-w.x0,vs=it.t==6?.95:.9;
    const X=PX(w.x0,w.y+.5)-cam.x,Y=PY(w.x0,w.y+.5)-cam.y;
    ctx.save();ctx.transform(tiles*HW/a.w,tiles*HH/a.w,0,vs,Math.round(X),Math.round(Y-a.h*vs+3));ctx.drawImage(im,0,0);ctx.restore();}
  else if(it.t==3){ctx.globalAlpha=Math.max(0,1-o.t/.6);if(mobArt(o.m)){const mm=o.m;mm.hurt=1;drawMobArt(mm,fx(mm)-cam.x,fy(mm)-cam.y,0,0,0,1,1-o.t);ctx.globalAlpha=1;return;}const s=mobSpr(o.m.k);ctx.save();ctx.translate(fx(o.m)-cam.x,fy(o.m)-cam.y);ctx.scale(o.m.dir,1-o.t);ctx.drawImage(s.w,-s.n.width/2,-s.n.height);ctx.restore();ctx.globalAlpha=1;}
  else drawPlayer(o,Math.round(fx(o)-cam.x),Math.round(fy(o)-cam.y));}
function drawSlash(p,X,Y,k){ctx.save();ctx.translate(X,Y);ctx.rotate(p.ang);ctx.globalAlpha=(1-k)*(p.back?.55:1);ctx.strokeStyle=p.c;ctx.lineWidth=p.big?6:4;ctx.shadowColor=p.c;ctx.shadowBlur=p.big?16:6;ctx.beginPath();ctx.arc(-6,0,p.big?24:17,-1.3+k*.6,1.3+k*.6);ctx.stroke();ctx.restore();ctx.globalAlpha=1;}
function draw(){const m=cur;OX=m.H*HW;const WWp=(m.W+m.H)*HW,WHp=(m.W+m.H)*HH;
  let cx=fx(P)-VW/2,cy=fy(P)-28-VH/2;cx=Math.max(-VW*.2,Math.min(WWp-VW*.8,cx));cy=Math.max(-VH*.25,Math.min(WHp-VH*.75,cy));
  if(shake>0){cx+=rnd(-shakeMag,shakeMag);cy+=rnd(-shakeMag,shakeMag);}cam.x=Math.round(cx);cam.y=Math.round(cy);
  ctx.fillStyle=m.id=='cave'?'#1a1210':m.id=='waste'?'#7a6444':m.id=='forest'?'#1f3318':'#2c4524';ctx.fillRect(0,0,VW,VH);
  ctx.drawImage(m.groundCv,-cam.x,-cam.y);
  for(const k of m.anim){const i=k%m.W,j=k/m.W|0,X=PX(i+.5,j+.5)-cam.x,Y=PY(i+.5,j+.5)-cam.y;if(X<-40||Y<-30||X>VW+40||Y>VH+30)continue;
    if(m.g[k]=='w'){const o=((now*10+i*9+j*5)%24)-12;ctx.fillStyle='rgba(140,185,220,.4)';ctx.fillRect(X+o-4,Y-3+(j%2)*5,8,1);ctx.fillRect(X-o-3,Y+4,6,1);}
    else{const p=(Math.sin(now*2+i*1.3+j*.7)+1)/2;ctx.fillStyle=`rgba(255,${150+p*80|0},40,${.3+p*.35})`;ctx.fillRect(X-8+(i*7%12),Y-4+(j*5%6),9,4);ctx.fillStyle=`rgba(255,230,120,${p*.5})`;ctx.fillRect(X+(j*3%10)-4,Y+2,4,2);}}
  for(const p of m.portals){if(aImg('gate')||p.gate)continue;const X=PX(p.x+.5,p.y+.5)-cam.x,Y=PY(p.x+.5,p.y+.5)-cam.y,a=(Math.sin(now*3)+1)/2;ctx.save();ctx.shadowColor='#9a6ae0';ctx.shadowBlur=16;
    ctx.fillStyle=`rgba(110,70,210,${.28+a*.15})`;ctx.beginPath();ctx.ellipse(X,Y,24+a*3,12+a*1.5,0,0,7);ctx.fill();ctx.strokeStyle='#bfa0f0';ctx.lineWidth=2;ctx.stroke();
    ctx.strokeStyle=`rgba(255,255,255,${.3+a*.4})`;ctx.beginPath();ctx.ellipse(X,Y,14,7,0,now%6.28,now%6.28+3);ctx.stroke();ctx.restore();}
  if(marker){const X=PX(marker.x+.5,marker.y+.5)-cam.x,Y=PY(marker.x+.5,marker.y+.5)-cam.y,a=(Math.sin(now*8)+1)/2;ctx.strokeStyle=`rgba(255,231,163,${.4+a*.5})`;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(X,Y,12+a*4,6+a*2,0,0,7);ctx.stroke();}
  {const t=myTarget();if(t){const X=fx(t)-cam.x,Y=fy(t)-cam.y;ctx.strokeStyle='#e8503e';ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.lineDashOffset=-now*20;ctx.beginPath();ctx.ellipse(X,Y,t.boss?40:16,t.boss?18:7,0,0,7);ctx.stroke();ctx.setLineDash([]);}}
  drawGroundFx();
  const A=[],B=[],vis=(sx,sy)=>sx>-90&&sx<VW+90&&sy>-40&&sy<VH+140;
  for(const o of m.objs){if(BIG[o.t]){const l=PX(o.x,o.y+o.h)-cam.x,r=PX(o.x+o.w,o.y)-cam.x,top=PY(o.x,o.y)-cam.y-150,bot=PY(o.x+o.w,o.y+o.h)-cam.y;if(r>-60&&l<VW+60&&bot>-60&&top<VH+60)B.push({o,l,r,done:false});continue;}
    const sx=PX(o.x+.5,o.y+.5)-cam.x,sy=PY(o.x+.5,o.y+.5)-cam.y;if(vis(sx,sy))A.push({k:o.x+o.y,tx:o.x,ty:o.y,sx,t:0,o});}
  if(m.wall&&aImg('wallseg')){const w=m.wall;for(let x=w.x0;x<=w.x1;x++){if(x>=w.g0&&x<=w.g1)continue;const sx=PX(x+.5,w.y+.5)-cam.x,sy=PY(x+.5,w.y+.5)-cam.y;if(sx>-80&&sx<VW+80&&sy>-60&&sy<VH+120)A.push({k:x+w.y+.45,tx:x,ty:w.y,sx,t:6,o:{x,y:w.y}});}
    const gx=(w.g0+w.g1+1)/2;A.push({k:gx+w.y+.45,tx:Math.floor(gx),ty:w.y,sx:PX(gx,w.y+.5)-cam.x,t:7,o:w});}
  if(aImg('gate'))for(const p of m.portals){if(p.gate)continue;const sx=PX(p.x+.5,p.y+.5)-cam.x,sy=PY(p.x+.5,p.y+.5)-cam.y;if(vis(sx,sy))A.push({k:p.x+p.y-.2,tx:p.x,ty:p.y,sx,t:5,o:p});}
  for(const n of m.npcs)A.push({k:n.x+n.y+.01,tx:n.x,ty:n.y,sx:PX(n.x+.5,n.y+.5)-cam.x,t:1,o:n});
  for(const mb of m.mobs){const sx=fx(mb)-cam.x,sy=fy(mb)-cam.y;if(vis(sx,sy))A.push({k:mb.rx+mb.ry+.02,tx:Math.round(mb.rx),ty:Math.round(mb.ry),sx,t:2,o:mb});}
  for(const c of m.corpses)A.push({k:c.m.rx+c.m.ry+.02,tx:c.m.x,ty:c.m.y,sx:fx(c.m)-cam.x,t:3,o:c});
  for(const e of players.values())if(!hideOthers||e===P||e.party)A.push({k:e.rx+e.ry+.03,tx:Math.round(e.rx),ty:Math.round(e.ry),sx:fx(e)-cam.x,t:4,o:e});
  A.sort((a,b)=>a.k-b.k);
  for(const p of parts)if(p.type=='slash'&&p.back&&!(p.delay>0))drawSlash(p,p.x-cam.x,p.y-cam.y,p.t/p.life);
  for(const it of A){for(const b of B){if(b.done)continue;const o=b.o;if((it.tx>=o.x+o.w||it.ty>=o.y+o.h)&&it.sx>b.l-24&&it.sx<b.r+24){drawObj(o);b.done=true;}}drawItem(it);}
  for(const b of B)if(!b.done)drawObj(b.o);
  for(const p of m.portals)if(p.label)label(p.label,PX(p.gate?p.x+1:p.x+.5,p.y+.5)-cam.x,PY(p.gate?p.x+1:p.x+.5,p.y+.5)-cam.y-(p.gate?150:aImg('gate')?(p.big?160:112):18),'#d0bcf4');
  if(m.heal)label('治癒之泉',PX(m.heal.x+1,m.heal.y+1)-cam.x,PY(m.heal.x+1,m.heal.y+1)-cam.y-62,'#b8dcf4');
  for(const p of projs){const X=p.x-cam.x,Y=p.y-cam.y;ctx.save();ctx.translate(X,Y);ctx.rotate(p.ang||0);
    if(p.kind=='arrow'){ctx.fillStyle=O;ctx.fillRect(-11,-2,22,4);ctx.fillStyle='#c8b080';ctx.fillRect(-10,-1,18,2);ctx.fillStyle='#d8dee3';ctx.fillRect(7,-2,4,4);ctx.fillStyle=p.col||'#e4dccc';ctx.fillRect(-11,-3,4,2);ctx.fillRect(-11,1,4,2);}
    else if(p.kind=='bolt'){ctx.shadowColor='#7ab8ff';ctx.shadowBlur=14;ctx.fillStyle='#bfe8ff';ctx.fillRect(-5,-5,10,10);ctx.fillStyle='#fff';ctx.fillRect(-2,-2,4,4);}
    else if(p.kind=='fire'){ctx.shadowColor='#ff7a2a';ctx.shadowBlur=20;ctx.fillStyle='#c4301a';ctx.fillRect(-9,-9,18,18);ctx.fillStyle='#ff7a2a';ctx.fillRect(-7,-7,14,14);ctx.fillStyle='#ffd84a';ctx.fillRect(-4,-4,8,8);}
    else if(p.kind=='mfire'){ctx.shadowColor='#ff4a2a';ctx.shadowBlur=14;ctx.fillStyle='#a01a10';ctx.fillRect(-6,-6,12,12);ctx.fillStyle='#ff6a2a';ctx.fillRect(-4,-4,8,8);ctx.fillStyle='#ffd84a';ctx.fillRect(-2,-2,4,4);}
    else{ctx.fillStyle='#5a9a3a';ctx.fillRect(-5,-5,10,10);ctx.fillStyle='#a6e070';ctx.fillRect(-3,-3,6,6);}
    ctx.restore();}
  for(const p of parts){if(p.delay>0)continue;const X=p.x-cam.x,Y=p.y-cam.y,k=p.t/p.life;
    if(p.type=='slash'){if(p.back)continue;drawSlash(p,X,Y,k);continue;ctx.save();ctx.translate(X,Y);ctx.rotate(p.ang);ctx.globalAlpha=1-k;ctx.strokeStyle=p.c;ctx.lineWidth=p.big?6:4;ctx.shadowColor=p.c;ctx.shadowBlur=p.big?16:6;
      ctx.beginPath();ctx.arc(-6,0,p.big?24:17,-1.3+k*.6,1.3+k*.6);ctx.stroke();ctx.restore();ctx.globalAlpha=1;continue;}
    if(p.type=='ring'){ctx.strokeStyle=`rgba(${p.c},${1-k})`;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(X,Y,p.r*k,p.r*k*.5,0,0,7);ctx.stroke();continue;}
    ctx.globalAlpha=p.type=='leaf'?Math.min(1,(1-k)*2):1-k*.6;ctx.fillStyle=p.c;ctx.fillRect(Math.round(X),Math.round(Y),p.s,p.s);ctx.globalAlpha=1;}
  const di=dayInfo();NIGHT=m.id=='cave'?0:(1-di.day)*.3;const dark=Math.min(.9,m.dark+NIGHT);
  if(dark>0.02){const L=lctx,sc=.25;L.globalCompositeOperation='source-over';L.clearRect(0,0,lightCv.width,lightCv.height);
    L.fillStyle=m.id=='waste'&&NIGHT<.2?`rgba(50,26,0,${dark})`:`rgba(4,6,16,${dark})`;L.fillRect(0,0,lightCv.width,lightCv.height);L.globalCompositeOperation='destination-out';
    const hole=(wx,wy,r,a)=>{const X=(wx-cam.x)*sc,Y=(wy-cam.y)*sc,R=r*40*sc;if(X<-R||Y<-R||X>lightCv.width+R||Y>lightCv.height+R)return;const g=L.createRadialGradient(X,Y,0,X,Y,R);g.addColorStop(0,`rgba(0,0,0,${a})`);g.addColorStop(1,'rgba(0,0,0,0)');L.fillStyle=g;L.fillRect(X-R,Y-R,R*2,R*2);};
    hole(fx(P),fy(P)-20,m.id=='cave'?8+Math.sin(now*9)*.2:10,1);for(const l of m.lights)if(!l.night||NIGHT>.12)hole(PX(l.x,l.y),PY(l.x,l.y)-(l.h||0),l.r,.9);
    for(const p of projs)if(p.kind!='arrow')hole(p.x,p.y,p.kind=='fire'?3:1.8,.9);for(const L of lootList())if(L.q>=1)hole(PX(L.x+.5,L.y+.5),PY(L.x+.5,L.y+.5)-30,L.q>=3?3.5:2,.8);for(const g of tgs)hole(PX(g.x+.5,g.y+.5),PY(g.x+.5,g.y+.5),g.r*1.3,.5);for(const p of parts)if(p.type=='ring')hole(p.x,p.y,2.5,.6);
    ctx.imageSmoothingEnabled=true;ctx.drawImage(lightCv,0,0,VW,VH);ctx.imageSmoothingEnabled=false;
    if(m.id=='cave'||NIGHT>.12){ctx.globalCompositeOperation='lighter';for(const l of m.lights){if(l.night&&NIGHT<=.12)continue;const X=PX(l.x,l.y)-cam.x,Y=PY(l.x,l.y)-cam.y-(l.h||0);if(X<-90||Y<-90||X>VW+90||Y>VH+90)continue;const rr=l.r*34,g=ctx.createRadialGradient(X,Y,0,X,Y,rr);g.addColorStop(0,`rgba(${l.c},${m.id=='cave'?.2:.16})`);g.addColorStop(1,`rgba(${l.c},0)`);ctx.fillStyle=g;ctx.fillRect(X-rr,Y-rr,rr*2,rr*2);}ctx.globalCompositeOperation='source-over';}}
  drawPillars();
  ctx.textAlign='center';
  for(const f of floats){const k=f.t/1.1,sc=f.t<.12?1+(.12-f.t)*(f.big?6:3):1;ctx.globalAlpha=Math.min(1,(1-k)*2);ctx.font=`${f.big?18:14}px ${FONT}`;
    const X=f.x-cam.x,Y=f.y-cam.y-f.t*30;ctx.save();ctx.translate(X,Y);ctx.scale(sc,sc);ctx.fillStyle='#000';ctx.fillText(f.txt,1,1);ctx.fillText(f.txt,-1,1);ctx.fillStyle=f.col;ctx.fillText(f.txt,0,0);ctx.restore();}
  ctx.globalAlpha=1;
  if(hurtFlash>0){const g=ctx.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*.3,VW/2,VH/2,Math.max(VW,VH)*.7);g.addColorStop(0,'rgba(200,0,0,0)');g.addColorStop(1,`rgba(200,20,10,${hurtFlash*1.4})`);ctx.fillStyle=g;ctx.fillRect(0,0,VW,VH);}
  if(ME&&ME.hp>0&&ME.hp<ME.maxHP*.25&&!P.dead){const a=(Math.sin(now*6)+1)/2*.25;const g=ctx.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*.35,VW/2,VH/2,Math.max(VW,VH)*.7);g.addColorStop(0,'rgba(150,0,0,0)');g.addColorStop(1,`rgba(150,0,0,${a})`);ctx.fillStyle=g;ctx.fillRect(0,0,VW,VH);}
  if(banner.t>0){ctx.globalAlpha=Math.min(1,banner.t);const g=ctx.createLinearGradient(0,0,VW,0);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.5,'rgba(0,0,0,.65)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,VH*.22,VW,banner.b?58:42);
    ctx.font='22px '+FONT;ctx.fillStyle='#d8b25a';ctx.fillText(banner.a,VW/2,VH*.22+28);if(banner.b){ctx.font='12px '+FONT;ctx.fillStyle='#ece2c8';ctx.fillText(banner.b,VW/2,VH*.22+48);}ctx.globalAlpha=1;}
  if(P.dead>0){ctx.fillStyle='rgba(30,0,0,.5)';ctx.fillRect(0,0,VW,VH);ctx.font='24px '+FONT;ctx.fillStyle='#ffb3a8';ctx.fillText('你倒下了……',VW/2,VH/2);ctx.font='12px '+FONT;ctx.fillText('即將在晨霧村復活',VW/2,VH/2+24);}
  const mw=Math.min(110,VW*.28),mh=mw*m.H/m.W,mx=VW-mw-6,my=6;ctx.globalAlpha=.85;ctx.fillStyle=O;ctx.fillRect(mx-2,my-2,mw+4,mh+4);ctx.drawImage(m.miniCv,mx,my,mw,mh);ctx.globalAlpha=1;
  const sx=mw/m.W,sy=mh/m.H;for(const p of m.portals){ctx.fillStyle='#c9a8ff';ctx.fillRect(mx+p.x*sx-1,my+p.y*sy-1,3,3);}
  for(const mb of m.mobs){ctx.fillStyle=mb.boss?'#ff5a2a':'#d84a3a';const z=mb.boss?4:2;ctx.fillRect(mx+mb.x*sx-z/2,my+mb.y*sy-z/2,z,z);}
  for(const n of m.npcs){ctx.fillStyle='#ffd84a';ctx.fillRect(mx+n.x*sx-1,my+n.y*sy-1,3,3);}
  for(const e of players.values()){if(e===P)continue;ctx.fillStyle=e.flags&1?'#ff4a4a':e.party?'#6ad0ff':'#9fe09f';ctx.fillRect(mx+e.x*sx-1.5,my+e.y*sy-1.5,3,3);}
  ctx.fillStyle='#fff';ctx.fillRect(mx+P.x*sx-2,my+P.y*sy-2,4,4);
  ctx.font='12px '+FONT;ctx.textAlign='left';const nm=m.name+(m.id=='cave'?'':'・'+di.label);const tw=ctx.measureText(nm).width;ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(6,6,tw+12,20);ctx.fillStyle='#ece2c8';ctx.fillText(nm,12,20);
  drawTracker();
}

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
function mkPlayer(a){ const e={id:a[0],isPlayer:true,name:a[1],cls:a[2],g:a[3],x:a[4],y:a[5],rx:a[4],ry:a[5],hpPct:a[6],lv:a[7],flags:a[8],clan:a[9],title:a[12]||'',face:a[10],dir:faceDir(a[10]),eq:{w:{en:a[11]}},walk:0,atkVis:0,lunge:0,hurt:0,dead:0};
  players.set(e.id,e); ents.set(e.id,e); return e; }
const faceDir=f=>[1,1,0,-1,-1,-1,0,1][f]||1;
function onSnapshot(s){
  if(!cur) return;
  const seen=new Set();
  for(const a of s.p){ seen.add(a[0]); let e=players.get(a[0]); if(!e) e=mkPlayer(a);
    const moved=a[4]!==e.x||a[5]!==e.y; e.x=a[4]; e.y=a[5]; e.hpPct=a[6]; e.lv=a[7]; e.flags=a[8]; e.clan=a[9]; e.title=a[12]||''; if(a[10]!==e.face){e.face=a[10];const d=faceDir(a[10]);if(d)e.dir=d;} e.eq.w.en=a[11]; e.dead=a[8]&4?1:0; e.cls=a[2]; e.g=a[3];
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
    if(kind==='holy'){ vfx('crit',X,Y-30,{s:1.3}); burst(X,Y-30,30,['#fff6c0','#ffd84a','#ffffff'],180,{g:-40}); freeze(.05); }
    if(kind==='rage'){ p.bf.rage=now+10; vfx('explosion',X,Y-20,{s:.6,alpha:.8}); burst(X,Y-20,30,['#ff4a2a','#ffb070','#c4301a'],160,{g:-80}); SFX.crit(); }
    if(kind==='quake'){ vfx('shockwave',X,Y,{s:1.2}); vfx('explosion',X,Y-8,{s:.6}); doShake(9,.35); freeze(.06); SFX.slam(); }
    if(kind==='blast'){ vfx('explosion',X,Y-12,{s:.8}); doShake(5,.2); }
    if(kind==='rain'){ for(let i=0;i<9;i++) vfx('hit',X+rnd(-50,50),Y-10+rnd(-25,25),{s:.6,delay:i*.06}); doShake(4,.4); SFX.arrow(); }
    if(kind==='meteor'){ vfx('explosion',X,Y-10,{s:1.5,delay:.15}); setTimeout(()=>{ doShake(12,.45); SFX.boom(); },150); freeze(.07); }
    if(kind==='storm'){ vfx('frost-nova',X,Y,{s:1.5}); for(let i=0;i<6;i++) vfx('crit',X+rnd(-70,70),Y-20+rnd(-30,30),{s:.6,delay:i*.07}); doShake(8,.4); SFX.bolt(); }
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
  if(prevLv&&c.lv>prevLv){ SFX.level(); const L=skillsOf(c).find(k=>k.lv>prevLv&&k.lv<=c.lv); if(L){ banner={t:3.5,a:'學會新技能',b:`${L.n}：${L.d}`}; } }
  (c.cds||[]).forEach((v,i)=>cdEnd[i]=now+v);
  if(curPanel&&['bag','shop','smith','social','quest','guard','auto','mentor','guild','ach'].includes(curPanel)) openPanel(curPanel,curArg,true);
  hud(true);
  $('#bPk').classList.toggle('hot',!!c.pk);
}

/* ---------- telegraphs, ground loot, quest tracker ---------- */
let invasion=null, wboss=false, eclipse=null, tgs=[], gone=new Map(), trackRect=null, ICONIMG=null; const loot=new Map(), cdEnd=[0,0,0,0,0];
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
  const g=ctx.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*.45,VW/2,VH/2,Math.max(VW,VH)*.75); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,.16)'); ctx.fillStyle=g; ctx.fillRect(0,0,VW,VH); }
function wrapText(t,maxW){ const out=[]; let line=''; for(const ch of t){ if(ctx.measureText(line+ch).width>maxW&&line){ out.push(line); line=ch; } else line+=ch; } if(line) out.push(line); return out; }
function drawTracker(){ if(!ME) return; const q=QUESTS[ME.mq],maxW=Math.min(220,VW*.46),rows=[];
  ctx.font='12px '+FONT; ctx.textAlign='left';
  if(hideTrack) rows.push(['▸ 任務（點一下展開）','#9a9078']);
  else if(q){ rows.push(['◆ '+q.n,'#e8c46a']); for(const l of wrapText(q.d+(q.type!=='talk'?`（${ME.mqp}/${q.need}）`:''),maxW)) rows.push([l,'#ece2c8']); }
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
  SFX.ok(); addLine(`<div class="l-sys"><b>${m.note?'[公告]':'[任務完成]'}</b> ${esc(m.n)}　${esc(m.r||'')}</div>`);
  if(m.note){ toast(m.n); return; }
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
  const top=Y-64; label(e.name,X,top,nameCol); let tt=top-13; if(e.clan){ label('〈'+e.clan+'〉',X,tt,'#9fc4e0'); tt-=13; } if(e.title){ const A=ACH.find(a=>a.id===e.title); if(A) label('「'+A.t+'」',X,tt,'#e8c46a'); }
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
  for(const e of ents.values()){ const sp=Math.min(1,dt*(e===P?15:e.isPlayer?11:8)); const mv=Math.abs(e.x-e.rx)+Math.abs(e.y-e.ry)>.05; e.rx+=(e.x-e.rx)*sp; e.ry+=(e.y-e.ry)*sp;
    e.hurt-=dt; if(e.isPlayer){ e.atkVis-=dt; e.lunge-=dt; if(mv)e.walk+=dt; } else { e.kb=Math.max(0,(e.kb||0)-dt*6); e.atkAnim-=dt; e.mAtk=(e.mAtk||0)-dt; e.lg-=dt; } }
  for(const c of cur.corpses)c.t+=dt; cur.corpses=cur.corpses.filter(c=>c.t<.6);
  if(cur.id==='forest'&&Math.random()<dt*2.5)part(cam.x+rnd(0,VW),cam.y-4,{vx:rnd(10,30),vy:rnd(20,40),g:0,c:pick(['#6a9a40','#8ab050','#c8a040']),life:4,s:3,type:'leaf'});
  if(cur.id==='cave'&&Math.random()<dt*10)part(cam.x+rnd(0,VW),cam.y+VH+4,{vx:rnd(-10,10),vy:rnd(-60,-25),g:0,c:pick(['#ff9a3c','#ffd84a','#ff5a2a']),life:3,s:2,type:'leaf'});
  for(const p of parts)if(p.type==='leaf'){p.x+=p.vx*dt;p.y+=p.vy*dt;}
  for(const p of cur.portals)if(!p.gate&&Math.random()<dt*8)part(PX(p.x+.5,p.y+.5)+rnd(-14,14),PY(p.x+.5,p.y+.5)+rnd(-4,4),{vx:rnd(-6,6),vy:rnd(-50,-25),g:0,c:pick(['#c9a8ff','#8a5cff','#fff']),life:rnd(.6,1),s:2});
}

/* ---------- input ---------- */
let ZOOM=matchMedia('(pointer:coarse)').matches?.75:1; try{ const z=+localStorage.getItem('sm_zoom2'); if(z) ZOOM=z; }catch{}
let hideTrack=false; try{ hideTrack=localStorage.getItem('sm_track')==='0'; }catch{}
const BRI=[['標準',1,1],['明亮',1.12,1.08],['很亮',1.25,1.12]]; let bri=1; try{ const v=localStorage.getItem('sm_bri'); if(v!=null) bri=+v; }catch{}
function applyBri(){ const b=BRI[bri]||BRI[1]; const cv=document.getElementById('cv'); if(cv) cv.style.filter=b[1]===1?'':`brightness(${b[1]}) saturate(${b[2]})`; }
setTimeout(applyBri,0);
let hideOthers=false; try{ hideOthers=localStorage.getItem('sm_hide')==='1'; }catch{}
const isTouch=matchMedia('(pointer:coarse)').matches||('ontouchstart' in window&&navigator.maxTouchPoints>0); if(isTouch) document.body.classList.add('touch');
function resize(){const r=$('#stage').getBoundingClientRect(),d=Math.min(2,window.devicePixelRatio||1),cw=Math.max(100,r.width-4),ch=Math.max(100,r.height-4);VW=cw/ZOOM;VH=ch/ZOOM;
  cv.width=Math.round(cw*d);cv.height=Math.round(ch*d);cv.style.width=cw+'px';cv.style.height=ch+'px';ctx.setTransform(d*ZOOM,0,0,d*ZOOM,0,0);ctx.imageSmoothingEnabled=false;lightCv.width=Math.ceil(VW/4);lightCv.height=Math.ceil(VH/4);
  $('#bZoom').textContent=Math.round(ZOOM*100)+'%';}
const ZSTEPS=[.6,.75,1,1.25,1.5];
function setZoom(z){ ZOOM=Math.max(.5,Math.min(1.6,Math.round(z*100)/100)); try{localStorage.setItem('sm_zoom2',ZOOM);}catch{} resize(); }
$('#bZoom').onclick=()=>{ const i=ZSTEPS.findIndex(v=>v>ZOOM+.01); setZoom(i<0?ZSTEPS[0]:ZSTEPS[i]); };
// two-finger pinch on phones, mouse wheel on computers
{ const pts=new Map(); let pinch0=0,z0=1;
  cv.addEventListener('pointerdown',e=>{ pts.set(e.pointerId,[e.clientX,e.clientY]); if(pts.size===2){ const [a,b]=[...pts.values()]; pinch0=Math.hypot(a[0]-b[0],a[1]-b[1]); z0=ZOOM; } },true);
  cv.addEventListener('pointermove',e=>{ if(!pts.has(e.pointerId)) return; pts.set(e.pointerId,[e.clientX,e.clientY]); if(pts.size===2&&pinch0>0){ const [a,b]=[...pts.values()]; setZoom(z0*Math.hypot(a[0]-b[0],a[1]-b[1])/pinch0); } });
  const up=e=>{ pts.delete(e.pointerId); if(pts.size<2) pinch0=0; };
  cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',up);
  cv.addEventListener('wheel',e=>{ e.preventDefault(); setZoom(ZOOM*(e.deltaY>0?.9:1.1)); },{passive:false}); }
window.addEventListener('resize',resize);
// keep the canvas matched to its box whenever the layout changes; block browser zoom gestures on phones
try{ let rT=0; new ResizeObserver(()=>{ cancelAnimationFrame(rT); rT=requestAnimationFrame(resize); }).observe($('#stage')); }catch{}
for(const ev of ['gesturestart','gesturechange']) document.addEventListener(ev,e=>e.preventDefault(),{passive:false});
document.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});
cv.addEventListener('pointerdown',e=>{ audioOn(); if(!e.isPrimary||!P||!cur||P.dead) return;
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
  if(e.key==='1') usePot(); if('23456'.includes(e.key)&&e.key.length===1) castSkill(+e.key-2); });
window.addEventListener('keyup',e=>{ if(e.key&&keysDown.delete(e.key.toLowerCase())) updKeyJoy(); });
window.addEventListener('blur',()=>{ keysDown.clear(); updKeyJoy(); });
/* ---------- joystick (phones) and WASD (computers) ---------- */
const keysDown=new Set(); let joyV=null, joyHold=0, joySendT=0, joyPtr=null, keyJoy=false, joyDir='0,0';
function updKeyJoy(){ const x=(keysDown.has('d')?1:0)-(keysDown.has('a')?1:0), y=(keysDown.has('s')?1:0)-(keysDown.has('w')?1:0);
  if(x||y){ const l=Math.hypot(x,y); joyV={x:x/l,y:y/l}; keyJoy=true; } else if(keyJoy){ keyJoy=false; joyV=null; } }
{ // floating joystick: touch anywhere in the lower-left of the screen
  const J=$('#joy'),K=$('#joyK'),Z=$('#joyZone'); let cx=0,cy=0;
  const upd=e=>{ const dx=e.clientX-cx,dy=e.clientY-cy,l=Math.hypot(dx,dy),m=Math.min(l,48);
    K.style.transform=`translate(${l?dx/l*m:0}px,${l?dy/l*m:0}px)`; joyV=l<12?null:{x:dx/l,y:dy/l}; };
  Z.addEventListener('pointerdown',e=>{ audioOn(); e.preventDefault(); joyPtr=e.pointerId; Z.setPointerCapture(e.pointerId);
    const r=$('#stage').getBoundingClientRect(); cx=e.clientX; cy=e.clientY; J.style.left=(cx-r.left-64)+'px'; J.style.top=(cy-r.top-64)+'px'; J.style.bottom='auto'; J.classList.add('act'); upd(e); joySendT=0; });
  Z.addEventListener('pointermove',e=>{ if(e.pointerId===joyPtr) upd(e); });
  const end=e=>{ if(e.pointerId!==joyPtr) return; joyPtr=null; joyV=null; K.style.transform=''; J.classList.remove('act'); J.style.left=''; J.style.top=''; J.style.bottom=''; };
  Z.addEventListener('pointerup',end); Z.addEventListener('pointercancel',end); }
const JDIRS=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
function joyThink(dt){ joyHold-=dt; joySendT-=dt; if(!P||P.dead||!cur){ return; }
  let d='0,0';
  if(joyV){ joyHold=1.2; // screen direction -> isometric grid direction (8-way)
    const gx=joyV.x/HW+joyV.y/HH, gy=joyV.y/HH-joyV.x/HW, oct=((Math.round(Math.atan2(gy,gx)/(Math.PI/4))%8)+8)%8; d=JDIRS[oct].join(',');
    if(myTargetId) myTargetId=null; pendingAct=null; marker=null; }
  if(d!==joyDir||(d!=='0,0'&&joySendT<=0)){ const [dx,dy]=d.split(',').map(Number); send({t:'dir',dx,dy}); joyDir=d; joySendT=.5; } }
function checkPending(){ if(!pendingAct||!P) return; const a=pendingAct, near=a.big?Math.max(Math.abs(P.x-a.x-.5),Math.abs(P.y-a.y-.5))<=1.6:cheb(P,a)<=1;
  if(near&&Math.abs(P.rx-P.x)<.1&&Math.abs(P.ry-P.y)<.1){ pendingAct=null; if(a.act==='heal') send({t:'heal'}); else if(a.act.startsWith('mentor:')) openPanel('mentor',a.act.slice(7)); else openPanel(a.act); } }
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
function castSkill(i){ if(!ME) return; const sk=skillsOf(ME)[i]; if(!sk) return; if(ME.lv<sk.lv) return addLog(`${sk.n}：Lv.${sk.lv} 解鎖。${sk.d}`); if(cdEnd[i]>now) return;
  if(sk.tgt){ let t=myTarget(); if(!t||t.isPlayer&&!ME.pk) t=attackNearest(); if(!t) return;
    if(cheb(P,t)>skillRange()){ pendSkill={i,until:now+4}; return; } }
  send({t:'skill',i}); }
function pendSkillThink(){ if(!pendSkill) return; const t=myTarget(); if(!t||now>pendSkill.until){ pendSkill=null; return; } if(cheb(P,t)<=skillRange()){ send({t:'skill',i:pendSkill.i}); pendSkill=null; } }
$('#bAtk').onclick=()=>{ audioOn(); attackNearest(); };
for(let i=0;i<5;i++) $('#bS'+i).onclick=()=>{audioOn();castSkill(i);};
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
let AS=Object.assign({},AS_DEF,{sk:[1,1,1,1,1]}); try{ Object.assign(AS,JSON.parse(localStorage.getItem('sm_auto')||'{}')); }catch{}
function saveAS(){ try{ localStorage.setItem('sm_auto',JSON.stringify(AS)); }catch{} }
function toggleAuto(force){ auto=force!=null?force:!auto; $('#bAuto').classList.toggle('on',auto); autoOrigin=auto&&P?{x:P.x,y:P.y,map:cur.id}:null;
  addLog(auto?'掛機開始。':'掛機停止。'); if(!auto){ myTargetId=null; } }
function mapMobs(id){ const d=MAPDEF[id]; if(!d||!d.mobs) return []; return [...d.mobs,...(d.boss?[d.boss]:[])]; }
function wantMob(k){ const t=AS.targets[cur.id]; return !t||t.includes(k); }
function wantLoot(L){ if(AS.pick===3) return false; if(L.it){ if(ME.bag.length>=BAGMAX) return false; return (L.q|0)>=[0,1,2][AS.pick]; } return true; }
let dodgeT=0;
function inCircle(x,y){ return tgs.some(g=>Math.hypot(x-g.x,y-g.y)<=g.r+.4); }
function autoSkill(t){ const L=skillsOf(ME),c=ME.cls,hp=ME.hp/ME.maxHP; const ok=i=>L[i]&&AS.sk[i]!==0&&ME.lv>=L[i].lv&&ME.mp>=L[i].mp&&cdEnd[i]<=now;
  // advanced-class skills first
  { const inR2=cheb(P,t)<=(CLS[c].range<=1?1:CLS[c].range), near2=cur.mobs.filter(m=>Math.hypot(m.x-P.x,m.y-P.y)<=2.4).length, big2=t.boss||t.hp>ME.atk*3;
    for(const i of [4,3]){ const k=L[i]; if(!k||!ok(i)) continue;
      if(k.ai==='buff'&&(t.boss||hp<.7||near2>=2)) return i; if(k.ai==='heal'&&hp<.6) return i;
      if(k.ai==='aoe'&&(near2>=2||t.boss)&&(!k.tgt||inR2)) return i; if(k.ai==='tgt'&&inR2&&big2) return i; } }
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
function autoPanelHTML(){ const id=cur&&MAPDEF[cur.id]?.mobs?cur.id:(autoOrigin?.map||'forest'), list=mapMobs(id), sel=AS.targets[id], L=skillsOf(ME);
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
const MNAME={sylvie:'精靈遊俠 希爾薇',norn:'老學者 諾恩',vera:'黑暗妖精 薇拉'};
const PT={guild:'冒險者公會 米亞',ach:'成就與稱號',tele:'傳送師 露娜',auto:'掛機設定',quest:'任務',story:'故事',shop:'雜貨商 莉娜',smith:'鐵匠 巴爾克',bag:'角色',guard:'守衛 艾德',social:'社交',player:'玩家',clan:'血盟',rank:'排行榜',who:'在線玩家',ask:'邀請',trade:'交易'};
function openPanel(k,arg,keep){ if(keep&&curPanel!==k) return; curPanel=k; curArg=arg; const body=$('#pBody'),st=keep?body.scrollTop:0; $('#pTitle').textContent=k==='player'&&arg?arg.name:k==='mentor'?MNAME[arg]:PT[k]; body.innerHTML=panelHTML(k,arg); $('#overlay').hidden=false; body.scrollTop=st; }
function closePanel(force){ if(curPanel==='trade'&&!force) send({t:'tcancel'}); $('#overlay').hidden=true; curPanel=null; armed=null; }
$('#pClose').onclick=()=>closePanel();
$('#overlay').addEventListener('pointerdown',e=>{if(e.target.id==='overlay')closePanel();});
function panelHTML(k,arg){ const c=ME; if(!c) return '';
  if(k==='guard'){ const q=QUESTS[c.mq]; const advB=c.cls==='knight'?advHTML(c):(c.lv>=ADV_LV&&!c.adv?`<p class="ds">「想變得更強？去找${MENTOR[c.cls].who}，你的試煉在那邊。」</p>`:''); const qb=advB+(q&&q.type==='talk'?`<button class="btn wide on" data-act="qtalk">${c.mq===0?'「我來幫忙。」（接受主線）':'回報：'+esc(q.n)}</button>`:''); return qb+`<p>艾德：「現在村子裡不只你一個冒險者了。記住：村莊是安全區，出了傳送陣就可能被人攻擊。」</p>
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
    <button class="btn wide" data-act="bri" style="margin-top:6px">畫面亮度：${BRI[bri][0]}（點一下切換）</button>
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
  if(k==='mentor'){ const mine=MENTOR[c.cls].npc===arg, L={
      sylvie:['希爾薇：「森林在哭，你聽得到嗎？那些史萊姆以前不會攻擊人的。」','「精靈的箭只射該射的東西。」'],
      norn:['諾恩：「月之塔倒下那年，我只搶出這一本書。」','「月痕不是傷口，是月亮留下的字。總有一天會有人讀懂。」'],
      vera:['薇拉：「別盯著我看。黑暗妖精也是會救人的。」','「教團的人身上有灰燼的味道。聞到了就快跑……或者先下手。」']}[arg]||[''];
    return `<p>${L[0]}</p><p class="ds">${L[1]}</p>`+(mine?advHTML(c):`<p class="ds">你的導師是${MENTOR[c.cls].who}。</p>`); }
  if(k==='guild'){ const B=c.bounty; if(!B) return '<p>米亞：「稍等，我在整理委託單……」</p>';
    const rows=B.list.map((b,i)=>{ const done=b.p>=b.need; return `<div class="gear"><div class="gname">${b.boss?'【Boss】':''}${MAPDEF[b.map].name}・${MT[b.k].n} ×${b.need}</div><div class="pbar"><i style="width:${Math.min(100,b.p/b.need*100)}%"></i></div><div class="row2" style="margin-top:6px"><span class="ds">${Math.min(b.p,b.need)}/${b.need}${b.boss?'・必得強化卷軸':'・30% 送強化卷軸'}</span>${done?`<button class="btn on" data-bclaim="${i}" ${cur.id==='village'?'':'disabled'}>領取報酬</button>`:`<button class="btn ${armed==='rr'+i?'hot':''}" data-breroll="${i}">${armed==='rr'+i?'確定（200 金幣）':'換一張'}</button>`}</div></div>`; }).join('');
    return `<p>米亞：「歡迎來到冒險者公會晨霧村分部！委託會依你的等級挑，打完回來找我領錢～」</p>${rows||'<p class="ds">今天的委託都做完了，明天再來喔！</p>'}<p class="ds">今日完成 ${B.done}/${BOUNTY_DAY_MAX}・累計 ${c.bountyDone|0} 張・每天台灣時間午夜刷新</p>`; }
  if(k==='ach'){ const got=ACH.filter(a=>c.ach[a.id]).length;
    return `<p class="ds">已達成 ${got}/${ACH.length}。點「戴上」把稱號顯示在名字上方。</p>`+ACH.map(a=>{ const ok=c.ach[a.id], v=Math.min(achValue(c,a.k),a.v);
      return `<div class="row"><div class="info"><div class="nm" style="color:${ok?'#e8c46a':'var(--dim)'}">${ok?'★':'☆'} ${a.t}</div><div class="ds">${a.d}${a.g?`・${a.g.toLocaleString()} 金幣`:''}${ok?'':`・${v.toLocaleString()}/${a.v.toLocaleString()}`}</div></div>${ok?`<button class="btn ${c.title===a.id?'on':''}" data-title="${c.title===a.id?'':a.id}">${c.title===a.id?'卸下':'戴上'}</button>`:''}</div>`; }).join(''); }
  if(k==='tele') return `<p>露娜：「月光照得到的地方，我都能送你去。」</p>`+TELE.map(T=>`<div class="row"><div class="info"><div class="nm">${T.boss?'【Boss】':''}${esc(T.n)}</div><div class="ds">${MAPDEF[T.map].name}・建議 ${T.lv}・${T.p.toLocaleString()} 金幣</div></div><button class="btn" data-tele="${T.k}" ${c.gold<T.p?'disabled':''}>傳送</button></div>`).join('')+`<div class="sect">你的金幣：${c.gold.toLocaleString()}</div>`;
  if(k==='story') return `<div class="sect">${esc(arg.title||'')}</div><div class="story">${esc(arg.text||'')}</div>${arg.reward?`<p class="ds">獲得：${esc(arg.reward)}</p>`:''}<button class="btn wide" data-act="qpanel">查看任務</button>`;
  if(k==='quest'){ const q=QUESTS[c.mq];
    const main=q?`<div class="sect">主線・${esc(q.n)}</div><div class="story">${esc(q.story)}</div><p><b>目標</b>：${esc(q.d)}</p>${q.type!=='talk'?`<div class="pbar"><i style="width:${Math.round(c.mqp/q.need*100)}%"></i></div><p class="ds">進度 ${c.mqp}/${q.need}</p>`:`<button class="btn wide on" data-act="goguard">${cur.id==='village'?'去找守衛艾德':'回村找守衛艾德'}</button>`}<p class="ds">章節 ${c.mq+1}/${QUESTS.length}</p>`:`<div class="sect">主線</div><p>你完成了「新月之誓」。北方的血月……就是另一個故事了。</p>`;
    const d=c.daily; const daily=d?`<div class="sect">每日任務（${d.day}，台灣時間午夜重置）</div>`+d.list.map(x=>`<div class="qrow ${x.done?'done':''}"><span>${x.done?'✓ ':''}${esc(x.d)}</span><span>${x.done?'完成':x.p+'/'+x.n}</span></div>`).join('')+`<p class="ds">每完成一個：經驗、金幣、強力藥水 ×2。三個都完成再送武器、防具強化卷軸各 1。</p>`:'';
    const sk=`<div class="sect">技能（快捷鍵 2～6）</div>`+skillsOf(c).map(k=>`<div class="qrow ${c.lv>=k.lv?'':'ds'}"><span><b>${k.n}</b>　${esc(k.d)}</span><span>${c.lv>=k.lv?k.mp+' MP':'Lv.'+k.lv}</span></div>`).join('');
    const M=MENTOR[c.cls], aq=c.advq; const adv=c.adv?'':c.lv<ADV_LV?`<div class="sect">轉職</div><p class="ds">Lv.${ADV_LV} 去找${M.who}接受轉職試煉。</p>`:`<div class="sect">轉職試煉</div><p>${!aq?'還沒接受試煉':aq.s===1?`收集「${M.token}」${aq.n}/${ADVQ_NEED}（${M.mobs.map(k=>MT[k].n).join('、')}）`:aq.s===2?'打倒白骨巨像':'試煉完成，回去選擇道路'}</p><button class="btn wide" data-act="gomentor">去找${M.who}</button>`;
    const B=c.bounty, bt=B?`<div class="sect">公會委託（今日 ${B.done}/${BOUNTY_DAY_MAX}）</div>`+B.list.map(b=>`<div class="qrow ${b.p>=b.need?'done':''}"><span>${MT[b.k].n}（${MAPDEF[b.map].name}）</span><span>${b.p>=b.need?'可領取':b.p+'/'+b.need}</span></div>`).join('')+`<p class="ds">在晨霧村找公會接待米亞接委託、領報酬。</p>`:'';
    const got=ACH.filter(a=>c.ach&&c.ach[a.id]).length; const ach=`<div class="sect">成就 ${got}/${ACH.length}</div><button class="btn wide" data-act="achp">查看成就與稱號</button>`;
    return main+adv+daily+bt+ach+sk; }
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
  if(D.tele){ closePanel(); return send({t:'tele',to:D.tele}); }
  if(D.adv){ if(armed!=='adv'+D.adv){ armed='adv'+D.adv; return openPanel(curPanel,curArg); } armed=null; send({t:'advance',to:D.adv}); return; }
  if(D.act==='autogo'){ closePanel(); if(cur.id==='village'){ addLog('先出村再開始掛機（掛機只在狩獵地圖運作）。'); } toggleAuto(!auto); return; }
  if(D.tgt!=null){ const id=MAPDEF[cur.id]?.mobs?cur.id:'forest',all=mapMobs(id); if(D.tgt==='*') delete AS.targets[id]; else { let t=AS.targets[id]?[...AS.targets[id]]:[...all]; t=t.includes(D.tgt)?t.filter(x=>x!==D.tgt):[...t,D.tgt]; if(!t.length||t.length===all.length) delete AS.targets[id]; else AS.targets[id]=t; } saveAS(); return openPanel('auto'); }
  if(D.as){ AS[D.as]=D.v==='tog'?(AS[D.as]?0:1):(isNaN(+D.v)?D.v:+D.v); saveAS(); return openPanel('auto'); }
  if(D.sk!=null){ AS.sk[+D.sk]=AS.sk[+D.sk]?0:1; saveAS(); return openPanel('auto'); }
  if(D.act==='sellall'){ if(armed!=='sell'+D.q){ armed='sell'+D.q; return openPanel(curPanel,curArg); } armed=null; return send({t:'sellall',q:+D.q}); }
  if(D.act==='sortbag') return send({t:'sortbag'});
  if(D.act==='autoequip') return send({t:'autoequip'});
  if(D.lock!=null) return send({t:'lock',i:+D.lock});
  if(D.act==='qtalk') return send({t:'qtalk'});
  if(D.act==='advstart') return send({t:'advstart'});
  if(D.bclaim!=null) return send({t:'bclaim',i:+D.bclaim});
  if(D.breroll!=null){ if(armed!=='rr'+D.breroll){ armed='rr'+D.breroll; return openPanel('guild'); } armed=null; return send({t:'breroll',i:+D.breroll}); }
  if(D.title!=null) return send({t:'title',id:D.title});
  if(D.act==='achp') return openPanel('ach');
  if(D.act==='gomentor'){ closePanel(); const M=MENTOR[ME.cls]; if(cur.id!=='village') return send({t:'ret'}); const n=cur.npcs.find(n=>n.act===(M.npc==='guard'?'guard':'mentor:'+M.npc)); if(n){ pendingAct={x:n.x,y:n.y,act:n.act}; send({t:'move',x:n.x,y:n.y}); } return; }
  if(D.act==='qpanel') return openPanel('quest');
  if(D.act==='goguard'){ closePanel(); if(cur.id!=='village') return send({t:'ret'}); const n=cur.npcs.find(n=>n.act==='guard'); if(n){ pendingAct={x:n.x,y:n.y,act:'guard'}; send({t:'move',x:n.x,y:n.y}); } return; }
  if(D.act==='bri'){ bri=(bri+1)%BRI.length; try{localStorage.setItem('sm_bri',bri);}catch{} applyBri(); return openPanel('bag'); }
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
function advHTML(c){ if(c.adv) return `<p class="ds">你已轉職為「${ADV[c.adv].n}」。</p>`; const opts=ADV_KEYS.filter(k=>ADV[k].base===c.cls);
  const M=MENTOR[c.cls], q=c.advq;
  if(c.lv<ADV_LV) return `<div class="sect">轉職試煉</div><p class="ds">Lv.${ADV_LV} 可以接受轉職試煉，之後能成為：${opts.map(k=>ADV[k].n).join(' 或 ')}。</p>`;
  if(!q) return `<div class="sect">轉職試煉</div><p>${M.talk}</p><p class="ds">試煉：① 收集 ${ADVQ_NEED} 個「${M.token}」（${M.mobs.map(k=>MT[k].n).join('、')}會掉）② 打倒白骨巨像 ③ 回來選擇道路（${ADV_COST.toLocaleString()} 金幣）</p><button class="btn wide on" data-act="advstart">接受轉職試煉</button>`;
  if(q.s===1) return `<div class="sect">轉職試煉 ①</div><p>收集「${M.token}」：${M.mobs.map(k=>MT[k].n).join('、')}會掉。</p><div class="pbar"><i style="width:${q.n/ADVQ_NEED*100}%"></i></div><p class="ds">${q.n}/${ADVQ_NEED}</p>`;
  if(q.s===2) return `<div class="sect">轉職試煉 ②</div><p>「東西夠了。最後一關：去骸骨荒原深處打倒白骨巨像。組隊也算數。」</p>`;
  return `<div class="sect">轉職（${ADV_COST.toLocaleString()} 金幣，選了就不能改）</div>`+opts.map(k=>{ const A=ADV[k]; return `<div class="gear"><div class="gname">${A.n}</div><div class="ds">${A.d}</div>${A.sk.map(s=>`<div class="ds">・<b>${s.n}</b>（Lv.${s.lv}）${s.d}</div>`).join('')}<button class="btn ${armed==='adv'+k?'hot':''}" data-adv="${k}" ${c.gold<ADV_COST?'disabled':''}>${armed==='adv'+k?'再按一次確定轉職':'轉職為'+A.n}</button></div>`; }).join(''); }
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
  for(let i=3;i<5;i++) $('#bS'+i).hidden=!c.adv;
  skillsOf(c).forEach((k,i)=>{ const b=$('#bS'+i),lock=c.lv<k.lv,rem=Math.max(0,cdEnd[i]-now), ic=i<3?CLSI[c.cls]*3+i:24+ADV_KEYS.indexOf(c.adv)*2+(i-3), ue=b.querySelector('.ski'); if(ue&&ue.dataset.i!=String(ic)){ ue.dataset.i=ic; setUic(ue,ic); } b.title=k.n;
    b.querySelector('.sn').textContent=k.n; b.querySelector('small').textContent=lock?`Lv.${k.lv}`:rem>0?rem.toFixed(1):k.mp+' MP';
    b.querySelector('.cdv').style.height=(lock?0:rem/k.cd*100)+'%'; b.classList.toggle('lock',lock); b.classList.toggle('ready',!lock&&rem<=0&&c.mp>=k.mp); });
  $('#cQuest').textContent=QUESTS[c.mq]?(QUESTS[c.mq].type==='talk'?'回報':`${c.mqp}/${QUESTS[c.mq].need}`):'完成';
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

function npcHint(o){ const c=ME; if(!c) return false; const a=o.act;
  const advReady=!c.adv&&c.lv>=ADV_LV&&(!c.advq||c.advq.s===3);
  if(a==='guard') return (QUESTS[c.mq]&&QUESTS[c.mq].type==='talk')||(c.cls==='knight'&&advReady);
  if(a&&a.startsWith('mentor:')) return MENTOR[c.cls].npc===a.slice(7)&&advReady;
  if(a==='guild') return !!(c.bounty&&c.bounty.list.some(b=>b.p>=b.need));
  return false; }
