# Corredor: ilustración de Dani (assets/corredor.png, coloreada con la paleta del manual, plana y sin contorno).
# Corre con rebote y líneas de velocidad; en pulses[0] frena en seco, se tambalea y aparece el dolor en el Aquiles
# (brillo coral + rayitos rojos, como los iconos del manual).
import math, os, numpy as np, cv2
from PIL import Image, ImageDraw
from anim_base import *
FONT=None; CY=920; OY=CY-450
HGT=500; TOP=645                       # alto de la figura y borde superior (debajo del texto destacado de arriba)
_SPR=None
def sprite():
    global _SPR
    if _SPR is None:
        p=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'assets','corredor.png')
        im=cv2.imread(p,cv2.IMREAD_UNCHANGED).astype(np.float32)/255; im=im[...,[2,1,0,3]]
        s=HGT/im.shape[0]; _SPR=cv2.resize(im,None,fx=s,fy=s,interpolation=cv2.INTER_AREA)
    return _SPR
ACH=(0.815,0.905)   # tendón de Aquiles de la pierna de delante (fracción del ancho/alto del dibujo)
def draw(t,scene,t0,t1,pulses,broken):
    A=fade_io(t,t0,t1)
    if A<=0: return None
    ts=pulses[0]; spr=sprite(); h,w=spr.shape[:2]
    run=1.0 if t<ts else math.exp(-(t-ts)/0.12)
    bob=-14*abs(math.sin(2*math.pi*1.45*(t-t0)))*run
    rot=1.6*math.sin(2*math.pi*1.45*(t-t0))*run
    if t>ts:                                            # frenazo: se inclina, tambalea y se queda encogido
        u=t-ts; rot+=4*eo(u/0.2)-1.5*eio((u-0.2)/0.4)+3.0*math.sin(u*38)*math.exp(-u/0.12)
        bob+=6*eo(u/0.25)
    ent=eo((t-t0)/0.3); dx=-40*(1-ent)
    cx,cy=540+dx,TOP+h/2+bob
    M=cv2.getRotationMatrix2D((w/2,h*0.95),-rot,1.0); M[0,2]+=cx-w/2; M[1,2]+=cy-h/2
    lay=cv2.warpAffine(spr,M,(W,H),flags=cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT,borderValue=(0,0,0,0))
    img=canvas(); d=ImageDraw.Draw(img); glow=canvas(); g=ImageDraw.Draw(glow)
    gy=TOP+h+6
    d.line([((540-320)*SS,gy*SS),((540+320)*SS,gy*SS)],fill=BONE+(110,),width=5*SS)
    tt=min(t,ts)
    for j in range(4):                                  # líneas de velocidad por detrás
        u=((tt-t0)*2.6+j/4)%1; x=540+180-u*640; y=TOP+120+j*85; al=int(190*run*math.sin(u*math.pi))
        if al>0: d.line([(x*SS,y*SS),((x+110)*SS,y*SS)],fill=BONE+(al,),width=7*SS)
    if t>ts:                                            # dolor en el Aquiles
        u=t-ts; k_=eo(u/0.25); px,py=M@np.array([ACH[0]*w,ACH[1]*h,1.0])
        pul=1+0.12*math.sin(u*2*math.pi*2.2)
        for rr,al in ((46,80),(31,150),(18,235)):
            R=rr*k_*pul; g.ellipse([(px-R)*SS,(py-R)*SS,(px+R)*SS,(py+R)*SS],fill=CORAL+(al,))
        for j in range(6):
            an=-2.9+j*0.5; r0=60; r1=r0+28*k_
            m=(px+math.cos(an)*r0,py+math.sin(an)*r0); m2=(px+math.cos(an)*(r0+r1)/2+7,py+math.sin(an)*(r0+r1)/2-7); e=(px+math.cos(an)*r1,py+math.sin(an)*r1)
            if k_>0.1: g.line([(m[0]*SS,m[1]*SS),(m2[0]*SS,m2[1]*SS),(e[0]*SS,e[1]*SS)],fill=CORAL+(int(255*k_),),width=7*SS)
    base=to_full(img); gl=to_full(glow)
    out=base
    a=lay[...,3:4]; out[...,:3]=out[...,:3]*(1-a)+lay[...,:3]*a; out[...,3:4]=np.maximum(out[...,3:4],a)
    ha=cv2.GaussianBlur(gl[...,3],(0,0),14)[...,None]; hc=cv2.GaussianBlur(gl[...,:3]*gl[...,3:4],(0,0),14)/np.maximum(ha,1e-3)
    ah=np.clip(ha*1.8,0,1)*0.8; out[...,:3]=out[...,:3]*(1-ah)+np.clip(hc,0,1)*ah; out[...,3:4]=np.maximum(out[...,3:4],ah)
    a=gl[...,3:4]; out[...,:3]=out[...,:3]*(1-a)+gl[...,:3]*a; out[...,3:4]=np.maximum(out[...,3:4],a)
    out[...,3]*=A
    return out
