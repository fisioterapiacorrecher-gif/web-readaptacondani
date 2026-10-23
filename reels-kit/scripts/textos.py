# Uso: python3 -I textos.py edit.json words.json subs.ass
import sys, json, re
E=json.load(open(sys.argv[1])); W=json.load(open(sys.argv[2]))
def ts(t):
    t=max(0,t); return f"{int(t//3600)}:{int(t%3600//60):02d}:{t%60:05.2f}"
WH="&HFFFFFF&"; RED="&H3434FF&"
hdr="""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: W,Montserrat ExtraBold,80,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,5,0,0,0,1
Style: H,Montserrat Black,118,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,-2,0,1,0,0,5,0,0,0,1
Style: C,Playfair ExtraBold Italic,118,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,1,0,1,0,0,5,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
ev=[]
SOFT=E.get("sombra_suave",False)   # sombra negra más discreta bajo título y textos ("disimúlalo un poco")
SA,SB,SBL=("&HB8&","&HD0&",18) if SOFT else ("&H70&","&H90&",12)
KA,KB,KBL=("&HA8&","&HD0&",18) if SOFT else ("&H50&","&H90&",14)
def D(layer,st,en,style,tags,text): ev.append(f"Dialogue: {layer},{ts(st)},{ts(en)},{style},,0,0,0,,{{{tags}}}{text}")
cards=E["cards"]+E.get("graphics",[]); keys=[(K["st"],K["en"]) for K in E["keys"] if not K.get("keep_subs")]   # keep_subs: el texto convive con el subtítulo
def in_card(t): return any(c["st"]-0.05<=t<c["en"]+0.05 for c in cards)
keys+=[(G["st"],G["en"]) for G in E.get("graphics",[]) if G.get("hide_subs")]   # gráficos que sustituyen al subtítulo (p. ej. listas)
def in_key(t): return any(a-0.08<=t<b for a,b in keys)
def clip_to_key(st,en):
    for a,b in keys:
        if st<a<en: en=a
    return en
# 1) white one-word subtitles (hidden while a key text is on screen)
for st,en,txt,red in W:
    if st<E["hook"]["end"]-0.07 or in_key(st): continue
    en=clip_to_key(st,min(en,E["END"]))
    txt=re.sub(r'[¿?¡!.,:;]','',txt).lower()
    y=1180
    if E.get("subs_llamativos"):   # anuncios: MAYÚSCULAS, Montserrat Black más grande, contorno negro y rebote marcado
        txt=txt.upper(); fs=E.get("subs_size",104)   # palabras clave en rojo: red=true en words.json
        pop=r"\fscx55\fscy55\t(0,90,0.6,\fscx116\fscy116)\t(90,170,\fscx100\fscy100)"
        D(0,st,en,"H",f"\\an5\\pos(540,{y+7})\\fs{fs}\\fsp0\\c&H000000&\\bord6\\3c&H000000&\\1a&H60&\\3a&H80&\\blur12{pop}",txt)
        D(1,st,en,"H",f"\\an5\\pos(540,{y})\\fs{fs}\\fsp0\\c{RED if red else WH}\\bord5\\3c&H000000&{pop}",txt)
        continue
    pop=r"\fscx86\fscy86\t(0,110,0.6,\fscx100\fscy100)"
    D(0,st,en,"W",f"\\an5\\pos(540,{y+4})\\c&H000000&\\alpha{'&HA8&' if SOFT else '&H70&'}\\blur9{pop}",txt)
    D(1,st,en,"W",f"\\an5\\pos(540,{y})\\c{WH}{pop}",txt)
# 2) title: stacked, centred, tight, big
H=E["hook"]
for k,(txt,t,red) in enumerate(H["lines"]):
    y=H["y0"]+k*H["lh"]; col=RED if red else WH; dur=int((H["end"]-t)*1000)
    anim=r"\fscx55\fscy55\alpha&HFF&\t(0,60,\alpha&H00&)\t(0,150,0.7,\fscx107\fscy107)\t(150,240,\fscx100\fscy100)"
    ex=f"\\t({dur-170},{dur},\\fscx150\\blur8\\alpha&HFF&)"
    mv=lambda yy: f"\\move(540,{yy},1400,{yy},{dur-170},{dur})"
    D(2,t,H["end"],"H",f"\\an5{mv(y+7)}\\fs{H['size']}\\c&H000000&\\bord4\\3c&H000000&\\blur{SBL}{anim}\\1a{SA}\\3a{SB}{ex}",txt)
    D(3,t,H["end"],"H",f"\\an5{mv(y)}\\fs{H['size']}\\c{col}{anim}{ex}",txt)
# 3) key words: uppercase, centred on the subtitle line, replacing the subtitle
def letters(txt,dt,a):
    return "".join((f"{{\\alpha&HFF&\\t({int(i*dt)},{int(i*dt)+240},\\alpha&H{a}&)}}{ch}" if ch!=' ' else ' ') for i,ch in enumerate(txt))
for K in E["keys"]:
    cy=K.get("y",1180)
    sizes=[l[3] for l in K["lines"]]; gap=[s_*0.92 for s_ in sizes]; y=cy-sum(gap)/2+gap[0]/2
    for j,(txt,t,red,size) in enumerate(K["lines"]):
        col=RED if red else WH; dur=int((K["en"]-t)*1000); xo=170
        ent=r"\fscx25\fscy25\fsp30\alpha&HFF&\t(0,70,\alpha&H00&)\t(0,190,0.6,\fscx112\fscy112\fsp0)\t(190,300,\fscx100\fscy100)"
        ex=f"\\t({dur-xo},{dur},\\fscx150\\blur8\\alpha&HFF&)"
        mv=lambda yy: f"\\move(540,{int(yy)},1400,{int(yy)},{dur-xo},{dur})"
        D(4,t,K["en"],"H",f"\\an5{mv(y+8)}\\fs{size}\\c&H000000&\\bord5\\3c&H000000&\\blur{KBL}\\1a{KA}\\3a{KB}{ent}{ex}",txt)
        if K.get("glow")=="red":
            D(5,t,K["en"],"H",f"\\an5{mv(y)}\\fs{size}\\fsp0\\c&H3434FF&\\bord10\\3c&H3434FF&\\blur26\\1a&H30&\\3a&H50&{ent}{ex}",txt)
        D(6,t,K["en"],"H",f"\\an5{mv(y)}\\fs{size}\\fsp0\\c{col}{ent}{ex}",txt)
        y+=gap[j]
# 4) outro: Instagram handle under the subtitle line, whip in / whip out, white with shadow + glow
END=E["END"]; txt,t2,s2,y2=E.get("outro",{}).get("handle") or ("",0,0,0)
XO=END-0.24
for lay,tags,dy,bl in ((9,"\\c&H000000&\\bord6\\3c&H000000&\\1a&H30&\\3a&H80&",8,16),(10,"\\c&H3434FF&\\bord8\\3c&H3434FF&\\1a&H20&\\3a&H40&",0,24),(11,"\\c&HFFFFFF&",0,0)):
    if not txt: break
    D(lay,t2,XO,"H",f"\\an5\\move(-420,{y2+dy},540,{y2+dy},0,280)\\fs{s2}\\fsp0{tags}\\fscx160\\t(0,280,0.5,\\fscx100)\\blur10\\t(0,280,\\blur{bl})",txt)
    D(lay,XO,END,"H",f"\\an5\\move(540,{y2+dy},1550,{y2+dy},0,240)\\fs{s2}\\fsp0{tags}\\blur{bl}\\t(0,240,0.5,\\fscx170\\blur12)",txt)
open(sys.argv[3],"w").write(hdr+"\n".join(ev)+"\n"); print(len(ev),"events")
