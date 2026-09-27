# RCD Clinic · Landing (Readapta con Dani)

Web de una sola página para **RCD Clinic** — fisioterapia online para runners/corredores
con tendinopatías. Es un sitio **estático** (HTML + CSS + JavaScript, sin framework ni
compilación): se puede abrir tal cual y subir a cualquier hosting.

> Proyecto **independiente**. No depende de ninguna otra web, cuenta ni repositorio.

## Archivos

```
index.html      → la página (estructura y textos)
styles.css       → estilos (tema oscuro: negro, blanco, rojo coral; verde menta puntual)
script.js        → interacciones (menú al hacer scroll, formulario → WhatsApp)
robots.txt       → SEO (permite indexar; apunta al sitemap)
sitemap.xml      → SEO (lista la home)
server.js        → mini-servidor local opcional (solo para previsualizar)
img/             → fotos
  hero.jpg  dani.jpg  quote.jpg  plan1.jpg  plan2.jpg  plan3.jpg
```

## Ver la web en local

Es estática, así que vale cualquiera de estas:

- **Lo más fácil:** abre `index.html` con doble clic en el navegador.
- Con un servidor local (recomendado, así cargan bien las rutas):
  - Con Python: `python3 -m http.server 4310` y abre `http://localhost:4310`
  - Con Node: `npx serve` (o `npx http-server`)

## Publicarla (elige una)

Al ser estática, el deploy es de los más sencillos:

- **Netlify** (drag & drop): entra en app.netlify.com → arrastra esta carpeta → listo.
- **Vercel**: `vercel` en la carpeta, o importando el repo de GitHub.
- **GitHub Pages**: sube la carpeta a un repo y actívalo en Settings → Pages.
- **Cloudflare Pages**, etc.

## Antes de publicar — personalizar

1. **Dominio en el SEO.** Ahora hay un dominio de ejemplo `https://rcdclinic.com/`. Sustitúyelo
   por el dominio real en: `index.html` (canonical, Open Graph, Twitter y datos estructurados),
   `robots.txt` y `sitemap.xml`.
2. **Contacto** (ya puesto, revísalo): WhatsApp `+34 684 78 00 66` e Instagram `@readaptacondani`.
3. **Pendiente de sustituir cuando los tengáis:**
   - El **logo oficial** (ahora hay un destello SVG hecho a mano como marcador).
   - Las **tipografías** de la marca (ahora usa *Inter* de Google Fonts como sustituta).
4. **Foto de Dani** (`img/dani.jpg`): ya lleva difuminado el logo/rótulo de la otra clínica que
   salía de fondo y en el polo. Si tienes una foto de estudio mejor, se cambia por esta.

## Textos y colores

Todo el texto visible está en `index.html`. Los colores están al principio de `styles.css`
(bloque `:root`, variables `--coral`, `--mint`, etc.).
