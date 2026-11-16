// #OPENTOHELP popup: update status and list of contacts with a badge.

const locale = api.i18n.getUILanguage();
const numberFormat = new Intl.NumberFormat(locale);
const nameCollator = new Intl.Collator(locale, { sensitivity: 'base' });

let activeBadge = BADGE.OPEN_TO_WORK;
let data = { contacts: {}, meta: {}, scan: { state: SCAN_STATE.IDLE } };

const $ = (id) => document.getElementById(id);

// ---------- Utilities ----------

function timeAgo(timestamp) {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const seconds = Math.round((timestamp - Date.now()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
  return rtf.format(days, 'day');
}

// Lowercase and without accents, so "jose" finds "José"
function normalize(text) {
  return (text || '').toLocaleLowerCase(locale).normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function initials(name) {
  return (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

function isNew(contact) {
  const previous = data.meta.previousUpdate;
  return Boolean(previous) && contact.firstSeen > previous;
}

// ---------- Rendering ----------

function renderStatus() {
  const { scan, meta } = data;
  const running = scan.state !== SCAN_STATE.IDLE;
  const status = $('status');
  status.classList.remove('stale');
  const lastWasIncomplete = Boolean(meta.incompleteAttempt && meta.incompleteAttempt.date > (meta.lastUpdate || 0));

  if (scan.state === SCAN_STATE.RUNNING) {
    status.textContent = scan.total
      ? t('statusUpdatingWithTotal', [numberFormat.format(Math.min(scan.checked || 0, scan.total)), numberFormat.format(scan.total)])
      : t('statusUpdating', [numberFormat.format(scan.checked || 0)]);
    if (scan.lastError) status.textContent += ' · ' + t('statusError');
  } else if (scan.state === SCAN_STATE.PAUSED) {
    status.textContent = t('statusPaused');
  } else if (lastWasIncomplete) {
    const { checked, total } = meta.incompleteAttempt;
    status.textContent = total
      ? t('statusIncomplete', [numberFormat.format(checked), numberFormat.format(total)])
      : t('statusIncompleteNoTotal', [numberFormat.format(checked)]);
    status.classList.add('stale');
  } else if (meta.lastUpdate) {
    status.textContent = t('statusLastUpdate', [timeAgo(meta.lastUpdate)]);
    const days = (Date.now() - meta.lastUpdate) / 86400000;
    if (days >= 2) status.classList.add('stale');
  } else {
    status.textContent = t('statusNeverUpdated');
  }

  // Second line: elapsed time while running (stopped while paused);
  // otherwise, how long the last complete update took
  const detail = $('detail');
  if (running && scan.timer) {
    detail.textContent = t('elapsedTime', [formatDuration(elapsedTime(scan.timer), locale)]);
    detail.hidden = false;
  } else if (!running && !lastWasIncomplete && meta.lastUpdate && meta.durationMs != null) {
    detail.textContent = t('durationDetail', [formatDuration(meta.durationMs, locale)]);
    detail.hidden = false;
  } else {
    detail.hidden = true;
  }

  $('btn-update').hidden = running;
  $('btn-show-window').hidden = !running;
  $('btn-stop').hidden = !running;
}

function renderList() {
  const all = Object.values(data.contacts);
  const byBadge = { [BADGE.OPEN_TO_WORK]: [], [BADGE.HIRING]: [], [BADGE.UNKNOWN]: [] };
  for (const c of all) byBadge[c.badge]?.push(c);

  for (const badge of Object.keys(byBadge)) {
    $('count-' + badge).textContent = numberFormat.format(byBadge[badge].length);
  }
  const unknownTab = document.querySelector('.tab[data-badge="unknown"]');
  unknownTab.hidden = byBadge[BADGE.UNKNOWN].length === 0;
  if (unknownTab.hidden && activeBadge === BADGE.UNKNOWN) activeBadge = BADGE.OPEN_TO_WORK;
  for (const tab of document.querySelectorAll('.tab')) {
    tab.classList.toggle('active', tab.dataset.badge === activeBadge);
  }

  const filter = normalize($('filter').value.trim());
  const visible = byBadge[activeBadge]
    .filter((c) => !filter || normalize(c.name + ' ' + c.headline).includes(filter))
    .sort((a, b) => nameCollator.compare(a.name, b.name));

  const list = $('list');
  const template = $('contact-template');
  const fragment = document.createDocumentFragment();
  for (const c of visible) {
    const item = template.content.cloneNode(true);
    item.querySelector('.link').href = c.profileUrl;
    item.querySelector('.name').textContent = c.name;
    item.querySelector('.headline').textContent = c.headline;
    const photo = item.querySelector('.photo');
    const initialsEl = item.querySelector('.initials');
    initialsEl.textContent = initials(c.name);
    photo.addEventListener('error', () => {
      photo.hidden = true;
      initialsEl.hidden = false;
    });
    photo.src = c.photoUrl || '';
    if (!c.photoUrl) {
      photo.hidden = true;
      initialsEl.hidden = false;
    }
    const label = item.querySelector('.new-label');
    label.textContent = t('newLabel');
    label.hidden = !isNew(c);
    fragment.appendChild(item);
  }
  list.replaceChildren(fragment);

  const empty = $('empty');
  if (visible.length > 0) {
    empty.hidden = true;
  } else {
    empty.hidden = false;
    if (all.length === 0 && !data.meta.lastUpdate) empty.textContent = t('emptyNoData');
    else if (filter) empty.textContent = t('emptyNoResults');
    else empty.textContent = t('emptyNoConnections');
  }
}

async function load() {
  const stored = await api.storage.local.get(['contacts', 'meta', 'scan']);
  data = {
    contacts: stored.contacts || {},
    meta: stored.meta || {},
    scan: stored.scan || { state: SCAN_STATE.IDLE }
  };
  renderStatus();
  renderList();
}

// ---------- Events ----------

$('btn-update').addEventListener('click', () => api.runtime.sendMessage({ type: 'update' }));
$('btn-show-window').addEventListener('click', () => api.runtime.sendMessage({ type: 'focusWindow' }));
$('btn-stop').addEventListener('click', () => api.runtime.sendMessage({ type: 'stop' }));
$('filter').addEventListener('input', renderList);

for (const tab of document.querySelectorAll('.tab')) {
  tab.addEventListener('click', () => {
    activeBadge = tab.dataset.badge;
    renderList();
  });
}

// Refreshes by itself while the update progresses
api.storage.onChanged.addListener((_changes, area) => {
  if (area === 'local') load();
});

applyTranslations(document);
load();

// The elapsed time and the "X minutes ago" keep advancing even without stored changes
setInterval(renderStatus, 1000);
