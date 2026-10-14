# Uso: python3 -I pausas.py voz16k.wav [umbral_dB=-38] [min_frames=15]
# Lista los tramos de voz entre pausas (>=150 ms). Son los "inicio|fin" para segmentos.txt.
import sys, numpy as np
from scipy.io import wavfile
sr,a=wavfile.read(sys.argv[1]); a=a.astype(np.float32)/32768
if a.ndim>1: a=a.mean(1)
thr=float(sys.argv[2]) if len(sys.argv)>2 else -38; MINF=int(sys.argv[3]) if len(sys.argv)>3 else 15
hop=sr//100; n=len(a)//hop
db=20*np.log10(np.array([np.sqrt(np.mean(a[i*hop:(i+1)*hop]**2))+1e-9 for i in range(n)])); db=np.convolve(db,np.ones(3)/3,'same')
sil=db<thr; sils=[]; i=0
while i<n:
    if sil[i]:
        j=i
        while j<n and sil[j]: j+=1
        if j-i>=MINF: sils.append((i/100,j/100))
        i=j
    else: i+=1
edges=[0.0]+[x for s in sils for x in s]+[n/100]
for k in range(0,len(edges),2):
    if edges[k+1]-edges[k]>0.03: print(f"{edges[k]:.2f}|{edges[k+1]:.2f}|")
