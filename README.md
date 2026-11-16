# #OPENTOHELP

[English](#english) · [Español](#español)

---

## English

Browser extension that shows which of your LinkedIn connections have the **Open to Work** frame (they're looking for a job) or the **Hiring** frame (they're hiring), so you can help them: offer them something, recommend them, or connect them with each other.

### How it works

1. Click the extension button → **Update list**.
2. A window opens with your LinkedIn connections page and the extension does a few real scrolls. Meanwhile it watches which request the page uses to fetch each batch of connections (the "recipe": URL, body, and which number advances from batch to batch).
3. It replays one of those requests and learns to read the response by comparing it with the cards the page already rendered. None of this is hard-coded: if LinkedIn changes its request, the next update learns the new one.
4. With the recipe, it requests the remaining batches directly, without rendering the page (so memory doesn't run out): bursts of 3 batches with a short 0.2–0.6 second gap between them, like the page does, followed by a random 1.5–3 second pause. If the request stops working halfway, it learns the recipe again once; if that fails too, it continues by scrolling, hiding the cards it has already read so memory doesn't run out.
5. For each connection it looks at the photo URL: if it contains `profile-framedphoto`, the photo has a frame.
6. To tell which frame it is, it reads the color of the photo's bottom-left corner: green = Open to Work, purple = Hiring. This works with LinkedIn in any language. A frame of another color goes to the **Other frames** tab, which only appears when there's someone in it.
7. If a connection that was on your list now shows up with an unframed photo, it's removed right away.
8. When it finishes, the window closes on its own and the popup shows the list in alphabetical order, with a **New** label for those who turned on their frame since the previous update. After a complete update, anyone who no longer appeared with a frame is removed too (they turned it off or are no longer your connection).

While it runs, the extension icon shows `…` (or `II` when paused), and the popup shows the elapsed time plus the **Show window** and **Stop** buttons. Once finished, it shows how long the update took. The stopwatch doesn't count paused time.

Don't close the update window until it finishes. The first few seconds, and the scroll fallback, need the window visible, because the page only loads cards on screen; during the direct requests it can stay minimized or in the background. The banner at the top of the window says which case applies. If the page stops loading because the window is hidden, or you navigate away from the connections page in that window, the update pauses and resumes when you come back.

If the update is interrupted (you stop it, close the window, the tab crashes or the page stops responding 5 times in a row), what was found stays saved, nobody is removed, and the popup shows how far it got. If you click **Update** again within 24 hours, it resumes where it left off. The popup status is also highlighted when 2 or more days have passed since the last update.

If you visit your connections page on your own, the extension reads what you see (passive mode), without automating anything.

### Languages

The interface is available in English, Spanish, Portuguese (Brazil and Portugal) and French, following the browser's language. To add another one, create `_locales/<code>/messages.json` (e.g. `de`) with the same keys as `_locales/en/messages.json`; no code changes are needed.

The browser looks for the most specific translation and then the general one: Chrome in Canadian French tries `fr_CA` and then `fr`. That's why a folder without a region (`en`, `es`, `fr`) covers every variant of the language. Use a code from the [list of languages supported by the Chrome Web Store](https://developer.chrome.com/docs/webstore/i18n#choosing-locales-to-support) so the store recognizes it; Portuguese only appears there as `pt_BR` and `pt_PT`, which is why it has two folders.

### Privacy

- **Nothing is sent to any server.** There's no backend: everything stays in your browser's local storage (`storage.local`).
- **Only framed connections are stored** (name, headline, profile link and photo URL). Everyone else is read on screen and discarded.
- The extension doesn't read messages, send invitations or take any action on your behalf.
- Permissions: `storage` (saving the list), `www.linkedin.com` (reading your connections page), `media.licdn.com` (reading the frame color of photos) and `webRequest` (watching which request LinkedIn uses to fetch your connections, only in the update window).
- The recipe includes your LinkedIn session token: it's kept only in your browser while the update runs and deleted when it ends.
- In Firefox, the extension declares that it collects no data (`data_collection_permissions: none`).
- Full privacy policy: [PRIVACY.md](PRIVACY.md).

### About LinkedIn

#OPENTOHELP is not affiliated with LinkedIn. LinkedIn doesn't allow extensions that automate browsing or copy data from its site, so even though this extension only reads your own connections list, at a slow pace and without sending anything outside your browser, LinkedIn could temporarily restrict your account. If you'd rather not take that risk, you can use it in passive mode only: open your connections page and scroll through it yourself; the extension will take note of what you see.

### Install in developer mode

**Chrome:** `chrome://extensions` → turn on *Developer mode* → *Load unpacked* → choose this folder.

**Firefox (142+):** `about:debugging#/runtime/this-firefox` → *Load Temporary Add-on* → choose `manifest.json`. A temporary add-on is removed when Firefox closes. The first time, open `about:addons` → #OPENTOHELP → *Permissions* and check that access to `linkedin.com` and `licdn.com` is turned on.

One `manifest.json` works for both browsers: Chrome uses `background.service_worker` and Firefox uses `background.scripts` (each one ignores the other key, and Chrome may show a harmless warning about it). The Firefox ID is `opentohelp@swilsont.github.io`.

### Project structure

| File | What it does |
|---|---|
| `src/config.js` | Tunable settings: wait times, reference colors, etc. |
| `src/selectors.js` | **Everything that depends on LinkedIn's HTML.** If LinkedIn changes its page, this is where it gets fixed. |
| `src/color.js` | Classifies the frame by the color of the bottom-left corner. |
| `src/recipe.js` | Infers the pagination request from the observed requests. |
| `src/paginator.js` | Learns to read the responses and requests the batches directly. |
| `src/storage.js` | Reading and writing to `storage.local`. |
| `src/background.js` | Coordinates the update: opens the window, sets the pace, classifies and stores. |
| `src/content.js` | Runs on LinkedIn: reads cards, scrolls, shows the banner. |
| `src/popup.*` | The popup. |
| `src/i18n.js` | Fills the popup texts in the browser's language. |
| `src/compat.js` | Chrome / Firefox compatibility and shared helpers. |
| `_locales/` | Interface texts, one folder per language. |
| `store/` | Texts and images for publishing in the stores. |

### License

MIT

---

## Español

Extensión de navegador que muestra cuáles de tus contactos de LinkedIn tienen activo el marco **Open to Work** (buscan trabajo) o **Hiring** (están contratando), para que puedas ayudarlos: ofrecerles algo, recomendarlos o conectarlos entre sí.

### Cómo funciona

1. Presionas el botón de la extensión → **Actualizar lista**.
2. Se abre una ventana con tu página de conexiones de LinkedIn y la extensión hace unos pocos scrolls reales. Mientras tanto observa qué consulta usa la página para pedir cada tanda de contactos (la "receta": dirección, cuerpo y qué número avanza de tanda en tanda).
3. Repite una de esas consultas y aprende a leer la respuesta comparándola con las tarjetas que la página ya dibujó. Nada de esto queda fijo en el código: si LinkedIn cambia su consulta, la próxima actualización aprende la nueva.
4. Con la receta, pide el resto de las tandas directamente, sin dibujar la página (así no se agota la memoria): ráfagas de 3 tandas separadas por 0,2 a 0,6 segundos, como hace la página, y luego una pausa aleatoria de 1,5 a 3 segundos. Si la consulta deja de funcionar a mitad de camino, vuelve a aprender la receta una vez; si eso también falla, sigue con scroll, ocultando las tarjetas ya leídas para que no se agote la memoria.
5. Para cada contacto, mira la URL de su foto: si contiene `profile-framedphoto`, tiene marco.
6. Para saber cuál marco es, lee el color de la esquina inferior izquierda de la foto: verde = Open to Work, morado = Hiring. Esto funciona con LinkedIn en cualquier idioma. Un marco de otro color va a la pestaña **Otros marcos**, que solo aparece cuando hay alguien en ella.
7. Si un contacto que estaba en tu lista aparece ahora con foto sin marco, se quita de inmediato.
8. Al terminar, la ventana se cierra sola y el panel muestra la lista en orden alfabético, con la etiqueta **Nuevo** para quienes activaron el marco desde la actualización anterior. Al terminar completa, también se quita a quien ya no apareció con marco (lo desactivó o ya no es tu contacto).

Mientras corre, el ícono de la extensión muestra `…` (o `II` si está en pausa), y el panel muestra el tiempo transcurrido junto a los botones **Ver ventana** y **Detener**. Al terminar, muestra cuánto demoró. El cronómetro no cuenta el tiempo en pausa.

No cierres la ventana de actualización hasta que termine. Los primeros segundos, y el scroll de respaldo, necesitan la ventana visible, porque la página solo carga tarjetas en pantalla; durante las consultas directas puede quedar minimizada o en segundo plano. El banner de arriba de la ventana indica en qué caso estás. Si la página deja de cargar porque la ventana está oculta, o si en esa ventana sales de la página de conexiones, la actualización se pausa y sigue cuando vuelves.

Si la actualización se corta (la detienes, cierras la ventana, la pestaña se cae o la página deja de responder 5 veces seguidas), lo encontrado queda guardado, no se quita a nadie y el panel muestra hasta dónde llegó. Si vuelves a presionar **Actualizar** dentro de las 24 horas siguientes, sigue desde donde quedó. El estado del panel también se destaca cuando pasan 2 días o más desde la última actualización.

Si visitas tu página de conexiones por tu cuenta, la extensión va leyendo lo que ves (modo pasivo), sin automatizar nada.

### Idiomas

La interfaz está disponible en español, inglés, portugués (Brasil y Portugal) y francés, según el idioma del navegador. Para agregar otro, crea `_locales/<código>/messages.json` (ej. `de`) con las mismas claves que `_locales/en/messages.json`; no hay que tocar código.

El navegador busca la traducción más específica y luego la general: Chrome en francés de Canadá prueba `fr_CA` y después `fr`. Por eso una carpeta sin región (`en`, `es`, `fr`) cubre todas las variantes del idioma. Usa un código de la [lista de idiomas que acepta la Chrome Web Store](https://developer.chrome.com/docs/webstore/i18n#choosing-locales-to-support) para que la tienda lo reconozca; el portugués solo aparece ahí como `pt_BR` y `pt_PT`, y por eso tiene dos carpetas.

### Privacidad

- **No se envía nada a ningún servidor.** No hay backend: todo queda en el almacenamiento local de tu navegador (`storage.local`).
- **Solo se guardan los contactos con marco** (nombre, titular, link al perfil y URL de la foto). Los demás se leen en pantalla y se descartan.
- La extensión no lee mensajes, no envía invitaciones ni hace ninguna acción en tu nombre.
- Permisos: `storage` (guardar la lista), `www.linkedin.com` (leer tu página de conexiones), `media.licdn.com` (leer el color del marco de las fotos) y `webRequest` (observar qué consulta usa LinkedIn para pedir tus contactos, solo en la ventana de actualización).
- La receta incluye el token de tu sesión de LinkedIn: se guarda solo en tu navegador mientras dura la actualización y se borra al terminar.
- En Firefox, la extensión declara que no recopila datos (`data_collection_permissions: none`).
- Política de privacidad completa: [PRIVACY.md](PRIVACY.md#español).

### Sobre LinkedIn

#OPENTOHELP no está afiliada a LinkedIn. LinkedIn no permite extensiones que automaticen la navegación o copien datos de su sitio, así que, aunque esta extensión solo lee tu propia lista de contactos, a un ritmo pausado y sin enviar nada fuera de tu navegador, existe la posibilidad de que LinkedIn restrinja temporalmente tu cuenta. Si prefieres no correr ese riesgo, puedes usarla solo en modo pasivo: abre tu página de conexiones y recórrela tú; la extensión irá anotando lo que veas.

### Instalar en modo desarrollador

**Chrome:** `chrome://extensions` → activar *Modo de desarrollador* → *Cargar extensión sin empaquetar* → elegir esta carpeta.

**Firefox (142+):** `about:debugging#/runtime/this-firefox` → *Cargar complemento temporal* → elegir `manifest.json`. Un complemento temporal se borra al cerrar Firefox. La primera vez, abre `about:addons` → #OPENTOHELP → *Permisos* y revisa que el acceso a `linkedin.com` y `licdn.com` esté activado.

Un solo `manifest.json` sirve para los dos navegadores: Chrome usa `background.service_worker` y Firefox usa `background.scripts` (cada uno ignora la clave del otro, y Chrome puede mostrar una advertencia inofensiva por eso). El ID para Firefox es `opentohelp@swilsont.github.io`.

### Estructura

| Archivo | Qué hace |
|---|---|
| `src/config.js` | Parámetros ajustables: tiempos de espera, colores de referencia, etc. |
| `src/selectors.js` | **Todo lo que depende del HTML de LinkedIn.** Si LinkedIn cambia su página, se arregla aquí. |
| `src/color.js` | Clasifica el marco por el color de la esquina inferior izquierda. |
| `src/recipe.js` | Deduce la consulta de paginación a partir de las peticiones observadas. |
| `src/paginator.js` | Aprende a leer las respuestas y pide las tandas directamente. |
| `src/storage.js` | Lectura y escritura en `storage.local`. |
| `src/background.js` | Coordina la actualización: abre la ventana, marca el ritmo, clasifica y guarda. |
| `src/content.js` | Corre en LinkedIn: lee tarjetas, hace scroll, muestra el banner. |
| `src/popup.*` | El panel. |
| `src/i18n.js` | Pone los textos del panel en el idioma del navegador. |
| `src/compat.js` | Compatibilidad Chrome / Firefox y funciones compartidas. |
| `_locales/` | Textos de la interfaz, una carpeta por idioma. |
| `store/` | Textos e imágenes para publicar en las tiendas. |

### Licencia

MIT
