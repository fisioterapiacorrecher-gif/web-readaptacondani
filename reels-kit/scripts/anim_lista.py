# Lista de efectos (sustituye al subtítulo): título pequeño + filas con flecha hacia abajo en círculo coral.
# pulses = [aparece fila 1, aparece fila 2, ...]; ITEMS/TITLE se fijan desde edit.json con "scene" = "TÍTULO|fila1|fila2"
import math, numpy as np
from PIL import Image, ImageDraw
from anim_base import *
FONT=None; Y0=1035
def draw(t,scene,t0,t1,pulses,broken):
    A=fade_io(t,t0,t1,0.2,0.2)
    if A<=0: return None
    parts=scene.split('|'); title,items=parts[0],parts[1:]
    img=canvas(); d=ImageDraw.Draw(img); fT=font(FONT,46*SS); fI=font(FONT,84*SS)
    wmax=max(d.textlength(x,font=fI) for x in items)/SS+120; x0=540-wmax/2
    # sombra suave detrás del bloque para que se lea sobre el vídeo
    sh=canvas(); ImageDraw.Draw(sh).rounded_rectangle([(x0-50)*SS,(Y0-40)*SS,(x0+wmax+50)*SS,(Y0+110+len(items)*118)*SS],60*SS,fill=(0,0,0,120))
    sh=Image.fromarray(cv2.GaussianBlur(np.array(sh),(0,0),30*SS))
    a=eo((t-t0)/0.25)
    w=d.textlength(title,font=fT); d.text((x0*SS,(Y0+(1-a)*20)*SS),title,font=fT,fill=(255,251,232,int(235*a)),stroke_width=3*SS,stroke_fill=(0,0,0,120))
    for i,(txt,ti) in enumerate(zip(items,pulses)):
        u=(t-ti)/0.32
        if u<0: continue
        k=eo(u); y=Y0+80+i*118; dx=(1-k)*-40
        cx=x0+44+dx; cy=y+46; r=40*(0.6+0.4*back(u))
        d.ellipse([(cx-r)*SS,(cy-r)*SS,(cx+r)*SS,(cy+r)*SS],fill=CORAL+(int(255*k),))
        ay=cy+8*math.sin(min(1,u*0.9)*math.pi)                       # la flecha baja y vuelve
        d.line([(cx*SS,(ay-20)*SS),(cx*SS,(ay+16)*SS)],fill=(255,255,255,int(255*k)),width=8*SS)
        d.polygon([((cx-17)*SS,(ay+4)*SS),((cx+17)*SS,(ay+4)*SS),(cx*SS,(ay+24)*SS)],fill=(255,255,255,int(255*k)))
        d.text(((x0+110+dx)*SS,(y)*SS),txt,font=fI,fill=(255,255,255,int(255*k)),stroke_width=4*SS,stroke_fill=(0,0,0,110))
    out=to_full(img,A); s=to_full(sh,A*a)
    a2=out[...,3:4]; s[...,:3]=s[...,:3]*(1-a2)+out[...,:3]*a2; s[...,3:4]=np.maximum(s[...,3:4],a2)
    return s
import cv2
