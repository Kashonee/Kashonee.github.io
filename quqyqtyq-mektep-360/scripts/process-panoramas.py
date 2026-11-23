"""Process finished renders while Blender works on the following scenes."""
import os,sys,time,subprocess
from pathlib import Path
from PIL import Image
names=sys.argv[1:];root=Path('/tmp/qq-hq');out=Path('/tmp/qq-hq-clean');deadline=time.time()+1800
while names:
    for name in names[:]:
        source=root/f'{name}.png'
        if not source.exists():continue
        try:
            with Image.open(source) as im:im.verify()
        except Exception:continue
        subprocess.run([sys.executable,'scripts/denoise-panoramas.py',str(source),str(out/f'{name}.png')],check=True)
        subprocess.run([sys.executable,'scripts/cubemaps.py',name],check=True)
        names.remove(name)
    if names:
        if time.time()>deadline:raise TimeoutError(str(names))
        time.sleep(2)
