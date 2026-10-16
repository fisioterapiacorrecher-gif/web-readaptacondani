# Corredor (pictograma) que corre; al llegar a pulses[0] se para, se apaga a gris y le cae una X coral.
import math, numpy as np
from PIL import Image, ImageDraw
from anim_base import *
FONT=None; CY=920; OY=CY-450
def seg(d,a,b,w,col):
    d.line([(a[0]*SS,a[1]*SS),(b[0]*SS,b[1]*SS)],fill=col,width=int(w*SS))
    for p in (a,b): d.ellipse([(p[0]-w/2)*SS,(p[1]-w/2)*SS,(p[0]+w/2)*SS,(p[1]+w/2)*SS],fill=col)
def limb(o,a1,a2,l1,l2):   # ángulos desde la vertical hacia abajo (rad, + hacia delante)
    k=(o[0]+l1*math.sin(a1),o[1]+l1*math.cos(a1)); e=(k[0]+l2*math.sin(a2),k[1]+l2*math.cos(a2)); return k,e
def draw(t,scene,t0,t1,pulses,broken):
    A=fade_io(t,t0,t1)
    if A<=0: return None
    tstop=pulses[0]
    sp=1.0 if t<tstop else math.exp(-(t-tstop)/0.12)           # frena en seco
    ph=2*math.pi*1.7*(t-t0) if t<tstop else 2*math.pi*1.7*(tstop-t0)+2*math.pi*1.7*0.12*(1-sp)
    gray=eio((t-tstop)/0.3)
    col=tuple(int(BONE[i]*(1-gray)+GREY[i]*gray) for i in range(3)); far=tuple(int(c*0.62) for c in col)
    img=canvas(); d=ImageDraw.Draw(img); glow=canvas(); g=ImageDraw.Draw(glow)
    cx=540; Z=1.3; hip=(cx,CY+40-14*Z*abs(math.cos(ph))*sp)
    lean=0.22; neck=(hip[0]+150*Z*math.sin(lean),hip[1]-150*Z*math.cos(lean)); head=(neck[0]+52*Z*math.sin(lean),neck[1]-52*Z*math.cos(lean))
    # suelo y líneas de velocidad
    gy=CY+40+200*Z
    d.line([((cx-300)*SS,gy*SS),((cx+300)*SS,gy*SS)],fill=col+(150,),width=6*SS)
    for k in range(4):
        u=((t-t0)*2.4+k/4)%1 if t<tstop else (((tstop-t0)*2.4+k/4)%1)
        x=cx+240-u*560; y=CY-120+k*70; al=int(200*sp*math.sin(u*math.pi))
        if al>0: d.line([((x)*SS,y*SS),((x+90)*SS,y*SS)],fill=BONE+(al,),width=8*SS)
    def legs(p,c):
        a1=0.75*math.sin(p); a2=a1-0.25-1.1*max(0,math.sin(p-1.2))
        k,e=limb(hip,a1*sp,a2*sp+(-0.25 if sp<0.5 else 0),100*Z,100*Z); seg(d,hip,k,30*Z,c); seg(d,k,e,28*Z,c)
        seg(d,e,(e[0]+30*Z,e[1]+4),24*Z,c)
    def arm(p,c):
        a1=-0.8*math.sin(p)*sp; k,e=limb(neck,a1,a1-1.6,72*Z,66*Z); seg(d,neck,k,24*Z,c); seg(d,k,e,22*Z,c)
    legs(ph+math.pi,far); arm(ph,far)
    seg(d,hip,neck,40*Z,col)
    r_=38*Z; d.ellipse([(head[0]-r_)*SS,(head[1]-r_)*SS,(head[0]+r_)*SS,(head[1]+r_)*SS],fill=col+(255,))
    legs(ph,col); arm(ph+math.pi,col)
    # X coral
    k=eo((t-tstop-0.05)/0.22)
    if k>0:
        c0=(cx+10,CY-10); s=230*(1.25-0.25*k)
        for a,b in (((-1,-1),(1,1)),((-1,1),(1,-1))):
            g.line([((c0[0]+a[0]*s)*SS,(c0[1]+a[1]*s)*SS),((c0[0]+b[0]*s)*SS,(c0[1]+b[1]*s)*SS)],fill=CORAL+(int(255*k),),width=30*SS)
    return to_full(img,A,glow)
