# (Versión anterior, dibujada por código. La que se usa ahora es anim_corredor.py con la ilustración de assets/corredor.png.)
# Corredor de perfil al estilo de las ilustraciones del manual de marca (planas, sin contorno, piel clara,
# dolor marcado con brillo coral y rayitos rojos). Cada miembro es una silueta continua con forma de músculo
# (sin círculos en las articulaciones). Corre; en pulses[0] frena, cojea y se marca el dolor en el Aquiles.
import math, numpy as np
from PIL import Image, ImageDraw
from anim_base import *
FONT=None; CY=920; OY=CY-450
SKIN=(247,214,200); SHIRT=(241,241,241); SHORTS=CORAL; SHOE=(60,58,62); HAIR=(45,38,36)
def dark(c,k=0.8): return tuple(int(v*k) for v in c)
def path(pts,n=48):
    P=np.array(pts,float)
    for _ in range(3):                                   # Chaikin: redondea codos y rodillas
        Q=[P[0]]
        for a,b in zip(P[:-1],P[1:]): Q+= [0.75*a+0.25*b,0.25*a+0.75*b]
        Q.append(P[-1]); P=np.array(Q)
    seg=np.hypot(*np.diff(P,axis=0).T); s=np.concatenate([[0],np.cumsum(seg)]); s/=s[-1]
    u=np.linspace(0,1,n); return np.stack([np.interp(u,s,P[:,0]),np.interp(u,s,P[:,1])],1),u
def part(d,pts,prof_l,prof_r,col,s0=0.0,s1=1.0,grow=0.0,caps=True):
    """Silueta a lo largo de pts. prof_*: [(s,radio)], izquierda = lado posterior en piernas / anterior en tronco."""
    C,u=path(pts); T=np.gradient(C,axis=0); T/=np.linalg.norm(T,axis=1,keepdims=True)+1e-9; N=np.stack([-T[:,1],T[:,0]],1)
    m=(u>=s0-1e-6)&(u<=s1+1e-6); C,N,u=C[m],N[m],u[m]
    rl=np.interp(u,*zip(*prof_l))+grow; rr=np.interp(u,*zip(*prof_r))+grow
    L=C+N*rl[:,None]; R=C-N*rr[:,None]
    poly=[(x*SS,y*SS) for x,y in np.concatenate([L,R[::-1]])]
    d.polygon(poly,fill=col+(255,))
    ends=[(C[0],(rl[0]+rr[0])/2)]+([(C[-1],(rl[-1]+rr[-1])/2)] if caps else [])
    for p,r in ends:   # extremos suaves (quedan tapados); caps=False deja recto el final (bajo del pantalón, manga)
        d.ellipse([(p[0]-r)*SS,(p[1]-r)*SS,(p[0]+r)*SS,(p[1]+r)*SS],fill=col+(255,))
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
    Z=1.12; mix=lambda a,c: a*(1-b)+c*b
    lean=mix(0.15,0.30); bob=mix(-8*math.cos(2*ph),9)
    hip=(540,CY-55+bob)
    neck=(hip[0]+178*Z*math.sin(lean),hip[1]-178*Z*math.cos(lean))
    thN,knN=pose_run(ph); thF,knF=pose_run(ph+math.pi)
    thN,knN=mix(thN,0.32),mix(knN,0.95); thF,knF=mix(thF,-0.06),mix(knF,0.12)
    # suelo y líneas de velocidad
    gy=CY-55+2*121*Z+22
    d.line([((540-300)*SS,gy*SS),((540+300)*SS,gy*SS)],fill=BONE+(110,),width=5*SS)
    for j in range(4):
        u=((tt-t0)*2.6+j/4)%1; x=540+250-u*600; y=CY-230+j*70; al=int(190*(1-b)*math.sin(u*math.pi))
        if al>0: d.line([(x*SS,y*SS),((x+100)*SS,y*SS)],fill=BONE+(al,),width=7*SS)
    LEG_B=[(0,33*Z),(0.2,30*Z),(0.44,19*Z),(0.52,17*Z),(0.62,21*Z),(0.8,13*Z),(1,8*Z)]   # posterior (gemelo)
    LEG_F=[(0,31*Z),(0.2,30*Z),(0.42,22*Z),(0.5,17*Z),(0.62,14*Z),(0.8,11*Z),(1,8*Z)]   # anterior (cuádriceps)
    def leg(th,kn,cs,cl,csh):
        k=at(hip,th,122*Z); a=at(k,th-kn,120*Z)
        part(d,[hip,k,a],LEG_B,LEG_F,cs)
        part(d,[hip,k,a],LEG_B,LEG_F,cl,0,0.2,1.5,caps=False)  # pantalón corto
        fa=th-kn+math.pi/2+0.12; ca,sa=math.sin(fa),math.cos(fa); nx,ny=-sa,ca   # pie: eje y normal
        if ny<0: nx,ny=-nx,-ny
        shoe=[(-12,-10),(-16,2),(-14,12),(-6,16),(36,16),(48,13),(52,6),(46,-1),(26,-6),(6,-12)]
        P=[((a[0]+(u*ca+v*nx)*Z)*SS,(a[1]+(u*sa+v*ny)*Z)*SS) for u,v in shoe]
        d.polygon(P,fill=csh+(255,))
        sole=[(-14,12),(-6,16),(36,16),(48,13),(50,10),(-15,8)]
        d.polygon([((a[0]+(u*ca+v*nx)*Z)*SS,(a[1]+(u*sa+v*ny)*Z)*SS) for u,v in sole],fill=BONE+(255,))
        return k,a
    ARM=[(0,15*Z),(0.42,10.5*Z),(0.55,11.5*Z),(0.9,7*Z),(1,8.5*Z)]
    def arm(sh,el,cs,cc):
        e=at(neck,sh,86*Z); w=at(e,sh-el,92*Z)
        part(d,[neck,e,w],ARM,ARM,cs)
        part(d,[neck,e,w],ARM,ARM,cc,0,0.2,2.5,caps=False)        # manga
    shN=mix(-0.75*math.sin(ph),0.25); shF=mix(0.75*math.sin(ph),-0.15); el=mix(1.55,0.7)
    sh_pt=at(neck,lean+math.pi,-6*Z)
    arm(shF,el,dark(SKIN),dark(SHIRT))
    leg(thF,knF,dark(SKIN),dark(SHORTS),dark(SHOE))
    # tronco: pecho delante, espalda detrás (izquierda = delante al ir hacia arriba)
    TF=[(0,30*Z),(0.3,27*Z),(0.62,34*Z),(0.85,31*Z),(1,20*Z)]; TB=[(0,32*Z),(0.3,26*Z),(0.62,28*Z),(0.85,30*Z),(1,22*Z)]
    mid=((hip[0]+neck[0])/2-4*Z,(hip[1]+neck[1])/2)
    part(d,[hip,mid,neck],TF,TB,SHIRT)
    part(d,[hip,mid,neck],TF,TB,SHORTS,0,0.17,2)
    nk=at(neck,math.pi-lean,30*Z); part(d,[neck,nk],[(0,13*Z),(1,11*Z)],[(0,13*Z),(1,11*Z)],SKIN)
    k,a=leg(thN,knN,SKIN,SHORTS,SHOE)
    arm(shN,el,SKIN,SHIRT)
    # cabeza ovalada con mandíbula, nariz, oreja y pelo
    tilt=lean*0.5+mix(0,0.35); hd=at(nk,math.pi-tilt,30*Z)
    ct,st_=math.cos(tilt),math.sin(tilt)
    def H(x,y): return ((hd[0]+(x*ct-y*st_)*Z)*SS,(hd[1]+(x*st_+y*ct)*Z)*SS)
    head=[H(29*math.cos(q)*(1.06 if math.cos(q)>0 and math.sin(q)>0.2 else 1),38*math.sin(q)) for q in np.linspace(0,2*math.pi,48)]
    d.polygon(head,fill=SKIN+(255,))
    d.polygon([H(26,-6),H(36,4),H(27,9)],fill=SKIN+(255,))                       # nariz
    hair=[H(31*math.cos(q),40*math.sin(q)) for q in np.linspace(math.radians(160),math.radians(330),24)]+[H(18,-26),H(-6,-12),H(-22,6)]
    d.polygon(hair,fill=HAIR+(255,))
    d.ellipse([H(-9,-5)[0],H(-9,-5)[1],H(1,9)[0],H(1,9)[1]],fill=dark(SKIN,0.9)+(255,))
    # dolor en el tendón de Aquiles: brillo coral + rayitos rojos (estilo del manual)
    if t>ts:
        u=t-ts; k_=eo(u/0.25); px,py=at(k,thN-knN,98*Z); px-=10*Z
        pul=1+0.12*math.sin(u*2*math.pi*2.2)
        for rr,al in ((44,80),(30,150),(17,235)):
            R=rr*Z*k_*pul; g.ellipse([(px-R)*SS,(py-R)*SS,(px+R)*SS,(py+R)*SS],fill=CORAL+(al,))
        for j in range(6):
            an=-2.6+j*0.55; r0=56*Z; r1=r0+26*Z*k_
            m=((px+math.cos(an)*r0),(py+math.sin(an)*r0)); m2=((px+math.cos(an)*(r0+r1)/2+7),(py+math.sin(an)*(r0+r1)/2-7)); e=((px+math.cos(an)*r1),(py+math.sin(an)*r1))
            if k_>0.1: g.line([(m[0]*SS,m[1]*SS),(m2[0]*SS,m2[1]*SS),(e[0]*SS,e[1]*SS)],fill=CORAL+(int(255*k_),),width=7*SS)
    return to_full(img,A,glow)
