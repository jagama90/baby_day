export const pad = (n: number) => String(n).padStart(2, '0');
export const durMin = (s: string, e: string) => Math.round((new Date(e).getTime() - new Date(s).getTime()) / 60000);
export const durLabel = (m: number) => m < 60 ? m + '분' : Math.floor(m / 60) + '시간' + (m % 60 ? ' ' + (m % 60) + '분' : '');
export const autoSleepKind = (d: Date) => { const h = d.getHours(); return (h >= 6 && h < 19) ? 'nap' : 'night'; };
export const toAmPm = (hhmm: string) => {
  const parts = hhmm.split(':').map(Number);
  const h = parts[0], m = parts[1];
  const ampm = h < 12 ? '오전' : '오후';
  const dh = h % 12 || 12;
  return ampm + ' ' + dh + ':' + pad(m);
};
export const adjTimeVal = (val: string, diffMin: number) => {
  const parts = val.split(':').map(Number);
  const total = parts[0] * 60 + (parts[1] || 0) + diffMin;
  const nh = ((Math.floor(total / 60)) % 24 + 24) % 24;
  const nm = ((total % 60) + 60) % 60;
  return pad(nh) + ':' + pad(nm);
};
