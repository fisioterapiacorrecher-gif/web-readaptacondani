import numpy as np, cv2, math
from PIL import Image, ImageDraw, ImageFont
FONT=None
def font(sz): return ImageFont.truetype(FONT, sz)
SS=2; W,H=1080,1920; CY=800; OY=CY-450; CH=900
CORAL=(255,52,52); BONE=(255,251,232); MINT=(233,255,185)
def eo(x): x=min(1,max(0,x)); return 1-(1-x)**3
def eio(x): x=min(1,max(0,x)); return 3*x*x-2*x*x*x
NF=7; XA,XB=395,745; GAP=(555,605); TRAVEL=0.6
def fy(i,x):
    spread=np.interp(x,[XA,580,XB],[100,62,34]); base=(i-(NF-1)/2)/((NF-1)/2)
    return CY+base*spread+5*math.sin(x/40+i*1.7)
def P(x,y): return (x*SS,(y-OY)*SS)
def bone_layer(ang_deg, L=225):
    R=int((L+80)*SS); c=Image.new('RGBA',(2*R,2*R),(0,0,0,0)); d=ImageDraw.Draw(c)
    cx,cy=R,R; th=30*SS; k=30*SS
    d.rounded_rectangle([cx+10*SS,cy-th,cx+L*SS,cy+th],radius=th,fill=BONE+(255,))
    for ex in (cx+12*SS, cx+L*SS):
        d.ellipse([ex-k-8*SS,cy-th-k+8*SS,ex+k-8*SS,cy-th+k+8*SS],fill=BONE+(255,))
        d.ellipse([ex-k-8*SS,cy+th-k-8*SS,ex+k-8*SS,cy+th+k-8*SS],fill=BONE+(255,))
    return c.rotate(ang_deg,resample=Image.BICUBIC,center=(cx,cy)), R
def draw(t, scene, t0, t1, pulses, broken):
    A=eo((t-t0)/0.3)*(1-eo((t-(t1-0.25))/0.25) if t>t1-0.25 else 1)
    if A<=0: return None
    img=Image.new('RGBA',(W*SS,CH*SS),(0,0,0,0)); d=ImageDraw.Draw(img)
    contr=0; lift=0
    for ps in pulses:
        u=t-ps
        if 0<=u<1.1: contr=max(contr, math.sin(min(1,u/0.2)*math.pi/2)*(1-eio((u-0.7)/0.4)))
        if scene=='A' and TRAVEL<=u<TRAVEL+1.1: lift=max(lift, eo((u-TRAVEL)/0.3)*(1-eio((u-TRAVEL-0.6)/0.5)))
    # muscle
    mx=215; rx=165*(1-0.13*contr); ry=125*(1+0.12*contr)
    d.ellipse([*P(mx-rx,CY-ry),*P(mx+rx,CY+ry)],fill=CORAL+(245,))
    for k in range(-4,5):
        yy=CY+k*24*(ry/125); xs=math.sqrt(max(0,1-((yy-CY)/ry)**2))*rx*0.82
        d.line([*P(mx-xs,yy),*P(mx+xs,yy)],fill=(255,150,150,170),width=3*SS)
    # bone: pivot at tendon insertion, lifts (rotates up) when force arrives
    bl,R=bone_layer(28*lift)
    img.alpha_composite(bl,(int(XB*SS-R),int((CY-OY)*SS-R)))
    # fibres (base, slightly dim)
    gapw=(14 if scene=='B' else 0)
    def segs(i):
        xs=np.linspace(XA,XB,100)
        if scene=='B' or i in broken:
            return [[x for x in xs if x<GAP[0]-gapw],[x for x in xs if x>GAP[1]+gapw]]
        return [list(xs)]
    for i in range(NF):
        isb=scene=='B' or i in broken
        col=(BONE+(215,)) if not isb else (150,140,135,190)
        for sg in segs(i):
            d.line([P(x,fy(i,x)) for x in sg],fill=col,width=7*SS,joint='curve')
        if isb:
            for sg,end,dx in ((segs(i)[0],segs(i)[0][-1],1),(segs(i)[1],segs(i)[1][0],-1)):
                for k in (-1,0,1): d.line([*P(end,fy(i,end)),*P(end+dx*14,fy(i,end)+k*8)],fill=col,width=3*SS)
    # labels
    f=font(54*SS)
    for txt,x in (("MÚSCULO",mx),("HUESO",XB+125)):
        w=d.textlength(txt,font=f); d.text((x*SS-w/2,(CY-OY-215)*SS),txt,font=f,fill=(255,255,255,255),stroke_width=4*SS,stroke_fill=(0,0,0,140))
    f2=font(40*SS); w=d.textlength("TENDÓN",font=f2); d.text((((XA+XB)/2)*SS-w/2,(CY-OY+135)*SS),"TENDÓN",font=f2,fill=(255,255,255,240),stroke_width=3*SS,stroke_fill=(0,0,0,140))
    # light: fibres fill with light from muscle towards bone
    glow=Image.new('RGBA',img.size,(0,0,0,0)); g=ImageDraw.Draw(glow); sparks=[]
    for ps in pulses:
        u=(t-ps)/TRAVEL
        if not (0<=u<=2.0): continue
        head=XA+(XB-XA)*eio(min(u,1)); fade=1 if u<=1.3 else max(0,1-(u-1.3)/0.7)
        for i in range(NF):
            isb=scene=='B' or i in broken
            stop=(GAP[0]-gapw) if isb else XB
            h=min(head,stop)
            if h<=XA+2: continue
            colr=MINT
            if isb and head>stop:
                colr=(255,70,70); sparks.append((stop,fy(i,stop),fade))
            xs=np.linspace(XA,h,60)
            g.line([P(x,fy(i,x)) for x in xs],fill=colr+(int(255*fade),),width=8*SS,joint='curve')
            hx=h; g.ellipse([*P(hx-11,fy(i,hx)-11),*P(hx+11,fy(i,hx)+11)],fill=(255,255,255,int(255*fade)))
        if scene=='A' and 0.9<=u<=1.6:
            k=1-abs(u-1.15)/0.45
            if k>0: g.ellipse([*P(XB-55,CY-55),*P(XB+55,CY+55)],fill=MINT+(int(230*k),))
    for x,y,fd in sparks:
        for k in range(6):
            an=k*1.05+t*13; r=12+12*((t*6+k*0.37)%1)
            g.line([*P(x+6,y),*P(x+6+r*math.cos(an),y+r*math.sin(an))],fill=(255,80,80,int(255*fd)),width=4*SS)
    gl=np.array(glow).astype(np.float32); base=np.array(img).astype(np.float32)
    halo=cv2.GaussianBlur(gl,(0,0),14*SS)
    out=base
    for layer,k in ((halo,2.2),(gl,1.0)):
        a=np.clip(layer[...,3:4]/255*k,0,1); out[...,:3]=out[...,:3]*(1-a)+layer[...,:3]*a; out[...,3:4]=np.maximum(out[...,3:4],a*255)
    res=cv2.resize(out,(W,CH),interpolation=cv2.INTER_AREA)/255.0
    # red X over the gap once the force failed to cross
    if scene=='B':
        xa=[ (t-ps-TRAVEL) for ps in pulses if t-ps-TRAVEL>=0 ]
        if xa:
            k=eo(min(xa)/0.25) if len(xa)==1 else 1
            c=Image.new('RGBA',(W*SS,CH*SS),(0,0,0,0)); cd=ImageDraw.Draw(c); cx=(GAP[0]+GAP[1])/2; s=70*k
            for a_,b_ in (((-1,-1),(1,1)),((-1,1),(1,-1))):
                cd.line([*P(cx+a_[0]*s,CY+a_[1]*s),*P(cx+b_[0]*s,CY+b_[1]*s)],fill=CORAL+(255,),width=16*SS)
            xr=cv2.resize(np.array(c).astype(np.float32),(W,CH),interpolation=cv2.INTER_AREA)/255.0
            a=xr[...,3:4]; res[...,:3]=res[...,:3]*(1-a)+xr[...,:3]*a; res[...,3:4]=np.maximum(res[...,3:4],a)
    full=np.zeros((H,W,4),np.float32); full[OY:OY+CH]=res; full[...,3]*=A
    return full
