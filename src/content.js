// #OPENTOHELP content script.
// Injected on linkedin.com but only acts on the connections page.
// Modes:
//   - scan: the window opened by "Update". The background sets the pace.
//       · "discovering" phase: real scrolling ("step" messages) while the background
//         watches which request LinkedIn uses to fetch each batch.
//       · "learn": one of those requests is replayed and the extension learns to read
//         the response by comparing it with the cards already rendered.
//       · "direct" phase: batches are requested directly ("batches" messages), without rendering anything.
//   - passive: any other tab on the connections page. Reads what the user sees, without automating anything.

const seen = new Set();               // slugs checked on this page
const sent = new Set();               // framed slugs already sent to the background
const removed = new Set();            // slugs that lost their frame, already reported to the background
const pending = new Set();            // slugs whose photo hasn't loaded yet
const savedWithBadge = new Set();     // slugs the extension has stored with a badge
const domTruth = new Map();           // slug → {name, headline, photoUrl}: reference for learning
const MAX_DOM_TRUTH = 300;

// What was detected since the last report to the background
let toSend = [];
let toRemove = [];

let stepNumber = 0;
let lightenedUpTo = 0;       // cards before this position are already hidden without photo
let onConnectionsPage = null;
let scanMode = false;
let paused = false;
let passiveObserver = null;
let passiveDebounce = null;
let watchdog = null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function isConnectionsPage() {
  return location.pathname.startsWith(CONFIG.CONNECTIONS_PATH);
}

async function send(message) {
  try {
    return await api.runtime.sendMessage(message);
  } catch (e) {
    return null;
  }
}

// ---------- Contacts stored with a badge ----------

async function loadSaved() {
  const { contacts = {} } = await api.storage.local.get('contacts');
  savedWithBadge.clear();
  for (const slug of Object.keys(contacts)) savedWithBadge.add(slug);
}

api.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.contacts) return;
  savedWithBadge.clear();
  for (const slug of Object.keys(changes.contacts.newValue || {})) savedWithBadge.add(slug);
});

// Decides what to do with a contact read (from the page or from a direct response)
function registerContact(data) {
  seen.add(data.slug);
  if (data.photoState === PHOTO_STATE.FRAMED && !sent.has(data.slug)) {
    sent.add(data.slug);
    toSend.push({
      slug: data.slug,
      name: data.name,
      headline: data.headline,
      profileUrl: data.profileUrl,
      photoUrl: data.photoUrl
    });
  }
  // Someone is only removed if their photo is clearly WITHOUT a frame.
  // If they have no photo or it didn't load, there's no certainty and they're left as is.
  if (data.photoState === PHOTO_STATE.UNFRAMED && savedWithBadge.has(data.slug) && !removed.has(data.slug)) {
    removed.add(data.slug);
    toRemove.push(data.slug);
  }
}

// Hands over what was collected and empties the accumulators
function takeDetected() {
  const result = { candidates: toSend, unbadged: toRemove };
  toSend = [];
  toRemove = [];
  return result;
}

// ---------- Reading rendered cards ----------

function readCards() {
  const cards = [...getCards()];
  for (const [slug, card] of cards) {
    seen.add(slug);
    if (card.dataset.opentohelpRead) continue;
    const wantsTruth = scanMode && domTruth.size < MAX_DOM_TRUTH;
    const data = cardData(slug, card, wantsTruth);
    if (data.photoState === PHOTO_STATE.PENDING) {
      pending.add(slug);
      continue;
    }
    pending.delete(slug);
    if (wantsTruth && data.name) {
      domTruth.set(slug, { name: data.name, headline: data.headline, photoUrl: data.photoUrl });
    }
    registerContact(data);
    card.dataset.opentohelpRead = '1';
  }
  if (scanMode) lightenCards(cards);
}

// To avoid running out of memory: already read cards lose their photo and get hidden.
// The last ones stay visible, because LinkedIn loads more when the end of the list
// ENTERS the screen; if everything were hidden, the end would always be visible and nothing would load.
// It resumes where it left off and stops at the first card not read yet (photo still loading),
// so cards waiting for their photo are never hidden.
function lightenCards(cards) {
  const limit = cards.length - CONFIG.VISIBLE_CARDS;
  while (lightenedUpTo < limit) {
    const card = cards[lightenedUpTo][1];
    if (!card.dataset.opentohelpRead) break;
    for (const img of card.querySelectorAll('img')) {
      img.removeAttribute('srcset');
      img.removeAttribute('src');
    }
    card.style.display = 'none';
    lightenedUpTo++;
  }
}

// Brings into view the cards whose photo hasn't loaded, so lazy loading fetches it.
async function sweepPending() {
  const cards = getCards();
  for (const slug of [...pending].slice(0, 40)) {
    const card = cards.get(slug);
    if (!card) continue;
    card.scrollIntoView({ block: 'center' });
    await sleep(120);
  }
}

function shouldLog() {
  return stepNumber % CONFIG.LOG_EVERY_STEPS === 1;
}

// Takes the list's scroll container (on LinkedIn, <main>) to the bottom so the next batch loads
function requestMoreCards() {
  const last = [...getCards().values()].pop();
  if (!last) return;
  const container = scrollContainer(last);
  container.scrollTop = container.scrollHeight;
  const button = findLoadMoreButton();
  if (shouldLog()) {
    debugLog('Request more:', {
      last: (last.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
      container: container.tagName,
      button: button ? (button.className || button.textContent.trim()).slice(0, 80) : null
    });
  }
  if (button) button.click();
}

function scrollDiagnostics(moment) {
  const last = [...getCards().values()].pop();
  const container = scrollContainer(last);
  return {
    ['scroll_' + moment]: Math.round(container.scrollTop) + ' / ' + container.scrollHeight,
    container: container.tagName
  };
}

async function waitForNewCards(countBefore) {
  const deadline = Date.now() + CONFIG.LOAD_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await sleep(300);
    readCards();
    if (seen.size > countBefore) {
      await sleep(400); // let the rest of the batch finish rendering
      readCards();
      return true;
    }
  }
  return false;
}

// ---------- Scan: scroll phase ----------

async function runStep(message) {
  if (!isConnectionsPage()) return { outside: true };
  stepNumber++;
  resetWatchdog();
  updateBanner(message.progress);

  const initialCount = seen.size;
  readCards();
  if (pending.size > 0) {
    await sweepPending();
    readCards();
  }

  const countBefore = seen.size;
  const diagnostics = shouldLog() ? scrollDiagnostics('before') : null;
  requestMoreCards();
  await waitForNewCards(countBefore);
  const detected = takeDetected();
  if (diagnostics) {
    debugLog('Step ' + stepNumber + ' on the page:', {
      ...diagnostics,
      ...scrollDiagnostics('after'),
      cardsInDom: getCards().size,
      seen: seen.size,
      pending: pending.size,
      framed: detected.candidates.length,
      noLongerFramed: detected.unbadged.length
    });
  }

  resetWatchdog();
  return {
    ...detected,
    checked: seen.size,
    total: totalConnectionsOnPage(),
    hasNew: seen.size > initialCount,
    hidden: document.hidden
  };
}

// ---------- Scan: learning and direct phase ----------

// Replays the last observed request and learns to read its response using
// the cards the page already rendered as a reference.
async function learn({ recipe }) {
  const response = await fetchBatch(recipe, recipe.lastValue);
  if (!response.ok) return { ok: false, reason: 'HTTP ' + response.status };
  const learned = learnReader(response.text, domTruth);
  debugLog('Learning:', learned.diagnostics);
  if (!learned.reader) return { ok: false, reason: "couldn't learn to read the response", diagnostics: learned.diagnostics };
  for (const contact of learned.contacts) registerContact(contact);
  updateBanner({ phase: PHASE.DIRECT });
  return { ok: true, reader: learned.reader, ...takeDetected() };
}

// Requests a burst of consecutive batches, with short pauses between them (as the page does).
async function fetchBatches({ recipe, reader, index, count, progress }) {
  resetWatchdog();
  updateBanner(progress);
  let batchesRead = 0;
  let end = false;
  let error = null;
  for (let i = 0; i < count; i++) {
    const batchIndex = index + i * recipe.step;
    try {
      const response = await fetchBatch(recipe, batchIndex);
      if (!response.ok) {
        error = 'HTTP ' + response.status;
        break;
      }
      const contacts = readContacts(response.text, reader);
      if (contacts.length === 0) {
        end = true; // empty batch: end of the list (or unreadable response; the background decides)
        break;
      }
      for (const contact of contacts) registerContact(contact);
      batchesRead++;
    } catch (e) {
      error = String(e);
      break;
    }
    if (i < count - 1) await sleep(randomBetween(CONFIG.PAUSE_BETWEEN_BATCHES_MIN_MS, CONFIG.PAUSE_BETWEEN_BATCHES_MAX_MS));
  }
  resetWatchdog();
  return { ...takeDetected(), batchesRead, end, error };
}

function activateScan(scan) {
  if (scanMode) return;
  scanMode = true;
  stopPassive();
  loadSaved();
  paused = scan?.state === SCAN_STATE.PAUSED;
  showBanner();
  updateBanner({ found: scan?.found ?? 0, timer: scan?.timer ?? null, phase: scan?.phase ?? null });
  resetWatchdog();
}

// If the background restarted and stopped sending steps, ask for them again.
function resetWatchdog() {
  clearTimeout(watchdog);
  watchdog = setTimeout(() => {
    if (scanMode && !paused) send({ type: 'requestStep' });
  }, CONFIG.WATCHDOG_MS);
}

// Only resumes if the window is visible and on the connections page
// (if the user navigated elsewhere, resuming would immediately cause another pause).
function tryResume() {
  if (scanMode && paused && !document.hidden && isConnectionsPage()) send({ type: 'resume' });
}

document.addEventListener('visibilitychange', tryResume);

// ---------- Banner ----------

function showBanner() {
  if (document.getElementById('opentohelp-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'opentohelp-banner';
  Object.assign(banner.style, {
    position: 'fixed',
    top: '12px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '2147483647',
    background: '#2f6db0',
    color: '#ffffff',
    font: '14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    padding: '10px 16px',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0,0,0,.3)',
    maxWidth: '90vw',
    textAlign: 'center',
    pointerEvents: 'none'
  });
  document.body.appendChild(banner);
}

const bannerProgress = { found: 0, checked: null, total: null, timer: null, phase: null };
let bannerClock = null;

function elapsedText() {
  return t('elapsedTime', [formatDuration(elapsedTime(bannerProgress.timer), navigator.language)]);
}

// Only updates the time line, once per second (while paused it doesn't advance)
function startBannerClock() {
  if (bannerClock) return;
  bannerClock = setInterval(() => {
    const line = document.getElementById('opentohelp-elapsed');
    if (line) line.textContent = elapsedText();
  }, 1000);
}

function stopBannerClock() {
  clearInterval(bannerClock);
  bannerClock = null;
}

function updateBanner(progress) {
  if (progress) Object.assign(bannerProgress, progress);
  const banner = document.getElementById('opentohelp-banner');
  if (!banner) return;
  const format = new Intl.NumberFormat(navigator.language);
  const checked = Math.max(bannerProgress.checked || 0, seen.size);
  const total = bannerProgress.total || totalConnectionsOnPage();
  const progressText = total
    ? t('bannerProgressWithTotal', [format.format(Math.min(checked, total)), format.format(total), format.format(bannerProgress.found)])
    : t('bannerProgress', [format.format(checked), format.format(bannerProgress.found)]);

  const lines = [];
  lines.push(['strong', '#OPENTOHELP · ' + (paused ? t('bannerPaused') : t('bannerUpdating'))]);
  lines.push(['div', progressText]);
  if (bannerProgress.timer) lines.push(['elapsed', elapsedText()]);
  // A single notice depending on the phase: at the start (learning), direct, or scroll fallback
  if (paused) {
    lines.push(['small', t('bannerNoticePaused')]);
  } else if (bannerProgress.phase === PHASE.DIRECT) {
    lines.push(['small', t('bannerNoticeDirect')]);
  } else if (bannerProgress.phase === PHASE.SCROLL) {
    lines.push(['small', t('bannerNoticeScroll')]);
  } else {
    lines.push(['small', t('bannerNoticeDiscovering')]);
  }
  banner.textContent = '';
  for (const [kind, text] of lines) {
    const element = document.createElement(kind === 'strong' ? 'strong' : 'div');
    element.textContent = text;
    if (kind === 'small') Object.assign(element.style, { opacity: '0.8', fontSize: '12px' });
    if (kind === 'elapsed') element.id = 'opentohelp-elapsed';
    banner.appendChild(element);
  }
  startBannerClock();
}

// ---------- Passive mode ----------

async function sendPassive() {
  readCards();
  const detected = takeDetected();
  if (detected.candidates.length > 0 || detected.unbadged.length > 0) {
    await send({ type: 'passive', ...detected });
  }
}

async function startPassive() {
  if (passiveObserver || scanMode) return;
  await loadSaved();
  sendPassive();
  passiveObserver = new MutationObserver(() => {
    clearTimeout(passiveDebounce);
    passiveDebounce = setTimeout(sendPassive, CONFIG.PASSIVE_DEBOUNCE_MS);
  });
  passiveObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
}

function stopPassive() {
  passiveObserver?.disconnect();
  passiveObserver = null;
  clearTimeout(passiveDebounce);
}

// ---------- Navigation (LinkedIn is a SPA) ----------

async function onEnterConnections() {
  seen.clear();
  pending.clear();
  lightenedUpTo = 0;
  const response = await send({ type: 'connectionsReady', hidden: document.hidden });
  debugLog('Connections page, mode:', response?.mode ?? 'no response', '· cards:', getCards().size);
  if (response?.mode === 'scan') {
    activateScan(response.scan);
  } else {
    startPassive();
  }
}

function checkRoute() {
  const inside = isConnectionsPage();
  const before = onConnectionsPage;
  onConnectionsPage = inside;
  if (inside && before !== true) onEnterConnections();
  if (!inside && before === true) stopPassive();
}

// Runs an async task and ALWAYS responds, even if it fails,
// so the background never waits forever.
function alwaysRespond(task, sendResponse) {
  task.then(sendResponse, (e) => {
    console.error('[OPENTOHELP] Page error:', e);
    sendResponse({ error: String(e?.stack || e) });
  });
  return true;
}

api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case 'step':
      return alwaysRespond(runStep(message), sendResponse);
    case 'learn':
      return alwaysRespond(learn(message), sendResponse);
    case 'batches':
      return alwaysRespond(fetchBatches(message), sendResponse);
    case 'activateScan':
      activateScan(message.scan);
      sendResponse({ ok: true });
      return false;
    case 'paused':
      paused = true;
      updateBanner({ timer: message.timer });
      sendResponse({ ok: true });
      tryResume(); // if the window is already visible, continue right away
      return false;
    case 'finished': {
      scanMode = false;
      paused = false;
      clearTimeout(watchdog);
      stopBannerClock();
      const banner = document.getElementById('opentohelp-banner');
      if (banner) {
        banner.textContent = '#OPENTOHELP · ' + t('bannerFinished');
        setTimeout(() => banner.remove(), 5000);
      }
      sendResponse({ ok: true });
      return false;
    }
    case 'resumed':
      paused = false;
      updateBanner({ timer: message.timer });
      resetWatchdog();
      sendResponse({ ok: true });
      return false;
  }
  return false;
});

checkRoute();
setInterval(checkRoute, CONFIG.URL_CHECK_INTERVAL_MS);
