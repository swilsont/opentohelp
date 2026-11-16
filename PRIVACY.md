# #OPENTOHELP — Privacy Policy / Política de privacidad

[English](#english) · [Español](#español)

Effective date / Vigente desde: November 16, 2026 / 16 de noviembre de 2026

---

## English

#OPENTOHELP is a browser extension that shows which of your LinkedIn connections have the "Open to Work" or "Hiring" frame on their profile photo. This policy explains what data it handles and how.

### Summary

- **No data leaves your browser.** The extension has no server, no analytics and no tracking.
- **Nothing is sold, shared or transferred** to anyone.
- **Only what's needed is stored,** and only in your browser's local storage.

### What data the extension handles

| Data | Why | Where it's kept | For how long |
|---|---|---|---|
| Name, headline, profile link and profile photo URL of your **1st-degree LinkedIn connections that have an Open to Work or Hiring frame** | To show you the list | Your browser's local storage (`storage.local`) | Until the connection no longer has the frame, is no longer your connection, or you uninstall the extension |
| Your other connections (without a frame) | Read on screen to check whether they have a frame | **Not stored** | Discarded immediately |
| The request your browser uses to load your connections list, including your **LinkedIn session token** (CSRF token) | To read the rest of your list without rendering it, exactly as the LinkedIn page itself does | Your browser's local storage, only while an update is running | Deleted when the update ends |
| Date, duration and progress of the last update | To show them in the popup and resume an interrupted update | Your browser's local storage | Until the next update or until you uninstall the extension |

The extension also downloads the profile photos of framed connections from LinkedIn's image server (`media.licdn.com`) to read the color of the frame. The images are analyzed in memory and are not stored.

### What the extension does NOT do

- It doesn't send any data to the developer or to third parties.
- It doesn't read your messages, your feed or any page other than your connections list.
- It doesn't send invitations, messages or take any action on LinkedIn on your behalf.
- It doesn't use data for advertising, profiling or creditworthiness.

### How to delete the data

Uninstalling the extension deletes everything it stored. You can also remove it from `chrome://extensions` → #OPENTOHELP → Details → "Remove extension" in Chrome, or from `about:addons` → #OPENTOHELP → "Remove" in Firefox.

### Changes to this policy

If the way the extension handles data changes, this policy will be updated before the change is published, and the date at the top will reflect it.

### Contact

Questions or concerns: open an issue in the project's repository: https://github.com/swilsont/opentohelp/issues

---

## Español

#OPENTOHELP es una extensión de navegador que muestra cuáles de tus contactos de LinkedIn tienen el marco "Open to Work" o "Hiring" en su foto de perfil. Esta política explica qué datos maneja y cómo.

### Resumen

- **Ningún dato sale de tu navegador.** La extensión no tiene servidor, ni analítica, ni rastreo.
- **No se vende, comparte ni transfiere nada** a nadie.
- **Solo se guarda lo necesario,** y solo en el almacenamiento local de tu navegador.

### Qué datos maneja la extensión

| Dato | Para qué | Dónde se guarda | Por cuánto tiempo |
|---|---|---|---|
| Nombre, titular, link al perfil y URL de la foto de tus **contactos de primer nivel de LinkedIn que tienen el marco Open to Work o Hiring** | Para mostrarte la lista | El almacenamiento local de tu navegador (`storage.local`) | Hasta que el contacto quite el marco, deje de ser tu contacto o desinstales la extensión |
| Tus demás contactos (sin marco) | Se leen en pantalla para ver si tienen marco | **No se guardan** | Se descartan de inmediato |
| La consulta con que tu navegador carga tu lista de contactos, incluido tu **token de sesión de LinkedIn** (token CSRF) | Para leer el resto de tu lista sin dibujarla, tal como lo hace la propia página de LinkedIn | El almacenamiento local de tu navegador, solo mientras corre una actualización | Se borra al terminar la actualización |
| Fecha, duración y avance de la última actualización | Para mostrarlos en el panel y retomar una actualización cortada | El almacenamiento local de tu navegador | Hasta la siguiente actualización o hasta que desinstales la extensión |

La extensión además descarga desde el servidor de imágenes de LinkedIn (`media.licdn.com`) las fotos de perfil de los contactos con marco, para leer el color del marco. Las imágenes se analizan en memoria y no se guardan.

### Qué NO hace la extensión

- No envía ningún dato al desarrollador ni a terceros.
- No lee tus mensajes, tu feed ni ninguna página distinta de tu lista de contactos.
- No envía invitaciones, mensajes ni hace ninguna acción en LinkedIn en tu nombre.
- No usa datos para publicidad, perfilamiento ni evaluación crediticia.

### Cómo borrar los datos

Al desinstalar la extensión se borra todo lo que guardó. Puedes hacerlo desde `chrome://extensions` → #OPENTOHELP → Detalles → "Quitar extensión" en Chrome, o desde `about:addons` → #OPENTOHELP → "Eliminar" en Firefox.

### Cambios a esta política

Si cambia la forma en que la extensión maneja datos, esta política se actualizará antes de publicar el cambio, y la fecha del inicio lo indicará.

### Contacto

Dudas o reclamos: abre un issue en el repositorio del proyecto: https://github.com/swilsont/opentohelp/issues
