# Corredor de perfil al estilo de las ilustraciones del manual de marca (planas, sin contorno, piel clara,
# dolor marcado con brillo coral y rayitos rojos). Corre; en pulses[0] frena, cojea y se marca el dolor en el tendón.
import math, numpy as np
from PIL import Image, ImageDraw
from anim_base import *
FONT=None; CY=920; OY=CY-450
SKIN=(247,214,200); SHIRT=(241,241,241); SHORTS=CORAL; SHOE=(60,58,62); SOLE=BONE; HAIR=(45,38,36)
def dark(c,k=0.78): return tuple(int(v*k) for v in c)
def taper(d,p0,p1,r0,r1,col,rm=None):
    """Segmento con grosor variable (r0 -> rm -> r1) y extremos redondeados."""
    n=14; dx,dy=p1[0]-p0[0],p1[1]-p0[1]; L=math.hypot(dx,dy) or 1; nx,ny=-dy/L,dx/L
    rm=rm if rm is not None else (r0+r1)/2; L1,L2=[],[]
    for i in range(n+1):
        u=i/n; r=(1-u)**2*r0+2*u*(1-u)*rm+u*u*r1; x,y=p0[0]+dx*u,p0[1]+dy*u
        L1.append(((x+nx*r)*SS,(y+ny*r)*SS)); L2.append(((x-nx*r)*SS,(y-ny*r)*SS))
    d.polygon(L1+L2[::-1],fill=col+(255,))
    for p,r in ((p0,r0),(p1,r1)): d.ellipse([(p[0]-r)*SS,(p[1]-r)*SS,(p[0]+r)*SS,(p[1]+r)*SS],fill=col+(255,))
def at(o,a,l): return (o[0]+l*math.sin(a),o[1]+l*math.cos(a))   # ángulo desde la vertical hacia abajo, + hacia delante
def pose_run(ph):
    th=0.55*math.sin(ph)+0.05; kn=0.22+1.55*max(0,math.cos(ph+0.4))**1.3
    return th,kn
def draw(t,scene,t0,t1,pulses,broken):
    A=fade_io(t,t0,t1)
    if A<=0: return None
    ts=pulses[0]; b=eio((t-ts)/0.35)                       # 0 corriendo -> 1 parado y dolorido
    tt=min(t,ts+0.15*(1-math.exp(-(t-ts)/0.15))) if t>ts else t
    ph=2*math.pi*1.45*(tt-t0)
    img=canvas(); d=ImageDraw.Draw(img); glow=canvas(); g=ImageDraw.Draw(glow)
    Z=1.45; mix=lambda a,c: a*(1-b)+c*b
    lean=mix(0.16,0.32); bob=mix(-9*math.cos(2*ph),10)
    hip=(540,CY+60+bob)
    neck=(hip[0]+175*Z*math.sin(lean),hip[1]-175*Z*math.cos(lean))
    # piernas: (muslo, rodilla) corriendo -> postura de dolor (pierna cercana sin apoyar)
    thN,knN=pose_run(ph); thF,knF=pose_run(ph+math.pi)
    thN,knN=mix(thN,0.32),mix(knN,0.95); thF,knF=mix(thF,-0.06),mix(knF,0.12)
    def leg(th,kn,cs,cl,csh):
        k=at(hip,th,118*Z); a=at(k,th-kn,118*Z)
        taper(d,hip,k,30*Z,19*Z,cs,29*Z)                    # muslo
        taper(d,k,a,18*Z,10*Z,cs,23*Z)                      # gemelo
        fa=th-kn+math.pi/2+0.1                              # pie
        toe=at(a,fa,46*Z); taper(d,(a[0]-8*Z*math.sin(fa),a[1]-8*Z*math.cos(fa)),toe,15*Z,10*Z,csh)
        taper(d,hip,at(hip,th,52*Z),34*Z,26*Z,cl)           # pantalón corto
        return k,a,fa
    def arm(sh,el,cs,cc):
        e=at(neck,sh,88*Z); w=at(e,sh-el,82*Z)
        taper(d,neck,e,16*Z,12*Z,cs,15*Z); taper(d,e,w,12*Z,10*Z,cs,13*Z)
        taper(d,neck,at(neck,sh,34*Z),20*Z,16*Z,cc)          # manga
    shN=mix(-0.75*math.sin(ph),0.25); shF=mix(0.75*math.sin(ph),-0.15); el=mix(1.55,0.7)
    arm(shF,el,dark(SKIN),dark(SHIRT))
    leg(thF,knF,dark(SKIN),dark(SHORTS),dark(SHOE))
    # tronco con camiseta
    taper(d,hip,neck,31*Z,33*Z,SHIRT,37*Z)
    nk=at(neck,math.pi-lean,22*Z); taper(d,neck,nk,11*Z,11*Z,SKIN)
    k,a,fa=leg(thN,knN,SKIN,SHORTS,SHOE)
    arm(shN,el,SKIN,SHIRT)
    hd=at(neck,math.pi-lean+mix(0,-0.35),62*Z); r=36*Z
    d.ellipse([(hd[0]-r)*SS,(hd[1]-r)*SS,(hd[0]+r)*SS,(hd[1]+r)*SS],fill=SKIN+(255,))
    d.pieslice([(hd[0]-r*1.04)*SS,(hd[1]-r*1.08)*SS,(hd[0]+r*1.04)*SS,(hd[1]+r*1.0)*SS],160,330,fill=HAIR+(255,))
    d.ellipse([(hd[0]-r*0.25)*SS,(hd[1]-r*0.2)*SS,(hd[0]+r*0.05)*SS,(hd[1]+r*0.25)*SS],fill=dark(SKIN,0.9)+(255,))  # oreja
    # suelo y líneas de velocidad
    gy=CY+60+2*118*Z+30
    d.line([((540-320)*SS,gy*SS),((540+320)*SS,gy*SS)],fill=BONE+(120,),width=5*SS)
    for j in range(4):
        u=((tt-t0)*2.6+j/4)%1; x=540+250-u*600; y=CY-150+j*80; al=int(190*(1-b)*math.sin(u*math.pi))
        if al>0: d.line([(x*SS,y*SS),((x+100)*SS,y*SS)],fill=BONE+(al,),width=7*SS)
    # dolor en el tendón de Aquiles: brillo coral + rayitos rojos (estilo del manual)
    if t>ts:
        u=t-ts; k_=eo(u/0.25); px,py=at(k,thN-knN,92*Z); px-=12*Z
        pul=1+0.12*math.sin(u*2*math.pi*2.2)
        for rr,al in ((44,80),(30,150),(17,235)):
            R=rr*Z*k_*pul; g.ellipse([(px-R)*SS,(py-R)*SS,(px+R)*SS,(py+R)*SS],fill=CORAL+(al,))
        for j in range(6):
            an=-2.6+j*0.55; r0=56*Z; r1=r0+26*Z*k_
            m=((px+math.cos(an)*r0),(py+math.sin(an)*r0)); m2=((px+math.cos(an)*(r0+r1)/2+7),(py+math.sin(an)*(r0+r1)/2-7)); e=((px+math.cos(an)*r1),(py+math.sin(an)*r1))
            if k_>0.1: g.line([(m[0]*SS,m[1]*SS),(m2[0]*SS,m2[1]*SS),(e[0]*SS,e[1]*SS)],fill=CORAL+(int(255*k_),),width=7*SS)
    return to_full(img,A,glow)
