import os
root='/home/claude/silvermoon-online'
out='\n'.join(open(f'{root}/client/{f}').read() for f in ['header.js','legacy.js','client.js'])
open(f'{root}/public/game.js','w').write(out)
print('public/game.js',len(out)//1024,'KB')
