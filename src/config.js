// Tunable settings for #OPENTOHELP.
// Shared by the background and the content script.

var CONFIG = {
  // LinkedIn connections page
  CONNECTIONS_URL: 'https://www.linkedin.com/mynetwork/invite-connect/connections/',
  CONNECTIONS_PATH: '/mynetwork/invite-connect/connections',

  // Random pause AFTER each step has finished loading
  WAIT_MIN_MS: 1500,
  WAIT_MAX_MS: 3000,

  // Max time to wait for new cards to appear after each scroll
  LOAD_TIMEOUT_MS: 8000,

  // Consecutive steps without new cards to consider the list finished
  STEPS_WITHOUT_CHANGES_TO_FINISH: 3,

  // If LinkedIn shows the total number of connections, the list is only considered
  // complete if at least this ratio was checked (the total may include closed accounts)
  MIN_COMPLETE_RATIO: 0.98,

  // If the content script receives no step within this time, it asks for one (in case the background restarted)
  WATCHDOG_MS: 20000,

  // Max time the background waits for a step's response before giving up on it
  RESPONSE_TIMEOUT_MS: 30000,

  // Consecutive steps without a response from the page (crashed tab, out of memory…) before giving up
  FAILURES_TO_GIVE_UP: 5,

  // Discovery of LinkedIn's pagination request (see recipe.js)
  MIN_RECIPE_PAIRS: 2,            // request pairs with the same step needed to trust the recipe
  MAX_DISCOVERY_STEPS: 8,         // scrolls before giving up and falling back to scroll mode
  MAX_RELEARNS: 1,                // if the recipe fails midway, how many times to learn it again
  ANCHOR_RATIO: 0.7,              // a reading anchor must match at least this ratio of cards

  // Direct phase: bursts of consecutive batches (as the page does), then the normal pause
  BATCHES_PER_BURST: 3,
  PAUSE_BETWEEN_BATCHES_MIN_MS: 200,
  PAUSE_BETWEEN_BATCHES_MAX_MS: 600,

  // An interrupted update resumes where it left off if it happened less than this many hours ago
  RESUME_WINDOW_HOURS: 24,

  // Already read cards left visible at the end of the list (the rest are hidden without photos)
  VISIBLE_CARDS: 20,

  // In DEBUG mode, the page logs diagnostics every this many steps
  LOG_EVERY_STEPS: 10,

  // Diagnostic logs in the console (prefix [OPENTOHELP]); also keeps the update window open at the end
  DEBUG: false,

  // Size of the update window
  WINDOW_WIDTH: 1100,
  WINDOW_HEIGHT: 850,

  // Badge detection by color: bottom-left corner of the framed photo.
  // Calibrated with 6 real samples (16x16 out of 100x100): solid color, no variation.
  CORNER_RATIO: 0.16,
  COLOR_OPEN_TO_WORK: [70, 112, 49],  // green, hue ≈ 100°
  COLOR_HIRING: [130, 68, 203],       // purple, hue ≈ 268°
  MAX_COLOR_DISTANCE: 60,             // farther than this from both = "unknown"

  // Passive mode: wait after the last DOM change before reading
  PASSIVE_DEBOUNCE_MS: 1000,

  // How often to check whether the URL changed (LinkedIn is a SPA)
  URL_CHECK_INTERVAL_MS: 1000
};

var BADGE = {
  OPEN_TO_WORK: 'openToWork',
  HIRING: 'hiring',
  UNKNOWN: 'unknown'
};

var SCAN_STATE = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused'
};

// Phases of an update:
//   discovering: real scrolling on the page while its requests are observed
//   direct:      batches are requested with the learned recipe, without rendering
//   scroll:      fallback if the recipe couldn't be learned (goes as far as memory allows)
var PHASE = {
  DISCOVERING: 'discovering',
  DIRECT: 'direct',
  SCROLL: 'scroll'
};
