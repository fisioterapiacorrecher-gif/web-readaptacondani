# Uso: python3 -I alinear_palabras.py voz16k.wav segmentos.txt words.json
# segmentos.txt: "inicio|fin|texto" por línea (tiempos de pausas/ventanas). Reparte las palabras por sílabas + picos de energía.
import sys, re, json, numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfiltfilt, find_peaks
sr,a=wavfile.read(sys.argv[1]); a=a.astype(np.float32)/32768; hop=160; n=len(a)//hop
sos=butter(4,[300,2500],btype='band',fs=sr,output='sos'); b=sosfiltfilt(sos,a)
e=20*np.log10(np.array([np.sqrt(np.mean(b[i*hop:(i+1)*hop]**2))+1e-9 for i in range(n)])); e=np.convolve(e,np.ones(5)/5,'same')
pk,_=find_peaks(e,distance=8,prominence=2.5,height=-32); pk=pk/100
V='aeiouáéíóúü'; ST='aeoáéíóú'
def syl(w):
    w=re.sub(r'[^a-záéíóúüñ]','',w.lower())
    if w.startswith('peee'): return 3.0
    if w.endswith('y') and len(w)>1: w=w[:-1]+'i'
    c=0;p=None
    for ch in w:
        if ch in V:
            if p is None or (p in ST and ch in ST): c+=1
            p=ch
        else: p=None
    return max(c,1)
out=[]
for line in open(sys.argv[2]):
    st,en,txt=line.strip().split('|',2); st=float(st); en=float(en)
    ws=txt.split(); sy=np.array([syl(w) for w in ws]); cum=np.concatenate([[0],np.cumsum(sy)]); S=cum[-1]
    p=[x for x in pk if st-0.02<=x<=en+0.02]; P=len(p)
    for i,w in enumerate(ws):
        lin=st+(en-st)*cum[i]/S
        if i>0 and P>=2 and abs(P-S)<=0.4*S:
            k=min(int(round(cum[i]*P/S)),P-1); t=0.5*(p[k]-0.06)+0.5*lin
        else: t=lin
        red=w.startswith('*'); w=w.lstrip('*')
        out.append([round(t,2),None,w,red,en])
for i,o in enumerate(out):
    nxt=out[i+1][0] if i+1<len(out) else o[4]
    o[1]=round(nxt if nxt-o[4]<0.01 or nxt<=o[4] else min(o[4]+0.25,nxt),2)
    o.pop()
json.dump(out,open(sys.argv[3],'w'),ensure_ascii=False)
for o in out: print(o)
