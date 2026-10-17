import sys, json, subprocess, numpy as np, cv2
# Uso: python3 -I render.py edit.json subs.ass audio.wav salida.mp4 [segundos_max_para_prueba]
import os
KIT=os.path.dirname(os.path.dirname(os.path.abspath(sys.argv[0])))
E=json.load(open(sys.argv[1])); ASS=sys.argv[2]; AUD=sys.argv[3]; out=sys.argv[4]
if len(sys.argv)>5: E["END"]=min(E["END"],float(sys.argv[5]))
FONTS=KIT+"/fonts"
MODS={}
def modulo(name):   # cada animación puede usar su propio módulo ("module" en el gráfico; por defecto "graphic_module")
    if name not in MODS:
        sys.path.insert(0,KIT+"/scripts"); import importlib; m=importlib.import_module(name)
        m.FONT=FONTS+'/Montserrat-900.ttf'
        if 'graphic_cy' in E and hasattr(m,'OY'): m.CY=E['graphic_cy']; m.OY=m.CY-450
        MODS[name]=m
    return MODS[name]
for G_ in E.get("graphics",[]): G_["_mod"]=modulo(G_.get("module",E.get("graphic_module","animacion_tendon")))
W,H,FPS=1080,1920,30; END=E["END"]; NF=int(round(END*FPS))
# ---- sRGB (SDR graphics) -> HLG code values in BT.2020 (SDR white = 75% HLG, BT.2408)
M=np.array([[0.6274,0.3293,0.0433],[0.0691,0.9195,0.0114],[0.0164,0.0880,0.8956]],np.float32)
a_,b_,c_=0.17883277,0.28466892,0.55991073
def to_hlg(rgb,ref=0.203):
    lin=np.where(rgb<=0.04045,rgb/12.92,((rgb+0.055)/1.055)**2.4)
    l2=np.clip(lin@M.T,0,None)*ref
    Y=np.maximum(l2@np.array([0.2627,0.6780,0.0593],np.float32),1e-6)[...,None]
    E_=np.clip(l2*Y**(-0.2/1.2),0,1)
    return np.where(E_<=1/12,np.sqrt(3*E_),a_*np.log(np.maximum(12*E_-b_,1e-6))+c_).astype(np.float32)
dec=subprocess.Popen(["ffmpeg","-nostdin","-v","error","-i",E["video"],"-vf",
  f"trim=duration={E.get('video_end',E['END'])},tpad=stop_mode=clone:stop_duration=3,fps=30,scale=in_color_matrix=bt2020:in_range=tv:out_range=pc,format=rgb48le",
  "-frames:v",str(NF),"-f","rawvideo","-pix_fmt","rgb48le","-"],stdout=subprocess.PIPE)
ovr=subprocess.Popen(["ffmpeg","-nostdin","-v","error","-f","lavfi","-i",f"color=c=black:s=1080x1920:r=30:d={END+1}","-f","lavfi","-i",f"color=c=white:s=1080x1920:r=30:d={END+1}",
  "-filter_complex",f"[0]format=rgb24,ass={ASS}:fontsdir={FONTS}[b];[1]format=rgb24,ass={ASS}:fontsdir={FONTS}[w];[b][w]vstack",
  "-frames:v",str(NF),"-f","rawvideo","-pix_fmt","rgb24","-"],stdout=subprocess.PIPE)
enc=subprocess.Popen(["ffmpeg","-nostdin","-v","error","-f","rawvideo","-pix_fmt","rgb48le","-s","1080x1920","-r","30","-i","-","-i",AUD,
  "-vf","scale=out_color_matrix=bt2020:out_range=tv:in_range=pc,format=yuv420p10le","-map","0:v","-map","1:a","-t",str(END),
  "-c:v","libx265","-preset","medium","-crf","17","-x265-params","log-level=error:colorprim=bt2020:transfer=arib-std-b67:colormatrix=bt2020nc:range=limited",
  "-tag:v","hvc1","-color_primaries","bt2020","-color_trc","arib-std-b67","-colorspace","bt2020nc","-color_range","tv",
  "-c:a","aac","-b:a","192k","-movflags","+faststart",out,"-y"],stdin=subprocess.PIPE)
BR=E.get("broll"); brf=None
if BR:
    nb=int(round((BR["en"]-BR["st"])*FPS))
    if BR.get("hdr"):   # vídeo de apoyo grabado en HLG (iPhone): se usa tal cual, sin to_hlg()
        brp=subprocess.Popen(["ffmpeg","-nostdin","-v","error","-ss",str(BR["offset"]),"-i",BR["path"],"-vf","fps=30,scale=1080:1920:flags=lanczos:in_color_matrix=bt2020:in_range=tv:out_range=pc,format=rgb48le","-frames:v",str(nb),"-f","rawvideo","-pix_fmt","rgb48le","-"],stdout=subprocess.PIPE)
        brf=[np.frombuffer(brp.stdout.read(W*H*6),np.uint16).reshape(H,W,3) for _ in range(nb)]
    else:
        brp=subprocess.Popen(["ffmpeg","-nostdin","-v","error","-ss",str(BR["offset"]),"-i",BR["path"],"-vf","fps=30,scale=1080:1920:flags=lanczos","-frames:v",str(nb),"-f","rawvideo","-pix_fmt","rgb24","-"],stdout=subprocess.PIPE)
        brf=[np.frombuffer(brp.stdout.read(W*H*3),np.uint8).reshape(H,W,3) for _ in range(nb)]
Z=E["zoom"]
def eo(x): x=min(1,max(0,x)); return 1-(1-x)**3
def zoom(t):
    k=max(i for i in range(len(Z)) if Z[i][0]<=t+1e-6); t0,za,zb,m=Z[k]; t1=Z[k+1][0] if k+1<len(Z) else END
    if m=="S":   # empuje suave (0,6 s, ease in-out): énfasis sin brusquedad
        return za+(zb-za)*(3*min(1,(t-t0)/0.6)**2-2*min(1,(t-t0)/0.6)**3)
    if m=="P":
        if t-t0<0.22: return za+(zb-za)*eo((t-t0)/0.22)
        return zb+0.015*(t-t0-0.22)/max(0.01,t1-t0-0.22)
    return za+(zb-za)*(t-t0)/max(0.01,t1-t0)
CX,CY=520,860
cards=[]
for C in E["cards"]:
    im=cv2.imread(C["png"],cv2.IMREAD_UNCHANGED).astype(np.float32)/255
    rgb=to_hlg(im[...,2::-1].copy()); cards.append((C["st"],C["en"],np.dstack([rgb,im[...,3]]),C.get("cy",880),C.get("sc",1.0)))
GR=E.get("graphics",[])
KEYS=[(K["st"],K["en"],K.get("y",1180)) for K in E["keys"]]
yy=np.arange(H,dtype=np.float32)
def keydark(t):
    m=np.zeros(H,np.float32)
    for a,b,cy in KEYS:
        if a-0.15<=t<=b+0.2:
            v=max(0,min(1,(t-a+0.15)/0.25,(b+0.2-t)/0.25)); m=np.maximum(m,v*0.24*np.exp(-((yy-cy)/240)**2))
    return m
def over(dst,src,cx,cy,alpha):
    h,w=src.shape[:2]; x0=int(round(cx-w/2)); y0=int(round(cy-h/2))
    x1,y1=max(0,x0),max(0,y0); x2,y2=min(W,x0+w),min(H,y0+h)
    s=src[y1-y0:y2-y0,x1-x0:x2-x0]; a=s[:,:,3:4]*alpha
    dst[y1:y2,x1:x2]=dst[y1:y2,x1:x2]*(1-a)+s[:,:,:3]*a
LOOKS=E.get("looks",[])   # tramos en blanco y negro: [{"st","en","fade_in","fade_out","contrast","vignette"}]
_vy,_vx=np.mgrid[0:H,0:W].astype(np.float32)
VIG=np.clip(((_vx-540)/640)**2+((_vy-900)/1050)**2,0,1.5)[...,None]
def look(f,t):
    for L in LOOKS:
        fi,fo=L.get("fade_in",0.0),L.get("fade_out",0.25)
        if L["st"]-fi<=t<L["en"]+fo:
            m=1.0
            if fi>0 and t<L["st"]: m=(t-L["st"]+fi)/fi
            if t>=L["en"]: m=1-(t-L["en"])/fo
            m=max(0.0,min(1.0,m))
            Y=(f@np.array([0.2627,0.6780,0.0593],np.float32))[...,None]
            g=np.clip((Y-0.45)*L.get("contrast",1.15)+0.45,0,1)*(1-L.get("vignette",0.22)*VIG)
            return f*(1-m)+np.repeat(g,3,2)*m
    return f
def blurbg(f,amt):
    small=cv2.resize(f,(W//8,H//8),interpolation=cv2.INTER_AREA); small=cv2.GaussianBlur(small,(0,0),5)
    bl=cv2.resize(small,(W,H),interpolation=cv2.INTER_LINEAR)*0.62
    return f*(1-amt)+bl*amt
fb=W*H*6; ob=W*H*2*3; last=None
for i in range(NF):
    raw=dec.stdout.read(fb)
    if len(raw)<fb: raw=last
    last=raw; t=i/FPS
    f=np.frombuffer(raw,np.uint16).reshape(H,W,3).astype(np.float32)/65535.0
    z=zoom(t)
    if abs(z-1)>1e-4:
        Mz=np.array([[z,0,CX*(1-z)],[0,z,CY*(1-z)]],np.float32)
        f=cv2.warpAffine(f,Mz,(W,H),flags=cv2.INTER_LINEAR,borderMode=cv2.BORDER_REFLECT)
    if BR and BR["st"]<=t<BR["en"]:
        k=min(len(brf)-1,int((t-BR["st"])*FPS)); b=brf[k].astype(np.float32)/(65535 if BR.get("hdr") else 255)
        zb=1.0+BR.get("zoom",0.08)*(t-BR["st"])/(BR["en"]-BR["st"])
        Mb=np.array([[zb,0,540*(1-zb)],[0,zb,960*(1-zb)]],np.float32)
        b=cv2.warpAffine(b,Mb,(W,H),flags=cv2.INTER_LINEAR,borderMode=cv2.BORDER_REFLECT)*BR.get("dark",0.82)
        f=b if BR.get("hdr") else to_hlg(b)
    f=look(f,t)
    kd=keydark(t)
    if kd.max()>0: f=f*(1-kd[:,None,None])
    for st,en,im,ccy,csc in cards:
        if st<=t<=en:
            a=eo((t-st)/0.22); s=0.86+0.14*eo((t-st)/0.32)+0.03*(t-st)/(en-st)
            if t>en-0.18: q=(en-t)/0.18; a*=q; s*=0.97+0.03*q
            f=blurbg(f,max(0,min(1,(t-st)/0.18,(en-t)/0.18)))
            over(f,cv2.resize(im,None,fx=s*csc,fy=s*csc,interpolation=cv2.INTER_AREA),540,ccy,a)
    for G in GR:
        if G["st"]<=t<=G["en"]:
            if G.get("blur",True): f=blurbg(f,max(0,min(1,(t-G["st"])/0.2,(G["en"]-t)/0.2)))
            g=G["_mod"].draw(t,G.get("scene",""),G["st"],G["en"],G.get("pulses",[]),G.get("broken",[]))
            if g is not None:
                ys=np.where(g[...,3].max(1)>0)[0]
                if len(ys):
                    y0,y1=ys[0],ys[-1]+1; gg=g[y0:y1]; a=gg[...,3:4]
                    f[y0:y1]=f[y0:y1]*(1-a)+to_hlg(gg[...,:3],0.30)*a
    o=np.frombuffer(ovr.stdout.read(ob),np.uint8).reshape(2*H,W,3)
    bk=o[:H]; wh=o[H:]
    diff=(wh.astype(np.int16)-bk.astype(np.int16)).mean(2)
    ys,xs=np.where(diff<254)
    if len(ys):
        y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
        b=bk[y0:y1,x0:x1].astype(np.float32)/255; a=np.clip(1-diff[y0:y1,x0:x1]/255.0,0,1)[...,None]
        col=np.clip(b/np.maximum(a,1e-3),0,1)
        f[y0:y1,x0:x1]=f[y0:y1,x0:x1]*(1-a)+to_hlg(col,0.40)*a
    enc.stdin.write((np.clip(f,0,1)*65535+0.5).astype(np.uint16).tobytes())
    if i%300==0: print("frame",i,flush=True)
enc.stdin.close(); enc.wait(); dec.terminate(); ovr.terminate(); print("done")
