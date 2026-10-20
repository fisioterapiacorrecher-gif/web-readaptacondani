# Recorta un silencio del vídeo original y desplaza todos los tiempos posteriores de edit.json y words.json.
# Uso: python3 -I recortar_silencio.py video.mov A B edit.json words.json   (quita el tramo [A,B] en segundos)
# Crea video_cut.mov (HEVC 10-bit HLG, mismo color) y reescribe edit.json/words.json (copia .bak de ambos).
# Después: vuelve a sacar voz16k/voz48k del vídeo recortado y regenera textos, sonido y render.
import sys, json, subprocess, shutil, os
V,A,B,EJ,WJ=sys.argv[1],float(sys.argv[2]),float(sys.argv[3]),sys.argv[4],sys.argv[5]; D=B-A
out=os.path.join(os.path.dirname(V),'video_cut.mov')
X="colorprim=bt2020:transfer=arib-std-b67:colormatrix=bt2020nc:range=limited:log-level=error"
fc=(f"[0:v]trim=0:{A},setpts=PTS-STARTPTS[v1];[0:v]trim={B},setpts=PTS-STARTPTS[v2];"
    f"[0:a]atrim=0:{A},asetpts=PTS-STARTPTS[a1];[0:a]atrim={B},asetpts=PTS-STARTPTS[a2];"
    "[v1][a1][v2][a2]concat=n=2:v=1:a=1[vc][a];[vc]format=yuv420p10le[v]")
subprocess.run(["ffmpeg","-nostdin","-y","-v","error","-i",V,"-filter_complex",fc,"-map","[v]","-map","[a]","-c:v","libx265","-crf","12",
  "-preset","fast","-x265-params",X,"-color_primaries","bt2020","-color_trc","arib-std-b67","-colorspace","bt2020nc","-color_range","tv",
  "-c:a","pcm_s16le",out],check=True)
f=lambda t: t if t<=A else (A if t<B else round(t-D,3))
for p in (EJ,WJ): shutil.copy(p,p+'.bak')
E=json.load(open(EJ))
for k in E.get("keys",[]):
    k["st"],k["en"]=f(k["st"]),f(k["en"])
    for l in k["lines"]: l[1]=f(l[1])
for g in E.get("graphics",[]):
    g["st"],g["en"]=f(g["st"]),f(g["en"]); g["pulses"]=[f(p) for p in g.get("pulses",[])]
    for x in g.get("sfx",[]): x[1]=f(x[1])
for c in E.get("cards",[]): c["st"],c["en"]=f(c["st"]),f(c["en"])
for z in E.get("zoom",[]): z[0]=f(z[0])
for L in E.get("looks",[]): L["st"],L["en"]=f(L["st"]),f(L["en"])
if E.get("broll"): E["broll"]["st"],E["broll"]["en"]=f(E["broll"]["st"]),f(E["broll"]["en"])
if E.get("outro",{}).get("handle"): E["outro"]["handle"][1]=f(E["outro"]["handle"][1])
E["END"]=round(E["END"]-D,3); E["video_end"]=round(E.get("video_end",E["END"]+D)-D,3); E["video"]=out
json.dump(E,open(EJ,"w"),ensure_ascii=False,indent=1)
W=json.load(open(WJ))
for w in W: w[0],w[1]=f(w[0]),f(w[1])
json.dump(W,open(WJ,"w"),ensure_ascii=False)
print("recortado",D,"s ->",out)
