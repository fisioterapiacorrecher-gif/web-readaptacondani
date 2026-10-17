# Paso del tiempo: hoja de calendario cuyos días se tachan cada vez más rápido; al acabar el mes la hoja sale volando.
import math, numpy as np
from PIL import Image, ImageDraw
from anim_base import *
FONT=None; CX,CYC=540,1505; CW,CHH=360,330
import calendar as _cal
_N=["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"]
MESES,DIAS,INI=[],[],[]
for i in range(36):                     # desde octubre de 2026, tres años de hojas
    y,m=2026+(9+i)//12,(9+i)%12+1; w,n=_cal.monthrange(y,m); MESES.append(_N[m-1]); DIAS.append(n); INI.append(w)
def page(m,crossed):
    c=Image.new('RGBA',(CW*SS,CHH*SS),(0,0,0,0)); d=ImageDraw.Draw(c)
    d.rounded_rectangle([0,0,CW*SS-1,CHH*SS-1],22*SS,fill=BONE+(255,))
    d.rounded_rectangle([0,0,CW*SS-1,70*SS],22*SS,fill=CORAL+(255,)); d.rectangle([0,40*SS,CW*SS-1,70*SS],fill=CORAL+(255,))
    f=font(FONT,40*SS); w=d.textlength(MESES[m],font=f); d.text(((CW*SS-w)/2,12*SS),MESES[m],font=f,fill=(255,255,255,255))
    fn=font(FONT,22*SS); cw=(CW-30)/7; ch=(CHH-90)/6
    for day in range(DIAS[m]):
        p=day+INI[m]; col,row=p%7,p//7
        x=15+col*cw+cw/2; y=82+row*ch+ch/2
        s=str(day+1); w=d.textlength(s,font=fn); d.text((x*SS-w/2,(y-13)*SS),s,font=fn,fill=(60,55,52,255))
        if day<crossed:
            r=13
            for a,b in (((-1,-1),(1,1)),((-1,1),(1,-1))): d.line([((x+a[0]*r)*SS,(y+a[1]*r)*SS),((x+b[0]*r)*SS,(y+b[1]*r)*SS)],fill=CORAL+(255,),width=5*SS)
    return c
def plan(t0,t1):
    durs=[]; t=t0+0.3; k=0.8
    while t<t1-0.3 and len(durs)<len(MESES)-1: durs.append(min(k,t1-0.3-t)); t+=durs[-1]; k=max(0.2,k*0.74)
    return durs
def draw(t,scene,t0,t1,pulses,broken):
    A=fade_io(t,t0,t1,0.25,0.25)
    if A<=0: return None
    img=canvas()
    sh=Image.new('RGBA',img.size,(0,0,0,0)); ImageDraw.Draw(sh).rounded_rectangle([(CX-CW/2+6)*SS,(CYC-CHH/2+14)*SS,(CX+CW/2+6)*SS,(CYC+CHH/2+14)*SS],22*SS,fill=(0,0,0,130))
    img.alpha_composite(sh)
    ent=back((t-t0)/0.35)
    durs=plan(t0,t1); ts=t0+0.3; m=0
    while m<len(durs) and t>=ts+durs[m]: ts+=durs[m]; m+=1
    m=min(m,len(MESES)-1)
    under=page(min(m+1,len(MESES)-1),0)
    dur=durs[m] if m<len(durs) else 1.0; u=(t-ts)/dur
    fly=max(0,(u-0.78)/0.22) if m<len(durs) else 0
    crossed=int(DIAS[m]*min(1,max(0,u/0.75))) if t>=t0+0.3 else 0
    top=page(m,crossed)
    x0,y0=int((CX-CW/2)*SS),int((CYC-CHH/2)*SS)
    if fly>0: img.alpha_composite(under,(x0,y0))
    if fly<1:
        if fly>0:
            k=eio(fly); top=top.rotate(-25*k,resample=Image.BICUBIC,expand=True)
            al=np.array(top); al[...,3]=(al[...,3]*(1-k)).astype(np.uint8); top=Image.fromarray(al)
            img.alpha_composite(top,(max(0,int(x0+260*k*SS-(top.width-CW*SS)/2)),max(0,int(y0-300*k*SS-(top.height-CHH*SS)/2))))
        else: img.alpha_composite(top,(x0,y0))
    # anillas
    d=ImageDraw.Draw(img)
    for x in (CX-100,CX+100): d.rounded_rectangle([(x-9)*SS,(CYC-CHH/2-22)*SS,(x+9)*SS,(CYC-CHH/2+22)*SS],8*SS,fill=(70,70,78,255))
    if ent<1:
        s=0.6+0.4*ent; w,h=img.size; im2=img.resize((int(w*s),int(h*s)),Image.BICUBIC)
        img=canvas(); img.alpha_composite(im2,(int(CX*SS*(1-s)),int(CYC*SS*(1-s))))
    return to_full(img,A)
