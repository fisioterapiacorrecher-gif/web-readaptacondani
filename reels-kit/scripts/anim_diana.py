# «Un plan definido desde el principio»: diana que entra con rebote y una flecha que vuela y se clava en el centro
# (temblor de la flecha, onda coral y la diana se hunde un poco). Texto PLAN / DEFINIDO arriba (key con glow).
# pulses = [impacto de la flecha]
import math, numpy as np
from PIL import Image, ImageDraw
from anim_base import *
FONT=None; CY=1010; RD=250
def draw(t,scene,t0,t1,pulses,broken):
    A=fade_io(t,t0,t1,0.2,0.25)
    if A<=0: return None
    th=pulses[0] if pulses else t0+0.5
    img=canvas(); d=ImageDraw.Draw(img); glow=canvas(); g=ImageDraw.Draw(glow)
    sh=canvas(); ImageDraw.Draw(sh).ellipse([(540-RD-120)*SS,(CY-RD-120)*SS,(540+RD+120)*SS,(CY+RD+120)*SS],fill=(0,0,0,90))
    sh=Image.fromarray(cv2.GaussianBlur(np.array(sh),(0,0),36*SS))
    k=back((t-t0)/0.35); hit=t-th
    push=8*math.exp(-hit/0.12)*math.sin(hit*40) if hit>0 else 0      # la diana se hunde y vuelve al recibir
    r0=RD*min(1.1,0.25+0.75*k); cx,cy=540+push*0.6,CY-push*0.4
    cols=[CORAL,BONE,CORAL,BONE,CORAL]
    for j,c in enumerate(cols):
        r=r0*(1-j*0.19); d.ellipse([(cx-r)*SS,(cy-r)*SS,(cx+r)*SS,(cy+r)*SS],fill=c+(255,))
    if hit>0:                                                        # onda coral al clavarse
        u=hit/0.5
        if u<1: rr=r0*(0.25+u*1.1); g.ellipse([(cx-rr)*SS,(cy-rr)*SS,(cx+rr)*SS,(cy+rr)*SS],outline=CORAL+(int(255*(1-u)),),width=10*SS)
    # flecha: llega desde abajo a la derecha y se clava en el centro
    ang=math.radians(-35); dx,dy=math.cos(ang),-math.sin(ang)          # dirección de la cola (abajo-derecha)
    L=330
    if hit<0:
        q=eo((t-(th-0.32))/0.32) if t>th-0.32 else 0
        if q<=0: tipx,tipy=None,None
        else: off=(1-q)*900; tipx,tipy=cx+dx*off,cy+dy*off
        wob=0
    else:
        tipx,tipy=cx,cy; wob=0.09*math.exp(-hit/0.35)*math.sin(hit*45)
    if tipx is not None:
        a2=math.atan2(dy,dx)+wob; ux,uy=math.cos(a2),math.sin(a2)
        tx,ty=tipx+ux*L,tipy+uy*L
        d.line([(tipx*SS,tipy*SS),(tx*SS,ty*SS)],fill=(40,36,36,255),width=20*SS)
        d.line([(tipx*SS,tipy*SS),(tx*SS,ty*SS)],fill=BONE+(255,),width=13*SS)
        nx,ny=-uy,ux
        for s_ in (1,-1):                                            # plumas menta
            P=[(tx-ux*70,ty-uy*70),(tx-ux*10+nx*34*s_,ty-uy*10+ny*34*s_),(tx+ux*12+nx*34*s_,ty+uy*12+ny*34*s_),(tx,ty)]
            d.polygon([(x*SS,y*SS) for x,y in P],fill=MINT+(255,))
        if hit<0:                                                    # punta mientras vuela
            P=[(tipx-ux*6,tipy-uy*6),(tipx+ux*34+nx*16,tipy+uy*34+ny*16),(tipx+ux*34-nx*16,tipy+uy*34-ny*16)]
            d.polygon([(x*SS,y*SS) for x,y in P],fill=(40,36,36,255))
            for q2 in range(1,6):                                    # estela
                ex,ey=tx+ux*q2*40,ty+uy*q2*40; rr=6*(1-q2/6)
                d.ellipse([(ex-rr)*SS,(ey-rr)*SS,(ex+rr)*SS,(ey+rr)*SS],fill=(255,255,255,int(200*(1-q2/6))))
    out=to_full(img,A,glow); s=to_full(sh,A)
    a2_=out[...,3:4]; s[...,:3]=s[...,:3]*(1-a2_)+out[...,:3]*a2_; s[...,3:4]=np.maximum(s[...,3:4],a2_)
    return s
import cv2
