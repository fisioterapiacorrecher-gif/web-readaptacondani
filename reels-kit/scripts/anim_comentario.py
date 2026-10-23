# CTA "déjame un comentario": tarjeta de comentario de Instagram (estilo plano, colores del manual) arriba de la
# pantalla. Se escribe el texto letra a letra, se pulsa enviar, el comentario se publica y le llega el "me gusta"
# de Dani (corazón coral + "le gusta a <usuario>"). scene = "usuario_seguidor|texto|usuario_que_da_like".
# pulses = [empieza a escribir, enviar, me gusta]. Pon el sonido "mensaje" en enviar y en el me gusta.
import math, numpy as np
from PIL import Image, ImageDraw
from anim_base import *
FONT=None; CY=920; OY=CY-450
YC=360                                   # centro de la tarjeta (zona del cielo, sin tapar la cara)
X0,X1=70,1010
def heart(d,cx,cy,r,fill=None,outline=None,w=0):
    pts=[]
    for i in range(80):
        a=2*math.pi*i/80; x=16*math.sin(a)**3; y=-(13*math.cos(a)-5*math.cos(2*a)-2*math.cos(3*a)-math.cos(4*a))
        pts.append(((cx+x*r/17)*SS,(cy+y*r/17)*SS))
    if fill: d.polygon(pts,fill=fill)
    if outline: d.line(pts+[pts[0]],fill=outline,width=w*SS,joint='curve')
def draw(t,scene,t0,t1,pulses,broken):
    A=fade_io(t,t0,t1,0.25,0.2)
    if A<=0: return None
    user,text,liker=(scene or "corredor_con_tendon|Llevo 8 meses con el tendón...|readaptacondani").split('|')
    tw,ts,tl=pulses
    F8=FONT.replace('900','800') if FONT else FONT
    img=canvas(); d=ImageDraw.Draw(img); glow=canvas(); g=ImageDraw.Draw(glow)
    k=back((t-t0)/0.4,1.4); h=230
    top=YC-h/2*k; bot=YC+h/2*k
    sh=canvas(); ImageDraw.Draw(sh).rounded_rectangle([(X0-10)*SS,(top+14)*SS,(X1+10)*SS,(bot+26)*SS],46*SS,fill=(0,0,0,110))
    img.alpha_composite(Image.fromarray(cv2.GaussianBlur(np.array(sh),(0,0),22*SS)))
    d.rounded_rectangle([X0*SS,top*SS,X1*SS,bot*SS],44*SS,fill=(22,22,24,240))
    if k<0.95: return to_full(img,A,glow)
    ax,ay=X0+80,YC
    posted=t>=ts
    # avatar (círculo coral con iniciales)
    d.ellipse([(ax-46)*SS,(ay-46)*SS,(ax+46)*SS,(ay+46)*SS],fill=CORAL+(255,))
    fA=font(FONT,40*SS); ini=user[:1].upper(); w=d.textlength(ini,font=fA); d.text((ax*SS-w/2,(ay-26)*SS),ini,font=fA,fill=BONE+(255,))
    fU=font(FONT,38*SS); fT=font(F8,46*SS); fS=font(F8,30*SS)
    tx=ax+76
    if not posted:
        # caja de escribir: texto que aparece letra a letra + cursor; botón enviar a la derecha
        n=int(max(0,(t-tw))/0.055); s_=text[:n]
        if n==0: d.text((tx*SS,(ay-24)*SS),"Añade un comentario...",font=fT,fill=(150,140,135,255))
        else: d.text((tx*SS,(ay-24)*SS),s_,font=fT,fill=BONE+(255,))
        if (t*2.2)%1<0.6:
            cx=tx+d.textlength(s_,font=fT)/SS+6; d.line([(cx*SS,(ay-26)*SS),(cx*SS,(ay+26)*SS)],fill=CORAL+(255,),width=5*SS)
        bx,by=X1-80,ay; pr=1-0.15*math.sin(min(1,max(0,(t-(ts-0.18))/0.18))*math.pi)
        r=44*pr; d.ellipse([(bx-r)*SS,(by-r)*SS,(bx+r)*SS,(by+r)*SS],fill=CORAL+(255,))
        pl=[(bx-20*pr,by-18*pr),(bx+24*pr,by),(bx-20*pr,by+18*pr),(bx-12*pr,by)]
        d.polygon([(x*SS,y*SS) for x,y in pl],fill=(255,255,255,255))
    else:
        u=(t-ts)/0.35; s=back(u,1.6); dy=(1-eo(u))*30
        d.text((tx*SS,(ay-66+dy)*SS),user,font=fU,fill=(255,255,255,int(255*eo(u))))
        wu=d.textlength(user,font=fU)/SS; d.text(((tx+wu+18)*SS,(ay-61+dy)*SS),"ahora",font=fS,fill=(150,140,135,int(255*eo(u))))
        d.text((tx*SS,(ay-8+dy)*SS),text,font=fT,fill=BONE+(int(255*eo(u)),))
        hx,hy=X1-70,ay-10
        if t<tl: heart(d,hx,hy,26,outline=BONE+(255,),w=4)
        else:
            q=(t-tl); hs=26*back(q/0.3,2.2)
            heart(g,hx,hy,hs,fill=CORAL+(255,))
            if q<0.5:                                                 # destellos alrededor del corazón
                for j in range(8):
                    an=j*math.pi/4; r0=36+70*eo(q/0.5); a_=int(255*(1-q/0.5))
                    g.ellipse([(hx+math.cos(an)*r0-6)*SS,(hy+math.sin(an)*r0-6)*SS,(hx+math.cos(an)*r0+6)*SS,(hy+math.sin(an)*r0+6)*SS],fill=CORAL+(a_,))
            fL=font(F8,30*SS); lt="Le gusta a "+liker; a2=int(255*eo((q-0.15)/0.3))
            d.text((tx*SS,(ay+56)*SS),lt,font=fL,fill=(150,140,135,a2))
    return to_full(img,A,glow)
import cv2
