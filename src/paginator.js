// Direct reading of connection batches, without rendering the page.
//
// LinkedIn's response is text with one row per line. Rows about ONE person
// carry their slug (/in/…), name, headline and photo URL.
// Where the name and headline are located is NOT hard-coded: it's LEARNED by comparing
// a response with what the page shows (the page already rendered those same cards).
//
// reader = { nameAnchor, headlineAnchor }
//   anchor = text that appears right before the value in (most of) the cards.
//
// Uses PHOTO_STATE, FRAMED_PHOTO_PATTERN, decodeSlug and profileUrlFor from selectors.js.

const PREFIX_LENGTH = 120;
const MIN_ANCHOR_LENGTH = 8;

// In Firefox, the content script's fetch doesn't carry the page's session; content.fetch does.
const pageFetch = globalThis.content?.fetch ? globalThis.content.fetch.bind(globalThis.content) : fetch;

function escapeJson(text) {
  return JSON.stringify(text).slice(1, -1);
}

// Profile slugs mentioned in a row: "/in/slug/" or "https://www.linkedin.com/in/slug/"
function slugsInRow(row) {
  const slugs = new Set();
  for (const m of row.matchAll(/"(?:https:\/\/www\.linkedin\.com)?\/in\/([^/"?#\\]+)\/?(?:\?[^"]*)?"/g)) {
    slugs.add(decodeSlug(m[1]));
  }
  return [...slugs];
}

// Reads the JSON string starting at "from" (right after an opening quote)
function readJsonString(text, from) {
  let i = from;
  while (i < text.length && text[i] !== '"') {
    i += text[i] === '\\' ? 2 : 1;
  }
  if (i >= text.length) return null;
  try {
    return JSON.parse('"' + text.slice(from, i) + '"');
  } catch (e) {
    return null;
  }
}

function extractWithAnchor(row, anchor) {
  if (!anchor) return '';
  const position = row.indexOf(anchor);
  if (position === -1) return '';
  return readJsonString(row, position + anchor.length) || '';
}

// Photo: the media.licdn.com URL with "profile-…photo-". LinkedIn sends it split into
// a root and several sizes; it's built with the 100 px one (or the first available).
function photoInRow(row) {
  const root = row.match(/"(https:\/\/media\.licdn\.com\/[^"]*?profile-(?:framed|display)photo-[^"]*)"/);
  if (!root) return null;
  const url = root[1];
  if (url.includes('?')) return url; // already complete (carries its ?e=…&t=… signature)
  // The root may end in "photo-" (sizes "scale_100_100/…") or in "shrink_" (sizes "100_100/…")
  const rest = row.slice(root.index + root[0].length, root.index + root[0].length + 3000);
  const sizes = [...rest.matchAll(/"((?:[a-z]+_)?(\d+)_\d+\/[^"]+)"/g)];
  if (sizes.length === 0) return null;
  const chosen = sizes.find((m) => m[2] === '100') || sizes[0];
  return url + readJsonString(rest, chosen.index + 1);
}

function photoStateFromUrl(url) {
  if (!url) return PHOTO_STATE.NO_PHOTO;
  return url.includes(FRAMED_PHOTO_PATTERN) ? PHOTO_STATE.FRAMED : PHOTO_STATE.UNFRAMED;
}

// Contacts in a response, in the same format as cardData()
function readContacts(text, reader) {
  const bySlug = new Map();
  for (const row of text.split('\n')) {
    const slugs = slugsInRow(row);
    if (slugs.length !== 1) continue; // only rows about a single person
    const slug = slugs[0];
    const contact = bySlug.get(slug) || { slug, name: '', headline: '', photoUrl: null };
    contact.name = contact.name || extractWithAnchor(row, reader.nameAnchor);
    contact.headline = contact.headline || extractWithAnchor(row, reader.headlineAnchor);
    contact.photoUrl = contact.photoUrl || photoInRow(row);
    bySlug.set(slug, contact);
  }
  return [...bySlug.values()]
    .filter((c) => c.name)
    .map((c) => ({
      ...c,
      photoState: photoStateFromUrl(c.photoUrl),
      profileUrl: profileUrlFor(c.slug)
    }));
}

// Texts that appear right before each occurrence of "value" in the response
function prefixesBefore(text, value) {
  const prefixes = [];
  let from = 0;
  let position;
  while ((position = text.indexOf(value, from)) !== -1) {
    prefixes.push(text.slice(Math.max(0, position - PREFIX_LENGTH), position));
    from = position + value.length;
  }
  return prefixes;
}

// The longest text that precedes the value in MOST of the cards.
// It isn't required to work for all of them: a single person without a headline (the page
// shows another line instead) or a formatting difference would prevent a 100% match.
function commonAnchor(prefixesByCard) {
  const required = Math.max(3, Math.ceil(prefixesByCard.length * CONFIG.ANCHOR_RATIO));
  if (prefixesByCard.length < required) return null;
  const matchCount = (candidate) =>
    prefixesByCard.filter((list) => list.some((p) => p.endsWith(candidate))).length;
  let best = '';
  for (const list of prefixesByCard) {
    for (const prefix of list) {
      for (let length = prefix.length; length > best.length && length >= MIN_ANCHOR_LENGTH; length--) {
        const candidate = prefix.slice(-length);
        if (matchCount(candidate) >= required) {
          best = candidate;
          break;
        }
      }
    }
  }
  return best.length >= MIN_ANCHOR_LENGTH ? best : null;
}

function photoId(url) {
  const m = (url || '').match(/\/image\/v2\/([^/]+)\//);
  return m ? m[1] : null;
}

// truth: Map slug → { name, headline, photoUrl } taken from the rendered cards.
// Returns { reader, contacts, diagnostics }; reader is null if it couldn't be learned.
function learnReader(text, truth) {
  // Learning only happens inside rows that identify ONE person: the same rows that
  // readContacts() uses later. This way a text common to all cards but located in
  // another row (e.g. the "Send a message to…" button) isn't picked as an anchor.
  const rowsBySlug = new Map();
  for (const row of text.split('\n')) {
    const slugs = slugsInRow(row);
    if (slugs.length !== 1) continue;
    rowsBySlug.set(slugs[0], (rowsBySlug.get(slugs[0]) || '') + row + '\n');
  }
  const cards = [...rowsBySlug.keys()].filter((s) => truth.has(s) && truth.get(s).name);
  const diagnostics = { slugsInResponse: rowsBySlug.size, comparableCards: cards.length };
  if (cards.length < 3) return { reader: null, contacts: [], diagnostics };

  const prefixesOf = (slug, value) => prefixesBefore(rowsBySlug.get(slug), escapeJson(value));
  const nameAnchor = commonAnchor(cards.map((s) => prefixesOf(s, truth.get(s).name)));
  const withHeadline = cards.filter((s) => truth.get(s).headline);
  const headlineAnchor = withHeadline.length >= 3
    ? commonAnchor(withHeadline.map((s) => prefixesOf(s, truth.get(s).headline)))
    : null;
  const reader = { nameAnchor, headlineAnchor };
  diagnostics.nameAnchor = nameAnchor;
  diagnostics.headlineAnchor = headlineAnchor;
  if (!nameAnchor) return { reader: null, contacts: [], diagnostics };

  // Validation: what was read must match what the page shows
  const contacts = readContacts(text, reader);
  const bySlug = new Map(contacts.map((c) => [c.slug, c]));
  const namesOk = cards.filter((s) => bySlug.get(s)?.name === truth.get(s).name).length;
  const withPhoto = cards.filter((s) => truth.get(s).photoUrl && bySlug.get(s)?.photoUrl);
  const photosOk = withPhoto.filter((s) => photoId(truth.get(s).photoUrl) === photoId(bySlug.get(s).photoUrl)).length;
  Object.assign(diagnostics, { namesOk, photosOk, comparablePhotos: withPhoto.length, contactsRead: contacts.length });

  const valid = namesOk >= Math.ceil(cards.length * 0.8) && (withPhoto.length === 0 || photosOk >= Math.ceil(withPhoto.length * 0.8));
  return { reader: valid ? reader : null, contacts: valid ? contacts : [], diagnostics };
}

// Requests one batch using the recipe. Returns { ok, status, text }
async function fetchBatch(recipe, index) {
  const response = await pageFetch(recipe.url, {
    method: recipe.method,
    headers: recipe.headers,
    body: bodyForIndex(recipe, index),
    credentials: 'include'
  });
  const text = await response.text();
  return { ok: response.ok, status: response.status, text };
}
