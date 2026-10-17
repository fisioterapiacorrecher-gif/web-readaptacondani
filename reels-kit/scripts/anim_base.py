# Utilidades comunes de las animaciones del kit (mismo estilo que animacion_tendon.py)
import numpy as np, cv2, math
from PIL import Image, ImageDraw, ImageFont
W,H=1080,1920; SS=2
CORAL=(255,52,52); BONE=(255,251,232); MINT=(233,255,185); GREY=(150,140,135)
def eo(x): x=min(1,max(0,x)); return 1-(1-x)**3
def eio(x): x=min(1,max(0,x)); return 3*x*x-2*x*x*x
def back(x,s=1.7): x=min(1,max(0,x)); x-=1; return x*x*((s+1)*x+s)+1     # entrada con rebote
_F={}
def font(path,sz):
    if (path,sz) not in _F: _F[path,sz]=ImageFont.truetype(path,sz)
    return _F[path,sz]
def canvas(): return Image.new('RGBA',(W*SS,H*SS),(0,0,0,0))
def to_full(img,alpha=1.0,glow=None):
    """PIL RGBA a tamaño SS -> array HxWx4 float (0..1). glow: capa extra que se suma con halo."""
    a=np.array(img).astype(np.float32)
    if glow is not None:
        g=np.array(glow).astype(np.float32); halo=cv2.GaussianBlur(g,(0,0),14*SS)
        for layer,k in ((halo,2.0),(g,1.0)):
            al=np.clip(layer[...,3:4]/255*k,0,1); a[...,:3]=a[...,:3]*(1-al)+layer[...,:3]*al; a[...,3:4]=np.maximum(a[...,3:4],al*255)
    r=cv2.resize(a,(W,H),interpolation=cv2.INTER_AREA)/255.0
    r[...,3]*=alpha; return r
def text_c(d,f,txt,x,y,fill=(255,255,255,255),stroke=4):
    w=d.textlength(txt,font=f); d.text((x*SS-w/2,y*SS),txt,font=f,fill=fill,stroke_width=stroke*SS,stroke_fill=(0,0,0,150))
def fade_io(t,t0,t1,fi=0.3,fo=0.25):
    if t<t0 or t>t1: return 0.0
    return eo((t-t0)/fi)*(1-eo((t-(t1-fo))/fo) if t>t1-fo else 1)
