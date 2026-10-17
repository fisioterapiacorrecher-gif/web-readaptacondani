# "Aumenta la capacidad de carga": gráfico de barras que crecen una tras otra y una flecha que sube por encima
# (estilo esquema). pulses = [inicio de las barras]; las barras suben cada 0,22 s y la flecha se dibuja detrás.
import math, numpy as np
from PIL import Image, ImageDraw
from anim_base import *
FONT=None; CY=920; OY=CY-450
def draw(t,scene,t0,t1,pulses,broken):
    A=fade_io(t,t0,t1)
    if A<=0: return None
    img=canvas(); d=ImageDraw.Draw(img); glow=canvas(); g=ImageDraw.Draw(glow)
    X0,X1,YB=250,830,CY+230
    k=eo((t-t0)/0.3)
    d.line([(X0*SS,(YB-470*k)*SS),(X0*SS,YB*SS),((X0+(X1-X0+40)*k)*SS,YB*SS)],fill=BONE+(230,),width=8*SS,joint='curve')
    hs=[110,190,280,390]; bw=88; xs=[X0+60+i*130 for i in range(4)]; tb=pulses[0] if pulses else t0+0.2
    tops=[]
    for i,(x,h) in enumerate(zip(xs,hs)):
        u=(t-tb-i*0.22)/0.35
        hh=h*back(u,1.3) if u>0 else 0
        if hh>1:
            d.rounded_rectangle([x*SS,(YB-hh)*SS,(x+bw)*SS,(YB-4)*SS],radius=14*SS,fill=(CORAL if i==3 else tuple(int(255-(255-c)*(0.55+0.15*i)) for c in CORAL))+(255,))
        tops.append((x+bw/2,YB-h-60))
    # flecha que sube siguiendo las barras
    u=eio((t-tb-0.25)/1.0)
    if u>0:
        pts=[(X0+30,YB-60)]+tops; pts[-1]=(pts[-1][0]+40,pts[-1][1]-50)
        seg=np.cumsum([0]+[math.dist(a,b) for a,b in zip(pts[:-1],pts[1:])]); L=seg[-1]*u
        path=[pts[0]]
        for a,b,s0,s1 in zip(pts[:-1],pts[1:],seg[:-1],seg[1:]):
            if L>=s1: path.append(b)
            elif L>s0: q=(L-s0)/(s1-s0); path.append((a[0]+(b[0]-a[0])*q,a[1]+(b[1]-a[1])*q)); break
        g.line([(x*SS,y*SS) for x,y in path],fill=MINT+(255,),width=16*SS,joint='curve')
        (x2,y2)=path[-1]; (x1,y1)=path[-2] if len(path)>1 else pts[0]
        ang=math.atan2(y2-y1,x2-x1); s=46
        tri=[(x2+math.cos(ang)*s,y2+math.sin(ang)*s),(x2+math.cos(ang+2.4)*s,y2+math.sin(ang+2.4)*s),(x2+math.cos(ang-2.4)*s,y2+math.sin(ang-2.4)*s)]
        g.polygon([(x*SS,y*SS) for x,y in tri],fill=MINT+(255,))
    return to_full(img,A,glow)
