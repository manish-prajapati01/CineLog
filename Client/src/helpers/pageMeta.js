const site = 'https://cinelog-two.vercel.app';
function meta(selector, attributes, value) {
  let node = document.querySelector(selector);
  if (!node) {
    node = document.createElement('meta');
    for (const [k, v] of Object.entries(attributes)) node.setAttribute(k, v);
    document.head.append(node);
  }
  node.setAttribute('content', value);
}
export function setMeta(title, description, details) {
  document.title = `${title} | CineLog`;
  const url = site + window.location.pathname;
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.append(canonical);
  }
  canonical.href = url;
  for (const [name, value] of Object.entries({
    description,
    'twitter:title': document.title,
    'twitter:description': description,
    'twitter:card': 'summary_large_image',
  }))
    meta(`meta[name="${name}"]`, { name }, value);
  const image = details?.poster_path
    ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
    : site + '/logo.png';
  for (const [property, value] of Object.entries({
    'og:title': document.title,
    'og:description': description,
    'og:url': url,
    'og:image': image,
    'og:type': 'website',
  }))
    meta(`meta[property="${property}"]`, { property }, value);
  meta('meta[name="twitter:image"]', { name: 'twitter:image' }, image);
  document.getElementById('title-schema')?.remove();
  if (details) {
    const data = {
      '@context': 'https://schema.org',
      '@type': details.title ? 'Movie' : 'TVSeries',
      name: title,
      description,
      url,
      inLanguage: details.original_language,
      image,
      ...(details.release_date || details.first_air_date
        ? { datePublished: details.release_date || details.first_air_date }
        : {}),
    };
    const script = document.createElement('script');
    script.id = 'title-schema';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.append(script);
  }
}
