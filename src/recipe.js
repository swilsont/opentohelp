// "Recipe" of the request LinkedIn uses to fetch each batch of connections.
// It isn't hard-coded: it's inferred by watching the requests the page itself
// makes while scrolling. If LinkedIn changes the URL, headers or body,
// the next update learns the new version.
//
// recipe = {
//   url, method, headers: {name: value},
//   body: '<JSON of the last observed request>',
//   paths: [['clientArguments','payload','startIndex'], ...],  // where the offset goes
//   lastValue: 40, step: 10
// }
//
// Loaded in the background (detection) and in the content script (applying it).

// Headers the browser sets by itself or that fetch doesn't allow setting
var EXCLUDED_HEADERS = /^(cookie|content-length|host|origin|referer|user-agent|accept-encoding|accept-charset|connection|keep-alive|te|trailer|transfer-encoding|upgrade|via|dnt|expect|date|priority|sec-.*|proxy-.*)$/i;

function cleanHeaders(list) {
  const result = {};
  for (const { name, value } of list || []) {
    if (!EXCLUDED_HEADERS.test(name)) result[name.toLowerCase()] = value;
  }
  return result;
}

function isNumeric(value) {
  return typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value));
}

// Walks two objects in parallel and records the numeric fields that differ
function changedNumericFields(a, b, path = [], out = []) {
  if (isNumeric(a) && isNumeric(b)) {
    if (Number(a) !== Number(b)) out.push({ path, a: Number(a), b: Number(b) });
    return out;
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    for (const key of Object.keys(a)) {
      if (key in b) changedNumericFields(a[key], b[key], [...path, key], out);
    }
  }
  return out;
}

// Analyzes a series of requests to the same endpoint. If a fixed set of numeric
// fields always advances by the same step, that's the pagination offset.
function analyzeSeries(captures) {
  const bodies = [];
  for (const c of captures) {
    try {
      bodies.push(JSON.parse(c.body));
    } catch (e) {
      return null; // the body isn't JSON: this series is useless
    }
  }
  let step = null;
  let paths = null;
  let pairs = 0;
  for (let i = 1; i < bodies.length; i++) {
    const changes = changedNumericFields(bodies[i - 1], bodies[i]);
    if (changes.length === 0) continue; // retry of the same batch
    const deltas = new Set(changes.map((c) => c.b - c.a));
    if (deltas.size !== 1) return null;
    const delta = [...deltas][0];
    if (delta <= 0) return null;
    const keys = changes.map((c) => c.path.join('.')).sort().join('|');
    if (step === null) {
      step = delta;
      paths = { keys, list: changes.map((c) => c.path) };
    } else if (delta !== step || keys !== paths.keys) {
      return null;
    }
    pairs++;
  }
  if (!step) return null;
  const last = bodies[bodies.length - 1];
  return {
    step,
    paths: paths.list,
    lastValue: Number(readPath(last, paths.list[0])),
    pairs
  };
}

// captures: [{ url, method, body, headers, time }] in arrival order.
// Returns the recipe, or null if there isn't enough evidence yet.
function detectRecipe(captures, minPairs) {
  const groups = new Map();
  for (const c of captures) {
    if (!c.body) continue;
    const endpoint = c.method + ' ' + c.url.split('?')[0];
    if (!groups.has(endpoint)) groups.set(endpoint, []);
    groups.get(endpoint).push(c);
  }
  let best = null;
  for (const series of groups.values()) {
    if (series.length < 2) continue;
    const analysis = analyzeSeries(series);
    if (!analysis || analysis.pairs < minPairs) continue;
    if (!best || analysis.pairs > best.analysis.pairs) best = { series, analysis };
  }
  if (!best) return null;
  const last = best.series[best.series.length - 1];
  return {
    url: last.url,
    method: last.method,
    headers: last.headers || {},
    body: last.body,
    paths: best.analysis.paths,
    lastValue: best.analysis.lastValue,
    step: best.analysis.step
  };
}

function readPath(object, path) {
  return path.reduce((node, key) => (node == null ? undefined : node[key]), object);
}

function writePath(object, path, value) {
  let node = object;
  for (let i = 0; i < path.length - 1; i++) node = node[path[i]];
  const last = path[path.length - 1];
  node[last] = typeof node[last] === 'string' ? String(value) : value; // keeps the original type
}

// Request body for a given offset
function bodyForIndex(recipe, index) {
  const body = JSON.parse(recipe.body);
  for (const path of recipe.paths) writePath(body, path, index);
  return JSON.stringify(body);
}
