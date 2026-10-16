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
    pr=1-0.12*math.sin(min(1,max(0,((t-tp+0.12)%0.8)/0.24))*math.pi) if t>tp-0.12 else 1
    r=74*back((t-t0)/0.35)*pr
    d.ellipse([(BX-r)*SS,(Y-r)*SS,(BX+r)*SS,(Y+r)*SS],fill=CORAL+(255,))
    u=((t-tp)%0.8)/0.45 if t>=tp else -1
    if 0<u<1: rr=r+u*70; g.ellipse([(BX-rr)*SS,(Y-rr)*SS,(BX+rr)*SS,(Y+rr)*SS],outline=CORAL+(int(255*(1-u)),),width=8*SS)
    # amigo
    k=back((t-ta)/0.35)
    if t>ta:
        ra=66*k; d.ellipse([(AX-ra)*SS,(Y-ra)*SS,(AX+ra)*SS,(Y+ra)*SS],fill=BONE+(255,))
        d.ellipse([(AX-22*k)*SS,(Y-40*k)*SS,(AX+22*k)*SS,(Y+4*k)*SS],fill=(70,70,78,255))
        d.pieslice([(AX-42*k)*SS,(Y+10*k)*SS,(AX+42*k)*SS,(Y+80*k)*SS],180,360,fill=(70,70,78,255))
    # avión: sale una y otra vez del botón hasta el amigo (cada envío deja su estela)
    EV=0.8; n=int((t-tp)//EV)+1 if t>=tp else 0; arrived=0
    for j in range(max(0,n-2),n):
        fl=(t-tp-j*EV-0.05)/0.7
        if fl>=1: arrived=j+1; continue
        if fl<=0: continue
        e=eio(fl); hgt=170-35*(j%3)
        for q in range(1,10):
            e2=max(0,e-q*0.04); x2=BX+(AX-BX)*e2; y2=Y-hgt*math.sin(e2*math.pi)
            d.ellipse([(x2-5)*SS,(y2-5)*SS,(x2+5)*SS,(y2+5)*SS],fill=(255,255,255,int(220*(1-q/10))))
        x=BX+(AX-BX)*e; y=Y-hgt*math.sin(e*math.pi); ang=math.atan(-hgt*math.pi*math.cos(e*math.pi)/(AX-BX))
        plane(d,x,y,46,ang,(255,255,255,255))
    arrived=max(arrived,int(max(0,t-tp-0.75)//EV)+1 if t>=tp+0.75 else 0)
    since=(t-tp-0.05)%EV/0.7 if t>=tp else 1
    plane(d,BX-4,Y,44*(eo((since-0.3)/0.5) if t>=tp and since<0.8 else 1)*min(1,r/74)+0.01,-0.35,(255,255,255,255))
    # el amigo recibe: insignia coral con el número de envíos
    if arrived>0:
        tarr=tp+(arrived-1)*EV+0.75; k2=back((t-tarr)/0.3) if arrived==1 else 0.75+0.25*back((t-tarr)/0.25); bx,by=AX+52,Y-52; rb=32*k2
        d.ellipse([(bx-rb)*SS,(by-rb)*SS,(bx+rb)*SS,(by+rb)*SS],fill=CORAL+(255,))
        f=font(FONT,max(1,int(38*k2))*SS); s_=str(arrived); w=d.textlength(s_,font=f); d.text((bx*SS-w/2,(by-24*k2)*SS),s_,font=f,fill=(255,255,255,255))
    return to_full(img,A,glow)
