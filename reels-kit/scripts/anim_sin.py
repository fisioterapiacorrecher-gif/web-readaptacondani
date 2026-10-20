# "Sin agujas y sin corrientes": jeringa y electrodo (TENS con rayo) que aparecen al decirlos y se tachan con la señal
# de prohibido coral. pulses = [aparece la aguja, aparece la corriente]. scene = "ETIQUETA 1|ETIQUETA 2".
import math, numpy as np
from PIL import Image, ImageDraw
from anim_base import *
from anim_infiltracion import syringe
FONT=None; CY=920; OY=CY-450
def electrode(c,cx,cy,sc):
    d=ImageDraw.Draw(c); P=lambda x,y:((cx+x*sc)*SS,(cy+y*sc)*SS)
    d.line([P(-60,-95),P(-60,-150),P(0,-185),P(60,-150),P(60,-95)],fill=(70,70,78,255),width=int(10*sc*SS),joint='curve')
    for x in (-60,60):
        d.rounded_rectangle([*P(x-48,-95),*P(x+48,95)],radius=int(22*sc*SS),fill=BONE+(255,))
        d.rounded_rectangle([*P(x-30,-75),*P(x+30,75)],radius=int(14*sc*SS),fill=(225,221,206,255))
    bolt=[(-18,-62),(14,-62),(0,-12),(26,-12),(-16,64),(-4,8),(-28,8)]
    for x in (-60,60): d.polygon([P(x+bx,by) for bx,by in bolt],fill=CORAL+(255,))
def no_sign(d,g,cx,cy,r,k):
    if k<=0: return
    w=int(22*SS)
    g.arc([(cx-r)*SS,(cy-r)*SS,(cx+r)*SS,(cy+r)*SS],-90,-90+360*min(1,k*1.6),fill=CORAL+(255,),width=w)
    k2=eo((k-0.45)/0.55)
    if k2>0:
        a=math.radians(-45+180); ex=cx+math.cos(math.radians(-45))*r*0.92; ey=cy-math.sin(math.radians(-45))*r*0.92
        sx=cx-math.cos(math.radians(-45))*r*0.92; sy=cy+math.sin(math.radians(-45))*r*0.92
        g.line([((sx+(ex-sx)*0)*SS,(sy+(ey-sy)*0)*SS),((sx+(ex-sx)*k2)*SS,(sy+(ey-sy)*k2)*SS)],fill=CORAL+(255,),width=w)
def draw(t,scene,t0,t1,pulses,broken):
    A=fade_io(t,t0,t1)
    if A<=0: return None
    labs=(scene or "SIN AGUJAS|SIN CORRIENTES").split('|')
    img=canvas(); d=ImageDraw.Draw(img); glow=canvas(); g=ImageDraw.Draw(glow)
    f=font(FONT,54*SS)
    for i,(cx,ti) in enumerate(((285,pulses[0]),(795,pulses[1]))):
        u=t-ti
        if u<0: continue
        sc=back(u/0.35)
        d.ellipse([(cx-215*sc)*SS,(CY-215*sc)*SS,(cx+215*sc)*SS,(CY+215*sc)*SS],fill=(0,0,0,90))
        if i==0:
            syr,R=syringe(0.85); syr=syr.rotate(45,resample=Image.BICUBIC,center=(R,R))
            k=0.8*sc; syr=syr.resize((int(syr.width*k),int(syr.height*k)),Image.BICUBIC); Rk=R*k
            img.alpha_composite(syr,(int((cx-160)*SS-Rk),int((CY+160)*SS-Rk)))
        else:
            electrode(img,cx,CY+25,1.22*sc)
        no_sign(d,g,cx,CY,200,(u-0.3)/0.4)
        a=int(255*eo(u/0.3)); w=d.textlength(labs[i],font=f)
        d.text((cx*SS-w/2,(CY+250)*SS),labs[i],font=f,fill=(255,255,255,a),stroke_width=4*SS,stroke_fill=(0,0,0,140))
    return to_full(img,A,glow)
