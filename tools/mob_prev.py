# make assets/mob_<key>_prev.png from the idle south frame of a packed mob sheet
import sys,json,os
from PIL import Image
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
m=json.load(open(f'{root}/public/assets/manifest.json'))
for key in sys.argv[1:]:
    d=m['mobs'][key]; r=d['anims']['idle']['south']['row']
    sh=Image.open(f'{root}/public/assets/mob_{key}.png'); fr=sh.crop((0,r*d['fh'],d['fw'],(r+1)*d['fh']))
    fr.crop(fr.getbbox()).save(f'{root}/public/assets/mob_{key}_prev.png'); print(key,'prev ok')
