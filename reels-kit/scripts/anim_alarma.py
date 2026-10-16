# "Silenciar la alarma": campana que suena (tiembla + ondas) -> se tacha y deja de sonar -> el aviso rojo sigue ahí.
# pulses = [silencio, aparece el aviso]
import math, numpy as np
from PIL import Image, ImageDraw
from anim_base import *
FONT=None; CY=920; OY=CY-450
def bell(gray):
    R=340*SS; c=Image.new('RGBA',(2*R,2*R),(0,0,0,0)); d=ImageDraw.Draw(c)
    col=tuple(int(BONE[i]*(1-gray)+GREY[i]*gray) for i in range(3))+(255,)
    P=lambda x,y:(R+x*SS,R+y*SS)              # pivote (arriba de la campana) en el centro del lienzo
    ys=np.linspace(30,230,40); xs=48+82*((ys-30)/200)**1.7
    poly=[P(x,y) for x,y in zip(xs,ys)]+[P(150,232),P(150,252),P(-150,252),P(-150,232)]+[P(-x,y) for x,y in zip(xs[::-1],ys[::-1])]
    d.ellipse([*P(-48,-10),*P(48,80)],fill=col)
    d.polygon(poly,fill=col)
    d.ellipse([*P(-22,-8),*P(22,30)],fill=col)
    d.ellipse([*P(-26,250),*P(26,300)],fill=CORAL+(255,))
    d.line([P(-30,70),P(-62,210)],fill=(255,255,255,120),width=10*SS)
    return c,R
def draw(t,scene,t0,t1,pulses,broken):
    A=fade_io(t,t0,t1)
    if A<=0: return None
    ts,tw=pulses
    img=canvas(); d=ImageDraw.Draw(img); glow=canvas(); g=ImageDraw.Draw(glow)
    ringing=t<ts; s_=eo((t-t0)/0.35)*0.25+0.75
    ang=14*math.sin(t*2*math.pi*9) if ringing else 14*math.sin(ts*2*math.pi*9)*math.exp(-(t-ts)/0.08)
    px,py=540,CY-150
    b,R=bell(eio((t-ts)/0.4))
    b=b.rotate(ang,resample=Image.BICUBIC,center=(R,R))
    if s_<1: b=b.resize((int(b.width*s_),int(b.height*s_)),Image.BICUBIC); R=int(R*s_)
    img.alpha_composite(b,(int(px*SS-R),int(py*SS-R)))
    cx,cy=540,CY+20
    # ondas de sonido a los lados
    wa=1.0 if ringing else max(0,1-(t-ts)/0.15)
    if wa>0:
        for k in range(3):
            u=((t*2.2+k/3)%1); rr=190+u*120; al=int(255*wa*(1-u))
            for sgn in (1,-1):
                a0=-30 if sgn>0 else 150
                g.arc([(cx-rr)*SS,(cy-rr)*SS,(cx+rr)*SS,(cy+rr)*SS],a0,a0+60,fill=CORAL+(al,),width=14*SS)
    # tachón: se dibuja de arriba-izquierda a abajo-derecha
    k=eo((t-ts)/0.22)
    if k>0:
        a=(cx-190,cy-190); b_=(cx-190+380*k,cy-190+380*k)
        d.line([(a[0]*SS,a[1]*SS),(b_[0]*SS,b_[1]*SS)],fill=(0,0,0,170),width=34*SS)
        d.line([(a[0]*SS,a[1]*SS),(b_[0]*SS,b_[1]*SS)],fill=BONE+(255,),width=22*SS)
    # aviso rojo que sigue ahí (el problema)
    k=(t-tw)
    if k>0:
        sc=back(k/0.35)*(1+0.08*math.sin(k*2*math.pi*1.6)); bx,by=cx+165,cy-175; r=58*sc
        u=(k*1.2)%1; rr=r+u*70
        g.ellipse([(bx-rr)*SS,(by-rr)*SS,(bx+rr)*SS,(by+rr)*SS],outline=CORAL+(int(200*(1-u)),),width=8*SS)
        d.ellipse([(bx-r)*SS,(by-r)*SS,(bx+r)*SS,(by+r)*SS],fill=CORAL+(255,))
        f=font(FONT,int(84*sc)*SS); w=d.textlength("!",font=f); d.text((bx*SS-w/2,(by-r*0.85)*SS),"!",font=f,fill=(255,255,255,255))
    return to_full(img,A,glow)
