# «El bucle»: DOLOR -> CAMILLA -> LEVE MEJORA -> A CORRER -> DOLOR otra vez (reel «Bucle», nov 2026).
# Cuatro estaciones en círculo (icono en círculo coral + rótulo). Cada una entra al decirla y la flecha
# curva se dibuja desde la anterior. Al volver el dolor el círculo se cierra: una bola de luz recorre el bucle
# cada vez más rápido, cada estación late al pasar, el dolor da un fogonazo y el contador de vueltas sube.
# pulses = [dolor, camilla, leve mejora, correr, dolor otra vez]
import math, numpy as np
from PIL import Image, ImageDraw
from anim_base import *
FONT=None; CY=1010; R=300; RI=82
ANG=[-90,0,90,180]                                   # arriba, derecha, abajo, izquierda (sentido horario)
LABEL=["DOLOR","CAMILLA","LEVE MEJORA","A CORRER"]
INK=(30,26,26)

def pos(a): return 540+R*math.cos(math.radians(a)), CY+R*math.sin(math.radians(a))

def icono(d,k,cx,cy,s,al):
    w=BONE+(al,)
    if k==0:     # dolor: rayo
        P=[(-8,-50),(26,-50),(6,-8),(30,-8),(-14,52),(-2,8),(-26,8)]
        d.polygon([((cx+x*s)*SS,(cy+y*s)*SS) for x,y in P],fill=w)
    elif k==1:   # camilla: tablero con almohada y patas
        d.rounded_rectangle([(cx-50*s)*SS,(cy-6*s)*SS,(cx+50*s)*SS,(cy+10*s)*SS],5*SS,fill=w)
        d.rounded_rectangle([(cx+16*s)*SS,(cy-20*s)*SS,(cx+46*s)*SS,(cy-8*s)*SS],6*SS,fill=w)
        for lx in (-40,40): d.rectangle([(cx+(lx-4)*s)*SS,(cy+10*s)*SS,(cx+(lx+4)*s)*SS,(cy+38*s)*SS],fill=w)
    elif k==2:   # leve mejora: flechita menta que sube poco
        d.line([(cx*SS,(cy+30*s)*SS),(cx*SS,(cy-14*s)*SS)],fill=MINT+(al,),width=int(12*s*SS))
        d.polygon([((cx-26*s)*SS,(cy-6*s)*SS),((cx+26*s)*SS,(cy-6*s)*SS),(cx*SS,(cy-38*s)*SS)],fill=MINT+(al,))
    else:        # a correr: zapatilla
        d.polygon([((cx-44*s)*SS,(cy+20*s)*SS),((cx-40*s)*SS,(cy-22*s)*SS),((cx-14*s)*SS,(cy-22*s)*SS),((cx+6*s)*SS,(cy-2*s)*SS),
                   ((cx+40*s)*SS,(cy+4*s)*SS),((cx+48*s)*SS,(cy+20*s)*SS)],fill=w)
        d.rectangle([(cx-46*s)*SS,(cy+20*s)*SS,(cx+50*s)*SS,(cy+30*s)*SS],fill=w)
        for j in range(3): d.line([((cx-22*s+j*12*s)*SS,(cy-12*s+j*6*s)*SS),((cx-10*s+j*12*s)*SS,(cy-18*s+j*6*s)*SS)],fill=CORAL+(al,),width=int(4*s*SS))

def flecha(d,a0,a1,q,al):
    """Arco del bucle de a0 a a1 (grados) dibujado hasta la fracción q, con punta."""
    if q<=0: return
    g0=a0+21; g1=a0+21+(a1-a0-42)*q
    box=[(540-R)*SS,(CY-R)*SS,(540+R)*SS,(CY+R)*SS]
    d.arc(box,g0,g1,fill=BONE+(al,),width=10*SS)
    x,y=pos(g1); t=math.radians(g1); tx,ty=-math.sin(t),math.cos(t); nx,ny=math.cos(t),math.sin(t)
    P=[(x+tx*22,y+ty*22),(x-tx*6+nx*17,y-ty*6+ny*17),(x-tx*6-nx*17,y-ty*6-ny*17)]
    d.polygon([(px*SS,py*SS) for px,py in P],fill=BONE+(al,))

def draw(t,scene,t0,t1,pulses,broken):
    A=fade_io(t,t0,t1,0.25,0.25)
    if A<=0: return None
    p=list(pulses)+[1e9]*(5-len(pulses)); pclose=p[4]
    img=canvas(); d=ImageDraw.Draw(img); glow=canvas(); g=ImageDraw.Draw(glow)
    # sombra suave detrás de todo el bucle para que se lea sobre el fondo
    sh=canvas(); ImageDraw.Draw(sh).ellipse([(540-R-170)*SS,(CY-R-170)*SS,(540+R+170)*SS,(CY+R+170)*SS],fill=(0,0,0,90))
    sh=Image.fromarray(cv2.GaussianBlur(np.array(sh),(0,0),40*SS))
    # bola de luz que recorre el bucle cerrado, cada vez más rápido (ángulo acumulado)
    ball=None; vuelta=0
    if t>pclose:
        u=t-pclose; ang=-90+360*(0.55*u+0.32*u*u); ball=ang; vuelta=int((ang+90)//360)
    # flechas entre estaciones
    for i in range(4):
        ts=p[i+1]
        q=eo((t-ts+0.05)/0.45)
        flecha(d,ANG[i],ANG[i]+90,q,int(235*min(1,q*3)))
    # estaciones
    for i in range(4):
        ti=p[i]
        if t<ti: continue
        u=t-ti; k=back(u/0.38); cx,cy=pos(ANG[i]); al=int(255*min(1,u/0.1))
        bump=0.0
        if ball is not None:                                  # late cuando pasa la bola
            dd=((ball-ANG[i]+180)%360)-180
            bump=math.exp(-(dd/22)**2)*0.18
        if i==0 and t>pclose:                                  # el dolor vuelve: segundo pop
            k=max(k,1)*(1+0.25*math.exp(-(t-pclose)/0.18)*math.sin((t-pclose)*30))
        r=RI*min(1.12,0.3+0.7*k)*(1+bump)
        if i==0:                                               # dolor: brillo coral concéntrico + rayitos
            pul=1+0.10*math.sin(u*2*math.pi*1.8)
            for rr,a_ in ((r*1.5,55),(r*1.25,105)):            # halo debajo del círculo (el rayo se sigue viendo)
                rr*=pul; d.ellipse([(cx-rr)*SS,(cy-rr)*SS,(cx+rr)*SS,(cy+rr)*SS],fill=CORAL+(int(a_*al/255),))
            kr=min(1,u/0.3)
            for j in range(7):
                an=math.radians(-90-75+j*25); r0=r*1.62; r1=r0+30*kr
                g.line([((cx+math.cos(an)*r0)*SS,(cy+math.sin(an)*r0)*SS),((cx+math.cos(an)*r1)*SS,(cy+math.sin(an)*r1)*SS)],fill=CORAL+(int(al*kr),),width=7*SS)
        d.ellipse([(cx-r)*SS,(cy-r)*SS,(cx+r)*SS,(cy+r)*SS],fill=CORAL+(al,))
        icono(d,i,cx,cy,r/RI,al)
        # rótulo: arriba del dolor, debajo de los demás
        f=font(FONT,(50 if i!=2 else 46)*SS); a2=int(255*eo(u/0.3))
        ly=cy-r-78 if i==0 else cy+r+16
        text_c(d,f,LABEL[i],cx,ly,fill=(255,255,255,a2),stroke=5)
    # bola de luz con estela
    if ball is not None:
        for q in range(12):
            a_=math.radians(ball-q*5.5); x,y=540+R*math.cos(a_),CY+R*math.sin(a_); rr=15*(1-q/13)
            (g if q==0 else d).ellipse([(x-rr)*SS,(y-rr)*SS,(x+rr)*SS,(y+rr)*SS],fill=(255,255,255,int(255*(1-q/12))))
    # centro: contador de vueltas (meses en el bucle)
    if t>pclose:
        u=t-pclose; k=back(u/0.35); f=font(FONT,int(52*min(1.1,0.3+0.7*k))*SS)
        txt=f"VUELTA {vuelta+1}"; tw=d.textlength(txt,font=f)/SS; ph=42*min(1.1,0.4+0.6*k); pw=tw/2+32
        d.rounded_rectangle([(540-pw)*SS,(CY-ph)*SS,(540+pw)*SS,(CY+ph)*SS],ph*SS,fill=BONE+(int(255*min(1,u/0.1)),))
        d.text(((540-tw/2)*SS,(CY-32*min(1.1,0.3+0.7*k))*SS),txt,font=f,fill=INK+(int(255*min(1,u/0.1)),))
    out=to_full(img,A,glow); s=to_full(sh,A)
    a2=out[...,3:4]; s[...,:3]=s[...,:3]*(1-a2)+out[...,:3]*a2; s[...,3:4]=np.maximum(s[...,3:4],a2)
    return s
import cv2
