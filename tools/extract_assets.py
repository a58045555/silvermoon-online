# Pull embedded base64 images out of the single-file prototype into public/assets/*.png + manifest.json
import re,json,base64,os,sys
src=sys.argv[1]; out='/home/claude/silvermoon-online/public/assets'
s=open(src).read(); os.makedirs(out,exist_ok=True)
man={}
def grab(tag_a,tag_b,key,prefix):
    m=re.search(re.escape(tag_a)+r'(.*?)'+re.escape(tag_b),s,re.S); d=json.loads(m.group(1)) if m and m.group(1).strip() not in('{}','null') else {}
    res={}
    for k,v in d.items():
        for fld in ('src','prev'):
            if fld in v and v[fld].startswith('data:image/png;base64,'):
                fn=f'{prefix}{k}{"" if fld=="src" else "_prev"}.png'; open(f'{out}/{fn}','wb').write(base64.b64decode(v[fld].split(',',1)[1])); v[fld]='assets/'+fn
        res[k]=v
    man[key]=res
grab('/*SHEETS*/','/*END*/','sheets','hero_')
grab('/*MOBS*/','/*ENDM*/','mobs','mob_')
grab('/*ASSETS*/','/*ENDA*/','assets','')
m=re.search(r'const NPCIMG=(\{.*?\});const NPCI',s,re.S); d=json.loads(m.group(1))
for k,v in d.items(): fn=f'npc_{k}.png'; open(f'{out}/{fn}','wb').write(base64.b64decode(v['src'].split(',',1)[1])); v['src']='assets/'+fn
man['npcs']=d
m=re.search(r'/\*ICONS\*/(.*?)/\*ENDI\*/',s,re.S); d=json.loads(m.group(1)); open(f'{out}/icons.png','wb').write(base64.b64decode(d['src'].split(',',1)[1])); d['src']='assets/icons.png'; man['icons']=d
json.dump(man,open(f'{out}/manifest.json','w'),ensure_ascii=False,separators=(',',':'))
print({k:len(v) if isinstance(v,dict) else v for k,v in man.items() if k!='icons'}, sum(os.path.getsize(f'{out}/{f}') for f in os.listdir(out))//1024,'KB')
