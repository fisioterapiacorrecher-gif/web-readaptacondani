# Instalar el motor de la app RCD (una sola vez, ~10 minutos)

Hazlo **desde el ordenador** y con la cuenta **info@rcdclinic.com** (la del Workspace).

## 1. Crear el proyecto

1. Entra en <https://script.google.com> con **info@rcdclinic.com**.
   Si te abre con otra cuenta, cambia de cuenta arriba a la derecha.
2. Pulsa **Nuevo proyecto**.
3. Arriba a la izquierda, donde pone «Proyecto sin título», escribe **RCD App**.

## 2. Pegar el código

1. Abre el archivo `app/backend/Code.gs` en GitHub (rama `claude/beautiful-brown-d4d5t4`) y pulsa el botón **Copy raw file** (icono de dos cuadrados).
2. Vuelve al editor de Apps Script. En el archivo **Código.gs**, borra todo lo que haya (Ctrl+A, Supr) y pega (Ctrl+V).
3. Pulsa el icono del **disquete** (Guardar).

## 3. Poner la hora de España

1. Menú de la izquierda → **⚙️ Configuración del proyecto**.
2. En **Zona horaria**, elige **(GMT+01:00) Hora de Europa central – Madrid**.

## 4. Instalar

1. Vuelve al editor (icono **< >** de la izquierda).
2. En la barra de arriba, en el desplegable de funciones, elige **instalar** y pulsa **▶ Ejecutar**.
3. Google te pedirá permisos. Es normal: el programa es tuyo y necesita crear la hoja de datos y enviar emails.
   - Pulsa **Revisar permisos** → elige **info@rcdclinic.com**.
   - Si sale «Google no ha verificado esta aplicación»: **Configuración avanzada** → **Ir a RCD App (no seguro)**.
     Sale porque el programa lo has creado tú y no está publicado en Google; no es un riesgo.
   - Pulsa **Permitir**.
4. Abajo, en el **Registro de ejecución**, verás «Listo. Hoja de datos: https://docs.google.com/…».
   Esa es tu hoja **«RCD App · Datos»**, ya está en tu Drive. No la borres ni cambies el nombre de sus pestañas.

## 5. Publicarlo para que las apps puedan hablar con él

1. Arriba a la derecha: **Implementar → Nueva implementación**.
2. Junto a «Seleccionar tipo», pulsa el **⚙️** y elige **Aplicación web**.
3. Rellena:
   - **Descripción**: `RCD App 1.0`
   - **Ejecutar como**: **Yo (info@rcdclinic.com)**
   - **Quién tiene acceso**: **Cualquier usuario**
4. Pulsa **Implementar** y copia la **URL de la aplicación web** (termina en `/exec`).
5. **Pásame esa URL.** Con ella conecto las dos apps.

> «Cualquier usuario» solo permite que las apps le hablen. Para ver o guardar datos, cada persona
> tiene que entrar con el código que le llega a su email, y cada paciente solo ve lo suyo.

Si en «Quién tiene acceso» no te aparece **Cualquier usuario**, es un ajuste de tu Workspace:
**admin.google.com → Aplicaciones → Google Workspace → Drive y Documentos → Configuración de uso compartido**
→ permite compartir fuera de la organización. Avísame si te pasa y lo vemos juntos.

## 6. Comprobar

Abre la URL `/exec` en el navegador. Tiene que salir algo como:
`{"ok":true,"app":"RCD Clinic","version":"1.0.0"}`

---

### Cuando haya una versión nueva del código

1. Pega el código nuevo en **Código.gs** y guarda.
2. **Implementar → Gestionar implementaciones** → lápiz ✏️ → **Versión: Nueva versión** → **Implementar**.
   Así la URL no cambia y las apps siguen funcionando.

### Qué hay en la hoja «RCD App · Datos»

Una pestaña por tipo de dato: Pacientes, Prescripción, Series, Ejercicios, Sesiones, Dolor, Encuestas,
Cuestionarios, Decisiones, Mensajes, Alta, Biblioteca, Config y Registro (errores y accesos).
En **Config** puedes cambiar las horas de los recordatorios y, cuando lo actives, poner el enlace de tu
calendario de citas en `RESERVA_CALENDARIO`.
