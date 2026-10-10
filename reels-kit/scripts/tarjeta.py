# Uso: python3 -I tarjeta.py imagen.png ancho_px salida.png
# Tarjeta con esquinas redondeadas, sombra y filo blanco hueso. Se coloca centrada sobre el fondo desenfocado.
import sys
from PIL import Image, ImageDraw, ImageFilter
src,W,out=sys.argv[1],int(sys.argv[2]),sys.argv[3]; R=34
im=Image.open(src).convert('RGB'); H=round(im.height*W/im.width); im=im.resize((W,H),Image.LANCZOS)
m=Image.new('L',(W,H),0); ImageDraw.Draw(m).rounded_rectangle((0,0,W-1,H-1),R,fill=255)
P=60; c=Image.new('RGBA',(W+2*P,H+2*P),(0,0,0,0))
sh=Image.new('L',c.size,0); ImageDraw.Draw(sh).rounded_rectangle((P,P+18,P+W,P+H+18),R,fill=170); sh=sh.filter(ImageFilter.GaussianBlur(26))
c.paste(Image.new('RGBA',c.size,(0,0,0,255)),(0,0),sh)
ring=Image.new('L',(W,H),0); ImageDraw.Draw(ring).rounded_rectangle((0,0,W-1,H-1),R,outline=255,width=3)
c.paste(im,(P,P),m); c.paste(Image.new('RGBA',(W,H),(255,251,232,255)),(P,P),ring.point(lambda v:int(v*0.5)))
c.save(out); print(out,c.size)
