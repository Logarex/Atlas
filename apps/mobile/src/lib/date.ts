export function todayISO() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function isISODate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function parseISODate(value: string) {
  if (!isISODate(value)) return new Date();
  const [y, m, d] = value.split('-');
  return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
}

export function formatDate(value: string | null | undefined, fallback: string, locale: string = 'en') {
  if (!value) return fallback;
  if (!isISODate(value)) return value;
  try {
    const date = parseISODate(value);
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  } catch {
    return value;
  }
}
