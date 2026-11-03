export function formatConcertDate(dateStr: string): string {
  if (!dateStr) return 'Date to be announced';
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(year, month - 1, day));
}

export function daysUntil(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return 0;
  const now = new Date();
  const then = Date.UTC(year, month - 1, day);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((then - today) / 86400000));
}

export function formatShortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(y, m - 1, d));
}

export function futureDate(days = 47): string {
  const now = new Date();
  now.setDate(now.getDate() + days);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
