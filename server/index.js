// 銀月大陸 Online — HTTP (static files) + WebSocket game server.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { openStore } from './db.js';
import { World } from './world.js';
import { CLS, newCharacter, NAME_RE } from '../shared/data.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = +process.env.PORT || 3000;
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.png':'image/png', '.css':'text/css; charset=utf-8', '.ico':'image/x-icon' };

const store = await openStore();
const world = new World(store);
await world.init();
console.log(`[silvermoon] storage=${store.kind} port=${PORT}`);

// ---------- static files ----------
const server = http.createServer((req,res)=>{
  let url = decodeURIComponent((req.url||'/').split('?')[0]);
  if(url==='/health'){ res.writeHead(200,{'content-type':'application/json'}); return res.end(JSON.stringify({ok:true,online:world.players.size})); }
  if(url==='/') url='/index.html';
  const base = url.startsWith('/shared/') ? ROOT : path.join(ROOT,'public');
  const file = path.normalize(path.join(base, url));
  if(!file.startsWith(base)) { res.writeHead(403); return res.end(); }
  fs.readFile(file,(err,data)=>{
    if(err){ res.writeHead(404); return res.end('not found'); }
    const ext = path.extname(file);
    res.writeHead(200,{ 'content-type':MIME[ext]||'application/octet-stream', 'cache-control': ext==='.png'?'public, max-age=86400':'no-cache' });
    res.end(data);
  });
});

// ---------- auth helpers ----------
const hashPw = (pw,salt)=>crypto.scryptSync(pw,salt,32).toString('hex');
const newToken = ()=>crypto.randomBytes(24).toString('hex');
const USER_RE = /^[A-Za-z0-9_]{3,16}$/;
const loginFails = new Map(); // ip -> {n, t}

// ---------- websocket ----------
const wss = new WebSocketServer({ server, path:'/ws', maxPayload: 16*1024 });
wss.on('connection',(ws,req)=>{
  const ip = (req.headers['x-forwarded-for']||req.socket.remoteAddress||'').split(',')[0].trim();
  const S = { ws, ip, accountId:null, username:null, player:null, alive:true };
  const send = m=>{ try{ if(ws.readyState===1) ws.send(JSON.stringify(m)); }catch{} };
  ws.on('pong',()=>{ S.alive=true; });
  ws.on('message', async raw=>{
    let msg; try{ msg=JSON.parse(raw); }catch{ return; }
    if(!msg||typeof msg.t!=='string') return;
    try{
      if(S.player) return world.handle(S.player,msg);
      await preGame(S,msg,send);
    }catch(e){ console.error('handler error',msg.t,e); send({t:'err',msg:'伺服器發生錯誤，請再試一次。'}); }
  });
  ws.on('close', async ()=>{ if(S.player){ await world.leave(S.player); S.player=null; } });
});
// drop dead connections
wss.on('connection',ws=>ws.on('pong',()=>{ws._dead=false;}));
setInterval(()=>{ for(const ws of wss.clients){ if(ws._dead){ ws.terminate(); continue; } ws._dead=true; try{ws.ping();}catch{} } },30000).unref();

async function preGame(S,msg,send){
  switch(msg.t){
    case 'register': {
      const u=String(msg.user||'').trim(), p=String(msg.pass||'');
      if(!USER_RE.test(u)) return send({t:'auth',ok:false,err:'帳號要 3～16 個英文字母、數字或底線。'});
      if(p.length<6||p.length>64) return send({t:'auth',ok:false,err:'密碼要 6 個字以上。'});
      if(await store.getAccount(u)) return send({t:'auth',ok:false,err:'這個帳號已經有人用了。'});
      const salt=crypto.randomBytes(16).toString('hex'); const a=await store.createAccount(u,salt,hashPw(p,salt));
      return authed(S,a,send);
    }
    case 'login': {
      const f=loginFails.get(S.ip); if(f&&f.n>=8&&Date.now()-f.t<5*60e3) return send({t:'auth',ok:false,err:'登入失敗太多次，請 5 分鐘後再試。'});
      const u=String(msg.user||'').trim(), p=String(msg.pass||''); const a=await store.getAccount(u);
      if(!a||hashPw(p,a.salt)!==a.hash){ const g=loginFails.get(S.ip)||{n:0,t:0}; g.n++; g.t=Date.now(); loginFails.set(S.ip,g); return send({t:'auth',ok:false,err:'帳號或密碼錯誤。'}); }
      loginFails.delete(S.ip); return authed(S,a,send);
    }
    case 'resume': {
      const a=msg.token?await store.getAccountByToken(String(msg.token)):null;
      if(!a) return send({t:'auth',ok:false,err:'',expired:true});
      return authed(S,a,send,true);
    }
    case 'chars': if(!S.accountId) return; return send({t:'chars',list:await charList(S.accountId)});
    case 'create': {
      if(!S.accountId) return; const cls=String(msg.cls), g=msg.g==='f'?'f':'m', name=String(msg.name||'').trim();
      if(!CLS[cls]) return; if(!NAME_RE.test(name)) return send({t:'err',msg:'角色名稱要 2～12 個字，只能用中英文、數字和底線。'});
      const list=await store.listChars(S.accountId); if(list.some(c=>c.cls===cls)) return send({t:'err',msg:'這個職業已經有角色了。'});
      if(await store.nameTaken(name)) return send({t:'err',msg:'這個名字已經有人用了。'});
      const c=newCharacter(cls,g,name); await store.createChar(S.accountId,c);
      return send({t:'chars',list:await charList(S.accountId),created:cls});
    }
    case 'enter': {
      if(!S.accountId) return; const list=await store.listChars(S.accountId); const row=list.find(c=>c.cls===msg.cls); if(!row) return;
      if(msg.g==='m'||msg.g==='f') row.g=msg.g;
      await world.join(S,row);
      return;
    }
    case 'logout': await store.setToken(S.accountId,null); S.accountId=null; return send({t:'auth',ok:false,err:'',loggedOut:true});
  }
}
async function charList(aid){ return (await store.listChars(aid)).map(c=>({cls:c.cls,name:c.name,lv:c.lv,g:c.g,gold:c.gold,clan:c.clan||null})); }
async function authed(S,a,send,resumed){
  S.accountId=a.id; S.username=a.username; let token=a.token;
  if(!resumed||!token){ token=newToken(); await store.setToken(a.id,token); }
  send({t:'auth',ok:true,user:a.username,token});
  send({t:'chars',list:await charList(a.id)});
}

server.listen(PORT,()=>console.log(`[silvermoon] listening on http://localhost:${PORT}`));
const bye = async sig=>{ console.log(`[silvermoon] ${sig}, saving…`); await world.shutdown(); await store.close(); process.exit(0); };
process.on('SIGTERM',()=>bye('SIGTERM')); process.on('SIGINT',()=>bye('SIGINT'));
