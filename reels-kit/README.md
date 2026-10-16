# reels-kit — edición de reels de @readaptacondani

Kit para editar los reels de Dani con su estilo (aprendido en el reel "Maratón con el tendón roto").
**Instrucciones completas: [`PROMPT.md`](PROMPT.md).** Léelo entero antes de editar.

- `scripts/preparar.sh` — instala dependencias y baja Whisper large-v3 (desde GitHub).
- `scripts/transcribir.py`, `pausas.py`, `alinear_palabras.py` — de audio a palabras con tiempos.
- `scripts/textos.py` — título, subtítulos, palabras clave y @usuario (ASS).
- `scripts/audio.py` — voz + efectos de sonido de Dani (`sfx/`).
- `scripts/render.py` — composición en HDR HLG (zooms, imágenes, animaciones, textos) y exportación HEVC.
- `scripts/tarjeta.py` — imágenes de apoyo como tarjeta; `animacion_tendon.py` — ejemplo de infografía animada.
- `sfx/` — sonidos recortados de los propios vídeos de Dani. `fonts/` — Montserrat (OFL).
- `ejemplo-maraton/` — edit.json, segmentos y palabras del reel de ejemplo.
