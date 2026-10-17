# reels-kit — edición de reels de @readaptacondani

Kit para editar los reels de Dani con su estilo (aprendido en «Maratón con el tendón roto», «No funciona así»,
«¿Es suficiente una infiltración?» y «Tratamiento definitivo»).
**Instrucciones completas: [`PROMPT.md`](PROMPT.md).** Léelo entero antes de editar.

- `scripts/preparar.sh` — instala dependencias y baja Whisper large-v3 (desde GitHub).
- `scripts/transcribir.py`, `pausas.py`, `alinear_palabras.py` — de audio a palabras con tiempos.
- `scripts/textos.py` — título, subtítulos y textos destacados (ASS). `medir.py` — tamaño de letra que cabe.
- `scripts/audio.py` — voz + efectos de sonido de Dani (`sfx/`).
- `scripts/render.py` — composición en HDR HLG (zooms L/S/P, vídeo de apoyo, B/N, imágenes, animaciones, textos).
- `scripts/recortar_silencio.py` — quita un silencio del vídeo y desplaza todos los tiempos.
- `scripts/probar.py` — hoja de fotogramas de una animación sin renderizar el vídeo.
- `scripts/anim_*.py`, `animacion_tendon.py` — animaciones (catálogo en PROMPT.md §5.3); `anim_base.py` — utilidades.
- `scripts/tarjeta.py` — imágenes de apoyo como tarjeta.
- `assets/` — ilustración del corredor de Dani (coloreada y despiezada para articularla).
- `sfx/` — sonidos (entrada, salida, error, acierto, eureka, disco rayado, reloj, alarma, trombón, bien, destello).
- `fonts/` — Montserrat (OFL).
- `ejemplo-*/` — edit.json, segmentos y palabras de cada reel aprobado.
