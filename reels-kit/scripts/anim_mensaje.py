# CTA "escríbeme un mensaje": barra de chat que sube, el mensaje se escribe solo, se pulsa enviar,
# el mensaje sube como burbuja coral (✓✓) y Dani empieza a responder (burbuja con puntos "escribiendo…").
# scene = texto del mensaje (p. ej. "Quiero volver a correr"); pulses = [enviar, aparece la respuesta]
# Se queda hasta el final del vídeo (pon en > END). Sin desenfoque ("blur": false).
import math
from PIL import ImageDraw
from anim_base import *
FONT=None; Y=1500          # centro de la barra de chat (debajo de los subtítulos, y = 1180)
X0,X1=90,990; BH=104       # barra
DARK=(28,28,32)
def draw(t,scene,t0,t1,pulses,broken):
    A=fade_io(t,t0,t1,0.25,0.25)
    if A<=0: return None
    ts,tr=pulses; msg=scene or "Quiero volver a correr"
    img=canvas(); d=ImageDraw.Draw(img); glow=canvas(); g=ImageDraw.Draw(glow)
    f=font(FONT,40*SS)
    # 1) barra de chat que sube desde abajo
    k=eo((t-t0)/0.35); y=Y+(1-k)*160
    d.rounded_rectangle([X0*SS,(y-BH/2)*SS,X1*SS,(y+BH/2)*SS],BH/2*SS,fill=BONE+(int(245*k),))
    # texto que se escribe letra a letra hasta enviar
    if t<ts:
        n=int(len(msg)*min(1,max(0,(t-t0-0.15)/max(0.2,ts-t0-0.3))))
        txt=msg[:n]; d.text(((X0+46)*SS,(y-26)*SS),txt,font=f,fill=DARK+(255,))
        if int(t*4)%2==0 or n<len(msg):          # cursor
            cx=X0+46+d.textlength(txt,font=f)/SS+6; d.rectangle([cx*SS,(y-24)*SS,(cx+4)*SS,(y+26)*SS],fill=CORAL+(255,))
    else:
        d.text(((X0+46)*SS,(y-26)*SS),"Mensaje…",font=f,fill=(150,145,140,int(255*eo((t-ts)/0.3))))
    # botón enviar (círculo coral con avión de papel), se hunde al pulsar
    bx,by=X1-BH/2,y; pr=1-0.16*math.sin(min(1,max(0,(t-ts+0.1)/0.24))*math.pi) if t>ts-0.1 else 1
    r=40*back((t-t0-0.1)/0.35)*pr
    d.ellipse([(bx-r)*SS,(by-r)*SS,(bx+r)*SS,(by+r)*SS],fill=CORAL+(255,))
    s=r*0.52; P=[(bx-0.9*s,by-0.8*s),(bx+1.0*s,by),(bx-0.9*s,by+0.8*s),(bx-0.45*s,by)]
    d.polygon([(px*SS,py*SS) for px,py in P],fill=(255,255,255,255))
    u=(t-ts)/0.45
    if 0<u<1: rr=r+u*60; g.ellipse([(bx-rr)*SS,(by-rr)*SS,(bx+rr)*SS,(by+rr)*SS],outline=CORAL+(int(255*(1-u)),),width=7*SS)
    # 2) el mensaje sube como burbuja coral a la derecha
    if t>=ts:
        q=eo((t-ts)/0.4); w=d.textlength(msg,font=f)/SS+80; bh=96
        x1=X1; x0=x1-w; yb=(y-BH/2-30-bh/2)*q+y*(1-q)-(95 if t>=tr else 0)*eo((t-tr)/0.35)
        sc=0.7+0.3*back((t-ts)/0.4)
        cx,cy=(x0+x1)/2,yb; hw,hh=w/2*sc,bh/2*sc
        d.rounded_rectangle([(cx-hw)*SS,(cy-hh)*SS,(cx+hw)*SS,(cy+hh)*SS],int(34*sc)*SS,fill=CORAL+(255,))
        fs=font(FONT,max(1,int(40*sc))*SS); tw=d.textlength(msg,font=fs)
        d.text((cx*SS-tw/2,(cy-26*sc)*SS),msg,font=fs,fill=(255,255,255,255))
        # doble check debajo
        c=eo((t-ts-0.35)/0.3)
        if c>0:
            for j in (0,1):
                ox=cx+hw-40+j*14; oy=cy+hh+22
                d.line([((ox-10)*SS,oy*SS),((ox-3)*SS,(oy+8)*SS),((ox+10)*SS,(oy-8)*SS)],fill=MINT+(int(255*c),),width=4*SS,joint='curve')
    # 3) respuesta: burbuja gris a la izquierda con puntos "escribiendo…"
    if t>=tr:
        q=back((t-tr)/0.35); cx,cy=X0+90,y-BH/2-70+60*(1-eo((t-tr)/0.35))
        hw,hh=80*q,40*q
        d.rounded_rectangle([(cx-hw)*SS,(cy-hh)*SS,(cx+hw)*SS,(cy+hh)*SS],int(36*q)*SS,fill=(242,242,242,255))
        for j in range(3):
            ph=(t-tr)*5-j*0.6; dy=-8*max(0,math.sin(ph)) if ph>0 else 0
            rr=9*q; px=cx+(j-1)*28*q; py=cy+dy
            d.ellipse([(px-rr)*SS,(py-rr)*SS,(px+rr)*SS,(py+rr)*SS],fill=(120,115,110,255))
    return to_full(img,A,glow)
