# Corredor articulado a partir de la ilustración de Dani (assets/corredor_*.png + corredor_rig.json):
# cabeza, pelo y zapatillas son piezas de su dibujo (paleta del manual, sin contorno); tronco con camiseta de
# tirantes, brazos, piernas y pantalón se dibujan con el mismo estilo y se articulan en hombro, codo, cadera, rodilla y tobillo.
# Corre de verdad (zancada, braceo, rebote); en pulses[0] frena, se para cojeando y aparece el dolor en el Aquiles.
import math, os, json, numpy as np, cv2
from PIL import Image, ImageDraw
from anim_base import *
from anim_corredor_silueta import part, at
FONT=None; CY=920; OY=CY-450
HGT=500; GROUND=1145                    # alto de la figura y línea del suelo (debajo del texto destacado de arriba)
SKIN=(247,214,200); SHORTS=CORAL
def dark(c,k=0.8): return tuple(int(v*k) for v in c)
_R=None
def rig():
    global _R
    if _R is None:
        A=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'assets')
        J=json.load(open(os.path.join(A,'corredor_rig.json'))); s=HGT/J['alto_total']
        def load(n,org,anc):
            im=Image.open(os.path.join(A,n)).convert('RGBA'); k=s*SS
            im=im.resize((max(1,int(im.width*k)),max(1,int(im.height*k))),Image.LANCZOS)
            return im,((anc[0]-org[0])*k,(anc[1]-org[1])*k)
        hd=load('corredor_cabeza.png',J['cabeza_origen'],J['cuello_base'])
        sh=load('corredor_zapatilla.png',J['zapatilla_origen'],J['tobillo_zapatilla'])
        sd=Image.fromarray((np.array(sh[0]).astype(np.float32)*[0.8,0.8,0.8,1]).astype(np.uint8))
        _R=dict(J=J,s=s,cabeza=hd,zap=sh,zap_lejos=(sd,sh[1]),
                lean0=math.atan2(J['cuello'][0]-J['cadera'][0],J['cadera'][1]-J['cuello'][1]),
                hombro=((J['hombro'][0]-J['cadera'][0])*s,(J['hombro'][1]-J['cadera'][1])*s),
                cuello=((J['cuello_base'][0]-J['cadera'][0])*s,(J['cuello_base'][1]-J['cadera'][1])*s),
                pie0=math.atan2(J['punta_zapatilla'][1]-J['talon_zapatilla'][1],J['punta_zapatilla'][0]-J['talon_zapatilla'][0]))
    return _R
def paste_rot(img,spr,anchor,pos,deg):
    im,(ax,ay)=spr; pad=int(max(im.size))
    big=Image.new('RGBA',(im.width+2*pad,im.height+2*pad),(0,0,0,0)); big.paste(im,(pad,pad))
    big=big.rotate(deg,resample=Image.BICUBIC,center=(ax+pad,ay+pad))
    img.alpha_composite(big,(int(pos[0]*SS-ax-pad),int(pos[1]*SS-ay-pad))) if pos[0]*SS-ax-pad>=0 and pos[1]*SS-ay-pad>=0 else img.paste(big,(int(pos[0]*SS-ax-pad),int(pos[1]*SS-ay-pad)),big)
def run_pose(ph):
    th=0.58*math.sin(ph)+0.06                                   # muslo (desde la vertical, + hacia delante)
    kn=0.25+1.6*max(0,math.cos(ph+0.45))**1.25                  # flexión de rodilla (máxima en el recobro)
    return th,kn
def draw(t,scene,t0,t1,pulses,broken):
    A=fade_io(t,t0,t1)
    if A<=0: return None
    R=rig(); s=R['s']; J=R['J']; ts=pulses[0]
    F=1.45                                                       # zancadas por segundo
    if t<ts: ph=2*math.pi*F*(t-t0); b=0.0
    else:
        u=t-ts; ph=2*math.pi*F*((ts-t0)+0.3*(1-math.exp(-u/0.3)))   # frena en ~0,4 s
        b=eio(u/0.45)
    mix=lambda a,c: a*(1-b)+c*b
    run=1-b
    thN,knN=run_pose(ph); thF,knF=run_pose(ph+math.pi)
    # postura de dolor: pierna cercana (lesionada) sin apoyar, la otra recta; brazos abiertos para equilibrarse
    thN,knN=mix(thN,-0.04),mix(knN,0.6); thF,knF=mix(thF,0.06),mix(knF,0.1)
    shN=mix(-0.85*math.sin(ph),0.35); shF=mix(0.85*math.sin(ph),-0.55); elN=mix(1.55,0.55); elF=mix(1.55,0.7)
    lean=mix(0.22,0.38)+0.03*math.sin(2*ph)*run
    Lt,Ls,La,Lf=J['muslo']*s,J['tibia']*s,J['brazo']*s,J['antebrazo']*s
    # altura de cadera: el pie más bajo toca el suelo (+ pequeño vuelo al correr)
    def ank(th,kn): k=at((0,0),th,Lt); return k,at(k,th-kn,Ls)
    lowest=max(ank(thN,knN)[1][1],ank(thF,knF)[1][1])
    fly=10*max(0,math.sin(2*ph))*run
    hip=(540-40*s+(-30*(1-eo((t-t0)/0.3))),GROUND-lowest-50*s-fly)
    img=canvas(); d=ImageDraw.Draw(img); glow=canvas(); g=ImageDraw.Draw(glow)
    # suelo y líneas de velocidad
    d.line([((540-320)*SS,GROUND*SS),((540+320)*SS,GROUND*SS)],fill=BONE+(110,),width=5*SS)
    tt=min(t,ts)
    for j in range(4):
        u=((tt-t0)*2.6+j/4)%1; x=540+180-u*640; y=GROUND-420+j*85; al=int(190*run*math.sin(u*math.pi))
        if al>0: d.line([(x*SS,y*SS),((x+110)*SS,y*SS)],fill=BONE+(al,),width=7*SS)
    dl=lean-R['lean0']; c,sn=math.cos(dl),math.sin(dl)
    hx,hy=R['hombro']; shp=(hip[0]+hx*c-hy*sn,hip[1]+hx*sn+hy*c)
    LEG_B=[(0,36*s),(0.22,33*s),(0.45,22*s),(0.52,20*s),(0.63,26*s),(0.82,16*s),(1,13*s)]
    LEG_F=[(0,34*s),(0.22,32*s),(0.44,25*s),(0.5,21*s),(0.63,18*s),(0.82,14*s),(1,13*s)]
    ARM=[(0,24*s),(0.45,15*s),(0.55,17*s),(0.92,12*s),(1,13*s)]
    def leg(th,kn,cs,cl,zap):
        k=at(hip,th,Lt); a=at(k,th-kn,Ls)
        part(d,[hip,k,a],LEG_B,LEG_F,cs)
        part(d,[hip,k,a],LEG_B,LEG_F,cl,0,0.27,9*s,caps=False)            # pernera holgada
        fa=th-kn+math.pi/2+0.1; ang=math.atan2(math.cos(fa),math.sin(fa))
        paste_rot(img,zap,None,a,-math.degrees(ang-R['pie0']))
        return k,a,fa
    def arm(sh,el,cs):
        e=at(shp,sh,La); w=at(e,sh+el,Lf)
        part(d,[shp,e,w],ARM,ARM,cs)
        fx,fy=at(w,sh+el,10*s); r=21*s; d.ellipse([(fx-r)*SS,(fy-r)*SS,(fx+r)*SS,(fy+r)*SS],fill=cs+(255,))
    arm(shF,elF,dark(SKIN))
    leg(thF,knF,dark(SKIN),dark(SHORTS),R['zap_lejos'])
    # tronco: camiseta de tirantes (pecho delante, espalda detrás) y cuello; la cabeza es la de su dibujo
    nx_,ny_=R['cuello']; nk=(hip[0]+nx_*c-ny_*sn,hip[1]+nx_*sn+ny_*c)
    mid=((hip[0]+nk[0])/2,(hip[1]+nk[1])/2)
    TF=[(0,56*s),(0.35,50*s),(0.72,62*s),(0.9,52*s),(1,26*s)]; TB=[(0,58*s),(0.35,50*s),(0.72,56*s),(0.9,56*s),(1,28*s)]
    part(d,[hip,mid,nk],TF,TB,(241,241,241))
    paste_rot(img,R['cabeza'],None,nk,-math.degrees(dl))
    # cintura del pantalón por encima de la camiseta
    px,py=hip[0]+8*s*c-(-18*s)*sn, hip[1]+8*s*sn+(-18*s)*c
    d.ellipse([(px-64*s)*SS,(py-48*s)*SS,(px+64*s)*SS,(py+48*s)*SS],fill=SHORTS+(255,))
    k,a,fa=leg(thN,knN,SKIN,SHORTS,R['zap'])
    arm(shN,elN,SKIN)
    if t>ts:                                            # dolor en el tendón de Aquiles
        u=t-ts; k_=eo(u/0.25); bx,by=math.sin(fa),math.cos(fa); px,py=a[0]-bx*8*s,a[1]-by*8*s-14*s
        pul=1+0.12*math.sin(u*2*math.pi*2.2)
        for rr,al in ((46,80),(31,150),(18,235)):
            Rr=rr*k_*pul; g.ellipse([(px-Rr)*SS,(py-Rr)*SS,(px+Rr)*SS,(py+Rr)*SS],fill=CORAL+(al,))
        for j in range(6):
            an=-2.9+j*0.5; r0=60; r1=r0+28*k_
            m=(px+math.cos(an)*r0,py+math.sin(an)*r0); m2=(px+math.cos(an)*(r0+r1)/2+7,py+math.sin(an)*(r0+r1)/2-7); e=(px+math.cos(an)*r1,py+math.sin(an)*r1)
            if k_>0.1: g.line([(m[0]*SS,m[1]*SS),(m2[0]*SS,m2[1]*SS),(e[0]*SS,e[1]*SS)],fill=CORAL+(int(255*k_),),width=7*SS)
    return to_full(img,A,glow)
