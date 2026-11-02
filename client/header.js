// 銀月大陸 Online client — built by tools/build_client.py from client/header.js + client/legacy.js + client/client.js
import { CLS, STATN, STATD, MT, MAPDEF, SHOP, INV_N, BAGMAX, SLOTS, SLOTN, NOSHIELD, BIG, SHOP_GEAR, PK_MIN_LV, CLAN_COST, CLAN_MIN_LV,
  rng, buildMap, itemBase, itemBaseName, itemName, itemStat, eqSlotFor, enchRate, sellP, shopPrice, expNeed, cheb, dist } from '/shared/data.js';

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
let ASSETS={}, MOBS={}, SHEETS={}, NPCIMG={}, ICONS=null;
const AIMG={}, MOBI={}, NPCI={}, SHIMG={};
function aImg(k){return AIMG[k]&&AIMG[k].naturalWidth?AIMG[k]:null;}
function npcImg(k){const d=NPCIMG[k];if(!d)return null;if(!NPCI[k]){const im=new Image();im.src=d.src;NPCI[k]=im;}return NPCI[k].complete&&NPCI[k].naturalWidth?NPCI[k]:null;}
const cv=document.querySelector('#cv'), ctx=cv.getContext('2d');
const lightCv=mk(10,10), lctx=lightCv.getContext('2d');
