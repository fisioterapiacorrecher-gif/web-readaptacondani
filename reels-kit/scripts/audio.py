# Uso: python3 -I audio.py edit.json voz48k.wav mezcla_raw.wav   (luego: alimiter, ver README)
# Kit de sonidos de Dani (siempre el mismo sonido para cada función):
#   entrada  = doble clic  -> entra una palabra clave, imagen, animación o el @usuario (NO al inicio del título)
#   salida   = barrido     -> sale cualquier texto destacado, título, imagen, animación o @usuario
#   destello / bien / trombon / error -> solo en momentos puntuales con sentido (campo "sfx" en edit.json)
import sys, os, json, numpy as np
from scipy.io import wavfile
KIT=os.path.dirname(os.path.dirname(os.path.abspath(sys.argv[0])))
E=json.load(open(sys.argv[1])); SR=48000; END=E["END"]; N=int(END*SR)
def load(p):
    sr,x=wavfile.read(p); x=x.astype(np.float32)/32768
    return x if x.ndim>1 else np.stack([x,x],1)
LIB={os.path.splitext(k)[0]:load(f"{KIT}/sfx/{k}") for k in os.listdir(f"{KIT}/sfx") if k.endswith(".wav")}
v=load(sys.argv[2]); voice=np.zeros((N,2),np.float32); n=min(N,len(v)); voice[:n]=v[:n]
voice*=10**(E.get("voice_gain_db",14)/20)     # voz de Dani a ~-11 dB RMS, como en sus vídeos
fx=np.zeros((N,2),np.float32); log=[]
GAIN={"entrada":2.0}
def put(k,t,g=1.0):
    if not k: return
    if k in("salida","entrada") and any(k2==k and abs(t2-t)<0.45 for t2,k2 in log): return
    x=LIB[k]*GAIN.get(k,1.0)*g; s=int(t*SR); e=min(N,s+len(x))
    if 0<=s<N: fx[s:e]+=x[:e-s]; log.append((round(t,2),k))
H=E["hook"]; put(H.get("sfx_in"),0.0); put("salida",H["end"]-0.17)
for K in E["keys"]:
    put(K.get("sfx_in","entrada"),K["st"])
    for name,off,*g in K.get("sfx",[]): put(name,K["st"]+off,(g or [1.0])[0])
    put("salida",K["en"]-0.17)
for C in E.get("cards",[]): put("entrada",C["st"]); put("salida",C["en"]-0.2)
for G in E.get("graphics",[]):
    put(G.get("sfx_in","entrada"),G["st"]); put(G.get("sfx_out","salida"),G["en"]-0.25)
    for name,t,*g in G.get("sfx",[]): put(name,t,(g or [1.0])[0])
h=E.get("outro",{}).get("handle")
if h: put("entrada",h[1]); put("salida",END-0.24)
wavfile.write(sys.argv[3],SR,(voice+fx).astype(np.float32))
print(sorted(log))
