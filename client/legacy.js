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
  const tint={village:'#b4bca2',forest:'#9aa48e',waste:'#d6c8b0'}[m.id];
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
function finishGround(m){const W=m.W,H=m.H;
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
  if(E.atkVis>0&&d.anims.attack&&d.anims.attack[dn]){an='attack';const n=d.anims.attack[dn].n;fr=Math.min(n-1,Math.floor((1-E.atkVis/.45)*n));}
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
function mobArt(m){const d=MOBS[m.k],im=MOBI[m.k];if(d&&im&&im.naturalWidth)return{type:'sheet',d,im};const a=ASSETS['mob_'+m.k],ai=aImg('mob_'+m.k);if(a&&ai)return{type:'single',a,im:ai};return null;}
function drawMobArt(m,X,Y,kx,ky,bob,sx,sy){const art=mobArt(m);if(!art)return 0;let im=art.im,fx0=0,fy0=0,fw,fh,foot;
  if(art.type=='sheet'){const d=art.d,dn=DIR8[m.face==null?1:m.face],mv=Math.abs(m.x-m.rx)+Math.abs(m.y-m.ry)>.05;let a=d.anims.idle[dn],fr=0;
    if(mv&&d.anims.walk&&d.anims.walk[dn]){a=d.anims.walk[dn];fr=Math.floor(now*9+m.id)%a.n;}fw=d.fw;fh=d.fh;fx0=fr*fw;fy0=a.row*fh;foot=d.foot;sx=sx;}
  else{fw=im.width;fh=im.height;foot=art.a.foot;}
  const flip=art.type=='single'&&((m.dir<0)!==!!FACEL[m.k]);
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
  if(m.hp<m.maxhp||myTarget()===m||m.boss){const bw=m.boss?70:28,bx=X-bw/2,by=Y-h-8+(m.k=='bat'?-12:0);
    ctx.fillStyle=O;ctx.fillRect(bx-1,by-1,bw+2,5);ctx.fillStyle='#3a0c0a';ctx.fillRect(bx,by,bw,3);ctx.fillStyle=m.boss?'#ff5a2a':'#d84a3a';ctx.fillRect(bx,by,bw*Math.max(0,m.hp/m.maxhp),3);
    label((m.boss?'【BOSS】':'')+t.n+' Lv.'+t.lv,X,by-4,m.boss?'#ffb070':t.lv>(ME?ME.lv:1)+3?'#ff8a7a':'#e4dac0');}}
function label(txt,X,Y,col){ctx.font='11px '+FONT;ctx.textAlign='center';ctx.fillStyle='rgba(0,0,0,.8)';ctx.fillText(txt,X+1,Y+1);ctx.fillStyle=col||'#ffe7a3';ctx.fillText(txt,X,Y);}
function drawItem(it){const o=it.o;
  if(it.t==0)drawObj(o);
  else if(it.t==1){const X=PX(o.x+.5,o.y+.5)-cam.x,Y=PY(o.x+.5,o.y+.5)-cam.y;ctx.fillStyle='rgba(0,0,0,.32)';ctx.beginPath();ctx.ellipse(X,Y,12,5,0,0,7);ctx.fill();
    const ni=npcImg(o.k),nd=NPCIMG[o.k];if(ni)ctx.drawImage(ni,Math.round(X-nd.w/2),Math.round(Y-nd.foot));else ctx.drawImage(npcSpr(o.k),Math.round(X-16),Math.round(Y-47-Math.abs(Math.sin(now*2+o.x))*1.2));label(o.name,X,Y-58);const b=(Math.sin(now*4)+1)*1.5;ctx.fillStyle='#e8c040';ctx.fillRect(X-2,Y-74-b,4,7);ctx.fillRect(X-2,Y-65-b,4,2);}
  else if(it.t==2)drawMob(o,Math.round(fx(o)-cam.x),Math.round(fy(o)-cam.y));
  else if(it.t==3){ctx.globalAlpha=Math.max(0,1-o.t/.6);if(mobArt(o.m)){const mm=o.m;mm.hurt=1;drawMobArt(mm,fx(mm)-cam.x,fy(mm)-cam.y,0,0,0,1,1-o.t);ctx.globalAlpha=1;return;}const s=mobSpr(o.m.k);ctx.save();ctx.translate(fx(o.m)-cam.x,fy(o.m)-cam.y);ctx.scale(o.m.dir,1-o.t);ctx.drawImage(s.w,-s.n.width/2,-s.n.height);ctx.restore();ctx.globalAlpha=1;}
  else drawPlayer(o,Math.round(fx(o)-cam.x),Math.round(fy(o)-cam.y));}
function drawSlash(p,X,Y,k){ctx.save();ctx.translate(X,Y);ctx.rotate(p.ang);ctx.globalAlpha=(1-k)*(p.back?.55:1);ctx.strokeStyle=p.c;ctx.lineWidth=p.big?6:4;ctx.shadowColor=p.c;ctx.shadowBlur=p.big?16:6;ctx.beginPath();ctx.arc(-6,0,p.big?24:17,-1.3+k*.6,1.3+k*.6);ctx.stroke();ctx.restore();ctx.globalAlpha=1;}
function draw(){const m=cur;OX=m.H*HW;const WWp=(m.W+m.H)*HW,WHp=(m.W+m.H)*HH;
  let cx=fx(P)-VW/2,cy=fy(P)-28-VH/2;cx=Math.max(-VW*.2,Math.min(WWp-VW*.8,cx));cy=Math.max(-VH*.25,Math.min(WHp-VH*.75,cy));
  if(shake>0){cx+=rnd(-shakeMag,shakeMag);cy+=rnd(-shakeMag,shakeMag);}cam.x=Math.round(cx);cam.y=Math.round(cy);
  ctx.fillStyle=m.id=='cave'?'#080606':m.id=='waste'?'#1e180f':'#0b110a';ctx.fillRect(0,0,VW,VH);
  ctx.drawImage(m.groundCv,-cam.x,-cam.y);
  for(const k of m.anim){const i=k%m.W,j=k/m.W|0,X=PX(i+.5,j+.5)-cam.x,Y=PY(i+.5,j+.5)-cam.y;if(X<-40||Y<-30||X>VW+40||Y>VH+30)continue;
    if(m.g[k]=='w'){const o=((now*10+i*9+j*5)%24)-12;ctx.fillStyle='rgba(140,185,220,.4)';ctx.fillRect(X+o-4,Y-3+(j%2)*5,8,1);ctx.fillRect(X-o-3,Y+4,6,1);}
    else{const p=(Math.sin(now*2+i*1.3+j*.7)+1)/2;ctx.fillStyle=`rgba(255,${150+p*80|0},40,${.3+p*.35})`;ctx.fillRect(X-8+(i*7%12),Y-4+(j*5%6),9,4);ctx.fillStyle=`rgba(255,230,120,${p*.5})`;ctx.fillRect(X+(j*3%10)-4,Y+2,4,2);}}
  for(const p of m.portals){const X=PX(p.x+.5,p.y+.5)-cam.x,Y=PY(p.x+.5,p.y+.5)-cam.y,a=(Math.sin(now*3)+1)/2;ctx.save();ctx.shadowColor='#9a6ae0';ctx.shadowBlur=16;
    ctx.fillStyle=`rgba(110,70,210,${.28+a*.15})`;ctx.beginPath();ctx.ellipse(X,Y,24+a*3,12+a*1.5,0,0,7);ctx.fill();ctx.strokeStyle='#bfa0f0';ctx.lineWidth=2;ctx.stroke();
    ctx.strokeStyle=`rgba(255,255,255,${.3+a*.4})`;ctx.beginPath();ctx.ellipse(X,Y,14,7,0,now%6.28,now%6.28+3);ctx.stroke();ctx.restore();}
  if(marker){const X=PX(marker.x+.5,marker.y+.5)-cam.x,Y=PY(marker.x+.5,marker.y+.5)-cam.y,a=(Math.sin(now*8)+1)/2;ctx.strokeStyle=`rgba(255,231,163,${.4+a*.5})`;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(X,Y,12+a*4,6+a*2,0,0,7);ctx.stroke();}
  {const t=myTarget();if(t){const X=fx(t)-cam.x,Y=fy(t)-cam.y;ctx.strokeStyle='#e8503e';ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.lineDashOffset=-now*20;ctx.beginPath();ctx.ellipse(X,Y,t.boss?40:16,t.boss?18:7,0,0,7);ctx.stroke();ctx.setLineDash([]);}}
  const A=[],B=[],vis=(sx,sy)=>sx>-90&&sx<VW+90&&sy>-40&&sy<VH+140;
  for(const o of m.objs){if(BIG[o.t]){const l=PX(o.x,o.y+o.h)-cam.x,r=PX(o.x+o.w,o.y)-cam.x,top=PY(o.x,o.y)-cam.y-150,bot=PY(o.x+o.w,o.y+o.h)-cam.y;if(r>-60&&l<VW+60&&bot>-60&&top<VH+60)B.push({o,l,r,done:false});continue;}
    const sx=PX(o.x+.5,o.y+.5)-cam.x,sy=PY(o.x+.5,o.y+.5)-cam.y;if(vis(sx,sy))A.push({k:o.x+o.y,tx:o.x,ty:o.y,sx,t:0,o});}
  for(const n of m.npcs)A.push({k:n.x+n.y+.01,tx:n.x,ty:n.y,sx:PX(n.x+.5,n.y+.5)-cam.x,t:1,o:n});
  for(const mb of m.mobs){const sx=fx(mb)-cam.x,sy=fy(mb)-cam.y;if(vis(sx,sy))A.push({k:mb.rx+mb.ry+.02,tx:Math.round(mb.rx),ty:Math.round(mb.ry),sx,t:2,o:mb});}
  for(const c of m.corpses)A.push({k:c.m.rx+c.m.ry+.02,tx:c.m.x,ty:c.m.y,sx:fx(c.m)-cam.x,t:3,o:c});
  for(const e of players.values())A.push({k:e.rx+e.ry+.03,tx:Math.round(e.rx),ty:Math.round(e.ry),sx:fx(e)-cam.x,t:4,o:e});
  A.sort((a,b)=>a.k-b.k);
  for(const p of parts)if(p.type=='slash'&&p.back&&!(p.delay>0))drawSlash(p,p.x-cam.x,p.y-cam.y,p.t/p.life);
  for(const it of A){for(const b of B){if(b.done)continue;const o=b.o;if((it.tx>=o.x+o.w||it.ty>=o.y+o.h)&&it.sx>b.l-24&&it.sx<b.r+24){drawObj(o);b.done=true;}}drawItem(it);}
  for(const b of B)if(!b.done)drawObj(b.o);
  for(const p of m.portals)label(p.label,PX(p.x+.5,p.y+.5)-cam.x,PY(p.x+.5,p.y+.5)-cam.y-18,'#d0bcf4');
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
  const di=dayInfo();NIGHT=m.id=='cave'?0:(1-di.day)*.62;const dark=Math.min(.9,m.dark+NIGHT);
  if(dark>0.02){const L=lctx,sc=.25;L.globalCompositeOperation='source-over';L.clearRect(0,0,lightCv.width,lightCv.height);
    L.fillStyle=m.id=='waste'&&NIGHT<.2?`rgba(50,26,0,${dark})`:`rgba(4,6,16,${dark})`;L.fillRect(0,0,lightCv.width,lightCv.height);L.globalCompositeOperation='destination-out';
    const hole=(wx,wy,r,a)=>{const X=(wx-cam.x)*sc,Y=(wy-cam.y)*sc,R=r*40*sc;if(X<-R||Y<-R||X>lightCv.width+R||Y>lightCv.height+R)return;const g=L.createRadialGradient(X,Y,0,X,Y,R);g.addColorStop(0,`rgba(0,0,0,${a})`);g.addColorStop(1,'rgba(0,0,0,0)');L.fillStyle=g;L.fillRect(X-R,Y-R,R*2,R*2);};
    hole(fx(P),fy(P)-20,m.id=='cave'?5+Math.sin(now*9)*.15:6,1);for(const l of m.lights)if(!l.night||NIGHT>.12)hole(PX(l.x,l.y),PY(l.x,l.y)-(l.h||0),l.r,.9);
    for(const p of projs)if(p.kind!='arrow')hole(p.x,p.y,p.kind=='fire'?3:1.8,.9);for(const p of parts)if(p.type=='ring')hole(p.x,p.y,2.5,.6);
    ctx.imageSmoothingEnabled=true;ctx.drawImage(lightCv,0,0,VW,VH);ctx.imageSmoothingEnabled=false;
    if(m.id=='cave'||NIGHT>.12){ctx.globalCompositeOperation='lighter';for(const l of m.lights){if(l.night&&NIGHT<=.12)continue;const X=PX(l.x,l.y)-cam.x,Y=PY(l.x,l.y)-cam.y-(l.h||0);if(X<-90||Y<-90||X>VW+90||Y>VH+90)continue;const rr=l.r*34,g=ctx.createRadialGradient(X,Y,0,X,Y,rr);g.addColorStop(0,`rgba(${l.c},${m.id=='cave'?.2:.16})`);g.addColorStop(1,`rgba(${l.c},0)`);ctx.fillStyle=g;ctx.fillRect(X-rr,Y-rr,rr*2,rr*2);}ctx.globalCompositeOperation='source-over';}}
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
}