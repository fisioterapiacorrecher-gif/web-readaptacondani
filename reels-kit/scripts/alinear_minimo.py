# Uso: python3 -I alinear_minimo.py segmentos.txt words.json   (alternativa a alinear_palabras.py: reparto por sílabas con mínimo por palabra;
# las palabras de <0,16 s se muestran junto a la siguiente). Mejor con segmentos cortos (pausas.py voz16k.wav -36 8).
# Reparte palabras por sílabas con un mínimo por palabra (peso = sílabas + 0.8) para que ninguna dure 2 fotogramas.
import sys,re,json
V='aeiouáéíóúü'; ST='aeoáéíóú'
def syl(w):
    w=re.sub(r'[^a-záéíóúüñ]','',w.lower())
    if w.endswith('y') and len(w)>1: w=w[:-1]+'i'
    c=0;p=None
    for ch in w:
        if ch in V:
            if p is None or (p in ST and ch in ST): c+=1
            p=ch
        else: p=None
    return max(c,1)
out=[]
for line in open(sys.argv[1]):
    st,en,txt=line.strip().split('|',2); st=float(st); en=float(en); ws=txt.split()
    wt=[syl(w)+0.8 for w in ws]; T=sum(wt); t=st
    seg=[]
    for i,w in enumerate(ws):
        d=(en-st)*wt[i]/T; seg.append([t,t+d,w]); t+=d
    # palabras muy cortas (<0,16 s) se muestran junto a la siguiente ("y decirle"), como máx. 2 palabras
    k=0
    while k<len(seg)-1:
        if seg[k][1]-seg[k][0]<0.16 and ' ' not in seg[k][2] and ' ' not in seg[k+1][2]:
            seg[k]=[seg[k][0],seg[k+1][1],seg[k][2]+' '+seg[k+1][2]]; del seg[k+1]
        else: k+=1
    if len(seg)>1 and seg[-1][1]-seg[-1][0]<0.16 and ' ' not in seg[-2][2]:
        seg[-2]=[seg[-2][0],seg[-1][1],seg[-2][2]+' '+seg[-1][2]]; del seg[-1]
    seg[-1][1]=en+0.2
    for a,b,w in seg: out.append([round(a,2),round(b,2),w,False])
for i in range(len(out)-1):
    out[i][1]=min(out[i][1],out[i+1][0])
json.dump(out,open(sys.argv[2],'w'),ensure_ascii=False)
print(min(o[1]-o[0] for o in out), sum(o[1]-o[0]<0.15 for o in out))
