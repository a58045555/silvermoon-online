// 銀月大陸 Online — shared rules. Imported by the server (Node) and the browser client.
// Everything here must be deterministic and free of DOM / Node APIs.

export const CLS = {
  knight:  { n:'騎士',     d:'血厚防高，貼身砍殺。',           hp:[64,16], mp:[10,3], atk:1.0,  range:1,   spd:.68, def:2, dodge:.05, crit:0,   main:'力量',       sk:{n:'衝擊斬',mp:8,cd:1.6},  base:{str:16,dex:12,con:16,int:8, wis:10} },
  ranger:  { n:'遊俠',     d:'遠距離射擊，閃避高。',           hp:[48,12], mp:[14,4], atk:.92,  range:4.2, spd:.78, def:0, dodge:.14, crit:.02, main:'敏捷',       sk:{n:'三連射',mp:10,cd:1.8}, base:{str:11,dex:18,con:12,int:11,wis:12} },
  mage:    { n:'法師',     d:'血少但魔法傷害大，火球能炸一群。', hp:[40,9],  mp:[26,7], atk:1.15, range:3.6, spd:.95, def:0, dodge:.06, crit:0,   main:'智力',       sk:{n:'火球術',mp:12,cd:2.0}, base:{str:8, dex:11,con:11,int:18,wis:16} },
  darkelf: { n:'黑暗妖精', d:'雙刀刺客，出手快、爆擊高。',     hp:[52,13], mp:[14,4], atk:.9,   range:1,   spd:.5,  def:1, dodge:.12, crit:.08, main:'力量＋敏捷', sk:{n:'暗影突襲',mp:9,cd:1.5}, base:{str:14,dex:17,con:12,int:10,wis:11} }
};
export const STATN = { str:'力量', dex:'敏捷', con:'體質', int:'智力', wis:'精神' };
export const STATD = { str:'近戰攻擊', dex:'遠程攻擊、閃避、爆擊', con:'HP、防禦、回血', int:'魔法攻擊、MP', wis:'MP、回魔' };
export const WT = [4,9,15,23,34];
export const WN = {
  knight:['練習短劍','精鋼長劍','闊刃戰斧','龍鱗巨劍','熾焰之刃'],
  ranger:['獵人短弓','樺木長弓','精靈複合弓','風語者之弓','星落神弓'],
  mage:['學徒法杖','水晶法杖','古樹魔杖','冥火法杖','賢者之杖'],
  darkelf:['生鏽短刃','雙刃匕首','暗影雙刃','冥月刺刃','虛空之牙']
};
export const AN = ['旅人皮甲','鐵環鎖子甲','鋼鐵板甲','秘銀戰甲','龍鱗鎧甲'];
export const RINGS = [{n:'力量戒指',str:2,atk:3},{n:'守護戒指',def:4,con:1},{n:'生命戒指',hp:60,con:1},{n:'賢者戒指',mp:30,int:2,wis:1}];
export const SLOTS = [['w','武器'],['h','頭盔'],['a','盔甲'],['c','斗篷'],['g','手套'],['b','長靴'],['s','盾牌'],['n','項鍊'],['r1','戒指'],['r2','戒指']];
export const ARM = {
  a:{n:AN,def:[2,5,9,14,20]},
  h:{n:['皮帽','鐵盔','鋼鐵頭盔','秘銀頭盔','龍鱗頭盔'],def:[1,2,4,6,9]},
  c:{n:['旅人斗篷','守護斗篷','精靈斗篷','暗影斗篷','龍王斗篷'],def:[0,1,2,3,5],mp:[5,10,18,28,40]},
  g:{n:['皮手套','鐵手套','鋼鐵手套','秘銀手套','龍鱗手套'],def:[1,1,2,3,5],atk:[0,1,2,4,6]},
  b:{n:['皮靴','鐵靴','鋼鐵長靴','秘銀長靴','龍鱗長靴'],def:[1,2,3,4,6],dex:[0,0,1,1,2]},
  s:{n:['圓木盾','鐵盾','鋼鐵塔盾','秘銀盾','龍鱗盾'],def:[1,3,5,8,11]},
  n:{n:['骨製護符','銀月項鍊','精靈之淚','冥王項鍊','龍之心'],def:[0,0,0,0,0],hp:[10,25,45,70,100]}
};
export const SLOTN = { w:'武器', h:'頭盔', a:'盔甲', c:'斗篷', g:'手套', b:'長靴', s:'盾牌', n:'項鍊', r:'戒指' };
export const NOSHIELD = { ranger:1, darkelf:1 };
export const BONK = { str:'力量', dex:'敏捷', con:'體質', int:'智力', wis:'精神', hp:'HP', mp:'MP', atk:'攻擊', def:'防禦' };

export const MT = {
  slime:{n:'苔蘚史萊姆',lv:1,hp:24,atk:7,def:0,exp:7,g:[2,6],spd:.6,aggro:1,sight:3},
  mush:{n:'毒菇人',lv:3,hp:42,atk:9,def:1,exp:12,g:[3,8],spd:.6,ranged:3,aggro:1,sight:4},
  boar:{n:'狂暴野豬',lv:4,hp:62,atk:9,def:3,exp:14,g:[3,9],spd:.42,aggro:1,sight:4},
  goblin:{n:'哥布林',lv:5,hp:55,atk:10,def:2,exp:16,g:[4,10],spd:.45,aggro:1},
  wolf:{n:'灰牙狼',lv:6,hp:70,atk:12,def:2,exp:22,g:[6,13],spd:.38,aggro:1},
  skel:{n:'迷途骷髏兵',lv:10,hp:150,atk:20,def:6,exp:48,g:[12,26],spd:.5,aggro:1},
  scorp:{n:'沙蠍',lv:12,hp:185,atk:24,def:9,exp:60,g:[14,30],spd:.45,aggro:1},
  mummy:{n:'古代木乃伊',lv:13,hp:240,atk:25,def:8,exp:68,g:[14,30],spd:.62,aggro:1},
  ghoul:{n:'食屍鬼',lv:14,hp:220,atk:28,def:7,exp:74,g:[16,34],spd:.34,aggro:1},
  worm:{n:'沙漠巨蟲',lv:16,hp:300,atk:30,def:10,exp:86,g:[18,36],spd:.55,aggro:1,ranged:3},
  bat:{n:'火焰蝙蝠',lv:18,hp:200,atk:32,def:6,exp:90,g:[18,36],spd:.3,aggro:1},
  hound:{n:'地獄犬',lv:19,hp:260,atk:38,def:10,exp:110,g:[20,40],spd:.3,aggro:1},
  golem:{n:'熔岩魔像',lv:20,hp:480,atk:42,def:20,exp:150,g:[25,50],spd:.7,aggro:1,sight:4},
  cultist:{n:'魔族祭司',lv:22,hp:300,atk:44,def:12,exp:150,g:[26,52],spd:.55,aggro:1,ranged:4},
  dknight:{n:'黑暗騎士',lv:23,hp:420,atk:50,def:16,exp:185,g:[30,60],spd:.45,aggro:1},
  treant:{n:'腐木樹妖',lv:12,hp:2200,atk:28,def:8,exp:900,g:[300,500],spd:.7,aggro:1,boss:1},
  colossus:{n:'白骨巨像',lv:20,hp:6400,atk:48,def:15,exp:2800,g:[800,1200],spd:.65,aggro:1,boss:1},
  firelord:{n:'熾焰領主 卡爾薩',lv:28,hp:15000,atk:72,def:22,exp:8000,g:[2000,3000],spd:.6,aggro:1,boss:1}
};

export const MAPDEF = {
  village:{name:'晨霧村',W:30,H:22,dark:0,seed:3,safe:1},
  forest:{name:'哭泣森林',tip:'建議 Lv.1～10',W:44,H:34,dark:.32,base:'g',trail:'d',seed:11,mobs:['slime','mush','boar','goblin','wolf'],boss:'treant',tier:1,prev:'village',next:'waste'},
  waste:{name:'骸骨荒原',tip:'建議 Lv.10～18',W:44,H:34,dark:.08,base:'s',trail:'k',seed:22,mobs:['skel','scorp','mummy','ghoul','worm'],boss:'colossus',tier:2,prev:'forest',next:'cave'},
  cave:{name:'熔岩洞窟',tip:'建議 Lv.18 以上',W:40,H:32,dark:.8,base:'f',trail:'F',seed:33,mobs:['bat','hound','golem','cultist','dknight'],boss:'firelord',tier:3,prev:'waste',next:null}
};
export const SHOP = [
  {k:'pot',n:'紅色藥水',d:'回復 50 HP',p:20,q:[1,10]},
  {k:'big',n:'濃縮治癒藥水',d:'回復 160 HP',p:90,q:[1,5]},
  {k:'blue',n:'藍色藥水',d:'回復 40 MP',p:40,q:[1,5]},
  {k:'ret',n:'回村卷軸',d:'瞬間回到晨霧村',p:30,q:[1,3]},
  {k:'as',n:'防具強化卷軸',d:'找鐵匠衝防具用',p:260,q:[1]},
  {k:'ws',n:'武器強化卷軸',d:'找鐵匠衝武器用',p:420,q:[1]}
];
export const INV_N = { pot:'紅色藥水', big:'濃縮治癒藥水', blue:'藍色藥水', ret:'回村卷軸', ws:'武器強化卷軸', as:'防具強化卷軸' };
export const BAGMAX = 40;
export const PK_MIN_LV = 10;
export const CLAN_COST = 5000, CLAN_MIN_LV = 10;

// ---------- deterministic helpers ----------
export function rng(seed){ let s=(seed*2654435761)>>>0||1; return ()=>{ s^=s<<13; s>>>=0; s^=s>>>17; s^=s<<5; s>>>=0; return s/4294967296; }; }
export const DIRS = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
export const cheb = (a,b)=>Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y));
export const dist = (a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

// ---------- maps (identical on server and client) ----------
export const BIG = { house:[4,3], fountain:[2,2] };
function newMap(id){ const d=MAPDEF[id]; return { id, name:d.name, tip:d.tip, W:d.W, H:d.H, dark:d.dark, def:d, g:new Array(d.W*d.H).fill(d.base||'g'), blk:new Uint8Array(d.W*d.H), objs:[], npcs:[], portals:[], lights:[] }; }
function put(m,t,x,y,v){ const [w,h]=BIG[t]||[1,1]; for(let j=0;j<h;j++)for(let i=0;i<w;i++)m.blk[(y+j)*m.W+x+i]=1; const o={t,x,y,w,h,v:v|0}; m.objs.push(o);
  if(t==='lamp')m.lights.push({x:x+.5,y:y+.5,r:3.2,h:48,c:'255,200,110',night:1});
  if(t==='crystal')m.lights.push({x:x+.5,y:y+.5,r:3.2,h:18,c:'90,210,255'});
  if(t==='house')m.lights.push({x:x+w/2,y:y+h+.15,r:2.2,h:24,c:'255,190,100',night:1});
  return o; }
function buildVillage(){ const m=newMap('village'),W=m.W,H=m.H,R=rng(3),ri=(a,b)=>a+Math.floor(R()*(b-a+1));
  const G=(x,y,c)=>{m.g[y*W+x]=c;};
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){ if(x<2||y<2||x>=W-2||y>=H-2){ if(!(y>=H-2&&x>=13&&x<=16))put(m,'tree',x,y,ri(0,2)); } }
  for(let x=13;x<=16;x++)put(m,'tree',x,H-1,1);
  for(let x=3;x<=26;x++)G(x,8,'c'); for(let y=8;y<=19;y++){G(14,y,'c');G(15,y,'c');}
  for(let y=9;y<=12;y++)for(let x=12;x<=17;x++)G(x,y,'c');
  for(const [a,b] of [[4,6],[5,6],[4,7],[5,7],[23,6],[24,6],[23,7],[24,7],[5,16],[6,16],[22,16],[23,16]])G(a,b,'c');
  for(let x=5;x<=23;x++)G(x,17,'c');
  for(let y=9;y<=11;y++)for(let x=2;x<=10;x++)if(((x-6)/3.8)**2+((y-9.8)/1.25)**2<1){G(x,y,'w');m.blk[y*W+x]=1;}
  put(m,'house',3,3,0);put(m,'house',22,3,1);put(m,'house',4,13,2);put(m,'house',21,13,3);
  put(m,'fountain',14,10);
  for(const [a,b] of [[11,7],[18,7],[11,15],[18,15]])put(m,'lamp',a,b);
  put(m,'barrel',7,4);put(m,'barrel',7,5);put(m,'crate',21,4);put(m,'crate',21,5);put(m,'barrel',25,15);
  for(const [a,b,v] of [[10,3,0],[18,2,2],[26,11,1],[9,15,0],[26,19,2],[3,19,1],[19,11,2],[10,19,1],[20,19,0]])put(m,'tree',a,b,v);
  const npc=(k,x,y,name,act)=>{m.npcs.push({k,x,y,name,act});m.blk[y*W+x]=1;};
  npc('smith',6,6,'鐵匠 巴爾克','smith');npc('merchant',22,6,'雜貨商 莉娜','shop');npc('guard',13,18,'守衛 艾德','guard');
  m.portals.push({x:14,y:19,to:'forest',label:'往哭泣森林'});
  m.heal={x:14,y:10,w:2,h:2}; m.spawn={x:15,y:14};
  return finish(m); }
function buildWild(id){ const m=newMap(id),d=m.def,W=m.W,H=m.H,R=rng(d.seed),idx=(x,y)=>y*W+x;
  const ri=(a,b)=>a+Math.floor(R()*(b-a+1)), rnd=(a,b)=>a+R()*(b-a);
  const prot=new Uint8Array(W*H); const mark=(cx,cy,r)=>{for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++)if(x>1&&y>1&&x<W-2&&y<H-2)prot[idx(x,y)]=1;};
  const entry={x:3,y:3},exit={x:4,y:H-5},boss={x:W-7,y:H-7};
  const carve=(a,b)=>{let x=a.x,y=a.y,g=0;while((x!==b.x||y!==b.y)&&g++<4000){if(R()<.62){if(R()<.5&&x!==b.x)x+=Math.sign(b.x-x);else if(y!==b.y)y+=Math.sign(b.y-y);else x+=Math.sign(b.x-x);}else{if(R()<.5)x+=R()<.5?-1:1;else y+=R()<.5?-1:1;}
    x=Math.max(2,Math.min(W-3,x));y=Math.max(2,Math.min(H-3,y));for(const [dx,dy] of [[0,0],[1,0],[0,1]]){const k=idx(Math.min(W-3,x+dx),Math.min(H-3,y+dy));prot[k]=1;m.g[k]=d.trail;}}};
  carve(entry,exit);carve(entry,boss);carve(exit,boss);for(let i=0;i<4;i++)carve(entry,{x:ri(6,W-6),y:ri(6,H-6)});
  mark(entry.x,entry.y,2);mark(exit.x,exit.y,2);mark(boss.x,boss.y,4);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(R()<(id==='forest'?.05:.14)&&!prot[idx(x,y)])m.g[idx(x,y)]=d.trail;}
  const pool=(ch,n,rmax)=>{for(let i=0;i<n;i++){const cx=ri(5,W-6),cy=ri(5,H-6),rx=rnd(1.5,rmax),ry=rnd(1.2,rmax*.8);for(let y=cy-4;y<=cy+4;y++)for(let x=cx-4;x<=cx+4;x++){if(x<2||y<2||x>=W-2||y>=H-2)continue;const k=idx(x,y);if(prot[k]||m.blk[k])continue;if(((x-cx)/rx)**2+((y-cy)/ry)**2<1){m.g[k]=ch;m.blk[k]=1;}}}};
  if(id==='forest')pool('w',4,3); if(id==='cave')pool('l',7,3);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=idx(x,y);if(m.blk[k])continue;
    if(x<2||y<2||x>=W-2||y>=H-2){put(m,id==='forest'?'dtree':id==='waste'?'srock':'wall',x,y,ri(0,2));continue;}
    if(prot[k])continue;const r=R();
    if(id==='forest'){if(r<.25)put(m,'dtree',x,y,ri(0,2));}
    else if(id==='waste'){if(r<.06)put(m,'dead',x,y,0);else if(r<.13)put(m,'srock',x,y,ri(0,1));}
    else{if(r<.09)put(m,'stal',x,y,0);else if(r<.12)put(m,'wall',x,y,ri(0,2));else if(r<.135)put(m,'crystal',x,y,0);}}
  const seen=new Uint8Array(W*H),q=[idx(entry.x,entry.y)];seen[q[0]]=1;
  while(q.length){const c=q.pop(),cx=c%W,cy=c/W|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=idx(cx+dx,cy+dy);if(!seen[k]&&!m.blk[k]){seen[k]=1;q.push(k);}}}
  for(let k=0;k<W*H;k++){if(!m.blk[k]&&!seen[k])put(m,id==='forest'?'dtree':id==='waste'?'srock':'wall',k%W,k/W|0,0);}
  m.portals.push({x:entry.x,y:entry.y,to:d.prev,label:'往'+MAPDEF[d.prev].name});
  if(d.next)m.portals.push({x:exit.x,y:exit.y,to:d.next,label:'往'+MAPDEF[d.next].name});
  m.entry=entry;m.exit=exit;m.boss=boss;m.spawn={x:4,y:4};
  for(const p of m.portals)m.lights.push({x:p.x+.5,y:p.y+.5,r:2.6,c:'190,140,255'});
  if(id==='cave')for(let k=0;k<W*H;k++)if(m.g[k]==='l'&&R()<.25)m.lights.push({x:k%W+.5,y:(k/W|0)+.5,r:2.4,c:'255,120,40'});
  return finish(m); }
function finish(m){ m.open=[]; for(let k=0;k<m.W*m.H;k++)if(!m.blk[k])m.open.push(k); return m; }
export function buildMap(id){ return id==='village'?buildVillage():buildWild(id); }
// where you appear when arriving through a portal from map `from`
export function arrivalPoint(m,from){
  if(m.id==='village')return{x:14,y:18};
  if(from===m.def.prev)return{x:m.entry.x+1,y:m.entry.y+1};
  return{x:m.exit.x+1,y:m.exit.y-1};
}
export function inSafeZone(m){ return !!(m&&m.def.safe); }

// ---------- pathfinding (BFS on 8 directions) ----------
export function findPath(m,sx,sy,gx,gy,mode,range,occupied){
  const W=m.W,H=m.H,solid=(x,y)=>x<0||y<0||x>=W||y>=H||m.blk[y*W+x]===1;
  const goal=(x,y)=>mode==='adj'?(Math.max(Math.abs(x-gx),Math.abs(y-gy))<=1&&!(x===gx&&y===gy)):mode==='range'?(Math.hypot(x-gx,y-gy)<=range&&!(x===gx&&y===gy)):(x===gx&&y===gy);
  if(goal(sx,sy))return[];
  const prev=new Int32Array(W*H).fill(-1),s=sx+sy*W;prev[s]=s;const q=[s];let h=0;
  while(h<q.length&&h<7000){const c=q[h++],cx=c%W,cy=(c/W)|0;
    for(const [dx,dy] of DIRS){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const k=nx+ny*W;if(prev[k]!==-1)continue;
      if(solid(nx,ny)||(occupied&&occupied(nx,ny)))continue;if(dx&&dy&&(solid(cx+dx,cy)||solid(cx,cy+dy)))continue;
      prev[k]=c;if(goal(nx,ny)){const p=[];let n=k;while(n!==s){p.push([n%W,(n/W)|0]);n=prev[n];}return p.reverse();}q.push(k);}}
  return null;
}

// ---------- items & stats ----------
export function itemBase(it){ const o={}; if(!it)return o; const t=it.t|0,en=it.en|0;
  if(it.s==='w'){o.atk=WT[t]+en*2+Math.max(0,en-6);}
  else if(it.s==='r'){const R=RINGS[t]||RINGS[0],q=1+(it.q|0)*.5;for(const k in R)if(k!=='n')o[k]=Math.round(R[k]*q);}
  else{const A=ARM[it.s];if(A){for(const k in A)if(k!=='n'){const v=A[k][t]||0;if(v)o[k]=v;}o.def=(o.def||0)+en;if(o.mp)o.mp+=en*3;if(o.hp)o.hp+=en*8;}}
  if(it.bon)for(const k in it.bon)o[k]=(o[k]||0)+it.bon[k];
  return o; }
export function gearSum(eq){ const o={}; for(const [sl] of SLOTS){const b=itemBase(eq&&eq[sl]);for(const k in b)o[k]=(o[k]||0)+b[k];} return o; }
// c = character record {cls, lv, sp, eq}
export function calcStats(c){ const C=CLS[c.cls], G=gearSum(c.eq), sp=c.sp||{};
  const st=k=>C.base[k]+(sp[k]||0)+(G[k]||0);
  const s={str:st('str'),dex:st('dex'),con:st('con'),int:st('int'),wis:st('wis'),gear:G};
  const main=c.cls==='knight'?s.str:c.cls==='ranger'?s.dex:c.cls==='mage'?s.int:(s.str+s.dex)/2;
  s.maxHP=Math.round(C.hp[0]+(c.lv-1)*C.hp[1]+(s.con-10)*(4+c.lv*.5)+(G.hp||0));
  s.maxMP=Math.round(C.mp[0]+(c.lv-1)*C.mp[1]+(s.wis-10)*3+(s.int-10)*2+(G.mp||0));
  s.atk=Math.max(1,Math.round((6+c.lv*2+(G.atk||0)+(main-10)*1.6)*C.atk));
  s.def=Math.round(C.def+(G.def||0)+Math.max(0,(s.con-10)/3));
  s.dodge=Math.min(.4,C.dodge+(s.dex-10)*.006);
  s.crit=Math.min(.5,.1+C.crit+(s.dex-10)*.005);
  return s; }
export const expNeed = l=>Math.round(25*Math.pow(l,1.65));
export function enchRate(kind,en){ const safe=kind==='w'?6:4; if(en<safe)return 1; return [.5,.4,.3,.22,.15,.1][en-safe]??.05; }
export const sellP = it=>Math.round([25,120,450,1300,3200][it.t|0]*(it.s==='w'?1.2:it.s==='a'?1:it.s==='r'||it.s==='n'?1.4:.7)*(1+(it.q|0)*.8)+(it.en|0)*(it.en|0)*40);
export const shopPrice = (sl,t)=>Math.round([0,600,2400,7000,16000][t]*(sl==='w'?1:sl==='a'?.8:.45));
export const SHOP_GEAR = [['w',1],['a',1],['h',1],['g',1],['b',1],['c',1],['s',1],['w',2],['a',2]];
export function itemBaseName(it,cls){ if(!it)return'（無）'; if(it.leg)return it.s==='w'?(LEGEND_W[cls]||LEGEND_W.knight):it.leg; if(it.s==='w')return(WN[cls]||WN.knight)[it.t]; if(it.s==='r')return(RINGS[it.t]||RINGS[0]).n; return ARM[it.s]?ARM[it.s].n[it.t]:'?'; }
export function itemName(it,cls){ if(!it)return'（無）'; return(it.en?'+'+it.en+' ':'')+itemBaseName(it,cls); }
export function itemStat(it){ const b=itemBase(it),out=[]; for(const k of ['atk','def','hp','mp','str','dex','con','int','wis'])if(b[k])out.push(BONK[k]+' +'+b[k]); return out.join('、')||'無屬性'; }
export function eqSlotFor(eq,it){ if(it.s==='r')return!eq.r1?'r1':!eq.r2?'r2':'r1'; return it.s; }
export function makeItem(s,t,R=Math.random){ const ri=(a,b)=>a+Math.floor(R()*(b-a+1)),pick=a=>a[Math.floor(R()*a.length)];
  t=Math.max(0,Math.min(4,t)); const it={s,t,en:0}; if(s==='r')it.t=ri(0,3);
  const r=R(),q=r<.07?2:r<.35?1:0;
  if(q){it.q=q;it.bon={};const pool=['str','dex','con','int','wis','hp','mp','atk','def'];const n=q===2?ri(2,3):1;
    for(let i=0;i<n;i++){const k=pick(pool);const v=k==='hp'?ri(8,20)*(t+1):k==='mp'?ri(4,10)*(t+1):k==='atk'?ri(1,2)*(t+1):k==='def'?ri(1,t+1):ri(1,2)+(t>>1);it.bon[k]=(it.bon[k]||0)+v;}}
  if(s!=='r'&&s!=='n'&&R()<.1)it.en=ri(1,2);
  return it; }
export function randomSlot(R=Math.random){ const r=R(); return r<.22?'w':r<.36?'a':r<.48?'h':r<.58?'g':r<.68?'b':r<.76?'c':r<.84?'s':r<.92?'n':'r'; }
export function newCharacter(cls,g,name){
  return { cls, g:g==='f'?'f':'m', name, lv:1, exp:0, gold:200, hp:0, mp:0, sp:{str:0,dex:0,con:0,int:0,wis:0}, pts:0,
    eq:{w:{s:'w',t:0,en:0},h:null,a:{s:'a',t:0,en:0},c:null,g:null,b:null,s:null,n:null,r1:null,r2:null},
    bag:[], inv:{pot:6,big:0,blue:2,ret:2,ws:1,as:1}, map:'village', x:15, y:14, lawful:0, kills:0, pkKills:0, bossKills:0, mq:0, mqp:0, daily:null }; }
export const NAME_RE = /^[\p{L}\p{N}_]{2,12}$/u;

// ---------- skills (3 per class, unlocked at Lv.1 / 5 / 10) ----------
export const SKILLS = {
  knight:[ {id:'k1',n:'衝擊斬',lv:1,mp:8,cd:1.6,tgt:1,d:'重擊單一目標並暈眩 1.3 秒'},
           {id:'k2',n:'旋風斬',lv:5,mp:14,cd:5,d:'砍擊身邊所有敵人'},
           {id:'k3',n:'鐵壁',lv:10,mp:16,cd:20,d:'8 秒內受到的傷害減半'} ],
  ranger:[ {id:'r1',n:'三連射',lv:1,mp:10,cd:1.8,tgt:1,d:'連射三箭'},
           {id:'r2',n:'穿雲箭',lv:5,mp:16,cd:6,tgt:1,d:'威力 3.2 倍、必定爆擊的一箭'},
           {id:'r3',n:'疾風步',lv:10,mp:18,cd:20,d:'8 秒內攻速 +60%、閃避 +15%'} ],
  mage:[   {id:'m1',n:'火球術',lv:1,mp:12,cd:2,tgt:1,d:'炸傷目標和周圍的敵人'},
           {id:'m2',n:'冰霜新星',lv:5,mp:18,cd:7,d:'冰凍身邊的敵人 2 秒並造成傷害'},
           {id:'m3',n:'治癒術',lv:10,mp:20,cd:6,d:'回復自己和附近隊友的 HP'} ],
  darkelf:[{id:'d1',n:'暗影突襲',lv:1,mp:9,cd:1.5,tgt:1,d:'連砍兩刀，第二刀必爆擊'},
           {id:'d2',n:'毒刃',lv:5,mp:12,cd:5,tgt:1,d:'使目標中毒 6 秒，每秒受到傷害'},
           {id:'d3',n:'影遁',lv:10,mp:16,cd:18,d:'6 秒內閃避 +40%，下一擊必定爆擊'} ]
};

// ---------- legendary weapons ----------
export const LEGEND_W = { knight:'銀誓', ranger:'風語・星痕', mage:'月之塔殘杖', darkelf:'冥月雙刃' };
export function makeLegend(kind){
  if(kind==='n') return {s:'n',t:4,en:0,q:3,leg:'新月項鍊',bon:{hp:120,str:3,dex:3,con:3,int:3,wis:3}};
  return {s:'w',t:4,en:0,q:3,leg:'w',bon:{atk:18,str:4,dex:4,con:2,int:4}};
}

// ---------- main quests (follow the story 新月之誓) ----------
export const QUESTS = [
  {n:'序章：月碎之夜', d:'找村南的守衛艾德說話', type:'talk', r:{exp:20,gold:100,pot:5},
   story:'酒館裡的老故事說，很久以前天上有兩顆月亮。最近哭泣森林在夜裡傳出哭聲，守衛艾德想找冒險者幫忙。'},
  {n:'第一章：晨霧村的旅人', d:'到哭泣森林打倒 10 隻苔蘚史萊姆。', type:'kill', k:['slime'], n:10, r:{exp:80,gold:200,ret:2},
   story:'艾德：「史萊姆的黏液裡有月痕碎屑，有人在森林裡餵牠們。去看看。」'},
  {n:'第一章：鐵匠的兵器', d:'回村找鐵匠巴爾克，衝一次裝備。', type:'enchant', n:1, r:{ws:1,as:1,gold:200},
   story:'艾德：「碎屑我收下了。去找巴爾克，你的兵器撐不了多久。」'},
  {n:'第二章：哭泣森林', d:'掃蕩森林裡的哥布林：打倒 15 隻。', type:'kill', k:['goblin'], n:15, r:{exp:300,gold:500,big:3},
   story:'哥布林營地裡堆著一箱箱用灰布包好的月痕。有人拿食物跟牠們交換。'},
  {n:'第二章：老根的哭聲', d:'打倒森林深處的腐木樹妖。', type:'kill', k:['treant'], n:1, r:{exp:800,gold:1500,ws:2},
   story:'精靈遊俠希爾薇：「精靈守護千年的古樹被人埋進了月痕。從那天起，它每晚都在哭。」'},
  {n:'第三章：骸骨荒原', d:'到骸骨荒原打倒 20 隻骷髏兵或木乃伊。', type:'kill', k:['skel','mummy'], n:20, r:{exp:1500,gold:1500},
   story:'樹妖的碎片上刻著羊頭骷髏，那是灰燼教團的記號。車轍印一路往南，通往一片沒有草的沙地。'},
  {n:'第三章：銀誓', d:'打倒荒原中央的白骨巨像。', type:'kill', k:['colossus'], n:1, r:{exp:4000,gold:4000,as:2},
   story:'老學者諾恩：「教團在餵封印下的那個人。他叫卡爾薩，三百年前銀月騎士團的團長。」'},
  {n:'第四章：地底的影子', d:'打倒 10 隻沙漠巨蟲，救出受傷的黑暗妖精。', type:'kill', k:['worm'], n:10, r:{exp:3000,gold:3000,big:5},
   story:'艾德的右手被巨像壓碎，再也握不了劍。他把劍交給你：「它叫銀誓。它不會讓你變強，只會提醒你為什麼要握劍。」'},
  {n:'第五章：熔岩洞窟', d:'擊退灰燼教團：打倒 15 隻魔族祭司。', type:'kill', k:['cultist'], n:15, r:{exp:6000,gold:5000},
   story:'黑暗妖精薇拉：「我們三年前就警告過你們。下一個滿月，封印就擋不住了。」'},
  {n:'第六章：月心', d:'打倒熾焰領主卡爾薩。', type:'kill', k:['firelord'], n:1, r:{exp:15000,gold:10000,ws:3,as:3},
   story:'卡爾薩：「我也握過那把劍。有了月心，你的劍永遠不會斷。拿去吧。」'},
  {n:'終章：新月之下', d:'回村向守衛艾德報告', type:'talk', r:{gold:5000},
   story:'夜空出現了一道細細的銀色彎月。北方雪山的天際，卻翻出了一絲紅光……（第二部「血月之預言」敬請期待）'}
];
// ---------- daily quests ----------
export const DAILY_POOL = [
  {k:'kill',  n:40, d:'打倒 40 隻怪物'},
  {k:'kill',  n:80, d:'打倒 80 隻怪物'},
  {k:'boss',  n:1,  d:'參與擊殺 1 隻 Boss'},
  {k:'enchant',n:2, d:'在鐵匠鋪衝裝 2 次'},
  {k:'pick',  n:8,  d:'撿起 8 件掉落物'},
  {k:'party', n:30, d:'和隊友一起打倒 30 隻怪物'},
  {k:'skill', n:30, d:'使用技能 30 次'}
];
export function dailyFor(day){ const R=rng([...day].reduce((a,c)=>a*31+c.charCodeAt(0),7)); const idx=[...DAILY_POOL.keys()];
  const out=[]; while(out.length<3){ const i=idx.splice(Math.floor(R()*idx.length),1)[0]; out.push({...DAILY_POOL[i],p:0,done:false}); } return out; }
export const RARN = ['','魔法','稀有','傳說'];
