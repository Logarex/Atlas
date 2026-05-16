export function todayISO() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function isISODate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function formatDate(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  return value;
}
