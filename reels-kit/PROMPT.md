# Prompt — Editor de reels de Dani (@readaptacondani · RCD Clinic)

> Pega esto (o di "lee el prompt del Kit de edición de reels") al empezar una sesión nueva.
> Todo lo que hay aquí lo aprendimos editando el reel "Maratón con el tendón roto" (oct 2026).
> Si algo de este documento choca con lo que Dani pida en el momento, manda lo que pida Dani.

---

## 0. Quién es Dani y qué hace

Dani es fisioterapeuta especializado en corredores (tendinopatías). Publica reels educativos verticales en
Instagram: él hablando a cámara + textos dinámicos + imágenes de apoyo. Habla en español, tono cercano.
Quiere vídeos con ritmo, legibles y con **siempre el mismo estilo**. Trátalo de tú, en español.

---

## 1. Arranque de la sesión (hazlo tú, sin preguntar)

1. **Kit** (programas, sonidos, fuentes y ejemplo). Está en el repo `fisioterapiacorrecher-gif/web-readaptacondani`,
   rama `claude/amazing-fermi-clq5qg`, carpeta `reels-kit/`:
   ```bash
   cd /home/user/web-readaptacondani
   git fetch origin claude/amazing-fermi-clq5qg
   git checkout origin/claude/amazing-fermi-clq5qg -- reels-kit   # si no está ya
   bash reels-kit/scripts/preparar.sh                               # pip + modelo Whisper large-v3 (GitHub)
   ```
2. **Drive** (conector Google Drive). Carpeta raíz `CLAUDE` (id `1N9BnTAeyHzv8Bctc896iykw1uXsBnCQa`):
   - `video a editar` → el vídeo nuevo + guion + imágenes/vídeos de apoyo (busca por título; mira subcarpetas).
   - `Kit edición reels` → este prompt (documento).
   - (Pueden haber desaparecido `REFERENCIAS`, `Audios`, `Creación contenido`, `videos apoyo`: ya no hacen falta.)
3. **Descargar archivos de Drive**: el conector solo baja ≤10 MB y lo devuelve en base64. Para vídeos usa:
   ```bash
   curl -sS -L -o video.mov "https://drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t"
   ```
   Requisitos: dominio `drive.usercontent.google.com` permitido en la red del entorno y el archivo compartido
   como "cualquiera con el enlace". Si da 403, díselo a Dani (red del entorno / compartir).
   Imágenes pequeñas: `download_file_content` → se guarda en un .txt JSON → `jq -r .content f | base64 -d > img.png`.
4. **Red**: huggingface (CDN) está bloqueado → el modelo Whisper se baja de GitHub (lo hace `preparar.sh`).
   Pexels/pixabay están bloqueados: los vídeos de apoyo los sube Dani a Drive.

---

## 2. Qué te va a dar Dani

- **Vídeo bruto**: iPhone, `.mov`, HEVC 10-bit **HDR HLG (BT.2020, arib-std-b67)**, 1080×1920, 30 fps, ~1 min.
- **Guion** (texto en el mensaje o en un doc). OJO: **Dani no lo sigue al pie de la letra**. Los subtítulos y las
  palabras clave deben reflejar **lo que dice de verdad** en el audio, no el guion.
- **Imágenes de apoyo** con la frase en la que van ("imagen tendón en 'es como un cable…'").
- **Vídeo de apoyo para la portada/inicio** (opcional, SDR bt709, p. ej. corredores de maratón).

---

## 3. ESTILO DEFINITIVO (lo que Dani aprobó)

### 3.1 Color
- **El color debe ser el del original.** NO conviertas a SDR ni apliques LUT/tonemapping (lo vio naranja 3 veces).
- Se trabaja y se exporta en **HDR HLG** tal cual: decodificar a rgb48 sin cambiar transferencia, componer, y
  re-codificar HEVC 10-bit con tags `bt2020 / arib-std-b67 / bt2020nc`, `-tag:v hvc1` (lo hace `render.py`).
- Los gráficos SDR (texto, imágenes) se convierten a HLG con `to_hlg()`. Blanco de texto = referencia 0.40
  (más brillante que el blanco SDR 0.203; si no, los subtítulos se ven **grises**). Imágenes/vídeo de apoyo = 0.203.

### 3.2 Inicio (título / gancho) — estilo "dolor lateral"
- Pregunta-gancho en **MAYÚSCULAS**, Montserrat Black, **grande (~150 px)**, **centrada en el medio del encuadre
  aunque tape la cara**, líneas **muy juntas** (interlineado ~0.88), una línea por palabra/grupo, alternando
  blanco y **rojo #FF3434** en las palabras clave (p. ej. MARATÓN / TENDÓN / ROTO?).
- Cada línea entra al decirla (pop: escala 55%→107%→100%). Sale con **barrido a la derecha** (estirado + desenfoque).
- Si hay vídeo de apoyo: **a pantalla completa** bajo el título, con zoom lento 1.00→1.08 y oscurecido un 18 %.
  Termina **justo cuando Dani dice la frase de transición** ("te lo cuento") → corte a Dani.
- **Sin sonido de clic al empezar el título** (sí barrido de salida).
- **Vídeo de apoyo en mitad del reel** (p. ej. Dani esperando sentado en "si esperas sentado… vas a esperar mucho
  tiempo"): córtalo antes con ffmpeg (trim+concat, HEVC 10-bit HLG) a la duración exacta de la frase y ponlo en `broll`
  con `"hdr": true` si viene del iPhone en HLG (no pasa por `to_hlg`), `"dark": 0.93` y `"zoom": 0.06`. Los subtítulos siguen
  encima. Ejemplo: `ejemplo-infiltracion/edit.json`.

### 3.3 Subtítulos normales
- **Una palabra cada vez**, minúsculas, sin puntuación, Montserrat ExtraBold 80 px, **blanco puro**, sombra
  negra suave (desenfocada). Pequeño pop de entrada (86%→100% en 110 ms).
- **Siempre en la misma línea (y = 1180)**, también cuando hay imágenes o animaciones. Nunca bajarlos.
- Se ocultan mientras está en pantalla una palabra clave (las palabras clave sustituyen al subtítulo).

### 3.4 Palabras clave / textos destacados
- **Misma tipografía que el título**: Montserrat Black, **MAYÚSCULAS**, centradas, en la línea de subtítulos
  (y = 1180), **en lugar** del subtítulo. Tamaño hasta 140 px (ajustado al ancho, ~990 px).
- 1–3 líneas. Primera en blanco, la palabra fuerte en **rojo #FF3434** (ej. ROTURA / **PARCIAL**,
  ROTURA / **COMPLETA**, NADA QUE / **HACER**, NO ES / **BUENA IDEA**, SE ROMPA / **POR COMPLETO**,
  TIPO DE / **ROTURA**). Si una línea larga queda pequeña, pártela para que todas tengan tamaño parecido
  (DEPENDE / DEL TIPO / DE ROTURA).
- Entrada estilo Dani: pequeña con letras separadas → crece con rebote (25%→112%→100%). Salida: **barrido a la
  derecha**. Sombra oscura detrás + leve oscurecimiento de la franja.
- Copia **literal** lo que dice (corrige: dijo "se rompa", no "se rompe"; "no es buena idea" no es pregunta).
- ~1 cada 4–5 s, solo conceptos clave. **No poner palabras rojas sueltas en los subtítulos normales.**

### 3.5 Imágenes de apoyo
- **Centradas** en el encuadre sobre el **fondo de vídeo desenfocado y oscurecido**, como tarjeta con esquinas
  redondeadas (`tarjeta.py`). Entrada con pop (86%→100%) + fundido; salida rápida.
- **Duración corta: ~2 s**, sobre la frase exacta. Grandes; si una vertical queda mejor grande y centrada
  aunque el subtítulo pase por encima, mejor (la cuerda: escala 1.18 en el centro).

### 3.6 Animaciones explicativas (infografías)
- Gustan mucho. Ejemplo hecho: músculo → tendón (fibras) → hueso (`animacion_tendon.py`):
  rotura parcial = la luz recorre las fibras sanas, llega al hueso y el hueso se levanta; rotura completa = la luz
  se para en la rotura, chispas rojas + X, el hueso no se mueve.
- Sobre fondo desenfocado, en la zona central (centro y ≈ 920), subtítulos en su línea por debajo.
- La palabra clave asociada (HAY MOVIMIENTO / NO HAY MOVIMIENTO) va **arriba, separada de la animación (y ≈ 420)**,
  **letras blancas con resplandor rojo** (nunca letra roja + resplandor rojo: "demasiado"). Sin subtítulo mientras.
  La animación debe durar al menos lo que dure su texto.

### 3.7 Zooms
- Saltos de encuadre entre frases (1.00 ↔ 1.10–1.15) y **punch-in rápido** (0.22 s) en las palabras fuertes;
  acercamiento lento y dramático en los momentos tristes. Centro del zoom en la cara.

### 3.8 Final (@usuario)
- **@readaptacondani** en Montserrat Black ~94 px, **blanco con resplandor/sombra roja** + sombra oscura,
  **debajo de la línea de subtítulos (y ≈ 1310)**. Aparece ~2 s antes del final (cuando dice la llamada a la
  acción), entra con **barrido desde la izquierda** y sale con **barrido a la derecha** al terminar.
- **El vídeo no se congela al final** (nada de plano quieto). Los subtítulos siguen con lo que dice
  ("esta es tu cuenta").

---

## 4. SONIDO

- **Sin música de fondo.** (No le gustó la música generada.)
- Voz subida al nivel de sus vídeos: ~-11 dB RMS activo (+14 dB sobre el bruto del iPhone) + limitador.
- **Siempre el mismo sonido para cada función** (no mezclar sonidos distintos para lo mismo). Archivos en `reels-kit/sfx/`
  (recortados de sus propios vídeos):

| Archivo | Qué es | Cuándo |
|---|---|---|
| `entrada.wav` | doble clic | entra cada palabra clave, imagen, animación y el @usuario (volumen ×2). **No** al empezar el título |
| `salida.wav` | barrido | sale cada palabra clave, el título, imágenes, animaciones y el @usuario |
| `destello.wav` | brillo con vibrato (2,7 s) | revelación importante (usado en "DEPENDE") |
| `bien.wav` | campanita + "¡bieeen!" | momento positivo/alivio (usado en INTACTAS) |
| `trombon.wav` | trombón triste "wah-wah-wah-waaah" | momento triste/negativo ("ya no hay nada que hacer") |
| `error.wav` | doble zumbido de error | algo que falla o está mal ("no es buena idea", la fuerza choca con la rotura) |

- Los especiales (destello, bien, trombón, error) **solo** donde tengan sentido con el guion, pocos por vídeo.
- **Menos ruido (feedback de Dani, reel «Infiltración»):** el barrido de salida **solo** al salir el título, las 3-4
  palabras clave principales y las imágenes pequeñas de apoyo; nunca en animaciones a pantalla completa. Barrido a
  mitad de volumen (`"salida_gain": 0.5`) y clic de entrada suave (ganancia 1.3). Si una palabra clave coincide con un
  punch-in de zoom, sin clic (`"sfx_in": null`): el zoom ya da el énfasis.
- Monigotes/personas en animaciones: estilo de las ilustraciones del manual (planas, sin contorno, piel clara, dolor con
  brillo coral y rayitos rojos) y silueta natural, nunca "palitos y bolas" (ver `scripts/anim_corredor.py`).
  Un sonido que "no pega" con lo que se dice se quita.

---

## 5. Lo que a Dani NO le gusta (no repetir)
- Verse naranja / cualquier filtro de color. Subtítulos grisáceos.
- Música de fondo inventada. Mezclar sonidos distintos para la misma función.
- Palabras rojas "cada x palabras" en los subtítulos. Letra roja con resplandor rojo.
- Tipografías distintas (serif, cursiva) en los textos destacados: todo Montserrat.
- Imágenes que duran mucho. Subtítulos que cambian de altura.
- Plano congelado al final para enseñar el @. @ en rojo plano.
- Textos que no dicen exactamente lo que él dice.

---

## 6. Flujo técnico (comandos)

Directorio de trabajo en el scratchpad: `ENTRADA/` (descargas) y `TRABAJO/`.

1. **Descargar** vídeo, imágenes y vídeo de apoyo (sección 1.3). Mira el vídeo con una hoja de contacto:
   `ffmpeg -i video.mov -vf "fps=1/4,scale=270:-2,tile=6x3" -frames:v 1 hoja.jpg` (y léela).
2. **Audio**: `ffmpeg -i video.mov -ac 1 -ar 16000 TRABAJO/voz16k.wav` y `-ac 2 -ar 48000 TRABAJO/voz48k.wav`.
3. **Transcribir** (en segundo plano, ~20-25 min): `python3 -I reels-kit/scripts/transcribir.py TRABAJO/voz16k.wav ~/models/sherpa-onnx-whisper-large-v3 -38 15 TRABAJO/ventanas.json 0.3`
4. **Pausas**: `python3 -I reels-kit/scripts/pausas.py TRABAJO/voz16k.wav` → tramos `inicio|fin|`.
5. **segmentos.txt**: rellena cada tramo con el texto REAL (de la transcripción, corrigiendo con el guion las palabras
   mal oídas: "fisio", "deshilachados"…). Formato `inicio|fin|texto` (ver `ejemplo-maraton/segmentos.txt`).
6. **Palabras**: `python3 -I reels-kit/scripts/alinear_palabras.py TRABAJO/voz16k.wav segmentos.txt TRABAJO/words.json`
   (después revisa a mano la última frase: si dice "esta es tu cuenta", que no ponga "sígueme").
7. **edit.json**: copia `ejemplo-maraton/edit.json` y adapta: `video`, `END`/`video_end` (duración), `hook`,
   `broll`, `keys` (st/en/líneas/rojo/`sfx`/`sfx_in`/`y`/`glow`), `cards` (`png`, `cy`, `sc`), `graphics`, `zoom`, `outro`.
   Tarjetas: `python3 -I reels-kit/scripts/tarjeta.py imagen.png 940 TRABAJO/card_x.png` (vertical: 620).
   Para otra animación, crea un módulo nuevo en `scripts/` con `draw(t, scene, t0, t1, pulses, broken)` y pon
   `"graphic_module"` en edit.json.
8. **Textos**: `python3 -I reels-kit/scripts/textos.py edit.json TRABAJO/words.json TRABAJO/subs.ass`
9. **Sonido**: `python3 -I reels-kit/scripts/audio.py edit.json TRABAJO/voz48k.wav TRABAJO/mix_raw.wav` y
   `ffmpeg -i TRABAJO/mix_raw.wav -af "alimiter=limit=0.97:attack=3:release=60:level=disabled" -ar 48000 -c:a pcm_s16le TRABAJO/mix.wav`
10. **Prueba corta** (1 min): `python3 -I reels-kit/scripts/render.py edit.json TRABAJO/subs.ass TRABAJO/mix.wav TRABAJO/prueba.mp4 8`
    y mira fotogramas. **Render completo** (~11 min, en segundo plano): sin el último argumento.
11. **Comprobar** fotogramas clave (título, cada palabra clave, imágenes, animación, final). Busca solapes.
12. **Comprimir para entregar** (<30 MB, conservando HDR):
    ```bash
    X="colorprim=bt2020:transfer=arib-std-b67:colormatrix=bt2020nc:range=limited:log-level=error"
    ffmpeg -i HQ.mp4 -c:v libx265 -preset medium -b:v 3600k -x265-params "pass=1:$X" -an -f mp4 /dev/null -y
    ffmpeg -i HQ.mp4 -c:v libx265 -preset medium -b:v 3600k -x265-params "pass=2:$X" -pix_fmt yuv420p10le -tag:v hvc1 \
      -color_primaries bt2020 -color_trc arib-std-b67 -colorspace bt2020nc -color_range tv -c:a aac -b:a 192k -movflags +faststart FINAL.mp4
    ```
13. **Entregar** con `SendUserFile` (límite 30 MB). No se puede subir a Drive (conector ≤10 MB y en base64).
    Recuérdale subirlo desde el iPhone para que Instagram respete el HDR.

### Trucos técnicos aprendidos
- libass no escribe transparencia: `render.py` dibuja los textos sobre negro y sobre blanco y calcula el alfa.
- `ffmpeg -ss` como opción de salida sobre una fuente lavfi corta da 0 frames: dale duración suficiente (`d=`).
- Para esperar a un proceso no uses `pgrep -f "<texto>"` con un texto que aparece en tu propio comando (se
  encuentra a sí mismo y no termina nunca). Espera a que exista el archivo de salida.
- Un `ffmpeg` sin `-nostdin`/`-y` puede quedarse esperando confirmación.
- Comunica avances a Dani con frases cortas; los renders tardan (~11 min + 4 min de compresión).
