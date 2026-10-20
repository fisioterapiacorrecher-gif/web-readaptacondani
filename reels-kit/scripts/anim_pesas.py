# "Es como ir al gimnasio y que alguien levante las pesas por ti": mancuerna que se levanta SOLA (repeticiones con
# rayitas de movimiento) y se tacha con la señal de prohibido. pulses = [empieza a subir sola, prohibido].
import math, numpy as np
from PIL import Image, ImageDraw
from anim_base import *
from anim_sin import no_sign
FONT=None; CY=920; OY=CY-450
def dumbbell(d,cx,cy,sc):
    P=lambda x,y:((cx+x*sc)*SS,(cy+y*sc)*SS)
    d.rounded_rectangle([*P(-230,-16),*P(230,16)],radius=int(16*sc*SS),fill=BONE+(255,))            # barra
    for s in (1,-1):
        d.rounded_rectangle([*sorted_box(P(s*150,-112),P(s*205,112))],radius=int(18*sc*SS),fill=CORAL+(255,))   # disco grande
        d.rounded_rectangle([*sorted_box(P(s*210,-78),P(s*250,78))],radius=int(14*sc*SS),fill=CORAL+(255,))    # disco pequeño
        d.rounded_rectangle([*sorted_box(P(s*126,-34),P(s*148,34))],radius=int(8*sc*SS),fill=(225,221,206,255))  # tope
        d.line([P(s*162,-88),P(s*162,40)],fill=(255,255,255,90),width=int(9*sc*SS))                     # brillo
def sorted_box(a,b): return (min(a[0],b[0]),min(a[1],b[1]),max(a[0],b[0]),max(a[1],b[1]))
def draw(t,scene,t0,t1,pulses,broken):
    A=fade_io(t,t0,t1)
    if A<=0: return None
    tl,tn=pulses
    img=canvas(); d=ImageDraw.Draw(img); glow=canvas(); g=ImageDraw.Draw(glow)
    sc=back((t-t0)/0.35)
    floor=CY+230
    lift=0.0; v=0.0
    if t>tl:                                                  # repeticiones: sube y baja sola (0,7 s cada una)
        u=(t-tl)/0.7; ph=u%1; amp=170*eo((t-tl)/0.25)
        lift=amp*math.sin(ph*math.pi)**1.4; v=math.cos(ph*math.pi)
    by=floor-120-lift
    # sombra en el suelo (se encoge al subir)
    r=230*sc*(1-0.35*lift/170)
    d.ellipse([(540-r)*SS,(floor-14)*SS,(540+r)*SS,(floor+14)*SS],fill=(0,0,0,int(110*(1-0.5*lift/170))))
    # rayitas de movimiento bajo los discos mientras sube
    if t>tl and v>0.15:
        for x in (330,385,695,750):
            a=int(230*min(1,v))
            d.line([(x*SS,(by+130)*SS),(x*SS,(by+130+70*v)*SS)],fill=BONE+(a,),width=10*SS)
    dumbbell(d,540,by,1.2*sc)
    no_sign(d,g,540,CY+40,320,(t-tn)/0.3)
    return to_full(img,A,glow)
