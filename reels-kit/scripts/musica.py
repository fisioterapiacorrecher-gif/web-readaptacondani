# Música v2 (más gancho): 129 BPM, La menor (Am-F-C-G), riff de sintetizador sincopado (3-3-2), stabs en contratiempo,
# bajo rodante con sidechain. Compás 5 = subida con redoble y corte en seco; en DROP2 (el "sígueme") vuelve todo con crash.
# Uso: python3 -I musica.py salida.wav T0 DROP2 END
import sys, numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
SR=48000; T0,DROP2,END=map(float,sys.argv[2:5]); N=int(END*SR)
BAR=(DROP2-T0)/5; B=BAR/4; S16=B/4; rng=np.random.default_rng(3)
bus={k:np.zeros((N,2)) for k in("kick","drums","music")}
def add(k,x,t,pan=0.0,g=1.0):
    s=int(round(t*SR))
    if s>=N or s<0: return
    e=min(N,s+len(x)); x=x[:e-s]*g
    bus[k][s:e,0]+=x*np.sqrt((1-pan)/2); bus[k][s:e,1]+=x*np.sqrt((1+pan)/2)
def hp(x,f): return sosfilt(butter(2,f,'hp',fs=SR,output='sos'),x)
def lp(x,f,o=2): return sosfilt(butter(o,f,'lp',fs=SR,output='sos'),x)
def ar(n,a,d): t=np.arange(n)/SR; return np.minimum(1,t/max(a,1e-4))*np.exp(-t/d)
def saw(f,n,det=0.0,ph0=0.0): t=np.arange(n)/SR; return 2*((f*(1+det)*t+ph0)%1)-1
midi=lambda m:440*2**((m-69)/12)
def kick():
    n=int(0.5*SR); t=np.arange(n)/SR; f=45+140*np.exp(-t/0.03)
    x=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t/0.22)+0.3*rng.standard_normal(n)*np.exp(-t/0.003)
    return np.tanh(2.2*x)*0.9
def clap(g=1.0):
    n=int(0.3*SR); t=np.arange(n)/SR; nz=hp(lp(rng.standard_normal(n),6000),1000)
    e=sum(np.exp(-np.maximum(t-k*0.01,0)/0.005)*(t>=k*0.01) for k in range(3))+0.9*np.exp(-t/0.09)
    body=np.sin(2*np.pi*190*t)*np.exp(-t/0.05)*0.4
    return (nz*e*0.6+body)*g
def hat(o=False):
    n=int((0.2 if o else 0.05)*SR); t=np.arange(n)/SR
    return hp(rng.standard_normal(n),8000)*np.exp(-t/(0.07 if o else 0.012))*0.3
def crash(): n=int(2.5*SR); t=np.arange(n)/SR; return hp(rng.standard_normal(n),3000)*np.exp(-t/0.8)*0.4
def supersaw(f,n,v=7,spread=0.012):
    return sum(saw(f,n,spread*(i/(v-1)*2-1),rng.random()) for i in range(v))/np.sqrt(v)
CH=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]]; ROOT=[45,41,48,43]
RIFF=[{0:81,3:84,6:88,8:86,10:84,12:86,14:88},{0:81,3:84,6:89,8:88,10:84,12:81,14:84},
      {0:79,3:84,6:88,8:86,10:84,12:86,14:88},{0:79,3:83,6:86,8:91,10:88,12:86,14:83}]
def lead(m,n):
    f=midi(m); x=supersaw(f,n,5,0.008)+0.6*np.sign(np.sin(2*np.pi*f/2*np.arange(n)/SR))*0.5
    t=np.arange(n)/SR; cut=1200+5000*np.exp(-t/0.09)
    y=np.zeros(n); st=0; blk=480   # filtro de "pluck" que se cierra
    for i in range(0,n,blk):
        y[i:i+blk]=lp(x[i:i+blk],min(cut[i],20000)) if True else 0
    return y*ar(n,0.003,0.22)
def stab(ci,n):
    x=sum(supersaw(midi(m),n,7,0.015) for m in CH[ci]); return lp(x,3200)*ar(n,0.004,0.11)
def bass(m,n):
    f=midi(m); t=np.arange(n)/SR
    return (lp(saw(f,n),700)*0.8+np.sin(2*np.pi*f/2*t)*0.6)*ar(n,0.003,0.09)
pump=np.ones(N)
nbars=int(np.ceil((END-T0)/BAR))
for b in range(nbars):
    tb=T0+b*BAR; ci=b%4; build=(b==4)
    for q in range(4):
        tq=tb+q*B; last=build and q==3
        if not last:
            add("kick",kick(),tq)
            s=int(tq*SR); m=int(0.2*SR); e=min(N,s+m); pump[s:e]=np.minimum(pump[s:e],0.25+0.75*(np.arange(e-s)/m)**0.6)
        if not build:
            if q in(1,3): add("drums",clap(),tq,0.0,0.9)
            add("drums",hat(True),tq+B/2,0.3,0.8)
            for k in(1,3): add("drums",hat(),tq+k*S16,-0.3,0.5)
            add("music",stab(ci,int(S16*1.6*SR)),tq+B/2,0,0.22)
        if not last:
            for k in(1,2,3):  # bajo rodante en semicorcheas (salvo en el bombo)
                add("music",bass(ROOT[ci]+(12 if k==2 else 0),int(S16*0.9*SR)),tq+k*S16,0,0.5)
    # riff (en la subida, filtrado y solo la primera mitad)
    for st,m in RIFF[ci].items():
        if build and st>=12: continue
        n=int(S16*(3 if st in(0,3) else 2)*SR); x=lead(m,n)
        if build: x=lp(x,1800)
        for d,(g,p) in enumerate([(1.0,0),(0.35,-0.6),(0.2,0.6)]):   # eco en corchea con puntillo
            add("music",x,tb+st*S16+d*3*S16,p,0.16*g)
    if build:   # redoble que se acelera + ruido que sube, y corte en seco el último tiempo
        for k in range(12):
            tt=tb+k*S16*(1 if k<8 else 1) ; add("drums",clap(0.35+0.05*k),tt,0,0.6)
        n=int(3*B*SR); t=np.arange(n)/SR; nz=rng.standard_normal(n)
        sw=np.zeros(n); blk=960
        for i in range(0,n,blk): sw[i:i+blk]=hp(lp(nz[i:i+blk],800+9000*(i/n)**2),400)
        add("drums",sw*(t/t[-1])**2*0.5,tb,0,1.0)
add("drums",crash(),T0); add("drums",crash(),DROP2)
mix=bus["kick"]+(bus["drums"]+bus["music"]*1.0)*pump[:,None]
mix[:int(T0*SR)]=0
mix=np.tanh(mix/np.abs(mix).max()*1.6)/np.tanh(1.6)*0.9
t=np.arange(N)/SR; mix*=np.clip((END-t)/0.5,0,1)[:,None]
print("rms dB",20*np.log10(np.sqrt(np.mean(mix[int(T0*SR):]**2))),"BPM",round(60/B,1))
wavfile.write(sys.argv[1],SR,mix.astype(np.float32))
