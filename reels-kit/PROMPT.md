# Prompt — Editor de reels de Dani (@readaptacondani · RCD Clinic)

> Pega esto (o di "lee el prompt del Kit de edición de reels") al empezar una sesión nueva.
> Resume todo lo aprendido editando 4 reels con Dani (oct 2026): «Maratón con el tendón roto», «No funciona así»,
> «¿Es suficiente una infiltración?» (7 versiones) y «Tratamiento definitivo» (3 versiones).
> El objetivo es que **el primer render ya salga como la versión final** de esos reels.
> Si algo de este documento choca con lo que Dani pida en el momento, manda lo que pida Dani.

---

## 0. Quién es Dani y qué quiere

Dani es fisioterapeuta especializado en corredores (tendinopatías). Publica reels educativos verticales en
Instagram: él hablando a cámara + textos destacados + animaciones explicativas + algún vídeo de apoyo.
Habla en español, tono cercano. Trátalo de tú, en español, con mensajes cortos.

**La lección más importante: MENOS ES MÁS.** Las primeras versiones siempre le parecieron "agresivas": demasiadas
palabras destacadas, demasiados sonidos y demasiados zooms a la vez. Lo que aprobó al final:
- **Pocas palabras destacadas** (5-7 por minuto), de **1-2 palabras** cada una, solo las ideas clave.
- **Pocos sonidos**, suaves, y cada uno con un significado (no un clic por cada cosa que entra o sale).
- **Zooms suaves** (saltos pequeños y empujes lentos), nunca un punch-in en cada palabra.
- **Animaciones explicativas** en los momentos clave: le encantan, son lo que más valor aporta.

---

## 1. Arranque de la sesión (hazlo tú, sin preguntar)

1. **Kit** (programas, sonidos, fuentes, ilustraciones y ejemplos) en el repo `fisioterapiacorrecher-gif/web-readaptacondani`,
   rama **`claude/new-session-mvstl8`** (la más completa), carpeta `reels-kit/`:
   ```bash
   cd /home/user/web-readaptacondani
   git fetch origin claude/new-session-mvstl8
   git checkout origin/claude/new-session-mvstl8 -- reels-kit   # si no está ya
   git reset -q reels-kit                                           # que no quede "staged" en tu rama
   bash reels-kit/scripts/preparar.sh                               # pip + modelo Whisper large-v3 (GitHub)
   ```
   Si mejoras el kit, haz commit en tu rama de trabajo (el kit viaja con ella).
2. **Drive** (conector Google Drive). Carpeta raíz `CLAUDE` (id `1N9BnTAeyHzv8Bctc896iykw1uXsBnCQa`):
   - Carpetas `Video a editar`, `Video a editar 2`, `Video a editar 3`… → cada una: el vídeo, un doc `Guion` y,
     si hay, `Video apoyo` (busca con `parentId = '<id carpeta>'`). **Si hay varias, edítalas una tras otra.**
   - El `Guion` puede venir **vacío**: entonces los textos salen solo de la transcripción.
   - `Kit edición reels` → este prompt (documento de Google).
3. **Descargar de Drive**: el conector solo baja ≤10 MB y en base64. Para vídeos:
   ```bash
   curl -sS -L -o video.mov "https://drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t"
   ```
   Si da 403: red del entorno o archivo no compartido "con el enlace" → díselo a Dani.
4. **Red**: huggingface, pexels, pixabay, unsplash, wikimedia y canva.com están **bloqueados**; GitHub sí funciona.
   No hay bancos de imágenes: las imágenes/vídeos de apoyo los pasa Dani, o se **dibujan como animación** (§5).
5. **Canva** (conector): el **MANUAL DE MARCA** (`DAHIyA7xpXU`) tiene la paleta, tipografías y en la pág. 29
   ("RECURSOS", iconos de @pepermpron) el estilo de ilustración de referencia (§5.1).

---

## 2. Qué te va a dar Dani

- **Vídeo bruto**: iPhone, `.mov`, HEVC 10-bit **HDR HLG (BT.2020, arib-std-b67)**, 1080×1920, 30 fps, 30-60 s.
  A veces empieza con Dani entrando en plano o se corta al final a mitad de palabra: no pasa nada, se edita igual
  (fundido de audio de 0,3 s al final) y se le comenta.
- **Guion**: **no lo sigue al pie de la letra**. Subtítulos y textos = **lo que dice de verdad**. El guion sirve
  para corregir palabras mal oídas ("corticoides"→"corticoide", "comando"→"como antes", "demos"→"veamos").
- **Vídeo de apoyo** (p. ej. él esperando sentado): también HDR HLG del iPhone, a veces girado (metadato de rotación,
  ffmpeg lo endereza solo). Te dirá en qué frase va.
- Instrucciones a veces incompletas ("te pongo los guiones" sin pegarlos): busca en Drive antes de preguntar.

---

## 3. ESTILO DEFINITIVO

### 3.1 Color
- **El color debe ser el del original.** Nada de SDR/LUT/tonemapping (lo vio naranja 3 veces).
- Todo se trabaja y exporta en **HDR HLG** (`render.py`). Gráficos SDR → HLG con `to_hlg()`; blanco de texto 0.40,
  imágenes 0.203, animaciones 0.30. Vídeo de apoyo HLG: `"hdr": true` en `broll` (no pasa por `to_hlg`).
- Única excepción aprobada: el **vídeo de apoyo en blanco y negro** (`looks`) para que se note que es otro clip.

### 3.2 Título (gancho)
- Pregunta-gancho en **MAYÚSCULAS**, Montserrat Black, grande (130-150 px, que quepa en el ancho con margen;
  mide con `medir.py`), **centrada en el medio aunque tape la cara**, líneas muy juntas, una línea por palabra/grupo,
  blanco y **rojo #FF3434** en las palabras clave. Cada línea entra al decirla (pop) y sale con barrido a la derecha.
- **Sin ningún sonido** (ni al entrar ni al salir): `"sfx_in": null, "sfx_out": null` en `hook`.
- **El interrogante va donde acaba la pregunta de verdad.** Si la pregunta sigue después del título
  ("…mejorar tu tendinitis / sin tener que ir al fisio todas las semanas?"), el título va sin "?" y el "?" lo lleva
  la palabra destacada que cierra la frase (SEMANAS?).

### 3.3 Subtítulos
- **Una palabra cada vez**, minúsculas, sin puntuación, Montserrat ExtraBold 80 px, blanco puro, sombra suave.
- **Siempre en la misma línea (y = 1180).** Nunca cambian de altura.
- Se ocultan mientras hay un texto destacado o una animación que lleva su propio texto (`hide_subs`).
- **Nunca el mismo texto dos veces**: si algo está en texto destacado, no sale también en subtítulo.

### 3.4 Textos destacados (palabras clave)
- Montserrat Black, MAYÚSCULAS, centrados, hasta 140 px (`fit()` de `medir.py`), 1-3 líneas, primera blanca y la
  palabra fuerte en **rojo**. Entrada con rebote (letras separadas → 112% → 100%), salida con barrido.
- **1-2 palabras, literales o exactamente como las pida Dani**: VERDADERA / CAUSA (no "ATACA LA VERDADERA CAUSA"),
  TU / RECUPERACIÓN, NI FÁRMACO / NI INFILTRACIÓN, EJERCICIO / PROGRESIVO, TODAS LAS / SEMANAS?, NO RECONSTRUYE /
  EL TENDÓN, MUCHO TIEMPO. Si una frase merece más, mejor una animación o una lista que una frase entera en grande.
- **Dónde van:**
  - Normal: en la línea de subtítulos (y = 1180), en lugar del subtítulo.
  - Con una **animación a pantalla completa**: arriba (y ≈ 420) en **blanco con resplandor rojo** (todas las líneas
    blancas; nunca letra roja + resplandor rojo). Si la animación es alta, bájala a ella, no subas el texto.
  - Si abajo hay otra cosa (p. ej. el calendario sobre el vídeo de apoyo): **a media pantalla (y ≈ 960)**.
  - **CTA final** (escríbeme X): donde antes iba el @ (y ≈ 1330), blanco con resplandor rojo, hasta el final, sin subtítulos.
- El texto de una animación **aguanta hasta que se va la animación** y se van **a la vez** (mismo `en`).
- En una animación, cada frase que Dani dice sobre ella lleva su texto con el mismo estilo
  (SILENCIAR LA ALARMA → EL PROBLEMA SIGUE AHÍ → PERO NO SUENA).

### 3.5 Listas (enumeraciones y efectos)
- Cuando enumera (efectos, beneficios), **lista** en vez de palabras sueltas (`anim_lista.py`):
  título pequeño + filas que entran al decirlas, icono en círculo coral.
  - Efectos que bajan algo: flecha ↓ (`scene = "SU EFECTO ES BAJAR|EL DOLOR|LA INFLAMACIÓN"`).
  - Enumeración neutra (sin juzgar): **números** (`scene = "@1170;num:|MASAJES|ONDA DE CHOQUE|PUNCIÓN"`, título vacío
    = sin título), un `entrada` por fila.
  - Beneficios: **check ✓** (`scene = "check:UN TRATAMIENTO QUE|EVITA RECAÍDAS|NO TE PRODUCE DOLOR|SEGUIR ENTRENANDO"`)
    con sonido `acierto` en cada fila.
- Sin desenfoque del fondo, **sombra negra suave** (que no tape la cara) y **más abajo** si la cara queda tapada
  (`scene = "@1170;check:…"`). **Sin zoom** mientras está la lista. `hide_subs: true`.

### 3.6 Zooms (suaves)
- Saltos de encuadre entre frases **1.00 ↔ 1.05** con deriva lenta (+0.02) — modo `"L"`.
- **Empuje lento** (`"S"`, 0,6 s ease-in-out, +0.05/+0.06) solo en **1-2 ideas clave** del vídeo.
- Nada de punch-in rápido (`"P"`) en cada palabra destacada: zoom + sonido + texto a la vez es "agresivo".
- Sin zoom durante listas. Centro del zoom en la cara.

### 3.7 Vídeo de apoyo (b-roll a mitad del reel)
- Entra **justo al acabar la frase anterior** (sin verte en grande ni un instante antes) y dura hasta la frase
  siguiente al tramo que ilustra. Sustituye a la imagen de Dani a pantalla completa; subtítulos encima.
- **Blanco y negro** (`looks` con `contrast 1.15`, `vignette 0.22`) para que se note que es otro clip.
- Entrada con **`disco_rayado`** (cambio de escena / "cosa mal hecha"); si es una espera, **`reloj`** debajo.
- Elige los trozos con más significado y móntalos con cortes (trim+concat) a la duración exacta; a Dani le gustan
  los cortes de acción (mira alrededor → resopla → mira el reloj). No lo aceleres si no lo pide.
- **Silencios largos** (> 0,5 s) entre frases, sobre todo justo en el cambio de escena, se **recortan del vídeo
  original** con `scripts/recortar_silencio.py` (desplaza todos los tiempos de edit.json y words.json).
- **Clips cortos que ilustran una palabra** (p. ej. «fisios», «cacos», «ejercicios de fuerza» en «cintilla»): Dani los
  pasa con el nombre de la frase. Van **en color** (se ve que son otra escena), entran **en su palabra** y duran hasta
  la frase siguiente; su texto arriba (y ≈ 420, blanco con resplandor rojo) con el mismo `en`, y solo el clic de
  entrada. Elige el trozo con más acción (manos trabajando, corredor de lado, sentadilla completa). Varios clips =
  `broll` como **lista**. Los clips SDR (bt709) pasan por `to_hlg`; los del iPhone en HLG llevan `"hdr": true`.

### 3.8 Final
- **Sin @usuario por defecto** (en dos reels lo quitó), **pero en «Tu tendón quiere decirte algo» lo pidió**: si lo pide,
  `"outro":{"handle":["@readaptacondani",t,110,1330],"keep":true,"sfx_in":"golpe","gain":0.8}` (blanco con resplandor,
  `keep` = no se va, hasta el último fotograma, sin barrido).
  - "Te leo en comentarios" / "cuéntame en comentarios": **no** en texto destacado (no lo quiere); animación de
    comentario (`anim_comentario.py`) + sonido `mensaje` + el @. Según la llamada a la acción:
  - "Escríbeme TENDÓN": texto destacado ESCRÍBEME / TENDÓN donde iba el @ (§3.4), hasta el último fotograma.
  - "Envíaselo a un amigo": **animación de compartir** (`anim_compartir.py`): botón coral con avión de papel que
    se pulsa varias veces, el avión vuela con estela blanca hasta el amigo, insignia con el número de envíos.
    **No desaparece**: dura hasta el último fotograma (`en` > END).
- El vídeo nunca se congela al final.

---

## 4. SONIDO

- **Sin música de fondo.** Voz a ~-11 dB RMS activo (+14 dB sobre el iPhone) + limitador.
- **Cada sonido tiene un significado** y siempre es el mismo para lo mismo. Pocos por vídeo.

| Archivo | Qué es | Cuándo (y cómo) |
|---|---|---|
| `entrada.wav` | doble clic | entra un texto destacado o una animación **sin** otro sonido. Ganancia 1.3 (suave). **No** si coincide con un empuje de zoom, ni en el título |
| `salida.wav` | barrido | **solo** al salir 2-4 textos destacados principales, a mitad de volumen (`"salida_gain": 0.5`). **Nunca** en animaciones a pantalla completa ni en el título. Excepción: texto + animación que se van juntos (un solo barrido) |
| `error.wav` | doble zumbido | algo que está mal / un "no" fuerte (NO RECONSTRUYE EL TENDÓN, NI FÁRMACO NI INFILTRACIÓN, NO VAS A PODER CORRER COMO ANTES). Es el "nooo" que pide Dani |
| `acierto.wav` | ding-ding ascendente | cada fila de una lista de beneficios (ganancia 2.6, que se oiga) |
| `eureka.wav` | arpa que sube + acorde | **la** solución del vídeo (EJERCICIO PROGRESIVO). Ganancia 2.6 |
| `disco_rayado.wav` | scratch de vinilo + frenazo | entrada del vídeo de apoyo / cambio de escena |
| `reloj.wav` | tic-tac que se acelera (6 s) | paso del tiempo (bajo el calendario) |
| `alarma.wav` | timbre de despertador 0,6 s | la alarma de la animación, se corta al silenciarla |
| `trombon.wav` | wah-wah-waaah | momento triste ("vas a esperar mucho tiempo") |
| `bien.wav` | campanita + "¡bieeen!" | alivio/positivo (EJERCICIO BIEN PLANEADO, INTACTAS) |
| `destello.wav` | brillo | revelación; **no** en "todo depende" (Dani lo quitó): úsalo poco |
| `golpe.wav` | **golpe grave** (sub-bajo ~40 Hz, impacto corto) | **el efecto que más usa Dani**: cuando aparece de golpe una palabra o imagen GRANDE (NO ENTIENDES NADA, NO SIR, el @, una foto de producto). Sacado de sus vídeos (promedio de 5 usos) |
| `golpe_largo.wav` | golpe grave más profundo y largo | palabras que entran **una a una** en grande (DINERO / TIEMPO / FRUSTRACIÓN: un golpe por palabra). De «placa de carbono» (7 usos) |
| `impacto.wav` | barrido corto + golpe | salto a una imagen/vídeo de stock y vuelta a Dani («no entiendes nada» 10,6 s) |
| `transicion.wav` | barrido de aire (whoosh) 0,45 s | cambio de plano o de escena con movimiento (barrido de cámara, desenfoque) |
| `subida.wav` | ruido que crece y corta en seco 0,55 s | justo antes de un corte importante (crea tensión) |
| `arpegio.wav` | acorde de Do mayor + 2 ecos | revelación positiva / respuesta ("estará…", la solución). Imitado de «placa de carbono» y «meses con dolor» |
| `acorde_brillante.wav` | acorde agudo sostenido 1 s | la gran frase final positiva (SOLUCIÓN DEFINITIVA). Imitado de «no entiendes nada» |
| `mensaje.wav` | pop + dos notas ascendentes (notificación) | se publica un comentario / entra un mensaje (CTA de comentarios). Ganancia 1.6 |
| `ding.wav` | ding-ding agudo corto | aparece el logo/marca (READAPTA CON DANI) o un icono |

- **Cómo edita Dani sus propios reels** (analizados 6: «dolor lateral», «no entiendes nada», «placa de carbono»,
  «meses con dolor», «zapatillas», «correr por la ciudad»): el sonido base de sus textos grandes es el **golpe grave**
  (no el clic); campanas en Do mayor para lo positivo; barridos solo en cambios de plano; error para el "no".
  1-7 golpes por vídeo, 0-1 campana, 0-4 barridos. Los golpes van fuertes (pico parecido a la voz, ganancia 1.0);
  las campanas, por debajo de la voz (ganancia 1-1.5). Muchos de sus efectos son estéreo y la voz mono: para
  analizar un vídeo suyo, el canal lateral (L-R) aísla los efectos.
- Los sonidos "especiales" deben **oírse** (Dani no notó el eureka/acierto a volumen normal): comprueba que su RMS
  quede al nivel de la voz (ganancia 2-3 en `sfx`: `["eureka", 0.0, 2.6]`).
- **ERROR CORREGIDO (oct 2026) en `audio.py`:** los wav en coma flotante (golpe, golpe_largo, impacto, eureka, acierto,
  arpegio, ding, transicion, subida, reloj, alarma, disco_rayado, acorde_brillante) se dividían por 32768 y quedaban
  MUDOS. Las ganancias altas (eureka/acierto 2.6) se pusieron cuando no sonaban: ahora el eureka a 2.6 ya va al nivel
  de la voz. Si un sonido "no se oye", mide su nivel en la mezcla (por encima de 300 Hz frente a la voz) antes de tocar ganancias.
- **`golpe`/`golpe_largo` son casi todo sub-bajo (<150 Hz): en altavoces de móvil/tablet NO se oyen.** Dani no oyó el golpe
  en ENTRENAR. Para una palabra que debe sonar seguro: `transicion` (whoosh) en la pausa justo antes (−0.32 s, ganancia 2.2) +
  `impacto` en la palabra (ganancia 2.4) — así quedó ENTRENAR.
- Listas: **un clic `entrada` por fila** (lo pidió en las 3 terapias), no uno solo al empezar.
- **El eureka, ahora que suena, a Dani le parece demasiado**: en «Tu tendón quiere decirte algo» lo cambió por `bien`
  también en la solución (EJERCICIO TERAPÉUTICO). Usa `bien` (ganancia 3.0) para la solución salvo que pida otra cosa.
- Positivo final (VOLVER A CORRER): `bien` (campanita + "¡bieeen!") a ganancia 3.0 (es flojo de origen), sin barrido de salida.
- Un sonido que no pega con lo que se dice se quita. Dos sonidos que se pisan (barrido + disco rayado) → quita uno.
- No puedes escuchar el resultado: dile a Dani qué sonidos revisar.

---

## 5. ANIMACIONES (lo que más le gusta)

### 5.1 Estilo de ilustración
- Como los iconos del manual (@pepermpron): **planas, sin contorno**, paleta cerrada: coral `#FF3434`,
  blanco hueso `#FFFBE8`, gris `#F1F1F1`, menta `#E9FFB9` (puntual), negro; piel clara `(247,214,200)`.
- **Dolor** = brillo coral concéntrico + rayitos rojos alrededor (como sus iconos de lesión).
- Rótulos en Montserrat Black blanco con trazo oscuro. Personas: **silueta natural**, nunca "palitos y bolas".
- **Corredor**: el muñeco articulado hecho a partir del dibujo de Dani (`assets/corredor_*.png` +
  `corredor_rig.json` + `anim_corredor.py`): corre de verdad (zancada, rodillas, braceo, rebote), frena, se queda
  sobre la pierna buena sin apoyar la dolorida y aparece el dolor en el Aquiles. Si Dani pasa otro dibujo de
  línea: se escala ×4, se separa por zonas (connectedComponents), se colorea con la paleta sin contorno (lado lejano
  ×0.8 más oscuro) y se monta como recortable (cabeza/zapatillas del dibujo, tronco y miembros dibujados).

### 5.2 Reglas
- **Entra exactamente en la palabra** que la motiva ("consiste" → infiltración; no antes ni 2 s tarde) y dura al
  menos lo que su texto; si algo se explica con ella, que dure hasta el final de la explicación (≥ 3 s si es un "gag").
- A pantalla completa: fondo desenfocado y oscurecido, centro y ≈ 920, texto arriba (y ≈ 420) que no la toque.
- Listas, calendario y compartir: **sin** desenfoque (`"blur": false`).
- Pruébala con `scripts/probar.py` (hoja de fotogramas sobre un fotograma real) **antes** del render completo.

### 5.3 Catálogo (en `scripts/`, todas con `draw(t, scene, t0, t1, pulses, broken)`)
| Módulo | Qué muestra | Ejemplo de uso |
|---|---|---|
| `animacion_tendon.py` | músculo → tendón (fibras) → hueso; rotura parcial/completa con luz que recorre | «Maratón con el tendón roto» |
| `anim_infiltracion.py` | jeringa que pincha la zona lesionada (roja que late) e inyecta líquido menta que la calma | "una infiltración consiste en inyectar…" |
| `anim_lista.py` | lista con ↓ (efectos) o ✓ (beneficios) | "su efecto es bajar el dolor y la inflamación" |
| `anim_alarma.py` | campana que suena → se tacha y calla → aviso "!" que sigue latiendo | "es como silenciar la alarma" |
| `anim_corredor.py` | corredor articulado que corre y se para por dolor en el Aquiles | "no vas a poder correr como antes" |
| `anim_calendario.py` | hojas de calendario tachándose cada vez más rápido (un año en 6 s) | "vas a esperar mucho tiempo" (sobre el b-roll) |
| `anim_compartir.py` | botón de enviar + aviones de papel repetidos hasta el amigo | CTA "envíaselo a ese amigo" |
| `anim_sin.py` | jeringa y electrodo que se tachan con señal de prohibido | "sin agujas y sin corrientes molestas" |
| `anim_carga.py` | barras que crecen + flecha menta que sube | "aumenta la capacidad de carga del tendón" · "aguantar carga de forma progresiva" |
| `anim_gimnasio.py` | dos personas con el muñeco de Dani: TÚ sentado en un banco con el móvil + OTRO que entra andando y hace curl alterno con mancuernas. pulses = [entra el otro, empieza el curl] | "es como ir al gimnasio y que otro levante las pesas por ti" («Tu tendón quiere decirte algo»). **Sustituye a `anim_pesas.py`** (mancuerna sola + prohibido): a Dani no le gustó nada; quería las dos personas como dice el texto |
| `anim_comentario.py` | tarjeta de comentario de Instagram arriba (zona del cielo): se escribe letra a letra, se envía, se publica y le llega el ❤ de readaptacondani. scene = "usuario|texto|quien_da_like", pulses = [escribir, enviar, me gusta]; `blur: false`, sin `hide_subs` | CTA "cuéntame / te leo en comentarios". Sonido `mensaje` al enviar |
| `animacion_estabilidad.py` | `eje`: modelo anatómico de frente (silueta de `assets/modelo_frontal.png`, la lámina de Dani) con CADERA → RODILLA → PIE que se encienden y se unen · `cintilla`: zoom-out desde la cintilla iliotibial hasta la pierna entera con dolor en la cara externa de la rodilla · (`fisio`, `correr`, `fuerza`: personas planas, sustituidas por vídeos reales) | «La clave para recuperar tu cintilla» |

Para una idea nueva, crea un módulo con `anim_base.py` (canvas ×2, `to_full`, `fade_io`, easings, colores) y ponlo
en `graphics` con `"module"`. Ideas que encajan: sol-luna (paso de días), reloj, carga/peso, fibras que se ordenan.

---

## 6. edit.json — campos útiles

- `hook`: `y0, lh, size, end, lines[[texto,t,rojo]], sfx_in, sfx_out`.
- `keys[]`: `st, en, lines[[texto,t,rojo,px]], y, glow:"red", sfx_in, sfx_out, sfx[[nombre,offset,ganancia]], keep_subs`.
- `graphics[]`: `module, st, en, scene, pulses, blur, hide_subs, sfx_in, sfx_out, sfx[[nombre,t_abs,ganancia]]`.
- `broll`: `st, en, offset, path, hdr, dark, zoom` (un objeto o una **lista** de varios clips) · `looks[]`: `st, en, fade_in, fade_out, contrast, vignette`.
- `zoom[]`: `[t, desde, hasta, "L"|"S"|"P"]` · `salida_gain` · `graphic_cy` · sin `outro` = sin @.
- `sfx[]` (raíz): `[nombre, t_abs, ganancia]` efectos sueltos sobre una frase sin texto (trombón en "no ves la luz").
- `sombra_suave: true` (sombra de título/textos más discreta, la pidió Dani) · `keydark` (oscurecido tras los textos, 0.10).
- Ejemplos completos y aprobados: `ejemplo-infiltracion/edit.json`, `ejemplo-tratamiento-definitivo/edit.json` y
  `ejemplo-cintilla/edit.json` (3 clips de apoyo + animaciones del eje y la cintilla + sonidos con significado).

---

## 7. Lo que a Dani NO le gusta (no repetir)
- Objetos sueltos que "representan" una comparación con personas (una mancuerna que sube sola): si el texto habla de
  personas, dibuja las personas con el muñeco (`anim_gimnasio.py` muestra cómo reutilizar el rig en otras posturas).
- Palabras del título mal oídas: **lee siempre el Guion de Drive antes de escribir el título** (aunque llegue tarde:
  vuelve a mirar la carpeta). «criándote» era «pidiéndote».
- Mezcla de muchas palabras destacadas + sonidos + zooms (agresivo). Frases enteras como texto destacado.
- Clic/barrido en el título; barrido al salir animaciones; sonidos que se pisan; sonidos especiales que no se oyen.
- Punch-ins de zoom rápidos en cada palabra.
- Verse naranja / filtros de color (salvo el B/N del vídeo de apoyo). Subtítulos grisáceos o que cambian de altura.
- Música de fondo. Mezclar sonidos distintos para la misma función.
- Palabras rojas sueltas en subtítulos. Letra roja con resplandor rojo. Tipografías distintas a Montserrat.
- Texto destacado repetido en los subtítulos. Textos que no dicen lo que él dice (o lo que pidió).
- Sombras negras que le tapan la cara. Textos que se pisan con la animación.
- Monigotes de palitos y bolas o figuras rígidas que no se mueven de verdad.
- Animaciones que aparecen tarde o desaparecen antes de que acabe su frase; la animación final que se va.
- Verse en grande un momento antes del vídeo de apoyo; silencios raros en el cambio de escena.
- Plano congelado al final. @ en rojo plano.

---

## 8. Flujo técnico

Trabaja en el scratchpad: `vN/ENTRADA/` (descargas) y `vN/TRABAJO/`.

1. **Descargar** (§1.3) y mirar con hoja de contacto: `ffmpeg -i video.mov -vf "fps=1/4,scale=270:-2,tile=6x3" -frames:v 1 hoja.jpg`.
2. **Audio**: `-ac 1 -ar 16000 voz16k.wav` y `-ac 2 -ar 48000 voz48k.wav`.
3. **Transcribir** en segundo plano (~5-10 min por vídeo de 45 s; si hay varios, en cadena):
   `python3 -I reels-kit/scripts/transcribir.py voz16k.wav ~/models/sherpa-onnx-whisper-large-v3 -38 15 ventanas.json 0.3`
4. **Pausas**: `pausas.py voz16k.wav`. Para afinar, transcribe cada tramo por separado (mismo modelo, un
   `create_stream` por tramo) y así sabes qué frase va en cada pausa.
5. **segmentos.txt** (`inicio|fin|texto` real) → **words.json** con `alinear_palabras.py`.
6. **edit.json**: escríbelo con un pequeño script Python (más fiable que a mano) partiendo de un ejemplo aprobado.
   Tamaños con `from medir import fit`. Aplica §3-§5 desde la primera versión.
7. **Animaciones**: pruébalas con `probar.py` sobre un fotograma real.
8. `textos.py` → `audio.py` → limitador + fundido final:
   `ffmpeg -i mix_raw.wav -af "alimiter=limit=0.97:attack=3:release=60:level=disabled,afade=t=out:st=<END-0.3>:d=0.3" -ar 48000 -c:a pcm_s16le mix.wav`
9. **Render** (`render.py`) en segundo plano: ~25-30 min con animaciones (10 min sin ellas) + 4 min de
   compresión. Encadena render + compresión en un solo comando y avisa a Dani de cuánto falta si pregunta.
   Si hay dos vídeos, **en cola** (uno detrás de otro), no a la vez.
10. **Comprobar** fotogramas clave (título, cada texto, cada animación, b-roll, final): solapes, caras tapadas.
11. **Comprimir** (<30 MB, HDR):
    ```bash
    X="colorprim=bt2020:transfer=arib-std-b67:colormatrix=bt2020nc:range=limited:log-level=error"
    ffmpeg -i HQ.mp4 -c:v libx265 -preset medium -b:v 3600k -x265-params "pass=1:$X" -an -f mp4 /dev/null -y
    ffmpeg -i HQ.mp4 -c:v libx265 -preset medium -b:v 3600k -x265-params "pass=2:$X" -pix_fmt yuv420p10le -tag:v hvc1 \
      -color_primaries bt2020 -color_trc arib-std-b67 -colorspace bt2020nc -color_range tv -c:a aac -b:a 192k -movflags +faststart FINAL.mp4
    ```
12. **Entregar** con `SendUserFile` (nombre claro: `Reel_<tema>_vN.mp4`), resumen corto de qué cambió y qué
    sonidos revisar. Recuérdale subirlo desde el iPhone (HDR).
13. Cuando apruebe, guarda su `edit.json` como `ejemplo-<tema>/` y lo aprendido en este prompt; commit + push.

### Trucos técnicos
- libass no escribe transparencia: `render.py` dibuja los textos sobre negro y sobre blanco y calcula el alfa.
- Halo/brillo: desenfoca el color **premultiplicado** por el alfa (si no, salen bordes de colores raros).
- `ffmpeg` siempre con `-nostdin -y`. En `filter_complex`, un filtro tras `concat` necesita su propia etiqueta.
- Para esperar, no uses `pgrep -f` con un texto de tu propio comando; espera a que exista el archivo de salida.
- No uses `rm` con rutas relativas tras un `cd` (lo bloquea la sesión): rutas absolutas o carpetas nuevas.
