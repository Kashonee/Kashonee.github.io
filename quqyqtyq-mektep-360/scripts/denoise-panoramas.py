"""Remove path-tracing noise before panorama resampling; requires oidn and Pillow."""
import sys,os,ctypes
from pathlib import Path
import numpy as np
from PIL import Image
import oidn

source=Path(sys.argv[1]);target=Path(sys.argv[2]);target.parent.mkdir(parents=True,exist_ok=True)
image=np.asarray(Image.open(source).convert('RGB'),dtype=np.float32)/255
h,w=image.shape[:2];result=np.empty_like(image)
lib=ctypes.CDLL(str(Path(oidn.__file__).parent/'lib.linux.x64/libOpenImageDenoise.so.1.4.3'))
lib.oidnSetFilter1b.argtypes=[ctypes.c_void_p,ctypes.c_char_p,ctypes.c_bool]
device=oidn.NewDevice();oidn.CommitDevice(device)
# Overlapping horizontal strips limit peak memory on full 6K panoramas.
for top in range(0,h,512):
    start=max(0,top-96);end=min(h,top+512+96)
    color=np.ascontiguousarray(image[start:end]);output=np.empty_like(color)
    filt=oidn.NewFilter(device,'RT')
    oidn.SetSharedFilterImage(filt,'color',color,oidn.FORMAT_FLOAT3,w,end-start)
    oidn.SetSharedFilterImage(filt,'output',output,oidn.FORMAT_FLOAT3,w,end-start)
    lib.oidnSetFilter1b(filt,b'srgb',True)
    oidn.CommitFilter(filt);oidn.ExecuteFilter(filt)
    err=oidn.GetDeviceError(device)
    if err:raise RuntimeError(f'OIDN failed: {err}')
    n=min(512,h-top);result[top:top+n]=output[top-start:top-start+n]
    oidn.ReleaseFilter(filt)
oidn.ReleaseDevice(device)
Image.fromarray((np.clip(result,0,1)*255+.5).astype(np.uint8)).save(target)
print('DENOISED',target.name,flush=True)
