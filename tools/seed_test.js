// Create a test account with one top-geared Lv.50 character per class.
// usage: node tools/seed_test.js [username] [password]   (run while the server is stopped)
import crypto from 'node:crypto';
import { openStore } from '../server/db.js';
import { newCharacter, makeLegend, NOSHIELD, calcStats } from '../shared/data.js';
const [u='tester',pw='test1234']=process.argv.slice(2);
const store=await openStore();
if(await store.getAccount(u)){ console.log('account exists:',u); await store.close(); process.exit(); }
const salt=crypto.randomBytes(16).toString('hex'), hash=crypto.scryptSync(pw,salt,32).toString('hex');
const acc=await store.createAccount(u,salt,hash);
const MAIN={knight:{str:6,con:6,hp:120,def:4},ranger:{dex:8,con:3,hp:80,atk:6},mage:{int:8,wis:4,mp:80,hp:60},darkelf:{str:5,dex:5,hp:80,atk:6}};
const names={knight:'頂裝騎士',ranger:'頂裝遊俠',mage:'頂裝法師',darkelf:'頂裝妖精'};
const pts={knight:['str','con'],ranger:['dex'],mage:['int','wis'],darkelf:['str','dex']};
for(const cls of ['knight','ranger','mage','darkelf']){
  const c=newCharacter(cls,'m',names[cls]); c.lv=50; c.exp=0; c.gold=1000000; c.mq=1;
  const ks=pts[cls]; for(let i=0;i<49;i++) c.sp[ks[i%ks.length]]=(c.sp[ks[i%ks.length]]||0)+1; c.pts=0;
  const gear=s=>({s,t:4,en:7,q:2,bon:{...MAIN[cls]}});
  c.eq={ w:Object.assign(makeLegend('w'),{en:9}), a:gear('a'), h:gear('h'), c:gear('c'), g:gear('g'), b:gear('b'), s:NOSHIELD[cls]?null:gear('s'),
         n:makeLegend('n'), r1:{s:'r',t:0,en:0,q:2}, r2:{s:'r',t:cls==='mage'?3:2,en:0,q:2} };
  c.bag=[makeLegend('w'),makeLegend('n'),gear('h'),gear('a')];
  c.inv={pot:200,big:100,blue:100,ret:50,ws:30,as:30};
  const st=calcStats(c); c.hp=st.maxHP; c.mp=st.maxMP;
  await store.createChar(acc.id,c); console.log(cls,names[cls],'atk',st.atk,'def',st.def,'HP',st.maxHP,'MP',st.maxMP);
}
await store.close(); console.log('account',u,'/',pw);
