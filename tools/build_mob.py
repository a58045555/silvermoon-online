# Download a PixelLab character and pack idle/walk/attack into public/assets/mob_<key>.png + manifest entry.
# usage: python3 tools/build_mob.py <key> <character_id>
import sys,json,io,zipfile,urllib.request,os
from PIL import Image
key,cid=sys.argv[1],sys.argv[2]
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data=urllib.request.urlopen(f'https://api.pixellab.ai/mcp/characters/{cid}/download').read()
z=zipfile.ZipFile(io.BytesIO(data)); meta=json.loads(z.read('metadata.json'))
st=meta['states'][0]['frames'] if 'states' in meta else meta['frames']
DIR8=['east','south-east','south','south-west','west','north-west','north','north-east']
anims={'idle':{d:[st['rotations'][d]] for d in DIR8 if d in st['rotations']}}
for k,v in st.get('animations',{}).items():
    kind='attack' if 'attack' in k.lower() else 'walk' if 'walk' in k.lower() else None
    if kind and (kind not in anims or len(v)>len(anims[kind])): anims[kind]=dict(v)
imgs={}; fw=fh=0
for a,dd in anims.items():
    for d,fl in dd.items():
        for f in fl:
            im=Image.open(io.BytesIO(z.read(f))).convert('RGBA'); imgs[f]=im; fw=max(fw,im.width); fh=max(fh,im.height)
maxn=max(len(fl) for dd in anims.values() for fl in dd.values())
rows=[(a,d) for a in anims for d in DIR8 if d in anims[a]]
sheet=Image.new('RGBA',(fw*maxn,fh*len(rows)),(0,0,0,0)); layout={}
for r,(a,d) in enumerate(rows):
    fl=anims[a][d]; layout.setdefault(a,{})[d]={'row':r,'n':len(fl)}
    for i,f in enumerate(fl):
        im=imgs[f]; sheet.paste(im,(i*fw+(fw-im.width)//2,r*fh+(fh-im.height)//2),im)
south=imgs[st['rotations']['south']]; bb=south.getbbox(); foot=bb[3]-1+(fh-south.height)//2
sheet.save(f'{root}/public/assets/mob_{key}.png',optimize=True)
mp=f'{root}/public/assets/manifest.json'; m=json.load(open(mp)); old=m['mobs'].get(key,{})
import time; m['mobs'][key]={'src':f'assets/mob_{key}.png?v={int(time.time())}','prev':old.get('prev',f'assets/mob_{key}_prev.png'),'fw':fw,'fh':fh,'foot':foot,'anims':layout}
json.dump(m,open(mp,'w'),separators=(',',':'))
print(key,fw,fh,'foot',foot,{a:sorted(dd) for a,dd in layout.items() if a!='idle'}, os.path.getsize(f'{root}/public/assets/mob_{key}.png')//1024,'KB')
