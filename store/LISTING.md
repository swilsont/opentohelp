# Publicación en las tiendas

Textos listos para copiar en el panel de desarrollador de la Chrome Web Store (<https://chrome.google.com/webstore/devconsole>, secciones 1 a 4) y de Firefox Add-ons (<https://addons.mozilla.org/developers/>, sección 5).
Antes de copiar, reemplaza `<REPO_URL>` por la URL del repositorio en GitHub.

---

## 1. Pestaña "Ficha de la tienda" (Store listing)

**Nombre y resumen:** se toman del `manifest.json` y de `_locales/*/messages.json` (`extensionDescription`), así que no se escriben aquí.

**Categoría sugerida:** la más cercana a "Social" / "Redes sociales". Si no existe con ese nombre, "Productividad".

**Idioma predeterminado:** inglés (el `default_locale` del manifest). Para cada idioma (en, es, pt_BR, pt_PT, fr) el panel pide su propia descripción detallada: usa los textos de abajo.

### Descripción detallada — English (en)

```
#OPENTOHELP shows you which of your LinkedIn connections have the "Open to Work" frame (they're looking for a job) or the "Hiring" frame (they're hiring), all in one list.

With hundreds or thousands of connections, checking every profile photo by hand is impossible. But you know these people: their skills and their integrity. Seeing who's looking for work lets you offer them something, recommend them, or introduce them to someone who's hiring. And if you're the one looking for work, the "Hiring" tab shows which of your connections are hiring right now.

HOW IT WORKS
• Click "Update list". A window opens with your LinkedIn connections page and the extension reads your list at a calm pace.
• It detects the frame by the color of the profile photo, so it works with LinkedIn in any language.
• Your list is shown in alphabetical order, with a "New" label for people who turned on their frame since your last update, and a filter by name or job title.
• If an update is interrupted, it resumes where it left off.

PRIVACY
• Nothing leaves your browser: no servers, no analytics, no tracking.
• Only connections with a frame are stored, locally in your browser.
• It doesn't send messages or invitations or take any action on your behalf.
• The source code is public: <REPO_URL>

ABOUT LINKEDIN
#OPENTOHELP is not affiliated with LinkedIn. LinkedIn doesn't allow extensions that automate browsing or copy data from its site, so although this extension only reads your own connections list, at a slow pace and without sending anything outside your browser, LinkedIn could temporarily restrict your account. If you'd rather not take that risk, use it in passive mode: open your connections page and scroll through it yourself; the extension will take note of what you see.
```

### Descripción detallada — Español (es)

```
#OPENTOHELP te muestra cuáles de tus contactos de LinkedIn tienen activo el marco "Open to Work" (buscan trabajo) o el marco "Hiring" (están contratando), todo en una sola lista.

Con cientos o miles de contactos, revisar la foto de cada uno a mano es imposible. Pero tú conoces a esas personas: sus capacidades y su integridad. Saber quién está buscando trabajo te permite ofrecerle algo, recomendarlo o presentarle a alguien que está contratando. Y si eres tú quien busca trabajo, la pestaña "Hiring" te muestra cuáles de tus contactos están contratando ahora.

CÓMO FUNCIONA
• Presiona "Actualizar lista". Se abre una ventana con tu página de conexiones de LinkedIn y la extensión lee tu lista a un ritmo pausado.
• Detecta el marco por el color de la foto de perfil, así que funciona con LinkedIn en cualquier idioma.
• Tu lista aparece en orden alfabético, con la etiqueta "Nuevo" para quienes activaron el marco desde tu última actualización, y un filtro por nombre o cargo.
• Si una actualización se corta, sigue desde donde quedó.

PRIVACIDAD
• Nada sale de tu navegador: sin servidores, sin analítica, sin rastreo.
• Solo se guardan los contactos con marco, en el almacenamiento local de tu navegador.
• No envía mensajes ni invitaciones, ni hace ninguna acción en tu nombre.
• El código es público: <REPO_URL>

SOBRE LINKEDIN
#OPENTOHELP no está afiliada a LinkedIn. LinkedIn no permite extensiones que automaticen la navegación o copien datos de su sitio, así que, aunque esta extensión solo lee tu propia lista de contactos, a un ritmo pausado y sin enviar nada fuera de tu navegador, existe la posibilidad de que LinkedIn restrinja temporalmente tu cuenta. Si prefieres no correr ese riesgo, puedes usarla solo en modo pasivo: abre tu página de conexiones y recórrela tú; la extensión irá anotando lo que veas.
```

### Descripción detallada — Português (pt_BR)

```
#OPENTOHELP mostra quais das suas conexões do LinkedIn têm a moldura "Open to Work" (estão procurando emprego) ou a moldura "Hiring" (estão contratando), tudo em uma única lista.

Com centenas ou milhares de conexões, verificar a foto de cada uma manualmente é impossível. Mas você conhece essas pessoas: suas habilidades e sua integridade. Saber quem está procurando emprego permite oferecer algo, recomendá-las ou apresentá-las a alguém que está contratando. E se for você quem está procurando emprego, a aba "Hiring" mostra quais das suas conexões estão contratando agora.

COMO FUNCIONA
• Clique em "Atualizar lista". Uma janela se abre com a sua página de conexões do LinkedIn e a extensão lê a sua lista em um ritmo tranquilo.
• Ela detecta a moldura pela cor da foto de perfil, então funciona com o LinkedIn em qualquer idioma.
• A sua lista aparece em ordem alfabética, com a etiqueta "Novo" para quem ativou a moldura desde a sua última atualização, e um filtro por nome ou cargo.
• Se uma atualização for interrompida, ela continua de onde parou.

PRIVACIDADE
• Nada sai do seu navegador: sem servidores, sem análises, sem rastreamento.
• Somente as conexões com moldura são salvas, localmente no seu navegador.
• Não envia mensagens nem convites, nem realiza nenhuma ação em seu nome.
• O código-fonte é público: <REPO_URL>

SOBRE O LINKEDIN
#OPENTOHELP não é afiliada ao LinkedIn. O LinkedIn não permite extensões que automatizem a navegação ou copiem dados do seu site; por isso, embora esta extensão apenas leia a sua própria lista de conexões, em um ritmo lento e sem enviar nada para fora do seu navegador, existe a possibilidade de o LinkedIn restringir temporariamente a sua conta. Se preferir não correr esse risco, use-a apenas no modo passivo: abra a sua página de conexões e percorra-a você mesmo; a extensão vai anotando o que você vê.
```

### Descripción detallada — Português de Portugal (pt_PT)

```
#OPENTOHELP mostra quais das suas conexões do LinkedIn têm a moldura "Open to Work" (estão à procura de emprego) ou a moldura "Hiring" (estão a recrutar), tudo numa única lista.

Com centenas ou milhares de conexões, verificar a fotografia de cada uma manualmente é impossível. Mas conhece estas pessoas: as suas competências e a sua integridade. Saber quem está à procura de emprego permite-lhe oferecer-lhes algo, recomendá-las ou apresentá-las a alguém que está a recrutar. E, se for o próprio a procurar emprego, o separador "Hiring" mostra quais das suas conexões estão a recrutar neste momento.

COMO FUNCIONA
• Clique em "Atualizar lista". Abre-se uma janela com a sua página de conexões do LinkedIn e a extensão lê a sua lista a um ritmo tranquilo.
• Deteta a moldura pela cor da fotografia de perfil, por isso funciona com o LinkedIn em qualquer idioma.
• A sua lista aparece por ordem alfabética, com a etiqueta "Novo" para quem ativou a moldura desde a última atualização, e um filtro por nome ou cargo.
• Se uma atualização for interrompida, continua a partir de onde parou.

PRIVACIDADE
• Nada sai do seu navegador: sem servidores, sem análises, sem rastreio.
• Só são guardadas as conexões com moldura, localmente no seu navegador.
• Não envia mensagens nem convites, nem realiza qualquer ação em seu nome.
• O código-fonte é público: <REPO_URL>

SOBRE O LINKEDIN
O #OPENTOHELP não está afiliado ao LinkedIn. O LinkedIn não permite extensões que automatizem a navegação ou copiem dados do seu site; por isso, embora esta extensão se limite a ler a sua própria lista de conexões, a um ritmo lento e sem enviar nada para fora do seu navegador, existe a possibilidade de o LinkedIn restringir temporariamente a sua conta. Se preferir não correr esse risco, utilize-a apenas no modo passivo: abra a sua página de conexões e percorra-a manualmente; a extensão vai registando o que vê.
```

### Descripción detallada — Français (fr)

```
#OPENTOHELP vous montre lesquelles de vos relations LinkedIn affichent le cadre « Open to Work » (elles cherchent un emploi) ou le cadre « Hiring » (elles recrutent), le tout dans une seule liste.

Avec des centaines ou des milliers de relations, vérifier chaque photo à la main est impossible. Pourtant, vous connaissez ces personnes : leurs compétences et leur intégrité. Savoir qui cherche un emploi vous permet de leur proposer quelque chose, de les recommander ou de les présenter à quelqu'un qui recrute. Et si c'est vous qui cherchez un emploi, l'onglet « Hiring » vous montre lesquelles de vos relations recrutent en ce moment.

COMMENT ÇA MARCHE
• Cliquez sur « Mettre à jour la liste ». Une fenêtre s'ouvre avec votre page de relations LinkedIn et l'extension lit votre liste à un rythme tranquille.
• Elle détecte le cadre grâce à la couleur de la photo de profil : elle fonctionne donc avec LinkedIn dans n'importe quelle langue.
• Votre liste s'affiche par ordre alphabétique, avec une étiquette « Nouveau » pour les personnes qui ont activé leur cadre depuis votre dernière mise à jour, et un filtre par nom ou par poste.
• Si une mise à jour est interrompue, elle reprend là où elle s'était arrêtée.

CONFIDENTIALITÉ
• Rien ne quitte votre navigateur : aucun serveur, aucune analyse, aucun suivi.
• Seules les relations avec un cadre sont enregistrées, localement dans votre navigateur.
• Elle n'envoie ni messages ni invitations et n'effectue aucune action en votre nom.
• Le code source est public : <REPO_URL>

À PROPOS DE LINKEDIN
#OPENTOHELP n'est pas affiliée à LinkedIn. LinkedIn n'autorise pas les extensions qui automatisent la navigation ou copient des données de son site. Même si cette extension se contente de lire votre propre liste de relations, à un rythme lent et sans rien envoyer en dehors de votre navigateur, LinkedIn pourrait donc restreindre temporairement votre compte. Si vous préférez ne pas courir ce risque, utilisez-la uniquement en mode passif : ouvrez votre page de relations et faites-la défiler vous-même ; l'extension prendra note de ce que vous voyez.
```

### Imágenes

| Campo | Archivo | Tamaño |
|---|---|---|
| Ícono de la tienda | `icons/icon-128.png` | 128×128 |
| Captura de pantalla (obligatoria, hasta 5) | `store/screenshot-1-en.png` (inglés, la predeterminada) y `store/screenshot-1-es.png` (para la ficha en español) | 1280×800 |
| Imagen promocional pequeña | `store/promo-small.png` | 440×280 |

La captura usa contactos de ejemplo ficticios y avatares con iniciales, para no publicar nombres ni fotos de personas reales.

---

## 2. Pestaña "Prácticas de privacidad" (Privacy practices)

Estos campos los lee el equipo de revisión de Google: van en inglés.

### Single purpose description

```
Show the user which of their own 1st-degree LinkedIn connections currently display the "Open to Work" or "Hiring" frame on their profile photo, in a single list inside the extension popup, so the user can help them (offer them a job, recommend them or introduce them).
```

### Permission justification

**storage**
```
Stores, only on the user's device, the list of the user's LinkedIn connections that have an "Open to Work" or "Hiring" frame (name, headline, profile link and photo URL), the date and duration of the last update, and the progress of an update in progress so it can be resumed if it's interrupted. Nothing is sent outside the browser.
```

**webRequest**
```
Used only while an update is running, and only for the extension's own update window. It observes (read-only: no blocking, no modification) the request that LinkedIn's connections page makes to load the next batch of connections, so the extension can repeat that same request to read the rest of the user's own connections list without rendering thousands of cards, which otherwise makes the tab run out of memory. No other tabs or requests are observed, and nothing is sent outside the browser.
```

**Host permission: https://www.linkedin.com/***
```
The content script reads the user's own connections list on the LinkedIn connections page (/mynetwork/invite-connect/connections/) and shows a progress banner there; on any other LinkedIn page it does nothing. The host permission is also required to observe the connections pagination request with webRequest and to repeat it from that page.
```

**Host permission: https://media.licdn.com/***
```
Downloads the profile photos of connections that have a frame, from LinkedIn's image server, to read the color of the frame's corner (green = Open to Work, purple = Hiring). The images are analyzed in memory and are not stored or sent anywhere.
```

### Remote code

`No, I am not using remote code.` (Todo el código está en el paquete; no se carga ni ejecuta nada externo.)

### Data usage

Ningún dato sale del navegador. Aun así, como la extensión **maneja** datos de personas, recomiendo declarar con criterio conservador: es preferible declarar de más que de menos, porque una declaración que no calza con lo que hace la extensión es motivo de rechazo.

Marcar:
- ☑ **Personally identifiable information** — nombres y perfiles de los contactos con marco.
- ☑ **Authentication information** — el token de sesión de LinkedIn, usado temporalmente para repetir la consulta de la lista de contactos (se borra al terminar).
- ☑ **Website content** — la extensión lee el contenido de la página de conexiones de LinkedIn.

Dejar sin marcar: Health, Financial and payment, Personal communications, Location, Web history, User activity.

Certificaciones (marcar las tres):
- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases.
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes.

### Privacy policy URL

```
<REPO_URL>/blob/main/PRIVACY.md
```

---

## 3. Pestaña "Distribución"

- **Visibilidad:** *Pública* para que cualquiera la encuentre, o *No listada* si prefieres partir compartiendo el enlace solo con tus cercanos y pasarla a pública después.
- **Regiones:** todas.

---

## 4. Pasos, en orden

1. Crear el repositorio público en GitHub y subir el código (sin la carpeta `store/` si prefieres no publicarla; no es necesaria para la extensión).
2. Reemplazar `<REPO_URL>` en `PRIVACY.md` y en este archivo, y volver a subir `PRIVACY.md`.
3. Registrarse como desarrollador en <https://chrome.google.com/webstore/devconsole> (pago único de US$5).
4. "Nuevo elemento" → subir `opentohelp-1.0.0-chrome.zip`.
5. Completar la ficha (sección 1) para cada idioma, subir las imágenes, completar la pestaña de privacidad (sección 2) y la de distribución (sección 3).
6. Enviar a revisión. Con el permiso `webRequest` y acceso a LinkedIn, es probable que la revisión tome más que el mínimo.

---

## 5. Firefox Add-ons (AMO)

El mismo código sirve para Firefox: el `manifest.json` ya trae `browser_specific_settings` con el ID `opentohelp@swilsont.github.io`, la versión mínima 142.0 y `data_collection_permissions: none`. Publicar en AMO no tiene costo.

### Datos que recopila

En el manifest se declaró `"none"`: según Mozilla, recopilar significa que los datos salen del complemento, y aquí nada sale del navegador. Firefox lo muestra así en la pantalla de instalación.

### Formulario de envío

- **Distribución:** *En este sitio* (On this site), para que aparezca en addons.mozilla.org.
- **Archivo:** `opentohelp-1.0.0-firefox.zip` (mismo contenido que el de Chrome).
- **Código fuente:** cuando pregunte si usas herramientas que transforman el código (minificadores, empaquetadores, etc.), responder **No**: el paquete es el código fuente tal cual.
- **Nombre y resumen:** se toman del manifest y de `_locales`.
- **Descripción:** usar las mismas de la sección 1 (AMO permite una por idioma).
- **Categoría:** *Social & Communication*.
- **Licencia:** MIT.
- **Política de privacidad:** pegar el contenido de `PRIVACY.md`, o el enlace `<REPO_URL>/blob/main/PRIVACY.md`.
- **Sitio web / soporte:** `<REPO_URL>` y `<REPO_URL>/issues`.
- **Capturas:** las mismas de la sección 1.

### Notes to reviewer (en inglés)

```
#OPENTOHELP lists which of the user's own 1st-degree LinkedIn connections display the "Open to Work" or "Hiring" frame on their profile photo. All data stays in storage.local; nothing is sent to any server (data_collection_permissions: none).

How to test: you need a LinkedIn account with some connections. Click the toolbar button → "Update list". A window opens on https://www.linkedin.com/mynetwork/invite-connect/connections/ and the extension reads the list. When it finishes, the popup shows the connections with a frame.

Permissions:
- webRequest: read-only, only for the extension's own update window, to observe the request LinkedIn's page uses to load the next batch of connections, so the extension can repeat it instead of rendering thousands of cards.
- www.linkedin.com: content script on the connections page and repeating that request.
- media.licdn.com: downloading framed profile photos to read the frame color in memory (OffscreenCanvas); images are not stored.

No remote code, no minification, no build step. Source: <REPO_URL>
```

### Pasos

1. Crear una cuenta en <https://addons.mozilla.org/developers/> (con cuenta de Mozilla).
2. *Submit a New Add-on* → *On this site* → subir `opentohelp-1.0.0-firefox.zip`.
3. Responder **No** a la pregunta del código fuente, completar la ficha y las notas para el revisor.
4. Enviar a revisión. Antes de publicar, probarla en tu Firefox (ver "Instalar en modo desarrollador" en el README).
