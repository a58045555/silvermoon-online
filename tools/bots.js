// Headless bot players: register, create characters, walk into the forest, party up, fight, trade, chat.
// Usage: node tools/bots.js [url] [count] [seconds]
import WebSocket from 'ws';
import { buildMap, MAPDEF } from '../shared/data.js';

const URL = process.argv[2] || 'ws://localhost:3000/ws';
const N = +(process.argv[3] || 4), SECS = +(process.argv[4] || 40);
const CLASSES = ['knight','ranger','mage','darkelf'];
const maps = Object.fromEntries(Object.keys(MAPDEF).map(id=>[id,buildMap(id)]));
const stats = { kills:0, deaths:0, levels:0, chats:0, errors:[], trades:0, parties:0, maxPlayersSeen:0 };

function bot(i){
  return new Promise(res=>{
    const ws = new WebSocket(URL); const tag=`bot${Date.now()%100000}_${i}`; const B={ws,i,me:null,map:null,mobs:[],players:[],tag};
    const send=m=>ws.readyState===1&&ws.send(JSON.stringify(m));
    ws.on('open',()=>send({t:'register',user:tag,pass:'secret123'}));
    ws.on('message',raw=>{ const m=JSON.parse(raw);
      if(m.t==='auth'){ if(!m.ok) stats.errors.push(`auth ${m.err}`); }
      if(m.t==='chars'){ if(!m.list.length) send({t:'create',cls:CLASSES[i%4],g:i%2?'f':'m',name:'測試'+tag.slice(-6)}); else send({t:'enter',cls:m.list[0].cls}); }
      if(m.t==='err') stats.errors.push(m.msg);
      if(m.t==='map'){ B.map=m.id; if(m.id==='village') setTimeout(()=>send({t:'move',x:14,y:19}),300); }
      if(m.t==='me'){ if(B.me&&m.c.lv>B.me.lv) stats.levels++; B.me=m.c; }
      if(m.t==='s'){ B.mobs=m.m; B.players=m.p; stats.maxPlayersSeen=Math.max(stats.maxPlayersSeen,m.p.length);
        for(const e of m.e){ if(e[0]==='k') stats.kills++; if(e[0]==='pd'&&e[1]===B.me?.id) stats.deaths++; } }
      if(m.t==='chat') stats.chats++;
      if(m.t==='ask'){ if(m.kind==='party'){ send({t:'paccept',from:m.from}); stats.parties++; } if(m.kind==='trade') send({t:'taccept',from:m.from}); }
      if(m.t==='trade'){ if(m.done&&!m.cancel) stats.trades++; else if(!m.done&&!m.mine.ok){ if(B.i===0&&m.mine.gold===0) send({t:'tput',gold:5}); else send({t:'tok'}); } }
    });
    // brain
    const iv=setInterval(()=>{ if(!B.me||!B.map) return;
      if(B.map==='village') return;
      if(B.me.hp<B.me.maxHP*.4&&B.me.inv.pot) send({t:'use',k:'pot'});
      const meP=B.players.find(p=>p[0]===B.me.id); if(!meP) return;
      let best=null,bd=1e9; for(const mob of B.mobs){ const d=Math.hypot(mob[2]-meP[4],mob[3]-meP[5]); if(d<bd&&!['treant','colossus','firelord'].includes(mob[1])){bd=d;best=mob;} }
      if(best&&Math.random()<.5) send({t:'attack',id:best[0]});
      if(Math.random()<.05) send({t:'skill'});
    },500);
    setTimeout(()=>send({t:'chat',ch:'all',msg:`大家好，我是 ${i} 號`}),2000+i*300);
    if(i===0) setTimeout(()=>{ for(const p of B.players.slice(0,4)) if(p[0]!==B.me?.id) send({t:'pinvite',name:p[1]}); },6000);
    if(i===0) setTimeout(()=>{ const o=B.players.find(p=>p[0]!==B.me?.id); if(o) send({t:'treq',name:o[1]}); },9000);
    setTimeout(()=>{ clearInterval(iv); res(B); },SECS*1000);
  });
}
const bots = await Promise.all(Array.from({length:N},(_,i)=>new Promise(r=>setTimeout(()=>r(bot(i)),i*150))).map(p=>p.then(x=>x)));
const all = await Promise.all(bots);
for(const B of all){ console.log(`bot${B.i}`, B.me?`${B.me.name} ${B.me.cls} Lv.${B.me.lv} exp ${B.me.exp}/${B.me.need} gold ${B.me.gold} hp ${B.me.hp}/${B.me.maxHP} map ${B.map} party ${B.me.party?B.me.party.length:0}`:'no character'); B.ws.close(); }
console.log(JSON.stringify(stats));
process.exit(0);
