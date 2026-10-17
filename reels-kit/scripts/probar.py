# Prueba una animación sin renderizar el vídeo: hoja de fotogramas en tiempos concretos.
# Uso: SC="escena" python3 probar.py modulo "t0,t1" "[pulsos]" "t1,t2,..." salida.jpg [cy] [fondo.png]
# python3 probar.py modulo "t0,t1" "pulses" "tiempos" salida.jpg [cy]
import sys, numpy as np, cv2, importlib, json
import os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
m=importlib.import_module(sys.argv[1]); m.FONT=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'fonts','Montserrat-900.ttf')
cy=int(sys.argv[6]) if len(sys.argv)>6 else 920
if hasattr(m,'OY'): m.CY=cy; m.OY=cy-450
t0,t1=map(float,sys.argv[2].split(',')); pl=json.loads(sys.argv[3]); ts=[float(x) for x in sys.argv[4].split(',')]
bg=cv2.imread(sys.argv[7]) if len(sys.argv)>7 else None
import os; SC=os.environ.get("SC",""); tiles=[]
for t in ts:
    f=(np.ones((1920,1080,3),np.float32)*np.array([0.25,0.27,0.3],np.float32)) if bg is None else cv2.resize(bg,(1080,1920)).astype(np.float32)/255*0.6
    g=m.draw(t,SC,t0,t1,pl,[])
    if g is not None: a=g[...,3:4]; f=f*(1-a)+g[...,2::-1]*a
    f=cv2.putText((f*255).astype(np.uint8),f"{t:.2f}",(20,80),0,2.5,(0,255,255),5)
    tiles.append(cv2.resize(f,(360,640)))
rows=[np.hstack(tiles[i:i+5]+[np.zeros((640,360,3),np.uint8)]*(5-len(tiles[i:i+5]))) for i in range(0,len(tiles),5)]
cv2.imwrite(sys.argv[5],np.vstack(rows))
