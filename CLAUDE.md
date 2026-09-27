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

1. **Hero** — "Vuelve a correr sin dolor" sobre foto a pantalla completa.
2. **¿Funciona?** — banda que responde a la duda de la fisio online.
3. **Qué hago** — el método en **3 pasos** (educación en dolor · ejercicio terapéutico · seguimiento).
4. **Sobre Dani** — foto + texto ("soy experto en corredores").
5. **5 pilares** — el enfoque.
6. **Cita** a pantalla completa.
7. **Planes** — 3 tarjetas (¿Encajas en RCD? · Readaptación Completa · Vuelta a Competir).
8. **Contacto** — WhatsApp + Instagram + formulario (el formulario abre WhatsApp con el mensaje).

## Marca

- **Tema oscuro**: fondo negro, texto blanco, detalle principal **rojo coral `#FF3434`**.
  Verde menta `#E9FFB9` **muy puntual** (2 toques). Variables al inicio de `styles.css` (`:root`).
- Tipografía provisional **Inter** (Google Fonts) hasta tener la tipografía oficial de la marca.
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

### Convenciones de movimiento (tras la revisión con las skills de Emil)

- Curvas en `:root`: `--ease` (ease-out fuerte `0.23,1,0.32,1`) y `--ease-in-out`. No usar `ease-in`.
- Duraciones de UI ≤ 200ms (pulsación 160ms). Animar solo `transform` y `opacity` (+ colores).
- Todo `:hover` va dentro de `@media (hover: hover) and (pointer: fine)`.
- Botones: `:active { transform: scale(0.97) }`. `prefers-reduced-motion` quita desplazamientos pero mantiene color/opacidad.
