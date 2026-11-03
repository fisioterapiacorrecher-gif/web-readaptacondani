# «Meses con tendinitis y tratamientos en camilla que no funcionan» (anuncio 4, nov 2026).
# Escena a pantalla completa con fondo propio (opaco, "blur": false), con el corredor articulado del kit:
#   A) entra corriendo; calendario de meses que pasa solo; en pulses[1] frena con dolor en el Aquiles.
#   B) barrido a la camilla: el mismo corredor tumbado boca abajo (cara en el agujero), contador de sesiones
#      que no para de subir y tratamientos pasivos que van apareciendo (corrientes, ultrasonido, agujas).
#   C) en pulses[4] ("NO te mejoran"): cruz roja gigante que se estampa, temblor y el dolor sigue ahí.
# pulses = [meses, dolor, cambio a camilla, (icono1, icono2, icono3), no]  -> ver ICONOS abajo
# Termina en seco en t1 (corte en el beat de la música), sin fundido.
import math, numpy as np, cv2
from PIL import Image, ImageDraw
from anim_base import *
import anim_corredor
anim_corredor.HGT=610                                              # corredor más grande que en los reels
from anim_corredor import rig, paste_rot, run_pose, dark, SKIN, SHORTS
from anim_corredor_silueta import part, at
FONT=None; CY=920; OY=CY-450
GREYM=(120,112,108); SHIRT=(241,241,241)
MESES=["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"]

def figura(img,d,g,hip,P,dolor=0.0,ut=0.0):
    """Corredor del kit en cualquier postura. P: lean, thN,knN,thF,knF, shN,elN,shF,elF (radianes)."""
    R=rig(); s=R['s']; J=R['J']
    Lt,Ls,La,Lf=J['muslo']*s,J['tibia']*s,J['brazo']*s,J['antebrazo']*s
    dl=P['lean']-R['lean0']; c,sn=math.cos(dl),math.sin(dl)
    hx,hy=R['hombro']; shp=(hip[0]+hx*c-hy*sn,hip[1]+hx*sn+hy*c)
    LEG_B=[(0,36*s),(0.22,33*s),(0.45,22*s),(0.52,20*s),(0.63,26*s),(0.82,16*s),(1,13*s)]
    LEG_F=[(0,34*s),(0.22,32*s),(0.44,25*s),(0.5,21*s),(0.63,18*s),(0.82,14*s),(1,13*s)]
    ARM=[(0,24*s),(0.45,15*s),(0.55,17*s),(0.92,12*s),(1,13*s)]
    def leg(th,kn,cs,cl,zap):
        k=at(hip,th,Lt); a=at(k,th-kn,Ls)
        part(d,[hip,k,a],LEG_B,LEG_F,cs); part(d,[hip,k,a],LEG_B,LEG_F,cl,0,0.27,9*s,caps=False)
        fa=th-kn+math.pi/2+0.1; ang=math.atan2(math.cos(fa),math.sin(fa))
        paste_rot(img,zap,None,a,-math.degrees(ang-R['pie0'])); return a,fa
    def arm(sh,el,cs):
        e=at(shp,sh,La); w=at(e,sh+el,Lf); part(d,[shp,e,w],ARM,ARM,cs)
        fx,fy=at(w,sh+el,10*s); r=21*s; d.ellipse([(fx-r)*SS,(fy-r)*SS,(fx+r)*SS,(fy+r)*SS],fill=cs+(255,))
    arm(P['shF'],P['elF'],dark(SKIN)); leg(P['thF'],P['knF'],dark(SKIN),dark(SHORTS),R['zap_lejos'])
    nx_,ny_=R['cuello']; nk=(hip[0]+nx_*c-ny_*sn,hip[1]+nx_*sn+ny_*c); mid=((hip[0]+nk[0])/2,(hip[1]+nk[1])/2)
    TF=[(0,56*s),(0.35,50*s),(0.72,62*s),(0.9,52*s),(1,26*s)]; TB=[(0,58*s),(0.35,50*s),(0.72,56*s),(0.9,56*s),(1,28*s)]
    part(d,[hip,mid,nk],TF,TB,SHIRT); paste_rot(img,R['cabeza'],None,nk,-math.degrees(dl))
    px,py=hip[0]+8*s*c-(-18*s)*sn, hip[1]+8*s*sn+(-18*s)*c
    rx,ry=64*s,48*s
    if abs(sn)>0.7: rx,ry=ry,rx                                      # tumbado: la cintura gira con él
    d.ellipse([(px-rx)*SS,(py-ry)*SS,(px+rx)*SS,(py+ry)*SS],fill=SHORTS+(255,))
    a,fa=leg(P['thN'],P['knN'],SKIN,SHORTS,R['zap']); arm(P['shN'],P['elN'],SKIN)
    if dolor>0: dolor_en(g,a,fa,s,dolor,ut)
    return a,fa
def dolor_en(g,a,fa,s,k_,u):
    """Dolor como en los iconos del manual: brillo coral concéntrico + rayitos rojos (Aquiles)."""
    bx,by=math.sin(fa),math.cos(fa); px,py=a[0]-bx*8*s,a[1]-by*8*s-14*s
    pul=1+0.12*math.sin(u*2*math.pi*2.2)
    for rr,al in ((50,80),(34,150),(20,235)):
        Rr=rr*k_*pul; g.ellipse([(px-Rr)*SS,(py-Rr)*SS,(px+Rr)*SS,(py+Rr)*SS],fill=CORAL+(al,))
    for j in range(7):
        an=-3.0+j*0.5; r0=62; r1=r0+30*k_
        m=(px+math.cos(an)*r0,py+math.sin(an)*r0); m2=(px+math.cos(an)*(r0+r1)/2+7,py+math.sin(an)*(r0+r1)/2-7); e=(px+math.cos(an)*r1,py+math.sin(an)*r1)
        if k_>0.1: g.line([(m[0]*SS,m[1]*SS),(m2[0]*SS,m2[1]*SS),(e[0]*SS,e[1]*SS)],fill=CORAL+(int(255*k_),),width=7*SS)

def fondo():
    """Fondo negro de marca con un halo cálido muy suave en el centro (opaco)."""
    yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
    r=np.sqrt(((xx-540)/700)**2+((yy-980)/900)**2)
    k=np.clip(1-r,0,1)**1.6
    rgb=np.stack([10+38*k,9+14*k,9+12*k],2)/255.0
    return np.dstack([rgb,np.ones((H,W),np.float32)]).astype(np.float32)
_BG=None
_yy,_xx=np.mgrid[0:H,0:W].astype(np.float32)
_VG=(np.clip(np.maximum(np.abs(_xx-540)/540,np.abs(_yy-960)/960)*1.25-0.25,0,1)**2.2)[...,None]   # borde rojo (fogonazo de dolor)

def calendario(d,cx,cy,t,tm,A):
    """Taco de calendario: las hojas de los meses pasan solas (cada vez más rápido)."""
    if t<tm or A<=0: return
    u=t-tm; k=back(u/0.35); sc=0.4+0.6*k; w,h=200*sc,210*sc
    n=int(min(11,(u*4.2)**1.25)); fl=((u*4.2)**1.25)%1 if n<11 else 1.0
    al=int(255*A*min(1,u/0.12))
    def hoja(m,yoff=0,alpha=al,curl=0.0):
        x0,y0,x1,y1=cx-w/2,cy-h/2+yoff,cx+w/2,cy+h/2+yoff
        d.rounded_rectangle([x0*SS,y0*SS,x1*SS,y1*SS],18*SS*sc,fill=BONE+(alpha,))
        d.rounded_rectangle([x0*SS,y0*SS,x1*SS,(y0+58*sc)*SS],18*SS*sc,fill=CORAL+(alpha,))
        d.rectangle([x0*SS,(y0+36*sc)*SS,x1*SS,(y0+58*sc)*SS],fill=CORAL+(alpha,))
        for rx in (-0.27,0.27):
            d.rounded_rectangle([(cx+rx*w-7*sc)*SS,(y0-16*sc)*SS,(cx+rx*w+7*sc)*SS,(y0+18*sc)*SS],6*SS,fill=(60,56,58,alpha))
        f=font(FONT,int(74*sc)*SS); txt=MESES[m%12]; tw=d.textlength(txt,font=f)
        d.text((cx*SS-tw/2,(y0+82*sc)*SS),txt,font=f,fill=(30,26,26,alpha))
    hoja(n+1 if n<11 else n,6*sc)
    if n<11:                                                         # la hoja de arriba sale volando hacia arriba
        q=eio(fl); hoja(n,-q*140*sc,int(al*(1-q)))
    else: hoja(n)

def icono(d,g,kind,cx,cy,u,apagado):
    if u<0: return
    k=back(u/0.38); r=78*min(1.12,0.3+0.7*k); a=min(1,u/0.1)
    col=tuple(int(c*(1-apagado)+v*apagado) for c,v in zip(CORAL,GREYM))
    d.ellipse([(cx-r)*SS,(cy-r)*SS,(cx+r)*SS,(cy+r)*SS],fill=col+(int(255*a),))
    w=(255,251,232,int(255*a)); s=r/78
    if kind=="rayo":     # corrientes / electroterapia
        P=[(-10,-46),(22,-46),(4,-8),(26,-8),(-14,48),(-2,6),(-24,6)]
        d.polygon([((cx+x*s)*SS,(cy+y*s)*SS) for x,y in P],fill=w)
    elif kind=="ondas":  # ultrasonido: cabezal + ondas
        d.rounded_rectangle([(cx-34*s)*SS,(cy-8*s)*SS,(cx+6*s)*SS,(cy+12*s)*SS],8*SS,fill=w)
        d.polygon([((cx+6*s)*SS,(cy-18*s)*SS),((cx+22*s)*SS,(cy-24*s)*SS),((cx+22*s)*SS,(cy+28*s)*SS),((cx+6*s)*SS,(cy+22*s)*SS)],fill=w)
        for j in range(3):
            ph=(u*2.2+j/3)%1; rr=(30+ph*34)*s
            d.arc([(cx+22*s-rr)*SS,(cy+2*s-rr)*SS,(cx+22*s+rr)*SS,(cy+2*s+rr)*SS],-40,40,fill=(255,251,232,int(255*a*(1-ph))),width=6*SS)
    elif kind=="aguja":  # punción / agujas
        for dx,ang in ((-16,-0.25),(10,0.12),(32,0.4)):
            x0,y0=cx+dx*s-20*s,cy-40*s; L=86*s
            x1,y1=x0+L*math.sin(ang),y0+L*math.cos(ang)
            d.line([(x0*SS,y0*SS),(x1*SS,y1*SS)],fill=w,width=4*SS)
            d.ellipse([(x0-8*s)*SS,(y0-8*s)*SS,(x0+8*s)*SS,(y0+8*s)*SS],fill=w)

def draw(t,scene,t0,t1,pulses,broken):
    global _BG
    if t<t0 or t>t1: return None
    if _BG is None: _BG=fondo()
    pm,pd,pc,i1,i2,i3,pn=pulses
    R=rig(); s=R['s']
    img=canvas(); d=ImageDraw.Draw(img); glow=canvas(); g=ImageDraw.Draw(glow)
    GROUND=1290
    # temblor al estamparse la cruz
    sh=0.0; flash=0.0
    if t>pn: u=t-pn; sh=18*math.exp(-u/0.12)*math.sin(u*70)
    # barrido A -> B (0,38 s)
    tr=eio((t-pc+0.05)/0.38); xa=-1100*tr+sh; xb=1100*(1-tr)+sh
    # ---------- ESCENA A: corre, meses, dolor ----------
    if tr<1:
        F=1.45
        if t<pd: ph=2*math.pi*F*(t-t0); b=0.0
        else: u=t-pd; ph=2*math.pi*F*((pd-t0)+0.3*(1-math.exp(-u/0.3))); b=eio(u/0.45)
        mix=lambda a_,c_: a_*(1-b)+c_*b; run=1-b
        thN,knN=run_pose(ph); thF,knF=run_pose(ph+math.pi)
        P=dict(thN=mix(thN,-0.04),knN=mix(knN,0.6),thF=mix(thF,0.06),knF=mix(knF,0.1),
               shN=mix(-0.85*math.sin(ph),0.35),shF=mix(0.85*math.sin(ph),-0.55),elN=mix(1.55,0.55),elF=mix(1.55,0.7),
               lean=mix(0.22,0.38)+0.03*math.sin(2*ph)*run)
        J=R['J']; Lt,Ls=J['muslo']*s,J['tibia']*s
        def ank(th,kn): k=at((0,0),th,Lt); return at(k,th-kn,Ls)
        lowest=max(ank(P['thN'],P['knN'])[1],ank(P['thF'],P['knF'])[1])
        fly=10*max(0,math.sin(2*ph))*run
        ent=eo((t-t0)/0.5)
        hip=(430-40*s-700*(1-ent)+xa,GROUND-lowest-50*s-fly)
        d.line([((540-380+xa)*SS,GROUND*SS),((540+380+xa)*SS,GROUND*SS)],fill=BONE+(110,),width=5*SS)
        tt=min(t,pd)
        for j in range(4):                                         # líneas de velocidad
            u=((tt-t0)*2.6+j/4)%1; x=540+200-u*700+xa; y=GROUND-440+j*90; al=int(190*run*math.sin(u*math.pi))
            if al>0: d.line([(x*SS,y*SS),((x+120)*SS,y*SS)],fill=BONE+(al,),width=7*SS)
        figura(img,d,g,hip,P,eo((t-pd)/0.25) if t>pd else 0.0,t-pd)
        calendario(d,800+xa,760,t,pm,1.0)
        if t>pd:                                                    # fogonazo rojo en el borde al dolerle
            u=t-pd; k=math.exp(-u/0.25)*0.4
            if k>0.02: flash=k
    # ---------- ESCENA B: camilla ----------
    if tr>0:
        TOP=1110; x0,x1=110+xb,970+xb
        # camilla: patas metálicas, tablero y colchoneta coral con el agujero de la cara
        for lx in (x0+70,x1-70):
            d.rounded_rectangle([(lx-12)*SS,(TOP+40)*SS,(lx+12)*SS,(GROUND)*SS],8*SS,fill=GREYM+(255,))
        d.rounded_rectangle([(x0+60)*SS,(TOP+150)*SS,(x1-60)*SS,(TOP+166)*SS],6*SS,fill=GREYM+(255,))
        d.line([((x0-40)*SS,GROUND*SS),((x1+40)*SS,GROUND*SS)],fill=BONE+(110,),width=5*SS)
        d.rounded_rectangle([x0*SS,(TOP+18)*SS,x1*SS,(TOP+46)*SS],10*SS,fill=(200,196,190,255))
        d.rounded_rectangle([x0*SS,(TOP-12)*SS,x1*SS,(TOP+26)*SS],18*SS,fill=CORAL+(255,))
        hx=x1-70; d.ellipse([(hx-26)*SS,(TOP-6)*SS,(hx+26)*SS,(TOP+12)*SS],fill=(150,30,30,255))
        # el corredor tumbado boca abajo (respira despacio); la cara cae en el agujero
        br=2.5*math.sin((t-pc)*2*math.pi*0.9)
        P=dict(lean=math.pi/2+0.02,thN=-math.pi/2+0.04,knN=-0.10,thF=-math.pi/2+0.08,knF=-0.05,
               shN=-math.pi/2-0.05,elN=0.12,shF=-math.pi/2+0.05,elF=0.10)
        hip=(530+xb,TOP-36*s-6+br*0.3)
        dol=0.0
        if t>pn: dol=eo((t-pn-0.15)/0.25)
        figura(img,d,g,hip,P,dol,t-pn)
        # contador de sesiones que no para de subir
        u=t-(pc+0.15)
        if u>0:
            n=1+int(min(27,(u*7.5)**1.15)); k=back(u/0.3); a=min(1,u/0.1)
            f=font(FONT,int(58*SS)); txt=f"SESIÓN Nº {n}"; tw=d.textlength(txt,font=f)/SS
            cx,cy=540+xb,1440; pw=tw/2+46; ph=50*min(1.1,0.4+0.6*k)
            d.rounded_rectangle([(cx-pw)*SS,(cy-ph)*SS,(cx+pw)*SS,(cy+ph)*SS],ph*SS,fill=(BONE if t<pn else (255,251,232))+(int(255*a),))
            d.text(((cx-tw/2)*SS,(cy-36)*SS),txt,font=f,fill=(20,18,18,int(255*a)))
        # tratamientos pasivos que van apareciendo, con un rayito hacia la pierna
        ap=eo((t-pn)/0.3) if t>pn else 0.0
        for kind,ti,cx in (("rayo",i1,280),("ondas",i2,540),("aguja",i3,800)):
            u=t-ti
            if u<0: continue
            cy=830+6*math.sin((t-ti)*3.1)
            tx=(300 if kind!="aguja" else 420)+xb                    # zona de la pierna/gemelo sobre la camilla
            q=eo((u-0.15)/0.3)
            if q>0:
                for j in range(9):
                    v=j/9
                    if v>q: break
                    px_=cx+xb+(tx-cx-xb)*v; py_=cy+80+(TOP-80-cy-80)*v
                    d.ellipse([(px_-5)*SS,(py_-5)*SS,(px_+5)*SS,(py_+5)*SS],fill=BONE+(int(150*(1-ap)),))
            icono(d,g,kind,cx+xb,cy,u,ap)
        # la cruz roja que se estampa (NO te mejoran)
        if t>pn:
            u=t-pn; k=back(u/0.28,2.2); sc=1.9-0.9*min(1,u/0.28) if u<0.28 else 1.0+0.015*math.sin(u*9)
            a=min(1,u/0.06); L=430*sc; th=78*sc; cx,cy=540+sh,1010
            for sgn in (1,-1):
                ang=math.radians(45*sgn+(1-min(1,u/0.28))*-12)
                dx,dy=math.cos(ang)*L,math.sin(ang)*L; nx,ny=-math.sin(ang)*th/2,math.cos(ang)*th/2
                poly=[(cx-dx+nx,cy-dy+ny),(cx+dx+nx,cy+dy+ny),(cx+dx-nx,cy+dy-ny),(cx-dx-nx,cy-dy-ny)]
                g.polygon([(x*SS,y*SS) for x,y in poly],fill=CORAL+(int(255*a),))
                d.polygon([((x+0)*SS,(y+14)*SS) for x,y in poly],fill=(0,0,0,int(90*a)))
    bg=_BG.copy()
    if flash>0: bg[...,:3]=bg[...,:3]*(1-_VG*flash)+np.array(CORAL,np.float32)/255*_VG*flash
    for layer,halo in ((img,False),(glow,True)):
        L=cv2.resize(np.array(layer).astype(np.float32)/255.0,(W,H),interpolation=cv2.INTER_AREA)
        if halo:   # halo rápido: desenfoque a 1/4 de resolución (premultiplicado)
            pm=np.dstack([L[...,:3]*L[...,3:4],L[...,3:4]]); sm=cv2.resize(pm,(W//4,H//4),interpolation=cv2.INTER_AREA)
            sm=cv2.GaussianBlur(sm,(0,0),7); hb=cv2.resize(sm,(W,H),interpolation=cv2.INTER_LINEAR)
            ha=np.clip(hb[...,3:4]*2.0,0,1); hc=hb[...,:3]/np.maximum(hb[...,3:4],1e-4)
            bg[...,:3]=bg[...,:3]*(1-ha)+np.clip(hc,0,1)*ha
        a=L[...,3:4]; bg[...,:3]=bg[...,:3]*(1-a)+L[...,:3]*a
    return bg
