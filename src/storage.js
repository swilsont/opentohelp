// Reading and writing to storage.local.
//
// Keys:
//   contacts: { [slug]: { slug, name, headline, profileUrl, photoUrl, badge, firstSeen, lastSeen } }
//   meta:     { lastUpdate, previousUpdate, durationMs, incompleteAttempt }
//   scan:     { state, phase, windowId, tabId, startedAt, checked, total, found, recipe, reader, timer, … }
//             (the recipe includes LinkedIn's session token: it's deleted when the update ends)
//   progress: { startedAt, next, date, elapsedMs } to resume an interrupted update
//
// Only contacts WITH a badge are stored. The rest are read on the page and discarded.

// Queue so writes don't overwrite each other (several photos are classified in parallel).
let storageQueue = Promise.resolve();

function enqueue(task) {
  const result = storageQueue.then(task, task);
  storageQueue = result.catch(() => {});
  return result;
}

async function readKey(key, fallback) {
  const data = await api.storage.local.get(key);
  return data[key] ?? fallback;
}

function readContacts() {
  return readKey('contacts', {});
}

function readMeta() {
  return readKey('meta', {});
}

function readScan() {
  return readKey('scan', { state: SCAN_STATE.IDLE });
}

function saveScan(changes) {
  return enqueue(async () => {
    const current = await readScan();
    const updated = { ...current, ...changes };
    await api.storage.local.set({ scan: updated });
    return updated;
  });
}

function resetScan() {
  return enqueue(() => api.storage.local.set({ scan: { state: SCAN_STATE.IDLE } }));
}

// Inserts or updates contacts with a badge. If a contact's badge type changes,
// it's considered "new" for that type (firstSeen is reset).
function saveContacts(list) {
  return enqueue(async () => {
    const contacts = await readContacts();
    const now = Date.now();
    for (const c of list) {
      const previous = contacts[c.slug];
      const sameBadge = previous && previous.badge === c.badge;
      contacts[c.slug] = {
        slug: c.slug,
        name: c.name || previous?.name || c.slug,
        headline: c.headline || previous?.headline || '',
        profileUrl: c.profileUrl,
        photoUrl: c.photoUrl,
        badge: c.badge,
        firstSeen: sameBadge ? previous.firstSeen : now,
        lastSeen: now
      };
    }
    await api.storage.local.set({ contacts });
  });
}

// Removes right away those seen with a photo WITHOUT a frame.
function removeContacts(slugs) {
  if (!slugs || slugs.length === 0) return Promise.resolve();
  return enqueue(async () => {
    const contacts = await readContacts();
    for (const slug of slugs) delete contacts[slug];
    await api.storage.local.set({ contacts });
  });
}

// Direct-phase progress, to resume an interrupted update
function readProgress() {
  return readKey('progress', null);
}

function saveProgress(progress) {
  return enqueue(() => api.storage.local.set({ progress }));
}

function clearProgress() {
  return enqueue(() => api.storage.local.remove('progress'));
}

function recordIncompleteAttempt(checked, total) {
  return enqueue(async () => {
    const meta = await readMeta();
    meta.incompleteAttempt = { checked, total, date: Date.now() };
    await api.storage.local.set({ meta });
  });
}

// Called ONLY when an update finished completely:
// removes those who no longer appeared with a badge and records the date.
function finishUpdate(startedAt, durationMs) {
  return enqueue(async () => {
    const contacts = await readContacts();
    const meta = await readMeta();
    for (const slug of Object.keys(contacts)) {
      if (contacts[slug].lastSeen < startedAt) delete contacts[slug];
    }
    const newMeta = {
      previousUpdate: meta.lastUpdate ?? null,
      lastUpdate: Date.now(),
      durationMs: durationMs ?? null
    };
    await api.storage.local.set({ contacts, meta: newMeta });
  });
}
