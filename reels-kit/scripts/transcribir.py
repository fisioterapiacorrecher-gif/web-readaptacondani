# Uso: python3 -I transcribir.py voz16k.wav ~/models/sherpa-onnx-whisper-large-v3 -38 15 ventanas.json 0.3
# Transcribe por ventanas (cortes en pausas). Tarda ~20-25 min para 1 min de vídeo en 4 CPU: lanzarlo en segundo plano.
# Salida: [[inicio, fin, texto], ...] -> sirve para escribir segmentos.txt con lo que Dani dice DE VERDAD (no el guion).
import sys, json, numpy as np, sherpa_onnx
from scipy.io import wavfile
M=sys.argv[2]
rec=sherpa_onnx.OfflineRecognizer.from_whisper(encoder=M+'/large-v3-encoder.int8.onnx',decoder=M+'/large-v3-decoder.int8.onnx',tokens=M+'/large-v3-tokens.txt',language='es',task='transcribe',num_threads=8)
sr,a=wavfile.read(sys.argv[1]); a=a.astype(np.float32)/32768
hop=160; n=len(a)//hop
db=20*np.log10(np.array([np.sqrt(np.mean(a[i*hop:(i+1)*hop]**2))+1e-9 for i in range(n)])); db=np.convolve(db,np.ones(3)/3,'same')
sil=db<float(sys.argv[3]); MINF=int(sys.argv[4])
sils=[];i=0
while i<n:
    if sil[i]:
        j=i
        while j<n and sil[j]: j+=1
        if j-i>=MINF: sils.append((i/100,j/100))
        i=j
    else:i+=1
edges=[0.0]+[x for s in sils for x in s]+[n/100]
raw=[(edges[k],edges[k+1]) for k in range(0,len(edges),2) if edges[k+1]-edges[k]>0.03]
GAP=float(sys.argv[6]); chunks=[list(raw[0])]
for st,en in raw[1:]:
    if st-chunks[-1][1]<GAP and en-chunks[-1][0]<9: chunks[-1][1]=en
    else: chunks.append([st,en])
out=[]
pad=np.zeros(int(0.3*sr),np.float32)
for st,en in chunks:
    seg=np.concatenate([pad,a[int(st*sr):int(en*sr)],pad])
    s=rec.create_stream(); s.accept_waveform(sr,seg); rec.decode_stream(s)
    t=s.result.text.strip(); out.append([st,en,t]); print(f"[{st:6.2f}-{en:6.2f}] {t}",flush=True)
json.dump(out,open(sys.argv[5],'w'),ensure_ascii=False)
