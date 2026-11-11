# Publicar las apps en app.rcdclinic.com (una sola vez, ~15 minutos)

La carpeta `app/web/` es la app ya terminada: no hay que compilar nada.
- `https://app.rcdclinic.com` → app del paciente
- `https://app.rcdclinic.com/panel` → tu panel

Usamos **Netlify** (gratis, con HTTPS automático) y en **IONOS** solo añadimos una línea.

## 1. Netlify: conectar el repositorio

1. Entra en <https://app.netlify.com/signup> y regístrate con **GitHub** (la misma cuenta del repositorio).
2. **Add new site → Import an existing project → GitHub** y elige `web-readaptacondani`.
3. Rellena:
   - **Branch to deploy**: `claude/beautiful-brown-d4d5t4` (de momento; cuando esté todo revisado pasamos a `main`)
   - **Base directory**: `app/web`
   - **Build command**: déjalo vacío
   - **Publish directory**: `app/web`
4. Pulsa **Deploy**. En un minuto tendrás una dirección del tipo `algo-raro-123.netlify.app`. Ábrela para comprobar que sale la pantalla «Entra en tu plan».
5. **Site configuration → Change site name** → ponle `rcd-app` (quedará `rcd-app.netlify.app`).

## 2. Netlify: añadir tu dominio

1. **Domain management → Add a domain** → escribe `app.rcdclinic.com` → **Verify** → **Add domain**.
2. Netlify te dirá que falta configurar el DNS. Deja esa pestaña abierta.

## 3. IONOS: apuntar «app» a Netlify

1. Entra en <https://my.ionos.es> → **Dominios y SSL** → `rcdclinic.com` → pestaña **DNS**.
2. **Añadir registro** → tipo **CNAME**:
   - **Nombre de host**: `app`
   - **Apunta a**: `rcd-app.netlify.app` (el nombre que pusiste en el paso 1.5)
   - **TTL**: el que venga por defecto
3. **Guardar**. Si IONOS avisa de que ya existe un registro `app`, bórralo primero (no toques los de `@` ni `www`).
4. Puede tardar entre 5 minutos y unas horas. Netlify activa el **HTTPS** solo cuando lo detecta.

## 4. Comprobar

- `https://app.rcdclinic.com` → «Entra en tu plan»
- `https://app.rcdclinic.com/panel` → «Panel de Dani» → entra con **info@rcdclinic.com**

La landing (`rcdclinic.com`) es independiente: cuando la subas, irá en otro sitio de Netlify con la raíz del repositorio,
y no hay que cambiar nada de esto.

## 5. Activar las notificaciones en el móvil (cuando app.rcdclinic.com ya funcione)

1. Entra en tu panel → **Ajustes** → **Notificaciones en el móvil** → **Generar claves**.
2. Te salen 3 valores. En Netlify: **Site configuration → Environment variables → Add a variable**, y crea estas tres
   (nombre exacto → valor que te da el panel, con el botón Copiar):
   `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `PUSH_SECRETO`
3. En Netlify: **Deploys → Trigger deploy → Deploy site**.
4. Listo. Cada paciente verá en su app «Activa las notificaciones» y, al aceptarlo, le llegará un aviso al móvil
   cada vez que publiques su semana. Quien no las active recibe el email (lo puedes desactivar en Ajustes).
   En iPhone solo funcionan si el paciente ha añadido la app a la pantalla de inicio (iOS 16.4 o posterior).

## Instalar la app en el móvil (para ti y para los pacientes)

- **iPhone (Safari)**: abre `app.rcdclinic.com` → botón **Compartir** → **Añadir a pantalla de inicio**.
- **Android (Chrome)**: abre `app.rcdclinic.com` → menú **⋮** → **Instalar aplicación** (o «Añadir a pantalla de inicio»).
