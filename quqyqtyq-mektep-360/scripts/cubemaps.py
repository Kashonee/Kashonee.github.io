"""Create sharp cube maps from denoised equirectangular renders."""
from PIL import Image
import numpy as np,os,sys
source=os.environ.get('PANORAMA_SOURCE','/tmp/qq-hq-clean')
for name in sys.argv[1:]:
    im=Image.open(f'{source}/{name}.png').convert('RGB');src=np.asarray(im,dtype=np.float32);h,w=src.shape[:2]
    for size,folder in [(2048,'dist/panoramas'),(1024,'dist/panoramas/mobile')]:
        os.makedirs(folder,exist_ok=True)
        a=np.linspace(-1,1,size,dtype=np.float32);u,v=np.meshgrid(a,a);one=np.ones_like(u)
        for face,(x,y,z) in {'front':(u,-v,-one),'back':(-u,-v,one),'right':(one,-v,u),'left':(-one,-v,-u),'up':(u,one,-v),'down':(u,-one,v)}.items():
            norm=np.sqrt(x*x+y*y+z*z);xx=(np.arctan2(x,-z)/(2*np.pi)+.5)*w;yy=(.5-np.arcsin(y/norm)/np.pi)*h
            x0=np.floor(xx).astype(np.int32)%w;y0=np.clip(np.floor(yy).astype(np.int32),0,h-1);x1=(x0+1)%w;y1=np.minimum(y0+1,h-1);fx=(xx-np.floor(xx))[...,None];fy=(yy-np.floor(yy))[...,None]
            out=(src[y0,x0]*(1-fx)+src[y0,x1]*fx)*(1-fy)+(src[y1,x0]*(1-fx)+src[y1,x1]*fx)*fy
            Image.fromarray(np.clip(out+.5,0,255).astype(np.uint8)).save(f'{folder}/{name}-{face}.webp',quality=94,method=5)
        print('CUBES',name,size,flush=True)
