# "Es como ir al gimnasio y que otro levante las pesas por ti": dos personas hechas con el muñeco de Dani
# (assets/corredor_* + rig de anim_corredor). TÚ, sentado en un banco mirando el móvil; en pulses[0] entra OTRO andando
# y se pone a hacer curl de bíceps alterno con mancuernas a su lado. pulses = [entra el otro, (opcional) empieza el curl].
import math, numpy as np
from PIL import Image, ImageDraw, ImageOps
from anim_base import *
from anim_corredor_silueta import part, at
import anim_corredor as AC
FONT=None; CY=920; OY=CY-450
GROUND=1150
SKIN=(247,214,200); DARK=(48,48,54); SHIRT=(241,241,241)
def dark(c,k=0.8): return tuple(int(v*k) for v in c)
def figure(img,d,hip,lean,legN,legF,armN,armF,shirt,shorts,hand_extra=None):
    """Dibuja el muñeco mirando a la derecha. leg=(muslo,flexión rodilla), arm=(hombro,codo) en radianes."""
    R=AC.rig(); s=R['s']; J=R['J']
    Lt,Ls,La,Lf=J['muslo']*s,J['tibia']*s,J['brazo']*s,J['antebrazo']*s
    dl=lean-R['lean0']; c,sn=math.cos(dl),math.sin(dl)
    hx,hy=R['hombro']; shp=(hip[0]+hx*c-hy*sn,hip[1]+hx*sn+hy*c)
    LEG_B=[(0,36*s),(0.22,33*s),(0.45,22*s),(0.52,20*s),(0.63,26*s),(0.82,16*s),(1,13*s)]
    LEG_F=[(0,34*s),(0.22,32*s),(0.44,25*s),(0.5,21*s),(0.63,18*s),(0.82,14*s),(1,13*s)]
    ARM=[(0,24*s),(0.45,15*s),(0.55,17*s),(0.92,12*s),(1,13*s)]
    def leg(th,kn,cs,cl,zap):
        k=at(hip,th,Lt); a=at(k,th-kn,Ls)
        part(d,[hip,k,a],LEG_B,LEG_F,cs)
        part(d,[hip,k,a],LEG_B,LEG_F,cl,0,0.27,9*s,caps=False)
        fa=th-kn+math.pi/2+0.1; ang=math.atan2(math.cos(fa),math.sin(fa))
        AC.paste_rot(img,zap,None,a,-math.degrees(ang-R['pie0']))
    def arm(sh,el,cs,far):
        e=at(shp,sh,La); w=at(e,sh+el,Lf)
        part(d,[shp,e,w],ARM,ARM,cs)
        fx,fy=at(w,sh+el,10*s); r=21*s; d.ellipse([(fx-r)*SS,(fy-r)*SS,(fx+r)*SS,(fy+r)*SS],fill=cs+(255,))
        if hand_extra: hand_extra(d,(fx,fy),sh+el,far)
    arm(*armF,dark(SKIN),True)
    leg(*legF,dark(SKIN),dark(shorts),R['zap_lejos'])
    nx_,ny_=R['cuello']; nk=(hip[0]+nx_*c-ny_*sn,hip[1]+nx_*sn+ny_*c)
    mid=((hip[0]+nk[0])/2,(hip[1]+nk[1])/2)
    TF=[(0,56*s),(0.35,50*s),(0.72,62*s),(0.9,52*s),(1,26*s)]; TB=[(0,58*s),(0.35,50*s),(0.72,56*s),(0.9,56*s),(1,28*s)]
    part(d,[hip,mid,nk],TF,TB,shirt)
    AC.paste_rot(img,R['cabeza'],None,nk,-math.degrees(dl))
    px,py=hip[0]+8*s*c-(-18*s)*sn, hip[1]+8*s*sn+(-18*s)*c
    d.ellipse([(px-64*s)*SS,(py-48*s)*SS,(px+64*s)*SS,(py+48*s)*SS],fill=shorts+(255,))
    leg(*legN,SKIN,shorts,R['zap'])
    arm(*armN,SKIN,False)
    return nk
def phone(d,p,ang,far):
    if far: return
    x,y=p; w,h=20,36
    d.rounded_rectangle([(x-w)*SS,(y-h-6)*SS,(x+w)*SS,(y+h-6)*SS],radius=7*SS,fill=(30,30,34,255))
    d.rounded_rectangle([(x-w+5)*SS,(y-h)*SS,(x+w-5)*SS,(y+h-12)*SS],radius=4*SS,fill=(150,190,255,255))
def dumbbell(d,p,ang,far):
    x,y=p; col=dark(CORAL,0.8) if far else CORAL
    d.ellipse([(x-30)*SS,(y-30)*SS,(x+30)*SS,(y+30)*SS],fill=col+(255,))
    d.ellipse([(x-11)*SS,(y-11)*SS,(x+11)*SS,(y+11)*SS],fill=dark(col,0.75)+(255,))
def draw(t,scene,t0,t1,pulses,broken):
    A=fade_io(t,t0,t1)
    if A<=0: return None
    R=AC.rig(); s=R['s']; J=R['J']
    te=pulses[0]; tc=pulses[1] if len(pulses)>1 else te+0.75
    img=canvas(); d=ImageDraw.Draw(img); glow=canvas()
    k=eo((t-t0)/0.35)
    d.line([((540-430*k)*SS,GROUND*SS),((540+430*k)*SS,GROUND*SS)],fill=BONE+(110,),width=5*SS)
    # --- TÚ: sentado en el banco, mirando el móvil (respira y pasa el dedo)
    bx=330; bench_top=GROUND-int(J['tibia']*s)-40
    d.rounded_rectangle([(bx-150)*SS,(bench_top)*SS,(bx+60)*SS,(bench_top+34)*SS],radius=10*SS,fill=(150,140,135,255))
    for lx in (bx-125,bx+30): d.rectangle([(lx)*SS,(bench_top+30)*SS,(lx+18)*SS,GROUND*SS],fill=(110,104,100,255))
    br=math.sin(t*2*math.pi*0.45)
    hip=(bx-20,bench_top-8*s)
    scroll=0.06*max(0,math.sin(t*2*math.pi*1.1))**8
    nk=figure(img,d,hip,0.18+0.02*br,(1.5,1.45),(1.42,1.3),(0.25,1.95+scroll),(0.4,1.7),SHIRT,CORAL,phone)
    # etiqueta TÚ encima de la cabeza
    if FONT:
        a=int(255*eo((t-t0-0.3)/0.3)); f=font(FONT,46*SS); w=d.textlength("TÚ",font=f)
        d.text(((nk[0]+5)*SS-w/2,(nk[1]-210+4*br)*SS),"TÚ",font=f,fill=(255,255,255,a),stroke_width=4*SS,stroke_fill=(0,0,0,140))
    # --- OTRO: entra andando desde la derecha y hace curl alterno (se dibuja mirando a la derecha y se refleja)
    if t>=te:
        L2=canvas(); d2=ImageDraw.Draw(L2)
        u=(t-te)/0.75; xw=760+(1-eo(u))*560            # posición final x=760 (en pantalla), entra desde fuera
        walking=u<1
        ph=2*math.pi*1.6*(t-te)
        wN=(0.38*math.sin(ph),0.1+0.55*max(0,math.cos(ph+0.45))**1.3)
        wF=(0.38*math.sin(ph+math.pi),0.1+0.55*max(0,math.cos(ph+math.pi+0.45))**1.3)
        b=eo((t-te-0.6)/0.25)                           # de andar a estar de pie
        legN=(wN[0]*(1-b)+0.05*b,wN[1]*(1-b)+0.08*b); legF=(wF[0]*(1-b)-0.05*b,wF[1]*(1-b)+0.08*b)
        def ank(th,kn): kk=at((0,0),th,J['muslo']*s); return at(kk,th-kn,J['tibia']*s)[1]
        hipy=GROUND-max(ank(*legN),ank(*legF))-50*s
        # curl alterno: cada brazo sube la mancuerna en 0,45 s y baja en 0,45 s
        def curl(off):
            if t<tc: return 0.0
            v=((t-tc)/1.2+off)%1
            return math.sin(min(1,v/0.5)*math.pi)**1.2 if v<0.5 else 0.0
        cN,cF=curl(0.0),curl(0.5)
        aN=(0.08*(1-b)+0.38*math.sin(ph)*(1-b)+0.0*b+0.15*cN, 0.25+1.95*cN)
        aF=(-0.08*b-0.38*math.sin(ph)*(1-b)+0.15*cF, 0.25+1.95*cF)
        lean=0.04+0.05*(1-b)-0.05*max(cN,cF)
        figure(L2,d2,(1080-xw,hipy),lean,legN,legF,aN,aF,CORAL,DARK,dumbbell)
        img.alpha_composite(ImageOps.mirror(L2))
    return to_full(img,A,glow)
