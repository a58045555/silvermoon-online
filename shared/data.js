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
export const WT = [4,9,15,23,34,48];
export const WN = {
  knight:['練習短劍','精鋼長劍','闊刃戰斧','龍鱗巨劍','熾焰之刃','月痕聖劍'],
  ranger:['獵人短弓','樺木長弓','精靈複合弓','風語者之弓','星落神弓','月痕長弓'],
  mage:['學徒法杖','水晶法杖','古樹魔杖','冥火法杖','賢者之杖','月痕權杖'],
  darkelf:['生鏽短刃','雙刃匕首','暗影雙刃','冥月刺刃','虛空之牙','月痕雙牙']
};
export const AN = ['旅人皮甲','鐵環鎖子甲','鋼鐵板甲','秘銀戰甲','龍鱗鎧甲','月痕聖鎧'];
export const RINGS = [{n:'力量戒指',str:2,atk:3},{n:'守護戒指',def:4,con:1},{n:'生命戒指',hp:60,con:1},{n:'賢者戒指',mp:30,int:2,wis:1}];
export const SLOTS = [['w','武器'],['h','頭盔'],['a','盔甲'],['c','斗篷'],['g','手套'],['b','長靴'],['s','盾牌'],['n','項鍊'],['r1','戒指'],['r2','戒指']];
export const ARM = {
  a:{n:AN,def:[2,5,9,14,20,28]},
  h:{n:['皮帽','鐵盔','鋼鐵頭盔','秘銀頭盔','龍鱗頭盔','月痕頭冠'],def:[1,2,4,6,9,13]},
  c:{n:['旅人斗篷','守護斗篷','精靈斗篷','暗影斗篷','龍王斗篷','月痕披風'],def:[0,1,2,3,5,7],mp:[5,10,18,28,40,56]},
  g:{n:['皮手套','鐵手套','鋼鐵手套','秘銀手套','龍鱗手套','月痕護手'],def:[1,1,2,3,5,7],atk:[0,1,2,4,6,9]},
  b:{n:['皮靴','鐵靴','鋼鐵長靴','秘銀長靴','龍鱗長靴','月痕戰靴'],def:[1,2,3,4,6,8],dex:[0,0,1,1,2,3]},
  s:{n:['圓木盾','鐵盾','鋼鐵塔盾','秘銀盾','龍鱗盾','月痕聖盾'],def:[1,3,5,8,11,15]},
  n:{n:['骨製護符','銀月項鍊','精靈之淚','冥王項鍊','龍之心','月痕護符'],def:[0,0,0,0,0,0],hp:[10,25,45,70,100,140]}
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
  firelord:{n:'熾焰領主 卡爾薩',lv:28,hp:15000,atk:72,def:22,exp:8000,g:[2000,3000],spd:.6,aggro:1,boss:1},
  // 霜狼雪原 Lv.28-38
  frostwolf:{n:'霜牙狼',lv:28,hp:620,atk:62,def:20,exp:270,g:[36,70],spd:.32,aggro:1},
  barbarian:{n:'雪原蠻族獵手',lv:30,hp:760,atk:70,def:24,exp:320,g:[40,78],spd:.45,aggro:1,ranged:4},
  yeti:{n:'雪原雪怪',lv:31,hp:1050,atk:74,def:28,exp:380,g:[42,82],spd:.6,aggro:1,sight:4},
  icewraith:{n:'冰晶怨靈',lv:33,hp:700,atk:80,def:18,exp:400,g:[44,86],spd:.5,aggro:1,ranged:4},
  frostgiant:{n:'冰霜巨人',lv:35,hp:1500,atk:90,def:34,exp:520,g:[50,96],spd:.7,aggro:1,sight:4},
  frostwitch:{n:'霜之魔女 莉瑟拉',lv:38,hp:32000,atk:108,def:34,exp:18000,g:[4000,6000],spd:.6,aggro:1,boss:1},
  // 月之塔遺跡 Lv.38-50
  gargoyle:{n:'石像鬼',lv:38,hp:1600,atk:102,def:40,exp:620,g:[60,110],spd:.4,aggro:1},
  moonknight:{n:'墮落月騎士',lv:40,hp:1900,atk:114,def:42,exp:740,g:[64,120],spd:.45,aggro:1},
  specter:{n:'書庫怨靈',lv:42,hp:1200,atk:112,def:26,exp:700,g:[62,116],spd:.5,aggro:1,ranged:4},
  arcgolem:{n:'秘法守衛',lv:44,hp:2800,atk:126,def:54,exp:980,g:[72,130],spd:.7,aggro:1,sight:4},
  ashpriest:{n:'灰燼大祭司',lv:46,hp:1700,atk:138,def:30,exp:1020,g:[74,136],spd:.55,aggro:1,ranged:4},
  sage:{n:'墮月賢者 歐瑞恩',lv:50,hp:64000,atk:150,def:46,exp:42000,g:[8000,12000],spd:.6,aggro:1,boss:1}
};

export const MAPDEF = {
  village:{name:'晨霧村',W:30,H:22,dark:0,seed:3,safe:1},
  forest:{name:'哭泣森林',tip:'建議 Lv.1～10',W:44,H:34,dark:.1,base:'g',trail:'d',seed:11,mobs:['slime','mush','boar','goblin','wolf'],boss:'treant',tier:1,prev:'village',next:'waste'},
  waste:{name:'骸骨荒原',tip:'建議 Lv.10～18',W:44,H:34,dark:0,base:'s',trail:'k',seed:22,mobs:['skel','scorp','mummy','ghoul','worm'],boss:'colossus',tier:2,prev:'forest',next:'cave'},
  cave:{name:'熔岩洞窟',tip:'建議 Lv.18～28',W:40,H:32,dark:.55,base:'f',trail:'F',seed:33,mobs:['bat','hound','golem','cultist','dknight'],boss:'firelord',tier:3,prev:'waste',next:'snow'},
  snow:{name:'霜狼雪原',tip:'建議 Lv.28～38',W:46,H:36,dark:0,base:'n',trail:'N',pool:'i',seed:44,mobs:['frostwolf','barbarian','yeti','icewraith','frostgiant'],boss:'frostwitch',tier:4,prev:'cave',next:'tower'},
  tower:{name:'月之塔遺跡',tip:'建議 Lv.38～50',W:44,H:36,dark:.22,base:'m',trail:'M',pool:'v',seed:55,mobs:['gargoyle','moonknight','specter','arcgolem','ashpriest'],boss:'sage',tier:5,prev:'snow',next:null}
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
  if(t==='crystal'||t==='icrys')m.lights.push({x:x+.5,y:y+.5,r:3.2,h:18,c:'90,210,255'});
  if(t==='mcrys')m.lights.push({x:x+.5,y:y+.5,r:3.4,h:18,c:'200,170,255'});
  if(t==='house')m.lights.push({x:x+w/2,y:y+h+.15,r:2.2,h:24,c:'255,190,100',night:1});
  return o; }
function buildVillage(){ const m=newMap('village'),W=m.W,H=m.H,R=rng(3),ri=(a,b)=>a+Math.floor(R()*(b-a+1));
  const G=(x,y,c)=>{m.g[y*W+x]=c;};
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){ if(x<2||y<2||x>=W-2||y>=H-2){ if(y<H-2||x<2||x>=W-2)put(m,'tree',x,y,ri(0,2)); } }
  for(let x=3;x<=26;x++)G(x,8,'c'); for(let y=8;y<=H-1;y++){G(14,y,'c');G(15,y,'c');} 
  for(let y=9;y<=12;y++)for(let x=12;x<=17;x++)G(x,y,'c');
  for(const [a,b] of [[4,6],[5,6],[4,7],[5,7],[23,6],[24,6],[23,7],[24,7],[5,16],[6,16],[22,16],[23,16]])G(a,b,'c');
  for(let x=5;x<=23;x++)G(x,17,'c');
  for(let y=9;y<=11;y++)for(let x=2;x<=10;x++)if(((x-6)/3.8)**2+((y-9.8)/1.25)**2<1){G(x,y,'w');m.blk[y*W+x]=1;}
  put(m,'house',3,3,0);put(m,'house',22,3,1);put(m,'house',4,13,2);put(m,'house',21,13,3);
  put(m,'fountain',14,10);
  for(const [a,b] of [[11,7],[18,7],[11,15],[18,15]])put(m,'lamp',a,b);
  put(m,'barrel',7,4);put(m,'barrel',7,5);put(m,'crate',21,4);put(m,'crate',21,5);put(m,'barrel',25,15);
  for(const [a,b,v] of [[10,3,0],[18,2,2],[26,11,1],[9,15,0],[26,19,2],[3,19,1],[19,11,2],[9,19,1],[21,19,0]])put(m,'tree',a,b,v);
  const npc=(k,x,y,name,act)=>{m.npcs.push({k,x,y,name,act});m.blk[y*W+x]=1;};
  npc('smith',6,6,'鐵匠 巴爾克','smith');npc('merchant',22,6,'雜貨商 莉娜','shop');npc('guard',13,18,'守衛 艾德','guard');npc('tele',17,17,'傳送師 露娜','tele');npc('sylvie',9,12,'精靈遊俠 希爾薇','mentor:sylvie');npc('norn',20,10,'老學者 諾恩','mentor:norn');npc('vera',25,17,'黑暗妖精 薇拉','mentor:vera');npc('guild',10,18,'公會接待 米亞','guild');
  // town wall along the south edge with a gatehouse over the road (x 14-15)
  m.wall={y:H-1,x0:2,x1:W-3,g0:13,g1:16};
  for(let x=2;x<=W-3;x++) if(x<14||x>15) m.blk[(H-1)*W+x]=1;
  m.portals.push({x:14,y:H-1,to:'forest',label:'往哭泣森林',gate:1},{x:15,y:H-1,to:'forest',label:'',gate:1});
  m.heal={x:14,y:10,w:2,h:2}; m.spawn={x:15,y:14};
  return finish(m); }
const BORDER={forest:'dtree',waste:'srock',cave:'wall',snow:'spine',tower:'pillar'};
function buildWild(id){ const m=newMap(id),d=m.def,W=m.W,H=m.H,R=rng(d.seed),idx=(x,y)=>y*W+x;
  const ri=(a,b)=>a+Math.floor(R()*(b-a+1)), rnd=(a,b)=>a+R()*(b-a);
  const prot=new Uint8Array(W*H); const mark=(cx,cy,r)=>{for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++)if(x>1&&y>1&&x<W-2&&y<H-2)prot[idx(x,y)]=1;};
  const entry={x:3,y:3},exit={x:4,y:H-5},boss={x:W-7,y:H-7};
  const carve=(a,b)=>{let x=a.x,y=a.y,g=0;while((x!==b.x||y!==b.y)&&g++<4000){if(R()<.62){if(R()<.5&&x!==b.x)x+=Math.sign(b.x-x);else if(y!==b.y)y+=Math.sign(b.y-y);else x+=Math.sign(b.x-x);}else{if(R()<.5)x+=R()<.5?-1:1;else y+=R()<.5?-1:1;}
    x=Math.max(2,Math.min(W-3,x));y=Math.max(2,Math.min(H-3,y));for(const [dx,dy] of [[0,0],[1,0],[0,1]]){const k=idx(Math.min(W-3,x+dx),Math.min(H-3,y+dy));prot[k]=1;m.g[k]=d.trail;}}};
  carve(entry,exit);carve(entry,boss);carve(exit,boss);for(let i=0;i<4;i++)carve(entry,{x:ri(6,W-6),y:ri(6,H-6)});
  mark(entry.x,entry.y,2);mark(exit.x,exit.y,2);mark(boss.x,boss.y,4);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(R()<(id==='forest'?.05:id==='snow'?.08:id==='tower'?.03:.14)&&!prot[idx(x,y)])m.g[idx(x,y)]=d.trail;}
  const pool=(ch,n,rmax)=>{for(let i=0;i<n;i++){const cx=ri(5,W-6),cy=ri(5,H-6),rx=rnd(1.5,rmax),ry=rnd(1.2,rmax*.8);for(let y=cy-4;y<=cy+4;y++)for(let x=cx-4;x<=cx+4;x++){if(x<2||y<2||x>=W-2||y>=H-2)continue;const k=idx(x,y);if(prot[k]||m.blk[k])continue;if(((x-cx)/rx)**2+((y-cy)/ry)**2<1){m.g[k]=ch;m.blk[k]=1;}}}};
  if(id==='forest')pool('w',4,3); if(id==='cave')pool('l',7,3); if(d.pool)pool(d.pool,id==='tower'?6:5,3);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=idx(x,y);if(m.blk[k])continue;
    if(x<2||y<2||x>=W-2||y>=H-2){put(m,BORDER[id],x,y,ri(0,2));continue;}
    if(prot[k])continue;const r=R();
    if(id==='forest'){if(r<.25)put(m,'dtree',x,y,ri(0,2));}
    else if(id==='waste'){if(r<.06)put(m,'dead',x,y,0);else if(r<.13)put(m,'srock',x,y,ri(0,1));}
    else if(id==='snow'){if(r<.11)put(m,'spine',x,y,ri(0,2));else if(r<.16)put(m,'irock',x,y,0);else if(r<.175)put(m,'icrys',x,y,0);}
    else if(id==='tower'){if(r<.05)put(m,'pillar',x,y,ri(0,2));else if(r<.09)put(m,'rubble',x,y,0);else if(r<.1)put(m,'mcrys',x,y,0);}
    else{if(r<.09)put(m,'stal',x,y,0);else if(r<.12)put(m,'wall',x,y,ri(0,2));else if(r<.135)put(m,'crystal',x,y,0);}}
  const seen=new Uint8Array(W*H),q=[idx(entry.x,entry.y)];seen[q[0]]=1;
  while(q.length){const c=q.pop(),cx=c%W,cy=c/W|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=idx(cx+dx,cy+dy);if(!seen[k]&&!m.blk[k]){seen[k]=1;q.push(k);}}}
  for(let k=0;k<W*H;k++){if(!m.blk[k]&&!seen[k])put(m,BORDER[id],k%W,k/W|0,0);}
  if(id==='forest'){ // the village's south wall and gatehouse, seen from outside
    const wy=1,x0=1,x1=14,inZone=(x,y)=>x>=0&&x<=x1+1&&y>=0&&y<=5;
    m.objs=m.objs.filter(o=>{ let hit=false; for(let j=0;j<o.h;j++)for(let i=0;i<o.w;i++)if(inZone(o.x+i,o.y+j))hit=true; if(hit)for(let j=0;j<o.h;j++)for(let i=0;i<o.w;i++)m.blk[idx(o.x+i,o.y+j)]=0; return !hit; });
    for(let y=0;y<=5;y++)for(let x=0;x<=x1+1;x++){ const k=idx(x,y); if(m.g[k]==='w'){m.g[k]=d.base||'g';} m.blk[k]=0; }
    for(let x=0;x<=x1+1;x++){ m.blk[idx(x,0)]=1; if(x<3||x>4) m.blk[idx(x,wy)]=1; }
    for(let y=wy;y<=5;y++){ m.g[idx(3,y)]=d.trail; m.g[idx(4,y)]=d.trail; }
    m.wall={y:wy,x0,x1,g0:2,g1:5};
    m.portals.push({x:3,y:wy,to:d.prev,label:'往'+MAPDEF[d.prev].name,gate:1},{x:4,y:wy,to:d.prev,label:'',gate:1});
  } else
  m.portals.push({x:entry.x,y:entry.y,to:d.prev,label:'往'+MAPDEF[d.prev].name});
  if(d.next)m.portals.push({x:exit.x,y:exit.y,to:d.next,label:'往'+MAPDEF[d.next].name});
  m.entry=entry;m.exit=exit;m.boss=boss;m.spawn={x:4,y:4};
  for(const p of m.portals)if(!p.gate)m.lights.push({x:p.x+.5,y:p.y+.5,r:2.6,c:p.to==='cave'?'255,130,50':p.to==='tower'||id==='tower'?'190,170,255':p.to==='snow'||id==='snow'?'190,225,255':id==='cave'?'255,230,170':'200,230,160'});
  if(id==='tower')for(let k=0;k<W*H;k++)if(m.g[k]==='v'&&R()<.12)m.lights.push({x:k%W+.5,y:(k/W|0)+.5,r:2.2,c:'170,120,255'});
  if(id==='cave')for(let k=0;k<W*H;k++)if(m.g[k]==='l'&&R()<.25)m.lights.push({x:k%W+.5,y:(k/W|0)+.5,r:2.4,c:'255,120,40'});
  return finish(m); }
function finish(m){ m.open=[]; for(let k=0;k<m.W*m.H;k++)if(!m.blk[k])m.open.push(k); return m; }
export function buildMap(id){ return id.startsWith('dg_')?buildDungeon(id):id==='village'?buildVillage():buildWild(id); }
// ---------- dungeons (公會試煉): 3 floors of rooms + a boss arena, layout fully determined by the id ----------
export const DG_FLOORS = 4, DG_DAILY = 3, DG_LIMIT = 900, DG_MINLV = 5;
export const DGN = { forest:'哭泣森林地穴', waste:'荒原墓窟', cave:'熔岩深淵', snow:'冰晶迷宮', tower:'月之塔書庫' };
export const dgTheme = lv=>lv<12?'forest':lv<20?'waste':lv<28?'cave':lv<38?'snow':'tower';
export const dgId = (theme,floor,seed)=>`dg_${theme}_${floor}_${seed}`;
function buildDungeon(id){ const [,theme,fl,sd]=id.split('_'), floor=+fl, seed=+sd, T=MAPDEF[theme], last=floor>=DG_FLOORS;
  const W=last?24:32, H=last?22:26, R=rng(seed*7+floor), idx=(x,y)=>y*W+x;
  const name=`${DGN[theme]}・${last?'最深處':'第 '+floor+' 層'}`;
  const m={ id:theme, dgId:id, dg:{theme,floor,last}, name, tip:last?'打倒守護者！':'消滅所有怪物，打開通往下一層的門', W, H, dark:Math.max(.2,T.dark),
    def:Object.assign({},T,{seed:seed%100000+floor,name,prev:null,next:null}), g:new Array(W*H).fill(T.base), blk:new Uint8Array(W*H).fill(1), objs:[], npcs:[], portals:[], lights:[] };
  const open=(x,y,ch)=>{ if(x<2||y<2||x>=W-2||y>=H-2) return; m.blk[idx(x,y)]=0; if(ch) m.g[idx(x,y)]=ch; };
  const blob=(cx,cy,rx,ry,ch)=>{ for(let y=cy-ry;y<=cy+ry;y++) for(let x=cx-rx;x<=cx+rx;x++) if(((x-cx)/(rx+.5))**2+((y-cy)/(ry+.5))**2<=1) open(x,y,ch); };
  const hall=(a,b)=>{ let x=a.x,y=a.y; const hz=R()<.5; const step=(nx,ny)=>{ x=nx; y=ny; for(const [dx,dy] of [[0,0],[1,0],[0,1],[1,1]]) open(x+dx,y+dy,T.trail); };
    if(hz){ while(x!==b.x) step(x+Math.sign(b.x-x),y); while(y!==b.y) step(x,y+Math.sign(b.y-y)); } else { while(y!==b.y) step(x,y+Math.sign(b.y-y)); while(x!==b.x) step(x+Math.sign(b.x-x),y); } };
  const rooms=[];
  if(last){ const c={x:12,y:11}; blob(c.x,c.y,8,7); rooms.push(c); m.entry={x:5,y:15}; m.boss={x:c.x+1,y:c.y-1}; m.exit={x:6,y:16}; open(5,15); open(6,16);
    m.portals.push({x:m.exit.x,y:m.exit.y,to:'village',label:'回到晨霧村',lock:1}); }
  else { const n=5; for(let i=0;i<n;i++){ const f=i/(n-1); rooms.push({x:Math.round(5+f*(W-11)+(R()-.5)*3), y:Math.round(i%2?H-8+(R()-.5)*2:7+(R()-.5)*2)}); }
    rooms.forEach((c,i)=>blob(c.x,c.y,3+Math.floor(R()*2),3+Math.floor(R()*2),i===0||i===n-1?T.trail:null)); for(let i=1;i<n;i++) hall(rooms[i-1],rooms[i]);
    m.entry={x:rooms[0].x,y:rooms[0].y}; m.exit={x:rooms[n-1].x,y:rooms[n-1].y}; m.boss=m.exit;
    m.portals.push({x:m.exit.x,y:m.exit.y,to:'next',label:floor===DG_FLOORS-1?'通往最深處':'通往下一層',lock:1}); }
  m.rooms=rooms; m.spawn={x:m.entry.x,y:m.entry.y};
  // walls: an object on every blocked tile next to the open area; deeper rock stays bare
  const NR=theme==='cave'||theme==='waste'?2:1; const near=(x,y)=>{ for(let dy=-NR;dy<=NR;dy++) for(let dx=-NR;dx<=NR;dx++){ const X=x+dx,Y=y+dy; if(X>=0&&Y>=0&&X<W&&Y<H&&!m.blk[idx(X,Y)]) return true; } return false; };
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(m.blk[idx(x,y)]&&near(x,y)){ const o={t:theme==='tower'?(R()<.3?'pillar':'rubble'):theme==='snow'&&R()<.35?'irock':BORDER[theme],x,y,w:1,h:1,v:Math.floor(R()*3)}; m.objs.push(o); }
  m.lights.push({x:m.entry.x+.5,y:m.entry.y+.5,r:3,c:'255,220,160'},{x:m.exit.x+.5,y:m.exit.y+.5,r:2.6,c:'190,140,255'});
  return finish(m); }
// where you appear when arriving through a portal from map `from`
export function arrivalPoint(m,from){
  if(m.id==='village')return{x:15,y:19};
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
  if(c.adv&&ADV[c.adv]) for(const [k,v] of Object.entries(ADV[c.adv].bon)) G[k]=(G[k]||0)+v;
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
export const sellP = it=>Math.round(([25,120,450,1300,3200,7000][it.t|0]||25)*(it.s==='w'?1.2:it.s==='a'?1:it.s==='r'||it.s==='n'?1.4:.7)*(1+(it.q|0)*.8)+(it.en|0)*(it.en|0)*40);
export const shopPrice = (sl,t)=>Math.round([0,600,2400,7000,16000][t]*(sl==='w'?1:sl==='a'?.8:.45));
export const SHOP_GEAR = [['w',1],['a',1],['h',1],['g',1],['b',1],['c',1],['s',1],['w',2],['a',2]];
export function itemBaseName(it,cls){ if(!it)return'（無）'; if(it.leg)return it.s==='w'?(LEGEND_W[cls]||LEGEND_W.knight):it.leg; if(it.s==='w')return(WN[cls]||WN.knight)[it.t]; if(it.s==='r')return(RINGS[it.t]||RINGS[0]).n; return ARM[it.s]?ARM[it.s].n[it.t]:'?'; }
export function itemName(it,cls){ if(!it)return'（無）'; return(it.en?'+'+it.en+' ':'')+itemBaseName(it,cls); }
export function itemStat(it){ const b=itemBase(it),out=[]; for(const k of ['atk','def','hp','mp','str','dex','con','int','wis'])if(b[k])out.push(BONK[k]+' +'+b[k]); return out.join('、')||'無屬性'; }
// rough gear score for "equip better gear": weights the class's main stats
const MAINST={knight:['str','con'],ranger:['dex'],mage:['int','wis'],darkelf:['str','dex']};
export function itemScore(it,cls){ if(!it) return 0; const b=itemBase(it),M=MAINST[cls]||[]; let v=(b.atk||0)*3+(b.def||0)*3+(b.hp||0)*.1+(b.mp||0)*.06;
  for(const k of ['str','dex','con','int','wis']) v+=(b[k]||0)*(M.includes(k)?2.2:.8); return v; }
export function eqSlotFor(eq,it){ if(it.s==='r')return!eq.r1?'r1':!eq.r2?'r2':'r1'; return it.s; }
export function makeItem(s,t,R=Math.random){ const ri=(a,b)=>a+Math.floor(R()*(b-a+1)),pick=a=>a[Math.floor(R()*a.length)];
  t=Math.max(0,Math.min(5,t)); const it={s,t,en:0}; if(s==='r')it.t=ri(0,3);
  const r=R(),q=r<.04?2:r<.26?1:0;
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
  if(kind==='n') return {s:'n',t:5,en:0,q:3,leg:'新月項鍊',bon:{hp:120,str:3,dex:3,con:3,int:3,wis:3}};
  return {s:'w',t:5,en:0,q:3,leg:'w',bon:{atk:14,str:4,dex:4,con:2,int:4}};
}

// ---------- main quests (follow the story 新月之誓) ----------
export const QUESTS = [
  {n:'序章：月碎之夜', d:'找村南的守衛艾德說話', type:'talk', r:{exp:20,gold:100,pot:5},
   story:'酒館裡的老故事說，很久以前天上有兩顆月亮。最近哭泣森林在夜裡傳出哭聲，守衛艾德想找冒險者幫忙。'},
  {n:'第一章：晨霧村的旅人', d:'到哭泣森林打倒 10 隻苔蘚史萊姆。', type:'kill', k:['slime'], need:10, r:{exp:80,gold:200,ret:2},
   story:'艾德：「史萊姆的黏液裡有月痕碎屑，有人在森林裡餵牠們。去看看。」'},
  {n:'第一章：鐵匠的兵器', d:'回村找鐵匠巴爾克，衝一次裝備。', type:'enchant', need:1, r:{ws:1,as:1,gold:200},
   story:'艾德：「碎屑我收下了。去找巴爾克，你的兵器撐不了多久。」'},
  {n:'第二章：哭泣森林', d:'掃蕩森林裡的哥布林：打倒 15 隻。', type:'kill', k:['goblin'], need:15, r:{exp:300,gold:500,big:3},
   story:'哥布林營地裡堆著一箱箱用灰布包好的月痕。有人拿食物跟牠們交換。'},
  {n:'第二章：老根的哭聲', d:'打倒森林深處的腐木樹妖。', type:'kill', k:['treant'], need:1, r:{exp:800,gold:1500,ws:2},
   story:'精靈遊俠希爾薇：「精靈守護千年的古樹被人埋進了月痕。從那天起，它每晚都在哭。」'},
  {n:'第三章：骸骨荒原', d:'到骸骨荒原打倒 20 隻骷髏兵或木乃伊。', type:'kill', k:['skel','mummy'], need:20, r:{exp:1500,gold:1500},
   story:'樹妖的碎片上刻著羊頭骷髏，那是灰燼教團的記號。車轍印一路往南，通往一片沒有草的沙地。'},
  {n:'第三章：銀誓', d:'打倒荒原中央的白骨巨像。', type:'kill', k:['colossus'], need:1, r:{exp:4000,gold:4000,as:2},
   story:'老學者諾恩：「教團在餵封印下的那個人。他叫卡爾薩，三百年前銀月騎士團的團長。」'},
  {n:'第四章：地底的影子', d:'打倒 10 隻沙漠巨蟲，救出受傷的黑暗妖精。', type:'kill', k:['worm'], need:10, r:{exp:3000,gold:3000,big:5},
   story:'艾德的右手被巨像壓碎，再也握不了劍。他把劍交給你：「它叫銀誓。它不會讓你變強，只會提醒你為什麼要握劍。」'},
  {n:'第五章：熔岩洞窟', d:'擊退灰燼教團：打倒 15 隻魔族祭司。', type:'kill', k:['cultist'], need:15, r:{exp:6000,gold:5000},
   story:'黑暗妖精薇拉：「我們三年前就警告過你們。下一個滿月，封印就擋不住了。」'},
  {n:'第六章：月心', d:'打倒熾焰領主卡爾薩。', type:'kill', k:['firelord'], need:1, r:{exp:15000,gold:10000,ws:3,as:3},
   story:'卡爾薩：「我也握過那把劍。有了月心，你的劍永遠不會斷。拿去吧。」'},
  {n:'終章：新月之下', d:'回村向守衛艾德報告', type:'talk', r:{gold:5000},
   story:'夜空出現了一道細細的銀色彎月。北方雪山的天際，卻翻出了一絲紅光……'},
  {n:'第七章：穿過冰縫', d:'穿過熔岩洞窟深處的冰縫，在霜狼雪原打倒 20 隻霜牙狼。', type:'kill', k:['frostwolf'], need:20, r:{exp:20000,gold:8000,big:5},
   story:'艾德：「那道紅光不是晚霞。熔岩洞窟最深處裂開了一道冰縫，冷風裡帶著血的味道。去北方看看。」'},
  {n:'第七章：被收買的部族', d:'打倒 20 隻雪原蠻族獵手或雪原雪怪。', type:'kill', k:['barbarian','yeti'], need:20, r:{exp:26000,gold:9000,ws:1},
   story:'希爾薇：「雪原的蠻族本來是精靈的盟友。現在他們脖子上掛著羊頭骷髏……教團連他們也收買了。」'},
  {n:'第七章：冰宮的魔女', d:'打倒冰宮裡的霜之魔女莉瑟拉。', type:'kill', k:['frostwitch'], need:1, r:{exp:50000,gold:20000,ws:3,as:3},
   story:'薇拉：「蠻族說，冰宮裡住著一個從月之塔逃出來的魔女。她用冰封住了通往塔的路。」'},
  {n:'第八章：月之塔', d:'在月之塔遺跡打倒 20 隻墮落月騎士或石像鬼。', type:'kill', k:['moonknight','gargoyle'], need:20, r:{exp:70000,gold:20000,big:8},
   story:'莉瑟拉倒下前低聲說：「我不是在封路……我是在把他關在裡面。歐瑞恩老師他……已經不是人了。」'},
  {n:'第八章：書庫的低語', d:'打倒 15 隻書庫怨靈或灰燼大祭司。', type:'kill', k:['specter','ashpriest'], need:15, r:{exp:90000,gold:25000,as:2},
   story:'諾恩：「歐瑞恩是我的老師，月之塔最後一任賢者。月碎之夜那天，他就站在塔頂。」'},
  {n:'第八章：墮月賢者', d:'登上觀星台，打倒墮月賢者歐瑞恩。', type:'kill', k:['sage'], need:1, r:{exp:200000,gold:50000,ws:5,as:5},
   story:'諾恩：「紅月升起的時候，兩顆月亮會再一次……不，你先上塔頂。把老師帶回來，或者讓他安息。」'},
  {n:'終章：血月之下', d:'回村向守衛艾德報告', type:'talk', r:{gold:20000},
   story:'歐瑞恩：「我只是……想讓月亮回來。」塔頂的紅光散去了，可是北方的夜空裡，第二顆月亮的影子越來越清楚……（第三部敬請期待）'}
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

// ---------- class advancement (Lv.30) ----------
export const ADV_LV = 30, ADV_COST = 10000;
export const ADV = {
  paladin:{base:'knight',n:'聖騎士',d:'以聖光守護隊友的騎士。體質、HP、防禦提升。',bon:{con:6,hp:200,def:10},sk:[
    {id:'p1',n:'聖光審判',lv:30,mp:20,cd:6,tgt:1,ai:'tgt',d:'3 倍神聖傷害，並回復自己 8% HP'},
    {id:'p2',n:'神聖護盾',lv:40,mp:35,cd:25,ai:'buff',d:'自己和附近隊友 6 秒受傷減半，並回復 HP'}]},
  berserker:{base:'knight',n:'狂戰士',d:'越戰越狂的戰鬼。力量與攻擊力提升。',bon:{str:6,atk:12},sk:[
    {id:'b1',n:'狂暴',lv:30,mp:15,cd:20,ai:'buff',d:'10 秒內攻擊力 +40%'},
    {id:'b2',n:'裂地斬',lv:40,mp:28,cd:8,ai:'aoe',d:'重擊地面，周圍敵人 2.4 倍傷害並暈眩'}]},
  sharpshooter:{base:'ranger',n:'神射手',d:'一箭定生死的狙擊手。敏捷與攻擊力提升。',bon:{dex:6,atk:10},sk:[
    {id:'s1',n:'爆裂箭',lv:30,mp:18,cd:5,tgt:1,ai:'tgt',d:'2.4 倍傷害，並炸傷周圍敵人'},
    {id:'s2',n:'箭雨',lv:40,mp:30,cd:9,tgt:1,ai:'aoe',d:'目標周圍降下箭雨，範圍 1.9 倍傷害'}]},
  windwalker:{base:'ranger',n:'風行者',d:'與風同行的遊俠。敏捷、體質、HP 提升。',bon:{dex:4,con:3,hp:80},sk:[
    {id:'w1',n:'旋風箭',lv:30,mp:18,cd:5,tgt:1,ai:'tgt',d:'連射五箭'},
    {id:'w2',n:'風之守護',lv:40,mp:30,cd:25,ai:'buff',d:'自己和隊友 10 秒攻速 +60%、閃避 +15%'}]},
  archmage:{base:'mage',n:'大魔導士',d:'掌握天災的法師。智力與攻擊力提升。',bon:{int:6,atk:12},sk:[
    {id:'a1',n:'隕石術',lv:30,mp:30,cd:7,tgt:1,ai:'tgt',d:'召喚隕石，目標周圍 3 倍傷害'},
    {id:'a2',n:'雷霆風暴',lv:40,mp:40,cd:10,ai:'aoe',d:'周圍大範圍 2.2 倍傷害並暈眩'}]},
  priestess:{base:'mage',n:'月之祭司',d:'侍奉新月的治癒者。精神、MP、HP 提升。',bon:{wis:6,mp:150,hp:100},sk:[
    {id:'q1',n:'月光祝福',lv:30,mp:30,cd:12,ai:'heal',d:'大量回復自己和隊友，並 6 秒受傷減半'},
    {id:'q2',n:'審判之光',lv:40,mp:28,cd:6,tgt:1,ai:'tgt',d:'聖光貫穿目標，3.5 倍傷害'}]},
  shadowdancer:{base:'darkelf',n:'影舞者',d:'在影子間起舞的刺客。敏捷與 HP 提升。',bon:{dex:6,hp:60},sk:[
    {id:'h1',n:'影分身',lv:30,mp:18,cd:18,ai:'buff',d:'10 秒閃避 +40%，下一擊必爆擊'},
    {id:'h2',n:'千刃',lv:40,mp:30,cd:8,ai:'aoe',d:'刀刃亂舞，周圍敵人受到 6 次攻擊'}]},
  assassin:{base:'darkelf',n:'暗殺者',d:'專取要害的殺手。力量與攻擊力提升。',bon:{str:6,atk:12},sk:[
    {id:'x1',n:'致命一擊',lv:30,mp:20,cd:7,tgt:1,ai:'tgt',d:'必定爆擊的 4 倍傷害'},
    {id:'x2',n:'劇毒爆發',lv:40,mp:28,cd:9,tgt:1,ai:'tgt',d:'重擊並施加劇毒 8 秒'}]}
};
export const ADV_KEYS = Object.keys(ADV);
export function skillsOf(c){ return (SKILLS[c.cls]||[]).concat(c.adv&&ADV[c.adv]?ADV[c.adv].sk:[]); }
// ---------- teleporter ----------
export const TELE = [
  {k:'forest',n:'哭泣森林・入口',map:'forest',p:100,lv:'1～10'},
  {k:'waste',n:'骸骨荒原・入口',map:'waste',p:400,lv:'10～18'},
  {k:'cave',n:'熔岩洞窟・入口',map:'cave',p:1200,lv:'18 以上'},
  {k:'treant',n:'腐木樹妖的巢穴',map:'forest',boss:1,p:600,lv:'Boss Lv.12'},
  {k:'colossus',n:'白骨巨像的祭壇',map:'waste',boss:1,p:2000,lv:'Boss Lv.20'},
  {k:'firelord',n:'卡爾薩的熔岩王座',map:'cave',boss:1,p:5000,lv:'Boss Lv.28'},
  {k:'snow',n:'霜狼雪原・入口',map:'snow',p:3000,lv:'28～38'},
  {k:'tower',n:'月之塔遺跡・入口',map:'tower',p:6000,lv:'38～50'},
  {k:'frostwitch',n:'霜之魔女的冰宮',map:'snow',boss:1,p:12000,lv:'Boss Lv.38'},
  {k:'sage',n:'墮月賢者的觀星台',map:'tower',boss:1,p:20000,lv:'Boss Lv.50'}
];

// ---------- class advancement quest: each class has a mentor ----------
export const MENTOR = {
  knight:{npc:'guard',who:'守衛 艾德',token:'騎士團殘章',mobs:['skel','dknight'],
    talk:'「我曾經是銀月騎士團的見習生。要接下這把劍的重量，先去荒原把騎士團散落的殘章找回來。」'},
  ranger:{npc:'sylvie',who:'精靈遊俠 希爾薇',token:'毒蠍尾刺',mobs:['scorp','hound'],
    talk:'「精靈的弓不是用來炫耀的。帶十根沙蠍或地獄犬的毒刺回來，我教你真正的射法。」'},
  mage:{npc:'norn',who:'老學者 諾恩',token:'月痕殘頁',mobs:['mummy','cultist'],
    talk:'「月之塔的藏書都被教團搶走了。從木乃伊和魔族祭司身上把殘頁找回來，我就把剩下的咒文傳給你。」'},
  darkelf:{npc:'vera',who:'黑暗妖精 薇拉',token:'影之結晶',mobs:['ghoul','bat'],
    talk:'「影子會記住每一個獵物。去食屍鬼和火焰蝙蝠身上取十顆影之結晶，證明你配得上我們的名字。」'}
};
export const ADVQ_NEED = 10, ADVQ_RATE = .3;
// ---------- adventurers' guild bounties ----------
export const BOUNTY_DAY_MAX = 20;
export function makeBounty(lv,R=Math.random){ const maps=lv<12?['forest']:lv<20?['forest','waste']:lv<26?['waste','cave']:lv<31?['cave','snow']:lv<38?['snow']:lv<42?['snow','tower']:['tower'];
  const map=maps[Math.floor(R()*maps.length)], d=MAPDEF[map];
  if(R()<.15&&lv>=10) return {map,k:d.boss,need:1,p:0,boss:1};
  const pool=d.mobs.filter(k=>MT[k].lv<=lv+3); const k=(pool.length?pool:d.mobs)[Math.floor(R()*(pool.length||d.mobs.length))];
  return {map,k,need:10+Math.floor(R()*4)*5,p:0}; }
// ---------- achievements & titles ----------
export const ACH = [
  {id:'lv10',t:'初出茅廬',d:'達到 Lv.10',k:'lv',v:10,g:1000},
  {id:'lv30',t:'身經百戰',d:'達到 Lv.30',k:'lv',v:30,g:10000},
  {id:'lv50',t:'銀月傳奇',d:'達到 Lv.50',k:'lv',v:50,g:50000},
  {id:'k500',t:'獵人',d:'累計打倒 500 隻怪物',k:'kills',v:500,g:3000},
  {id:'k3000',t:'屠戮者',d:'累計打倒 3,000 隻怪物',k:'kills',v:3000,g:20000},
  {id:'slime',t:'史萊姆剋星',d:'打倒 200 隻苔蘚史萊姆',k:'mk:slime',v:200,g:1500},
  {id:'goblin',t:'哥布林獵手',d:'打倒 300 隻哥布林',k:'mk:goblin',v:300,g:3000},
  {id:'skel',t:'送葬人',d:'打倒 300 隻迷途骷髏兵',k:'mk:skel',v:300,g:5000},
  {id:'treant',t:'伐木者',d:'打倒腐木樹妖 10 次',k:'bk:treant',v:10,g:5000},
  {id:'colossus',t:'碎骨者',d:'打倒白骨巨像 10 次',k:'bk:colossus',v:10,g:10000},
  {id:'firelord',t:'滅火者',d:'打倒熾焰領主卡爾薩 10 次',k:'bk:firelord',v:10,g:20000},
  {id:'frostwitch',t:'破冰者',d:'打倒霜之魔女莉瑟拉 5 次',k:'bk:frostwitch',v:5,g:30000},
  {id:'sage',t:'月之繼承者',d:'打倒墮月賢者歐瑞恩',k:'bk:sage',v:1,g:50000},
  {id:'snowk',t:'雪原獵人',d:'打倒 300 隻霜牙狼',k:'mk:frostwolf',v:300,g:15000},
  {id:'mq',t:'新月之誓',d:'完成主線「新月之誓」',k:'mq',v:11,g:10000},
  {id:'mq2',t:'血月之預言',d:'完成第二部主線「血月之預言」',k:'mq',v:18,g:50000},
  {id:'adv',t:'覺醒者',d:'完成轉職',k:'adv',v:1,g:5000},
  {id:'en7',t:'鍛造師',d:'把裝備衝到 +7',k:'maxEn',v:7,g:5000},
  {id:'en9',t:'月痕之主',d:'把裝備衝到 +9',k:'maxEn',v:9,g:30000},
  {id:'leg',t:'傳說持有者',d:'撿到一件傳說裝備',k:'legGot',v:1,g:5000},
  {id:'inv',t:'守村英雄',d:'守住晨霧村 3 次',k:'invWon',v:3,g:8000},
  {id:'wb',t:'焚月者',d:'擊倒世界 Boss 卡爾薩殘火',k:'wbKills',v:1,g:20000},
  {id:'b20',t:'公會之星',d:'完成 20 張公會委託',k:'bountyDone',v:20,g:8000},
  {id:'dg1',t:'試煉新人',d:'第一次通關公會試煉',k:'dgClears',v:1,g:2000},
  {id:'dg30',t:'地城常客',d:'通關公會試煉 30 次',k:'dgClears',v:30,g:20000},
  {id:'dgfast',t:'速攻者',d:'5 分鐘內通關公會試煉',k:'dgFast',v:1,g:10000},
  {id:'rich',t:'富商',d:'身上同時有 100 萬金幣',k:'gold',v:1000000,g:0}
];
export function achValue(c,k){ if(k==='lv') return c.lv; if(k==='kills') return c.kills|0; if(k==='mq') return c.mq|0; if(k==='adv') return c.adv?1:0; if(k==='gold') return c.gold|0;
  if(k.startsWith('mk:')) return (c.mk&&c.mk[k.slice(3)])|0; if(k.startsWith('bk:')) return (c.bk&&c.bk[k.slice(3)])|0; return c[k]|0; }
