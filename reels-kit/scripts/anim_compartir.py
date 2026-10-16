# CTA compartir: botón de enviar (avión de papel) que se pulsa -> el avión vuela hasta el amigo -> el amigo recibe (check).
# pulses = [pulsación/lanzamiento, aparece el amigo]
import math, numpy as np
from PIL import Image, ImageDraw
from anim_base import *
FONT=None; Y=1440; BX,AX=330,760
def plane(d,cx,cy,s,ang,col):
    pts=[(-0.95,-0.35),(1.0,0.0),(-0.95,0.42),(-0.55,0.03)]
    ca,sa=math.cos(ang),math.sin(ang)
    P=[((cx+s*(x*ca-y*sa))*SS,(cy+s*(x*sa+y*ca))*SS) for x,y in pts]
    d.polygon(P,fill=col); d.line([P[3],P[1]],fill=CORAL+(255,),width=max(1,int(s*0.07*SS)))
def draw(t,scene,t0,t1,pulses,broken):
    A=fade_io(t,t0,t1,0.25,0.3)
    if A<=0: return None
    tp,ta=pulses
    img=canvas(); d=ImageDraw.Draw(img); glow=canvas(); g=ImageDraw.Draw(glow)
    # botón
    pr=1-0.12*math.sin(min(1,max(0,(t-tp+0.12)/0.24))*math.pi)
    r=74*back((t-t0)/0.35)*pr
    d.ellipse([(BX-r)*SS,(Y-r)*SS,(BX+r)*SS,(Y+r)*SS],fill=CORAL+(255,))
    u=(t-tp)/0.45
    if 0<u<1: rr=r+u*70; g.ellipse([(BX-rr)*SS,(Y-rr)*SS,(BX+rr)*SS,(Y+rr)*SS],outline=CORAL+(int(255*(1-u)),),width=8*SS)
    # amigo
    k=back((t-ta)/0.35)
    if t>ta:
        ra=66*k; d.ellipse([(AX-ra)*SS,(Y-ra)*SS,(AX+ra)*SS,(Y+ra)*SS],fill=BONE+(255,))
        d.ellipse([(AX-22*k)*SS,(Y-40*k)*SS,(AX+22*k)*SS,(Y+4*k)*SS],fill=(70,70,78,255))
        d.pieslice([(AX-42*k)*SS,(Y+10*k)*SS,(AX+42*k)*SS,(Y+80*k)*SS],180,360,fill=(70,70,78,255))
    # avión: en el botón -> vuela en arco hasta el amigo
    fl=(t-tp-0.05)/0.75
    if fl<=0: plane(d,BX-4,Y,44*min(1,r/74),-0.35,(255,255,255,255))
    elif fl<1:
        e=eio(fl); x=BX+(AX-BX)*e; y=Y-170*math.sin(e*math.pi)
        dydx=-170*math.pi*math.cos(e*math.pi)/(AX-BX); ang=math.atan(dydx)
        for j in range(1,9):                       # estela de puntos
            e2=max(0,e-j*0.045); x2=BX+(AX-BX)*e2; y2=Y-170*math.sin(e2*math.pi)
            d.ellipse([(x2-5)*SS,(y2-5)*SS,(x2+5)*SS,(y2+5)*SS],fill=(255,255,255,int(200*(1-j/9))))
        plane(d,x,y,46,ang,(255,255,255,255))
        plane(d,BX-4,Y,44*eo((fl-0.4)/0.4) if fl>0.4 else 0.01,-0.35,(255,255,255,255))
    else:
        plane(d,BX-4,Y,44,-0.35,(255,255,255,255))
        k2=back((t-tp-0.8)/0.3); bx,by=AX+50,Y-50; rb=30*k2
        d.ellipse([(bx-rb)*SS,(by-rb)*SS,(bx+rb)*SS,(by+rb)*SS],fill=CORAL+(255,))
        d.line([((bx-13*k2)*SS,(by)*SS),((bx-3*k2)*SS,(by+11*k2)*SS),((bx+14*k2)*SS,(by-10*k2)*SS)],fill=(255,255,255,255),width=7*SS,joint='curve')
    return to_full(img,A,glow)
