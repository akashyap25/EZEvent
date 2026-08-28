// Lightweight stand-in for isomorphic-dompurify in tests.
// The real package pulls in jsdom, whose CSS parser is a genuine ES Module
// that Jest's CommonJS runtime cannot require() — so it's mocked here instead
// of tuning transformIgnorePatterns, which cannot fix a true ESM package.
const stripTags = (html, allowedTags = []) => {
  if (typeof html !== 'string') return '';
  if (allowedTags.length === 0) return html.replace(/<[^>]*>/g, '');
  const allowed = allowedTags.join('|');
  const disallowedTag = new RegExp(`<(?!\\/?(${allowed})(?=[\\s>/]))[^>]*>`, 'gi');
  return html.replace(disallowedTag, '');
};

module.exports = {
  sanitize: (html, options = {}) => stripTags(html, options.ALLOWED_TAGS || []),
};
