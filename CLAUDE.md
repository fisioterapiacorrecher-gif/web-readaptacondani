# RCD Clinic — Landing (memoria del proyecto)

Si abres una sesión nueva de Claude Code aquí, **empieza leyendo esto**.

## Qué es

Landing de **una sola página** para **RCD Clinic (Readapta con Dani)**: fisioterapia online
para **runners/corredores** con tendinopatías. Objetivo: que un corredor con dolor de tendón
entienda el método y contacte (WhatsApp/Instagram/formulario).

**Proyecto independiente y autocontenido.** No forma parte de ningún otro proyecto ni repo.

## Stack

- **Estático**: HTML5 + CSS moderno (variables CSS) + JavaScript vanilla. **Sin framework, sin build.**
- Se despliega subiendo la carpeta a cualquier hosting estático (Netlify, Vercel, GitHub Pages…).

## Estructura de la página (en `index.html`)

1. **Hero** — "Vuelve a correr sin dolor" sobre foto a pantalla completa (entrada escalonada al cargar).
   - Debajo, **franja de garantías** (plan adaptado · seguimiento 1:1 · largo plazo).
2. **¿Funciona?** — banda que responde a la duda de la fisio online.
3. **Qué hago** — el método en **3 pasos** (filas con número grande, no tarjetas) (educación en dolor · ejercicio terapéutico · seguimiento).
4. **Sobre Dani** — foto + texto ("soy experto en corredores").
5. **5 pilares** — el enfoque (título fijo a la izquierda + lista con divisores).
6. **Cita** a pantalla completa.
7. **Planes** — 3 tarjetas (¿Encajas en RCD? · Readaptación Completa · Vuelta a Competir).
8. **Contacto** — WhatsApp + Instagram + formulario (el formulario abre WhatsApp con el mensaje).

## Marca

- **Fuente de verdad: manual de marca en Canva** ("MANUAL DE MARCA", pág. 04 tipografías y 05 paleta).
- **Paleta (sin añadir tonos nuevos):** negro `#000000`, blanco hueso `#FFFBE8` (texto), gris `#F1F1F1`
  (superficies = gris con transparencia sobre negro), **rojo coral `#FF3434`** como eje y verde menta
  `#E9FFB9` **muy puntual**. Variables al inicio de `styles.css` (`:root`).
- **Tipografías del manual:** Pragmatica (títulos Bold en mayúsculas, texto Regular) y Stavok Groteske
  (subtítulos con interletrado amplio y números). Son de pago: en la web se usan **Geist** (por Pragmatica)
  y **Outfit** (por Stavok), autoalojadas en `fonts/` (OFL). Si se consiguen las licencias web, añadir su
  `@font-face` en `styles.css`: ya van primeras en `--font` y `--font-accent`.
- Radios: botones en píldora, superficies 16px, inputs 14px.
- El logo es un **destello/estrella SVG** hecho a mano como marcador, hasta tener el logo oficial.

## Contacto real (ya en la web)

- WhatsApp: **+34 684 78 00 66**
- Instagram: **@readaptacondani**

## Pendiente / ideas

- Poner el **dominio real** en el SEO (ahora `rcdclinic.com` de ejemplo): `index.html`
  (canonical/Open Graph/Twitter/datos estructurados), `robots.txt`, `sitemap.xml`.
- Sustituir **logo oficial** y **tipografía oficial** cuando estén disponibles.
- Posible **sección de FAQ** (buena para SEO: "¿funciona la fisio online?", "¿cuánto tarda una
  tendinopatía?"…).
- **Subir las fotos a `img/`** (`hero.jpg`, `dani.jpg`, `quote.jpg`, `plan1.jpg`, `plan2.jpg`, `plan3.jpg`):
  la carpeta **no está en el repo**. Mientras falten, cada foto muestra un fondo de marca (negro + halo
  coral + destello) gracias a `.media-fallback` en `styles.css` y al aviso `is-missing` de `script.js`.
- Foto de Dani (`img/dani.jpg`) ya lleva difuminada la marca de la otra clínica del fondo y del polo.

## SEO ya hecho

Título, meta description, Open Graph/Twitter, datos estructurados Schema.org (`MedicalBusiness`),
`robots.txt` y `sitemap.xml`. Keyword objetivo: **"fisio online para runners"**.

## Skills del proyecto

- **`emil-design-eng`** (`.claude/skills/emil-design-eng/`): filosofía de diseño e interacción de
  Emil Kowalski (animaciones, easing, estados de botones, detalles de pulido). Úsala al tocar
  estilos, animaciones o interacciones de la landing. Fuente: github.com/emilkowalski/skills (MIT).
- **`review-animations`**: revisión estricta de animaciones (tabla Antes/Después/Por qué + veredicto).
- **`mobile-native`**: detalles para que la web se sienta nativa en el móvil (hover pegado, flash al tocar, zoom en inputs…).
- **`find-animation-opportunities`**: dónde añadir movimiento y dónde no (solo propone, no toca código).

Todas vienen de github.com/emilkowalski/skills (MIT) y llevan su `LICENSE`.

- **`design-taste-frontend`** (`.claude/skills/taste-skill/`): la "Taste Skill" anti-plantilla para landings
  (github.com/Leonxlnx/taste-skill, MIT). Úsala para criticar/rediseñar layout, tipografía, color y copy.
  **Cómo aplicarla aquí:**
  - Su stack por defecto (React/Next/Tailwind/Motion) **no aplica**: este proyecto es HTML/CSS/JS sin build.
  - En **animación mandan las reglas de Emil** (arriba). Ignora su `transition: all 0.3s` de ejemplo.
  - Marca y contenido reales (colores `#FF3434`/`#E9FFB9`, tema oscuro, textos de Dani, logo) no se cambian
    sin que Dani lo pida: trátalo como "redesign - preserve" (su sección 11).

- **`impeccable`** (`.claude/skills/impeccable/`, github.com/pbakaus/impeccable, Apache 2.0): skill de
  diseño con 24 comandos (`/impeccable init`, `critique`, `audit`, `polish`, `typeset`…) + 4 subagentes
  (`.claude/agents/impeccable-*.md`) + hooks en `.claude/settings.json` que analizan cada edición de UI
  y hacen una pasada completa al terminar. El motor se descarga solo la primera vez (verificado por SHA-256)
  a `~/.impeccable/bin/`; no va en el repo. Pendiente: `/impeccable init` para crear `PRODUCT.md`.
  **El manual de marca de Canva manda sobre sus reglas** (negro `#000000`, estrella de 4 puntas, paleta cerrada).

### Convenciones de UI (tras la revisión con Impeccable, sept. 2026)

- Botones coral con **texto negro** (`#000` sobre `#FF3434` ≈ 6:1, AA). No volver a texto hueso sobre coral (3.5:1).
- Sin etiquetas/"kickers" encima de los títulos: el título habla solo.
- Viñetas de listas = destello de marca (`--spark-mask`), nunca glifos como ✓.
- Fotos como `<img>` dentro de `.media-fallback` (con `width`/`height`, `loading="lazy"` salvo el hero).
- Foco visible (`:focus-visible` coral), selección y scrollbar con la paleta.

### Convenciones de movimiento (tras la revisión con las skills de Emil)

- Curvas en `:root`: `--ease` (ease-out fuerte `0.23,1,0.32,1`) y `--ease-in-out`. No usar `ease-in`.
- Duraciones de UI ≤ 200ms (pulsación 160ms). Animar solo `transform` y `opacity` (+ colores).
- Todo `:hover` va dentro de `@media (hover: hover) and (pointer: fine)`.
- Botones: `:active { transform: scale(0.97) }`. `prefers-reduced-motion` quita desplazamientos pero mantiene color/opacidad.
