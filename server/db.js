// Storage: PostgreSQL when DATABASE_URL is set, otherwise a local JSON file (for development).
import fs from 'node:fs';
import path from 'node:path';

export async function openStore(){
  if(process.env.DATABASE_URL) return pgStore(process.env.DATABASE_URL);
  return fileStore(process.env.DATA_FILE || path.resolve('data/dev-db.json'));
}

async function pgStore(url){
  const { default: pg } = await import('pg');
  const pool = new pg.Pool({ connectionString:url, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized:false }, max:10 });
  await pool.query(`
    create table if not exists accounts(
      id serial primary key, username text unique not null, salt text not null, hash text not null,
      token text, created_at timestamptz default now(), last_login timestamptz);
    create table if not exists characters(
      id serial primary key, account_id int not null references accounts(id) on delete cascade,
      cls text not null, name text unique not null, lv int not null default 1, exp bigint not null default 0,
      data jsonb not null, updated_at timestamptz default now(), unique(account_id, cls));
    create table if not exists clans(
      name text primary key, leader text not null, members jsonb not null default '[]', notice text default '',
      created_at timestamptz default now());
    create index if not exists characters_rank on characters(lv desc, exp desc);`);
  const one = async (q,a)=>(await pool.query(q,a)).rows[0]||null;
  return {
    kind:'postgres',
    getAccount: u=>one('select * from accounts where lower(username)=lower($1)',[u]),
    getAccountByToken: t=>one('select * from accounts where token=$1',[t]),
    createAccount: (u,salt,hash)=>one('insert into accounts(username,salt,hash) values($1,$2,$3) returning *',[u,salt,hash]),
    setToken: (id,t)=>pool.query('update accounts set token=$2,last_login=now() where id=$1',[id,t]),
    listChars: async id=>(await pool.query('select id,cls,name,lv,data from characters where account_id=$1',[id])).rows.map(r=>({...r.data,id:r.id,cls:r.cls,name:r.name,lv:r.lv})),
    nameTaken: async n=>!!(await one('select 1 from characters where lower(name)=lower($1)',[n])),
    createChar: async (aid,c)=>{const r=await one('insert into characters(account_id,cls,name,lv,exp,data) values($1,$2,$3,$4,$5,$6) returning id',[aid,c.cls,c.name,c.lv,c.exp,c]);return r.id;},
    saveChar: (id,c)=>pool.query('update characters set lv=$2,exp=$3,data=$4,updated_at=now() where id=$1',[id,c.lv,c.exp,c]),
    getCharByName: async n=>{const r=await one('select id,account_id,cls,name,data from characters where lower(name)=lower($1)',[n]);return r?{...r.data,id:r.id,accountId:r.account_id}:null;},
    ranking: async (n=20)=>(await pool.query('select name,cls,lv,data->>\'clan\' as clan, (data->>\'pkKills\')::int as pk from characters order by lv desc, exp desc limit $1',[n])).rows,
    getClan: n=>one('select * from clans where name=$1',[n]),
    listClans: async ()=>(await pool.query('select * from clans')).rows,
    saveClan: c=>pool.query('insert into clans(name,leader,members,notice) values($1,$2,$3,$4) on conflict(name) do update set leader=$2,members=$3,notice=$4',[c.name,c.leader,JSON.stringify(c.members),c.notice||'']),
    deleteClan: n=>pool.query('delete from clans where name=$1',[n]),
    close: ()=>pool.end()
  };
}

function fileStore(file){
  fs.mkdirSync(path.dirname(file),{recursive:true});
  let db={accounts:[],chars:[],clans:{},seq:1};
  try{ db=JSON.parse(fs.readFileSync(file,'utf8')); }catch{}
  let dirty=false; const mark=()=>{dirty=true;};
  const flush=()=>{ if(!dirty)return; dirty=false; fs.writeFileSync(file+'.tmp',JSON.stringify(db)); fs.renameSync(file+'.tmp',file); };
  const timer=setInterval(flush,2000); timer.unref();
  const clone=o=>o?JSON.parse(JSON.stringify(o)):null;
  return {
    kind:'file',
    getAccount: async u=>clone(db.accounts.find(a=>a.username.toLowerCase()===u.toLowerCase())),
    getAccountByToken: async t=>clone(db.accounts.find(a=>a.token&&a.token===t)),
    createAccount: async (u,salt,hash)=>{const a={id:db.seq++,username:u,salt,hash,token:null};db.accounts.push(a);mark();return clone(a);},
    setToken: async (id,t)=>{const a=db.accounts.find(x=>x.id===id);if(a){a.token=t;mark();}},
    listChars: async id=>db.chars.filter(c=>c.accountId===id).map(c=>clone({...c.data,id:c.id,cls:c.cls,name:c.name,lv:c.data.lv})),
    nameTaken: async n=>db.chars.some(c=>c.name.toLowerCase()===n.toLowerCase()),
    createChar: async (aid,c)=>{const id=db.seq++;db.chars.push({id,accountId:aid,cls:c.cls,name:c.name,data:clone(c)});mark();return id;},
    saveChar: async (id,c)=>{const r=db.chars.find(x=>x.id===id);if(r){r.data=clone(c);mark();}},
    getCharByName: async n=>{const r=db.chars.find(c=>c.name.toLowerCase()===n.toLowerCase());return r?clone({...r.data,id:r.id,accountId:r.accountId}):null;},
    ranking: async (n=20)=>db.chars.map(c=>({name:c.name,cls:c.cls,lv:c.data.lv,exp:c.data.exp,clan:c.data.clan||null,pk:c.data.pkKills||0})).sort((a,b)=>b.lv-a.lv||b.exp-a.exp).slice(0,n),
    getClan: async n=>clone(db.clans[n]),
    listClans: async ()=>Object.values(db.clans).map(clone),
    saveClan: async c=>{db.clans[c.name]=clone(c);mark();},
    deleteClan: async n=>{delete db.clans[n];mark();},
    close: async ()=>{clearInterval(timer);flush();}
  };
}
