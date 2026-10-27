const names = new Intl.DisplayNames(['en'], { type: 'language' });
export function languageName(code) {
  if (!code) return 'Language not listed';
  try {
    return names.of(code) || code;
  } catch {
    return code;
  }
}
