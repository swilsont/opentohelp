// Everything that depends on LinkedIn's HTML lives in this file.
// When LinkedIn changes its page and something breaks, this is where it gets fixed.
// Stable hooks (/in/ links, photo URLs) are used instead of obfuscated CSS classes.

var SELECTORS = {
  root: 'main',
  // Hooks in LinkedIn's current HTML (Nov 2026). If they disappear,
  // getCards() falls back to the heuristic based on /in/ links.
  card: '[componentkey^="ConnectionCard_"]',
  profileLink: 'a[href*="/in/"]',
  // "Show more results" button of LinkedIn's older list layout (the current one loads on scroll)
  loadMoreButton: 'button.scaffold-finite-scroll__load-button:not([disabled])',
  // Text ignored when reading name/headline
  excludedText: 'button, .visually-hidden, script, style, time, svg'
};

var FRAMED_PHOTO_PATTERN = 'profile-framedphoto';
var PHOTO_DOMAIN = 'media.licdn.com';

var PHOTO_STATE = {
  FRAMED: 'framed',
  UNFRAMED: 'unframed',
  NO_PHOTO: 'noPhoto',   // LinkedIn's generic avatar
  PENDING: 'pending'     // image not loaded yet (lazy loading)
};

// Cache slug → card element, to avoid recomputing it on every step
var cardBySlug = new Map();

// Slugs may come percent-encoded (e.g. "sep%C3%BAlveda"); they're always compared decoded
function decodeSlug(slug) {
  try {
    return decodeURIComponent(slug);
  } catch (e) {
    return slug;
  }
}

function slugFromHref(href) {
  const match = (href || '').match(/\/in\/([^/?#]+)/);
  return match ? decodeSlug(match[1]) : null;
}

function profileUrlFor(slug) {
  return 'https://www.linkedin.com/in/' + encodeURIComponent(slug) + '/';
}

function countSlugs(element) {
  const slugs = new Set();
  for (const link of element.querySelectorAll(SELECTORS.profileLink)) {
    const slug = slugFromHref(link.getAttribute('href'));
    if (slug) slugs.add(slug);
  }
  return slugs.size;
}

// The card is the largest container that has a photo and only links to that person.
function cardContainer(link) {
  const li = link.closest('li');
  if (li && li.querySelector('img') && countSlugs(li) === 1) return li;

  let candidate = null;
  let node = link.parentElement;
  for (let level = 0; level < 10 && node && node !== document.body; level++) {
    if (countSlugs(node) > 1) break;
    if (node.querySelector('img')) candidate = node;
    node = node.parentElement;
  }
  return candidate;
}

// The connections list is the element with the most cards as direct children.
// This discards profile links outside the list (ads, suggestions, sidebar).
function mainList(cards) {
  const counts = new Map();
  for (const card of cards) {
    const parent = card.parentElement;
    if (parent) counts.set(parent, (counts.get(parent) || 0) + 1);
  }
  let best = null;
  let max = 0;
  for (const [parent, count] of counts) {
    if (count > max) {
      best = parent;
      max = count;
    }
  }
  return best;
}

// Returns a Map slug → element with the cards of the connections list, in DOM order.
function getCards() {
  const direct = cardsByAttribute();
  return direct.size > 0 ? direct : cardsByHeuristic();
}

// Main path: cards marked with componentkey="ConnectionCard_…"
function cardsByAttribute() {
  const result = new Map();
  for (const card of document.querySelectorAll(SELECTORS.card)) {
    const link = card.querySelector(SELECTORS.profileLink);
    const slug = slugFromHref(link?.getAttribute('href'));
    if (slug && !result.has(slug)) result.set(slug, card);
  }
  return result;
}

// Fallback: if LinkedIn changes those attributes, cards are inferred from the /in/ links
function cardsByHeuristic() {
  const root = document.querySelector(SELECTORS.root) || document.body;
  const all = new Map();
  for (const link of root.querySelectorAll(SELECTORS.profileLink)) {
    const slug = slugFromHref(link.getAttribute('href'));
    if (!slug || all.has(slug)) continue;
    let card = cardBySlug.get(slug);
    if (!card || !card.isConnected) {
      card = cardContainer(link);
      if (!card) continue;
      cardBySlug.set(slug, card);
    }
    all.set(slug, card);
  }
  const list = mainList(all.values());
  const result = new Map();
  for (const [slug, card] of all) {
    if (card.parentElement === list) result.set(slug, card);
  }
  return result;
}

// First ancestor with its own scrollbar; if there's none, the document.
function scrollContainer(element) {
  let node = element?.parentElement;
  while (node && node !== document.body && node !== document.documentElement) {
    const overflow = getComputedStyle(node).overflowY;
    if ((overflow === 'auto' || overflow === 'scroll') && node.scrollHeight > node.clientHeight) return node;
    node = node.parentElement;
  }
  return document.scrollingElement || document.documentElement;
}

// Total connections shown in the header ("3886 contactos", "3,886 connections"...).
// Looks for an element whose full text is "<number> <one word>" (number and word
// may be in separate nodes). Cached because it doesn't change during an update.
let cachedTotal = null;

function totalConnectionsOnPage() {
  if (cachedTotal) return cachedTotal;
  const root = document.querySelector(SELECTORS.root) || document.body;
  for (const element of root.querySelectorAll('h1, h2, h3, h4, p, span, div')) {
    const text = (element.textContent || '').replace(/\s+/g, ' ').trim();
    if (text.length > 40) continue;
    const match = text.match(/^(\d[\d.,   ]*)\s+\p{L}+$/u);
    if (match) {
      const number = parseInt(match[1].replace(/\D/g, ''), 10);
      if (number > 0) {
        cachedTotal = number;
        return number;
      }
    }
  }
  return null;
}

function realImageUrl(img) {
  const options = [
    img.currentSrc,
    img.getAttribute('src'),
    img.getAttribute('data-delayed-url'),
    img.getAttribute('data-src')
  ];
  return options.find((url) => url && url.startsWith('http')) || null;
}

function pickPhoto(card) {
  const images = [...card.querySelectorAll('img')];
  return images.find((img) => (realImageUrl(img) || '').includes('profile-')) || images[0] || null;
}

function photoState(img) {
  if (!img) return { state: PHOTO_STATE.NO_PHOTO, url: null };
  const url = realImageUrl(img);
  if (!url) return { state: PHOTO_STATE.PENDING, url: null };
  if (url.includes(FRAMED_PHOTO_PATTERN)) return { state: PHOTO_STATE.FRAMED, url };
  if (url.includes(PHOTO_DOMAIN)) return { state: PHOTO_STATE.UNFRAMED, url };
  return { state: PHOTO_STATE.NO_PHOTO, url: null };
}

function textLines(card) {
  const lines = [];
  const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentElement?.closest(SELECTORS.excludedText)) continue;
    const text = node.textContent.replace(/\s+/g, ' ').trim();
    if (text && !lines.includes(text)) lines.push(text);
  }
  return lines;
}

// full = true: also reads name and headline of UNFRAMED cards
// (used to teach the paginator how to read LinkedIn's responses).
function cardData(slug, card, full = false) {
  const img = pickPhoto(card);
  const photo = photoState(img);
  const data = {
    slug,
    photoState: photo.state,
    photoUrl: photo.url,
    profileUrl: profileUrlFor(slug),
    name: '',
    headline: ''
  };
  // Name and headline are only needed for framed contacts (the only ones that get stored).
  // In the card, text comes in order: name, headline, "Contacto desde…" (connected on…).
  // The photo's alt text isn't used because its format depends on the language.
  if (full || photo.state === PHOTO_STATE.FRAMED) {
    const lines = textLines(card);
    data.name = lines[0] || slug;
    data.headline = lines.find((l) => l !== data.name) || '';
  }
  return data;
}

function findLoadMoreButton() {
  return document.querySelector(SELECTORS.loadMoreButton);
}
