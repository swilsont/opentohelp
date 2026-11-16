// #OPENTOHELP background.
// In Chrome it runs as a service worker (loads its dependencies with importScripts).
// In Firefox it runs as a background page: the manifest loads the dependencies first in "scripts".
if (typeof importScripts === 'function' && typeof document === 'undefined') {
  importScripts('compat.js', 'config.js', 'color.js', 'storage.js', 'recipe.js');
}

let stepTimer = null;
let stepInProgress = false;

// ---------- Utilities ----------

// Sends a message to the tab and never waits forever:
// if there's no response within RESPONSE_TIMEOUT_MS, it returns null.
async function sendToTab(tabId, message) {
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => {
      debugLog('No response from the tab to', message.type);
      resolve(null);
    }, CONFIG.RESPONSE_TIMEOUT_MS);
  });
  try {
    return await Promise.race([api.tabs.sendMessage(tabId, message), timeout]);
  } catch (e) {
    debugLog('Could not send', message.type, String(e));
    return null; // the tab is loading or no longer exists
  } finally {
    clearTimeout(timer);
  }
}

async function updateIcon() {
  const scan = await readScan();
  let text = '';
  if (scan.state === SCAN_STATE.RUNNING) text = '…';
  if (scan.state === SCAN_STATE.PAUSED) text = 'II';
  await api.action.setBadgeText({ text });
  await api.action.setBadgeBackgroundColor({ color: '#2F6DB0' });
}

function progressFor(scan) {
  return {
    found: scan.found,
    checked: scan.checked,
    total: scan.total ?? null,
    timer: scan.timer,
    phase: scan.phase
  };
}

// ---------- Capturing the page's requests (discovery phase only) ----------

const captures = [];                   // [{ url, method, body, headers }]
const pendingCaptures = new Map();     // requestId → capture still without headers
let capturedTabId = null;

function startCapture(tabId) {
  captures.length = 0;
  pendingCaptures.clear();
  capturedTabId = tabId;
}

function stopCapture() {
  capturedTabId = null;
  pendingCaptures.clear();
}

const captureFilter = { urls: ['https://www.linkedin.com/*'], types: ['xmlhttprequest'] };

api.webRequest.onBeforeRequest.addListener((details) => {
  if (details.tabId !== capturedTabId || details.method !== 'POST') return;
  const bytes = details.requestBody?.raw?.[0]?.bytes;
  if (!bytes) return;
  pendingCaptures.set(details.requestId, {
    url: details.url,
    method: details.method,
    body: new TextDecoder().decode(bytes)
  });
}, captureFilter, ['requestBody']);

api.webRequest.onBeforeSendHeaders.addListener((details) => {
  const capture = pendingCaptures.get(details.requestId);
  if (!capture) return;
  pendingCaptures.delete(details.requestId);
  capture.headers = cleanHeaders(details.requestHeaders);
  captures.push(capture);
  if (captures.length > 60) captures.shift();
}, captureFilter, ['requestHeaders']);

// ---------- Start ----------

async function startUpdate() {
  const scan = await readScan();
  if (scan.state !== SCAN_STATE.IDLE) {
    await focusWindow();
    return;
  }

  // Was an update interrupted recently? It resumes where it left off.
  const progress = await readProgress();
  const resumable = progress && Date.now() - progress.date < CONFIG.RESUME_WINDOW_HOURS * 3600000;
  if (progress && !resumable) await clearProgress();

  const window = await api.windows.create({
    url: CONFIG.CONNECTIONS_URL,
    type: 'normal',
    width: CONFIG.WINDOW_WIDTH,
    height: CONFIG.WINDOW_HEIGHT,
    focused: true
  });
  const tabId = window.tabs[0].id;
  startCapture(tabId);
  await saveScan({
    state: SCAN_STATE.RUNNING,
    phase: PHASE.DISCOVERING,
    windowId: window.id,
    tabId,
    startedAt: resumable ? progress.startedAt : Date.now(),
    resumeFrom: resumable ? progress.next : 0,
    checked: resumable ? progress.next : 0,
    found: 0,
    stepsWithoutChanges: 0,
    discoverySteps: 0,
    relearns: 0,
    // When resuming, the time of the previous part is added to the total duration
    timer: { accumulatedMs: resumable ? progress.elapsedMs || 0 : 0, activeSince: Date.now() }
  });
  debugLog(resumable ? 'Resuming from connection ' + progress.next : 'New update');
  await updateIcon();
}

function scheduleStep() {
  clearTimeout(stepTimer);
  stepTimer = setTimeout(runStep, randomBetween(CONFIG.WAIT_MIN_MS, CONFIG.WAIT_MAX_MS));
}

async function runStep() {
  if (stepInProgress) return;
  stepInProgress = true;
  try {
    const scan = await readScan();
    if (scan.state !== SCAN_STATE.RUNNING) return;
    if (scan.phase === PHASE.DIRECT) {
      await directStep(scan);
    } else {
      await scrollStep(scan);
    }
  } catch (e) {
    // An unexpected error here must not break the chain of steps
    console.error('[OPENTOHELP] Background error:', e);
    scheduleStep();
  } finally {
    stepInProgress = false;
  }
}

// The page didn't respond: it may be loading or have crashed (out of memory, closed…)
async function recordPageFailure(scan) {
  const consecutiveFailures = (scan.consecutiveFailures || 0) + 1;
  await saveScan({ consecutiveFailures });
  if (consecutiveFailures >= CONFIG.FAILURES_TO_GIVE_UP) {
    await finishIncomplete(scan.checked, scan.total);
  } else {
    scheduleStep();
  }
}

// ---------- Scroll phases (discovery and fallback) ----------

async function scrollStep(scan) {
  // If the service worker restarted, start listening to the tab again
  if (scan.phase === PHASE.DISCOVERING && capturedTabId !== scan.tabId) startCapture(scan.tabId);

  const response = await sendToTab(scan.tabId, { type: 'step', progress: progressFor(scan) });
  if (!response) return recordPageFailure(scan);
  if (response.error) {
    console.error('[OPENTOHELP] Page error:', response.error);
    await saveScan({ lastError: response.error });
    scheduleStep();
    return;
  }
  if (response.outside) {
    await saveScan({ consecutiveFailures: 0 });
    await pause(); // the user navigated away from the connections page
    return;
  }
  debugLog('Step (' + scan.phase + '):', {
    checked: response.checked,
    total: response.total,
    framed: response.candidates.length,
    noLongerFramed: response.unbadged.length,
    hasNew: response.hasNew,
    captures: captures.length
  });

  const saved = await processCandidates(response.candidates);
  await removeContacts(response.unbadged);
  const stepsWithoutChanges = response.hasNew ? 0 : scan.stepsWithoutChanges + 1;
  const discoverySteps = (scan.discoverySteps || 0) + (scan.phase === PHASE.DISCOVERING ? 1 : 0);
  const current = await saveScan({
    checked: Math.max(response.checked, scan.checked || 0),
    total: response.total ?? scan.total ?? null,
    found: scan.found + saved,
    stepsWithoutChanges,
    discoverySteps,
    consecutiveFailures: 0,
    lastError: null
  });

  // Short list: it ended before the recipe was needed
  if (stepsWithoutChanges >= CONFIG.STEPS_WITHOUT_CHANGES_TO_FINISH) {
    if (response.hidden) {
      await pause(); // it may not have loaded because the window was hidden
    } else if (response.total && response.checked < response.total * CONFIG.MIN_COMPLETE_RATIO) {
      await finishIncomplete(response.checked, response.total);
    } else {
      await finish();
    }
    return;
  }

  if (scan.phase === PHASE.DISCOVERING) {
    const lastAttempt = discoverySteps >= CONFIG.MAX_DISCOVERY_STEPS;
    const recipe = detectRecipe(captures, lastAttempt ? 1 : CONFIG.MIN_RECIPE_PAIRS);
    if (recipe) {
      const learned = await learn(current, recipe);
      if (learned) return;
    }
    if (lastAttempt) {
      console.warn("[OPENTOHELP] Couldn't learn LinkedIn's request; continuing with scroll.");
      stopCapture();
      await saveScan({ phase: PHASE.SCROLL });
    }
  }
  scheduleStep();
}

// Replays the observed request and learns to read its response. Returns true if it moved to the direct phase.
async function learn(scan, recipe) {
  debugLog('Recipe detected:', { url: recipe.url.split('?')[0], step: recipe.step, lastValue: recipe.lastValue });
  const result = await sendToTab(scan.tabId, { type: 'learn', recipe });
  if (!result?.ok) {
    debugLog("Couldn't learn:", result?.reason, result?.diagnostics);
    return false; // keep discovering with more scrolling
  }
  stopCapture();
  const saved = await processCandidates(result.candidates);
  await removeContacts(result.unbadged);
  const next = Math.max(recipe.lastValue + recipe.step, scan.resumeFrom || 0);
  await saveScan({
    phase: PHASE.DIRECT,
    recipe,
    reader: result.reader,
    next,
    checked: Math.max(scan.checked || 0, next),
    found: scan.found + saved
  });
  debugLog('Direct phase from connection', next);
  scheduleStep();
  return true;
}

// ---------- Direct phase ----------

async function directStep(scan) {
  const response = await sendToTab(scan.tabId, {
    type: 'batches',
    recipe: scan.recipe,
    reader: scan.reader,
    index: scan.next,
    count: CONFIG.BATCHES_PER_BURST,
    progress: progressFor(scan)
  });
  if (!response) return recordPageFailure(scan);

  const saved = await processCandidates(response.candidates);
  await removeContacts(response.unbadged);
  const next = scan.next + response.batchesRead * scan.recipe.step;
  await saveScan({
    next,
    checked: Math.max(scan.checked || 0, next),
    found: scan.found + saved,
    consecutiveFailures: 0
  });
  await saveProgress({ startedAt: scan.startedAt, next, date: Date.now(), elapsedMs: elapsedTime(scan.timer) });
  debugLog('Burst:', { from: scan.next, to: next, framed: response.candidates.length, end: response.end, error: response.error });

  const total = scan.total;
  const reachedTotal = total && next >= total * CONFIG.MIN_COMPLETE_RATIO;
  if (response.error || (response.end && total && !reachedTotal)) {
    // The request stopped working (or returned something unreadable) before the end
    return relearnOrFallBackToScroll(scan, response.error || 'empty batch before the end');
  }
  if (response.end || (total && next >= total)) {
    await finish();
    return;
  }
  scheduleStep();
}

// If the recipe stops working, it's discovered again once; if that fails too, scroll.
async function relearnOrFallBackToScroll(scan, reason) {
  console.warn('[OPENTOHELP] Direct request failed:', reason);
  if ((scan.relearns || 0) < CONFIG.MAX_RELEARNS) {
    startCapture(scan.tabId);
    await saveScan({
      phase: PHASE.DISCOVERING,
      relearns: (scan.relearns || 0) + 1,
      discoverySteps: 0,
      stepsWithoutChanges: 0,
      resumeFrom: scan.next,
      recipe: null,
      reader: null
    });
  } else {
    await saveScan({ phase: PHASE.SCROLL, recipe: null, reader: null, stepsWithoutChanges: 0 });
  }
  scheduleStep();
}

// ---------- Classification and states ----------

// Classifies framed photos by color and stores the contacts. Returns how many were stored.
async function processCandidates(candidates) {
  if (!candidates || candidates.length === 0) return 0;
  const classified = await Promise.all(candidates.map(async (c) => {
    let badge;
    try {
      badge = await classifyPhoto(c.photoUrl);
    } catch (e) {
      // If the download fails, keep the previous badge so the contact isn't lost
      badge = (await readContacts())[c.slug]?.badge ?? BADGE.UNKNOWN;
    }
    return { ...c, badge };
  }));
  await saveContacts(classified);
  return classified.length;
}

// Pausing closes the current time segment; the stopwatch stays stopped.
async function pause() {
  const previous = await readScan();
  const timer = { accumulatedMs: elapsedTime(previous.timer), activeSince: null };
  const scan = await saveScan({ state: SCAN_STATE.PAUSED, timer });
  clearTimeout(stepTimer);
  await updateIcon();
  await sendToTab(scan.tabId, { type: 'paused', timer });
}

// Resuming opens a new segment.
async function resume() {
  const scan = await readScan();
  if (scan.state !== SCAN_STATE.PAUSED) return;
  const timer = { accumulatedMs: scan.timer?.accumulatedMs || 0, activeSince: Date.now() };
  await saveScan({ state: SCAN_STATE.RUNNING, stepsWithoutChanges: 0, timer });
  await updateIcon();
  await sendToTab(scan.tabId, { type: 'resumed', timer });
  scheduleStep();
}

async function closeScanWindow(windowId) {
  if (CONFIG.DEBUG) return; // in debug mode the window stays open to inspect the console
  try {
    await api.windows.remove(windowId);
  } catch (e) {
    // the window was already closed
  }
}

// Stops everything and marks the scan as idle. It runs before the window is closed,
// so windows.onRemoved doesn't treat a normal ending as an interruption.
async function endScan() {
  clearTimeout(stepTimer);
  stopCapture();
  await resetScan();
  await updateIcon();
}

async function endScanAndCloseWindow(scan) {
  await endScan();
  await sendToTab(scan.tabId, { type: 'finished' });
  await closeScanWindow(scan.windowId);
}

async function finish() {
  const scan = await readScan();
  const durationMs = elapsedTime(scan.timer);
  debugLog('Update complete:', scan.checked, 'checked in', Math.round(durationMs / 1000), 's');
  await finishUpdate(scan.startedAt, durationMs);
  await clearProgress();
  await endScanAndCloseWindow(scan);
}

// The list stopped loading before reaching the total: what was found is kept,
// but NOBODY is removed and it isn't recorded as a complete update.
// The direct-phase progress stays saved so it can be resumed.
async function finishIncomplete(checked, total) {
  const scan = await readScan();
  console.warn('[OPENTOHELP] Incomplete update:', checked, 'of', total);
  await recordIncompleteAttempt(checked, total);
  await endScanAndCloseWindow(scan);
}

// Manual stop, or the update window/tab was closed: nothing is removed.
// What was read stays saved, how far it got is shown in the popup, and it can be resumed.
async function interrupt(scan) {
  if (scan.checked > 0) await recordIncompleteAttempt(scan.checked, scan.total ?? null);
  await endScan();
}

async function stop() {
  const scan = await readScan();
  await interrupt(scan);
  if (scan.windowId == null) return;
  try {
    await api.windows.remove(scan.windowId);
  } catch (e) {
    // already closed
  }
}

async function focusWindow() {
  const scan = await readScan();
  if (scan.windowId == null) return;
  try {
    await api.windows.update(scan.windowId, { focused: true, state: 'normal' });
  } catch (e) {
    await endScan(); // the window no longer exists
  }
}

// ---------- Messages ----------

async function handleMessage(message, sender) {
  const tabId = sender.tab?.id;
  switch (message.type) {
    // From the popup
    case 'update':
      return startUpdate();
    case 'stop':
      return stop();
    case 'focusWindow':
      return focusWindow();

    // From the content script
    case 'connectionsReady': {
      const scan = await readScan();
      const isScanTab = tabId != null && tabId === scan.tabId;
      if (isScanTab && scan.state === SCAN_STATE.RUNNING) {
        scheduleStep();
        return { mode: 'scan', scan };
      }
      if (isScanTab && scan.state === SCAN_STATE.PAUSED) {
        if (!message.hidden) resume();
        return { mode: 'scan', scan };
      }
      return { mode: 'passive' };
    }
    case 'resume':
      return resume();
    case 'requestStep': {
      const scan = await readScan();
      if (tabId === scan.tabId) scheduleStep();
      return {};
    }
    case 'passive':
      // Reading while the user browses on their own: adds framed contacts and removes those seen without a frame.
      await processCandidates(message.candidates);
      await removeContacts(message.unbadged);
      return {};
  }
  return {};
}

// sendResponse + return true pattern: works the same in Chrome and Firefox.
api.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then((r) => sendResponse(r ?? {}))
    .catch((e) => sendResponse({ error: String(e) }));
  return true;
});

// Fallback: when the update window's page finishes loading, it's told it's in scan mode
// (in case its initial query arrived before the tabId was saved).
api.tabs.onUpdated.addListener(async (tabId, changes) => {
  if (changes.status !== 'complete') return;
  const scan = await readScan();
  if (scan.state === SCAN_STATE.RUNNING && scan.tabId === tabId) {
    const response = await sendToTab(tabId, { type: 'activateScan', scan });
    if (response) scheduleStep();
  }
});

api.windows.onRemoved.addListener(async (windowId) => {
  const scan = await readScan();
  if (scan.state !== SCAN_STATE.IDLE && scan.windowId === windowId) await interrupt(scan);
});

api.tabs.onRemoved.addListener(async (tabId) => {
  const scan = await readScan();
  if (scan.state !== SCAN_STATE.IDLE && scan.tabId === tabId) await interrupt(scan);
});

// When the browser starts or the extension is installed/updated, any previous update was interrupted.
api.runtime.onStartup.addListener(endScan);
api.runtime.onInstalled.addListener(endScan);
