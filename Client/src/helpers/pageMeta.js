export function setMeta(title, description) {
  document.title = `${title} | CineLog`;
  for (const [selector, attribute, value] of [
    ['meta[name="description"]', 'content', description],
    ['meta[property="og:title"]', 'content', document.title],
    ['meta[property="og:description"]', 'content', description],
  ]) {
    document.querySelector(selector)?.setAttribute(attribute, value);
  }
}
