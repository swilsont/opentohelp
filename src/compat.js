// Chrome / Firefox compatibility.
// Firefox exposes "browser" (promise-based); Chrome only "chrome" (MV3 also returns promises).
// All code goes through "api" so it doesn't depend on a specific browser.

var api = globalThis.browser ?? globalThis.chrome;

// Diagnostic logging, enabled with CONFIG.DEBUG (config.js loads after this file,
// so the flag is checked at log time, not at load time).
function debugLog(...parts) {
  if (globalThis.CONFIG?.DEBUG) console.log('[OPENTOHELP]', ...parts);
}

// Translated text from _locales (falls back to the key if it's missing)
function t(key, substitutions) {
  return api.i18n.getMessage(key, substitutions) || key;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

// Stopwatch for an update that can be paused:
// { accumulatedMs: time of already closed segments, activeSince: start of the current segment, or null while paused }
function elapsedTime(timer, now = Date.now()) {
  if (!timer) return 0;
  return (timer.accumulatedMs || 0) + (timer.activeSince ? now - timer.activeSince : 0);
}

// "1 h 3 min 5 s" / "6 min 12 s" / "40 s", using the locale's abbreviations
function formatDuration(ms, locale) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const unit = (value, name) =>
    new Intl.NumberFormat(locale, { style: 'unit', unit: name, unitDisplay: 'short' }).format(value);
  const parts = [];
  if (hours) parts.push(unit(hours, 'hour'));
  if (hours || minutes) parts.push(unit(minutes, 'minute'));
  parts.push(unit(seconds, 'second'));
  return parts.join(' ');
}
