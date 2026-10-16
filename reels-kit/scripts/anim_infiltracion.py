# Infiltración: jeringa que entra en el tendón (músculo-tendón-hueso de animacion_tendon) e inyecta líquido.
# pulses = [pinchazo, empieza a inyectar, termina de inyectar]
import numpy as np, cv2, math
from PIL import Image, ImageDraw
import animacion_tendon as T
from anim_base import *
FONT=None; CY=800; OY=CY-450
LX=535   # zona lesionada del tendón
def syringe(fill):
    """Jeringa horizontal con la punta en el centro del lienzo, cuerpo hacia la derecha. fill: 1 llena -> 0 vacía."""
    R=520*SS; c=Image.new('RGBA',(2*R,2*R),(0,0,0,0)); d=ImageDraw.Draw(c)
    def r(x0,y0,x1,y1,**k): d.rectangle([R+x0*SS,R+y0*SS,R+x1*SS,R+y1*SS],**k)
    def rr(x0,y0,x1,y1,rad,**k): d.rounded_rectangle([R+x0*SS,R+y0*SS,R+x1*SS,R+y1*SS],radius=rad*SS,**k)
    r(0,-3,115,3,fill=(215,218,225,255))                               # aguja
    d.polygon([(R,R-3*SS),(R+14*SS,R-3*SS),(R,R+1*SS)],fill=(0,0,0,0))  # bisel
    rr(112,-13,142,13,4,fill=BONE+(255,))                               # cono
    xp=150+190*fill                                                     # émbolo
    rr(142,-36,345,36,10,fill=(255,255,255,45),outline=BONE+(255,),width=5*SS)
    if fill>0.01: rr(147,-30,xp,30,6,fill=MINT+(245,))
    for k in range(6): r(170+k*30,-36,173+k*30,-22,fill=BONE+(200,))
    rr(xp,-31,xp+16,31,4,fill=(70,70,78,255))
    r(xp+16,-8,xp+150,8,fill=BONE+(255,))
    rr(xp+150,-40,xp+162,40,4,fill=BONE+(255,))
    rr(342,-58,352,58,4,fill=BONE+(255,))                                # aletas
    return c,R
def draw(t,scene,t0,t1,pulses,broken):
    A=fade_io(t,t0,t1)
    if A<=0: return None
    T.FONT=FONT; T.CY=CY; T.OY=OY
    base=T.draw(t,'A',t0,t1,[],[])            # músculo, fibras sanas, hueso y rótulos (sin pulsos de luz)
    if base is None: return None
    tp,ts,te=pulses
    glow=canvas(); g=ImageDraw.Draw(glow)
    inj=eio((t-ts)/(te-ts))
    # zona lesionada: brillo rojo que late y se calma cuando llega el líquido
    calm=eio((t-ts-0.6)/(te-ts+0.4))
    k=(0.75+0.25*math.sin(t*9))*(1-0.85*calm)
    if k>0.02: g.ellipse([(LX-62)*SS,(CY-46)*SS,(LX+62)*SS,(CY+46)*SS],fill=(255,60,60,int(255*min(1,k*1.3))))
    # líquido que se reparte alrededor del tendón
    if inj>0:
        rx=40+95*inj; ry=24+46*inj
        g.ellipse([(LX-rx)*SS,(CY-ry)*SS,(LX+rx)*SS,(CY+ry)*SS],fill=MINT+(int(185*min(1,inj*1.6)),))
        for j in range(5):
            u=((t*1.3+j*0.2)%1)
            rr_=20+u*(rx+20); g.ellipse([(LX+math.cos(j*1.3)*rr_-6)*SS,(CY+math.sin(j*2.1)*rr_*0.5-6)*SS,(LX+math.cos(j*1.3)*rr_+6)*SS,(CY+math.sin(j*2.1)*rr_*0.5+6)*SS],fill=MINT+(int(200*(1-u)*min(1,inj*3)),))
    # jeringa: entra en diagonal desde arriba a la derecha, pincha y empuja el émbolo
    ang=58; dx,dy=math.cos(math.radians(ang)),-math.sin(math.radians(ang))
    off=np.interp(t,[t0,t0+0.55,tp,tp+0.25],[330,70,70,-18])
    if t>te+0.35: off=-18+60*eio((t-te-0.35)/0.45)        # se retira un poco al acabar
    tip=(LX+off*dx,CY-34+off*dy)
    syr,R=syringe(1-inj)
    syr=syr.rotate(-(180-ang)+180,resample=Image.BICUBIC,center=(R,R))
    sx,sy=int(tip[0]*SS-R),int(tip[1]*SS-R)
    big=canvas(); big.paste(syr,(sx,sy),syr)
    if off<0:   # la punta que ha entrado en el tendón no se ve
        m=Image.new('L',big.size,255); ImageDraw.Draw(m).ellipse([(LX-30)*SS,(CY-40)*SS,(LX+30)*SS,(CY+34)*SS],fill=0)
        big.putalpha(Image.fromarray(np.minimum(np.array(big)[...,3],np.array(m))))
    gl=to_full(glow,A); sy_=to_full(big,A)
    out=base
    halo=cv2.GaussianBlur(gl,(0,0),16); a=np.clip(halo[...,3:4]*1.5,0,1)*0.7
    out[...,:3]=out[...,:3]*(1-a)+halo[...,:3]*a; out[...,3:4]=np.maximum(out[...,3:4],a)
    for lay in (gl,sy_):
        a=lay[...,3:4]; out[...,:3]=out[...,:3]*(1-a)+lay[...,:3]*a; out[...,3:4]=np.maximum(out[...,3:4],a)
    return out
