# Animaciones del reel "Estabilidad" (pictogramas estilo marca: blanco hueso + coral + menta puntual).
# Escenas: fisio (fisio moviendo la pierna de un paciente), correr (gente corriendo suave),
# fuerza (sentadilla con barra), eje (cadera -> rodilla -> tobillo), cintilla (zoom-out desde la cintilla iliotibial).
# Interfaz del kit: draw(t, scene, t0, t1, pulses, broken) -> RGBA float (H, W, 4) o None.
import numpy as np, cv2, math
from PIL import Image, ImageDraw, ImageFont
FONT=None
def font(sz): return ImageFont.truetype(FONT, int(sz))
SS=2; W,H=1080,1920; CY=920; OY=CY-450; CH=760
GROUND=1130
CORAL=(255,52,52); BONE=(255,251,232); MINT=(233,255,185)
def eo(x): x=min(1,max(0,x)); return 1-(1-x)**3
def eio(x): x=min(1,max(0,x)); return 3*x*x-2*x*x*x
def rad(a): return a*math.pi/180

class Pen:
    """Dibuja en coordenadas de pantalla (y absoluta) dentro del lienzo supermuestreado."""
    def __init__(s, oy):
        s.oy=oy; s.img=Image.new('RGBA',(W*SS,CH*SS),(0,0,0,0)); s.d=ImageDraw.Draw(s.img)
        s.glow=Image.new('RGBA',s.img.size,(0,0,0,0)); s.g=ImageDraw.Draw(s.glow)
    def P(s,x,y): return (x*SS,(y-s.oy)*SS)
    def limb(s,a,b,w,col=BONE+(255,),d=None):
        d=d or s.d; d.line([*s.P(*a),*s.P(*b)],fill=col,width=int(w*SS))
        for p in (a,b): s.dot(p,w/2,col,d)
    def dot(s,p,r,col=BONE+(255,),d=None):
        d=d or s.d; x,y=s.P(*p); d.ellipse([x-r*SS,y-r*SS,x+r*SS,y+r*SS],fill=col)
    def text(s,txt,x,y,sz,col=(255,255,255,255),d=None,anchor='mm'):
        d=d or s.d; f=font(sz*SS)
        d.text(s.P(x,y),txt,font=f,fill=col,anchor=anchor,stroke_width=int(4*SS),stroke_fill=(0,0,0,int(150*col[3]/255)))
    def finish(s,A,halo_k=2.2):
        gl=np.array(s.glow).astype(np.float32); base=np.array(s.img).astype(np.float32)
        if gl[...,3].max()>0:
            halo=cv2.GaussianBlur(gl,(0,0),14*SS)
            for layer,k in ((halo,halo_k),(gl,1.0)):
                a=np.clip(layer[...,3:4]/255*k,0,1); base[...,:3]=base[...,:3]*(1-a)+layer[...,:3]*a; base[...,3:4]=np.maximum(base[...,3:4],a*255)
        res=cv2.resize(base,(W,CH),interpolation=cv2.INTER_AREA)/255.0
        full=np.zeros((H,W,4),np.float32); full[s.oy:s.oy+CH]=res; full[...,3]*=A
        return full

def at(p,L,a):  # a: grados desde la vertical hacia abajo; positivo = hacia delante (derecha)
    return (p[0]+L*math.sin(rad(a)), p[1]+L*math.cos(rad(a)))
def up(p,L,a):  # hacia arriba, a positivo = inclinado hacia delante
    return (p[0]+L*math.sin(rad(a)), p[1]-L*math.cos(rad(a)))

LT,LS,LB,LU,LF,HR=118,112,160,88,80,31
# paleta del manual / del corredor de Dani (anim_corredor.py): piel clara, camiseta gris, pantalón coral
SKIN=(247,214,200,255); SKIN2=(198,171,160,255)           # piel (lado cercano / lejano ×0.8)
SHIRT=(241,241,241,255); SHIRT2=(193,193,193,255)
SHORTS=CORAL+(255,); SHORTS2=(204,42,42,255); HAIR=(52,40,36,255); SHOE=(48,48,56,255); SHOE2=(38,38,45,255)
BATA=BONE+(255,); BATA2=(214,210,195,255)
def V(a,b,k): return (a[0]+(b[0]-a[0])*k, a[1]+(b[1]-a[1])*k)
def add(a,v,k=1): return (a[0]+v[0]*k, a[1]+v[1]*k)
def norm(v):
    L=math.hypot(*v) or 1; return (v[0]/L,v[1]/L)
def cap(pen,a,b,ra,rb,col,d=None):
    """Segmento con grosor variable (como un músculo que se estrecha)."""
    d=d or pen.d; u=norm((b[0]-a[0],b[1]-a[1])); n=(-u[1],u[0])
    d.polygon([pen.P(*add(a,n,ra)),pen.P(*add(b,n,rb)),pen.P(*add(b,n,-rb)),pen.P(*add(a,n,-ra))],fill=col)
    pen.dot(a,ra,col,d); pen.dot(b,rb,col,d)
def chain(pen,pts,radii,col):
    for i in range(len(pts)-1): cap(pen,pts[i],pts[i+1],radii[i],radii[i+1],col)
def poly(pen,pts,col): pen.d.polygon([pen.P(*p) for p in pts],fill=col)

def leg(pen,hip,knee,ank,face,near,outfit):
    """Pierna de perfil: muslo con volumen, gemelo marcado, tobillo fino y zapatilla."""
    sk=SKIN if near else SKIN2
    s=norm((ank[0]-knee[0],ank[1]-knee[1])); fwd=(-s[1]*-face, s[0]*-face)   # perpendicular hacia delante
    th=norm((knee[0]-hip[0],knee[1]-hip[1])); tf=(-th[1]*-face, th[0]*-face)
    mid=add(V(hip,knee,0.42),tf,5)
    chain(pen,[hip,mid,knee],[27,24,16],sk)
    calf=add(V(knee,ank,0.33),fwd,-7)
    chain(pen,[knee,calf,V(knee,ank,0.75),ank],[16,19,12,10],sk)
    pen.dot(add(knee,fwd,6),13,sk)                            # rodilla
    heel=add(add(ank,s,10),fwd,-10); toe=add(add(ank,s,16),fwd,38)
    sh=SHOE if near else SHOE2
    cap(pen,heel,toe,11,8,sh); pen.dot(add(ank,s,4),11,sh)
    if outfit in ('run','gym'):
        cap(pen,add(hip,th,-4),V(hip,knee,0.5),31,27,SHORTS if near else SHORTS2)
def arm(pen,sh,el,hd,near,outfit,sleeve=True):
    sk=SKIN if near else SKIN2
    chain(pen,[sh,el,hd],[15,11,9],sk)
    pen.dot(add(hd,norm((hd[0]-el[0],hd[1]-el[1])),8),11,sk)  # mano
    if sleeve and outfit in ('run','gym'): cap(pen,sh,V(sh,el,0.5),18,15,SHIRT if near else SHIRT2)
    if sleeve and outfit=='fisio': cap(pen,sh,V(sh,el,0.9),19,15,BATA if near else BATA2)
def torso(pen,hip,neck,face,outfit):
    u=norm((neck[0]-hip[0],neck[1]-hip[1])); f=(-u[1]*face*-1,u[0]*face*-1)
    f=(f[0],f[1])
    if f[0]*face<0 and abs(u[1])>0.5: f=(-f[0],-f[1])
    L=math.hypot(neck[0]-hip[0],neck[1]-hip[1])
    prof=[(-30,-8),(-24,0.35),(-29,0.62),(-26,0.92),(-14,1.02),(14,1.02),(26,0.86),(32,0.70),(22,0.45),(26,0.12),(24,-8)]
    pts=[]
    for fx,uy in prof:
        uu=uy*L if abs(uy)<=1.5 else uy
        pts.append(add(add(hip,u,uu),f,fx))
    col={'run':SHIRT,'gym':SHIRT,'fisio':BATA,'none':SKIN}[outfit]
    poly(pen,pts,col)
    if outfit in('run','gym'):                               # pantalón corto (cadera)
        poly(pen,[add(add(hip,u,-10),f,-31),add(add(hip,u,24),f,-28),add(add(hip,u,24),f,27),add(add(hip,u,-10),f,27)],SHORTS)
    return u,f
def head(pen,neck,u,f):
    cap(pen,neck,add(neck,u,22),11,11,SKIN)
    c=add(add(neck,u,48),f,4)
    pen.dot(add(add(c,f,-5),u,4),HR+1,HAIR)                  # pelo
    pen.dot(add(c,f,3),HR-2,SKIN)
    pen.dot(add(add(c,f,HR-2),u,-2),6,SKIN)                   # nariz
    pen.dot(add(add(c,f,-12),u,-4),7,SKIN2)                   # oreja
def person(pen,hip,neck,legs,arms,face,outfit='run'):
    """legs: [(rodilla,tobillo)] lejana primero; arms: [(hombro,codo,mano)] lejano primero."""
    leg(pen,hip,*legs[0],face,False,outfit); arm(pen,*arms[0],False,outfit)
    u,f=torso(pen,hip,neck,face,outfit)
    leg(pen,hip,*legs[1],face,True,outfit)
    if outfit in('run','gym'): pen.d.polygon([pen.P(*add(add(hip,u,-10),f,-31)),pen.P(*add(add(hip,u,22),f,-28)),pen.P(*add(add(hip,u,22),f,27)),pen.P(*add(add(hip,u,-10),f,27))],fill=SHORTS)
    head(pen,neck,u,f)
    arm(pen,*arms[1],True,outfit)
    return u,f

def ik(a,b,L1,L2,bend=1):
    dx,dy=b[0]-a[0],b[1]-a[1]; d=max(1e-3,min(L1+L2-1e-3,math.hypot(dx,dy)))
    ang=math.atan2(dy,dx); c=(L1*L1+d*d-L2*L2)/(2*L1*d); off=math.acos(max(-1,min(1,c)))
    return (a[0]+L1*math.cos(ang-bend*off), a[1]+L1*math.sin(ang-bend*off))
def at(p,L,a): return (p[0]+L*math.sin(rad(a)), p[1]+L*math.cos(rad(a)))
def up(p,L,a): return (p[0]+L*math.sin(rad(a)), p[1]-L*math.cos(rad(a)))
def env(t,t0,t1):
    return eo((t-t0)/0.3)*(1-eo((t-(t1-0.25))/0.25) if t>t1-0.25 else 1)
def floor(pen,x0=80,x1=1000): pen.d.line([*pen.P(x0,GROUND+26),*pen.P(x1,GROUND+26)],fill=(255,255,255,80),width=5*SS)

# ---------------------------------------------------------------- escenas
def sc_fisio(pen,t,t0,t1,pulses):
    y=GROUND-150
    floor(pen)
    pen.d.rounded_rectangle([*pen.P(120,y),*pen.P(720,y+28)],radius=12*SS,fill=(205,200,186,255))
    for x in (160,680): cap(pen,(x,y+28),(x,GROUND+20),8,8,(170,165,150,255))
    # paciente tumbado boca arriba, cabeza a la izquierda
    hipP=(430,y-30); neckP=(hipP[0]-LB,y-34)
    u=(t-t0); lift=0.5-0.5*math.cos(min(1,u/0.6)*math.pi) if u<0.6 else 0.5+0.5*math.cos((u-0.6)*2*math.pi/1.6)
    ang=6+40*lift
    kneeA=(hipP[0]+LT*math.cos(rad(ang)),hipP[1]-LT*math.sin(rad(ang))); ankA=(kneeA[0]+LS*math.cos(rad(ang)),kneeA[1]-LS*math.sin(rad(ang)))
    kneeB=(hipP[0]+LT,hipP[1]+4); ankB=(kneeB[0]+LS,hipP[1]+6)
    sh=add(neckP,(1,0),18)
    person(pen,hipP,neckP,[(kneeB,ankB),(kneeA,ankA)],[(sh,(sh[0]+60,sh[1]+22),(sh[0]+130,sh[1]+24)),(sh,(sh[0]+64,sh[1]+16),(sh[0]+136,sh[1]+20))],face=1,outfit='run')
    # fisio de pie, mirando a la izquierda, con bata
    fh=(800,GROUND-LT-LS-12); lean=-14
    neck=up(fh,LB,lean)
    kL=at(fh,LT,-6); aL=at(kL,LS,-2); kR=at(fh,LT,10); aR=at(kR,LS,4)
    shF=up(fh,LB-14,lean)
    h2=add(ankA,(0,14)); h1=add(V(kneeA,ankA,0.5),(0,18))
    eF=ik(shF,h1,LU,LF,bend=-1); eN=ik(shF,h2,LU,LF,bend=-1)
    leg(pen,fh,kL,aL,-1,False,'fisio'); arm(pen,shF,eF,h1,False,'fisio')
    u_,f_=torso(pen,fh,neck,-1,'fisio')
    # bata hasta medio muslo
    poly(pen,[add(add(fh,u_,LB-20),f_,-30),add(add(fh,u_,LB-20),f_,30),add(add(fh,u_,-70),f_,36),add(add(fh,u_,-70),f_,-38)],BATA)
    leg(pen,fh,kR,aR,-1,True,'fisio')
    poly(pen,[add(add(fh,u_,40),f_,-38),add(add(fh,u_,40),f_,36),add(add(fh,u_,-70),f_,36),add(add(fh,u_,-70),f_,-38)],BATA)
    pen.d.line([pen.P(*add(add(fh,u_,LB-24),f_,4)),pen.P(*add(add(fh,u_,-70),f_,4))],fill=(190,190,185,255),width=3*SS)
    head(pen,neck,u_,f_)
    nx,ny=neck; pen.d.arc([*pen.P(nx-24,ny-4),*pen.P(nx+24,ny+60)],20,160,fill=CORAL+(255,),width=6*SS)   # fonendo
    arm(pen,shF,eN,h2,True,'fisio')

def run_legs(p):
    def one(q):
        th=26*math.sin(q); kf=18+72*max(0,math.cos(q+0.5))**2
        return th,kf
    return [one(p+math.pi),one(p)]
def runner(pen,x,p,outfit='run'):
    legs=run_legs(p); bob=6*abs(math.sin(p)); lean=9
    hip=(x,GROUND-(LT+LS)*0.94+bob-10)
    neck=up(hip,LB,lean); sh=up(hip,LB-16,lean)
    L=[]
    for th,kf in legs:
        k=at(hip,LT,th); a=at(k,LS,th-kf); L.append((k,a))
    A=[]
    for ua in (28*math.sin(p),28*math.sin(p+math.pi)):
        e=at(sh,LU,-ua); h=at(e,LF,-ua+95); A.append((sh,e,h))
    person(pen,hip,neck,L,A,face=1,outfit=outfit)
def sc_correr(pen,t,t0,t1,pulses):
    floor(pen,40,1040)
    off=(t*140)%120
    for k in range(10):
        x=1040-k*120+off-120; pen.d.line([*pen.P(x,GROUND+48),*pen.P(x+40,GROUND+48)],fill=(255,255,255,50),width=4*SS)
    for k,(x,ph,sc_) in enumerate(((320,0.0,0.86),(690,1.9,1.0))):
        sub=Pen(pen.oy); runner(sub,x,t*2*math.pi*1.2+ph)
        im=sub.img
        if sc_!=1.0:
            w,h=im.size; s2=im.resize((int(w*sc_),int(h*sc_)),Image.LANCZOS)
            ax,ay=x*SS,(GROUND+26-pen.oy)*SS; im=Image.new('RGBA',(w,h),(0,0,0,0)); im.alpha_composite(s2,(int(ax-ax*sc_),int(ay-ay*sc_)))
            arr=np.array(im); arr[...,3]=(arr[...,3]*0.8).astype(np.uint8); im=Image.fromarray(arr)
        pen.img.alpha_composite(im)

def sc_fuerza(pen,t,t0,t1,pulses):
    floor(pen,200,880)
    u=t-t0; s=0.5-0.5*math.cos(u*2*math.pi/2.0)
    ank=(560,GROUND-10); sh_=8+30*s; th_=8+80*s; lean=10+30*s
    knee=up(ank,LS,sh_); hip=(knee[0]-LT*math.sin(rad(th_)),knee[1]-LT*math.cos(rad(th_)))
    neck=up(hip,LB,lean); sh=up(hip,LB-16,lean)
    bar=add(sh,(-math.cos(rad(lean)),-math.sin(rad(lean))),26)
    pen.dot(bar,72,(28,28,28,255)); pen.d.ellipse([*pen.P(bar[0]-72,bar[1]-72),*pen.P(bar[0]+72,bar[1]+72)],outline=BONE+(200,),width=4*SS)
    pen.dot(bar,24,(70,70,70,255)); pen.dot(bar,9,(200,200,200,255))
    hd=add(bar,(1,0),34); e=ik(sh,hd,LU,LF,bend=1)
    person(pen,hip,neck,[(add(knee,(-8,0)),add(ank,(-8,0))),(knee,ank)],[(sh,e,hd),(sh,e,hd)],face=1,outfit='gym')

_MOD=None
def sc_eje(pen,t,t0,t1,pulses):
    """Modelo anatómico de frente: silueta de la lámina que pasó Dani (assets/modelo_frontal.png), plana y en tono piel."""
    global _MOD
    import os
    if _MOD is None:
        _MOD=Image.open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'assets','modelo_frontal.png')).convert('RGBA')
    HT=680; k=HT/_MOD.height; top=GROUND+40-HT; left=540-_MOD.width*k/2
    im=_MOD.resize((int(_MOD.width*k*SS),int(HT*SS)),Image.LANCZOS)
    pen.img.alpha_composite(im,(int(left*SS),int((top-pen.oy)*SS)))
    M=lambda x,y:(left+x*k,top+y*k)                      # coordenadas de la lámina (732x1520) -> pantalla
    pts=[M(410,790),M(402,1110),M(392,1405)]
    names=["CADERA","RODILLA","PIE"]
    lit=[i for i,p in enumerate(pulses) if t>=p]
    if len(lit)>=2:
        for i in range(1,lit[-1]+1):
            q=eo((t-pulses[i])/0.35); b=V(pts[i-1],pts[i],q)
            pen.d.line([*pen.P(*pts[i-1]),*pen.P(*b)],fill=CORAL+(255,),width=10*SS)
            pen.g.line([*pen.P(*pts[i-1]),*pen.P(*b)],fill=CORAL+(255,),width=10*SS)
    for i in lit:
        u=t-pulses[i]; q=eo(u/0.25); p=pts[i]
        if u<0.6:
            r=24+60*eo(u/0.6); pen.d.ellipse([*pen.P(p[0]-r,p[1]-r),*pen.P(p[0]+r,p[1]+r)],outline=CORAL+(int(255*(1-u/0.6)),),width=5*SS)
        pen.dot(p,20*q,CORAL+(255,),pen.g); pen.dot(p,8*q,(255,255,255,255),pen.g)
        lx=p[0]+110+40*(1-q); pen.d.line([*pen.P(p[0]+26,p[1]),*pen.P(lx-10,p[1])],fill=(255,255,255,int(220*q)),width=4*SS)
        pen.text(names[i],lx,p[1],46,(255,255,255,int(255*q)),anchor='lm')

# pierna de perfil (mirando a la derecha); coordenadas en "unidades pierna", origen = rodilla
LEG_OUT=[(-110,-560),(-70,-580),(10,-590),(90,-560),(118,-470),(96,-380),(70,-200),(48,-40),(58,20),(46,120),(30,300),(48,420),(150,440),(160,470),(-20,470),(-36,430),(-34,300),(-58,120),(-60,20),(-82,-80),(-112,-260),(-140,-420),(-150,-500)]
def sc_cintilla(pen,t,t0,t1,pulses):
    u=(t-t0); z0,z1=0.3,1.65                                    # 0.35 s quieto en la cintilla, zoom-out ~2 s
    q=eio(min(1,max(0,(u-z0)/(z1-z0))))
    scale=1.0*(3.6/1.0)**(1-q)
    focus=(10*(1-q)+20*q, -40*(1-q)+(-60)*q)                    # punto de la pierna en el centro
    cxs,cys=540,CY+15
    def T(p): return (cxs+(p[0]-focus[0])*scale*0.62, cys+(p[1]-focus[1])*scale*0.62)
    k=scale*0.62
    out=[pen.P(*T(p)) for p in LEG_OUT]
    pen.d.polygon(out,fill=(224,210,190,255))
    # músculos: cuádriceps (delante), isquios (detrás), gemelo
    def blob(c,rx,ry,ang,col):
        pts=[]
        for i in range(48):
            a=i/48*2*math.pi; x=rx*math.cos(a); y=ry*math.sin(a); ca,sa=math.cos(rad(ang)),math.sin(rad(ang))
            pts.append(pen.P(*T((c[0]+x*ca-y*sa,c[1]+x*sa+y*ca))))
        pen.d.polygon(pts,fill=col)
    blob((40,-280),52,215,-8,(214,96,90,255)); blob((-62,-270),40,190,-6,(190,80,78,255))
    blob((-30,170),30,130,4,(200,88,84,255))
    # rótula
    blob((70,-10),22,30,0,(245,240,225,255))
    # cintilla iliotibial: banda desde la cresta ilíaca (TFL) hasta debajo de la rodilla (cara lateral)
    band=[(-30,-520),(-4,-520),(18,-380),(28,-200),(30,-60),(34,40),(12,48),(6,-60),(2,-200),(-10,-380)]
    pen.d.polygon([pen.P(*T(p)) for p in band],fill=BONE+(255,))
    blob((-6,-520),40,46,0,(214,96,90,255))                    # tensor de la fascia lata
    # fibras de la banda (se ven de cerca)
    for i in range(5):
        f=(i+0.5)/5; pts=[]
        for yb in np.linspace(-500,30,30):
            xl=np.interp(yb,[-520,-380,-200,-60,40],[-30,-10,2,6,12]); xr=np.interp(yb,[-520,-380,-200,-60,40],[-4,18,28,30,34])
            pts.append(pen.P(*T((xl+(xr-xl)*f,yb))))
        pen.d.line(pts,fill=(200,190,170,255),width=max(1,int(1.4*k*SS)))
    # brillo menta recorriendo la banda
    gl=0.55+0.45*math.sin(u*5)
    pen.d.polygon([pen.P(*T(p)) for p in band],outline=None)
    pen.g.polygon([pen.P(*T(p)) for p in band],fill=MINT+(int(120*gl),))
    # dolor en la cara externa de la rodilla (estilo de sus iconos: brillo coral concéntrico + rayitos)
    k_=eo((u-0.2)/0.3); px,py=T((30,10)); pul=1+0.12*math.sin(u*2*math.pi*2.2); sc_=max(0.45,min(1.0,scale/2.2))
    for rr,al in ((46,80),(31,150),(18,235)):
        R=rr*k_*pul*sc_; pen.g.ellipse([*pen.P(px-R,py-R),*pen.P(px+R,py+R)],fill=CORAL+(al,))
    for j in range(6):
        an=-0.9+j*0.42; r0=60*sc_; r1=r0+28*k_*sc_
        if k_>0.1: pen.g.line([*pen.P(px+math.cos(an)*r0,py+math.sin(an)*r0),*pen.P(px+math.cos(an)*r1,py+math.sin(an)*r1)],fill=CORAL+(int(255*k_),),width=int(6*SS))

SCALE=dict(eje=1.0,fuerza=1.25,correr=1.06)
SCENES=dict(fisio=sc_fisio,correr=sc_correr,fuerza=sc_fuerza,eje=sc_eje,cintilla=sc_cintilla)
def draw(t, scene, t0, t1, pulses, broken):
    A=env(t,t0,t1)
    if A<=0: return None
    s=0.92+0.08*eo((t-t0)/0.35)
    pen=Pen(CY-CH//2-60)
    SCENES[scene](pen,t,t0,t1,pulses)
    out=pen.finish(1.0)
    if scene=='cintilla':                                      # bordes difuminados arriba/abajo (sin cortes rectos)
        y=np.arange(H,dtype=np.float32); y0,y1=pen.oy,pen.oy+CH
        out[...,3]*=(np.clip((y-y0)/110,0,1)*np.clip((y1-y)/110,0,1))[:,None]
    k=SCALE.get(scene,1.0)
    if abs(k-1)>1e-3:
        M=np.array([[k,0,540*(1-k)],[0,k,GROUND*(1-k)]],np.float32); out=cv2.warpAffine(out,M,(W,H))
    if abs(s-1)>1e-3:
        M=np.array([[s,0,540*(1-s)],[0,s,CY*(1-s)]],np.float32); out=cv2.warpAffine(out,M,(W,H))
    out[...,3]*=A
    return out
