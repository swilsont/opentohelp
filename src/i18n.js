// Translations for the extension's pages (popup), using t() from compat.js.
// Texts live in _locales/<language>/messages.json. To add a language, just create
// its folder (e.g. _locales/de/messages.json); no code changes are needed.

// <span data-i18n="key">             → textContent
// <input data-i18n-placeholder="key"> → placeholder
function applyTranslations(root) {
  for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of root.querySelectorAll('[data-i18n-placeholder]')) el.placeholder = t(el.dataset.i18nPlaceholder);
  document.documentElement.lang = api.i18n.getUILanguage();
}
