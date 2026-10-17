# Tamaño de letra para los textos destacados: fit("TEXTO") -> px (máx. 140) para que la línea quepa en ~900 px.
# Uso en Python: sys.path.insert(0,'reels-kit/scripts'); from medir import fit
import os
from PIL import ImageFont
F=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'fonts','Montserrat-900.ttf')
def width(t,s): return ImageFont.truetype(F,round(s/1.219)).getlength(t)*693/790   # calibrado con libass
def fit(t,cap=140,maxw=900):
    s=cap
    while width(t,s)>maxw: s-=1
    return s
