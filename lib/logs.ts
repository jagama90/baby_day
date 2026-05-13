import { supabase } from './supabase'

export type LogType = 'sleep' | 'formula' | 'breast' | 'diaper' | 'growth' | 'hospital' | 'bath' | 'vaccine'

export type LogPayload = {
  baby_id: string
  user_id: string
  type: LogType
  date: string
  start_time: string
  end_time?: string
  ml?: number
  left_min?: number
  right_min?: number
  sleep_kind?: string
  diaper_kind?: string
  memo?: string
  weight?: number
  height?: number
  head?: number
}

export const getLogs = async (babyId: string, date?: string) => {
  let query = supabase
    .from('baby_logs')
    .select('*')
    .eq('baby_id', babyId)
    .order('start_time', { ascending: false })
  if (date) query = query.eq('date', date)
  const { data } = await query
  return data
}

export const createLog = async (log: LogPayload) => {
  const { data, error } = await supabase.from('baby_logs').insert(log).select().single()
  return { data, error }
}

export const deleteLog = async (id: string) => {
  await supabase.from('baby_logs').delete().eq('id', id)
}

export const updateLog = async (id: string, updates: Partial<LogPayload>) => {
  const { data } = await supabase.from('baby_logs').update(updates).eq('id', id).select().single()
  return data
}

export type BabyRecord = {
  id: string;
  type: string;
  date: string;
  start_time: string;
  end_time?: string;
  ml?: number;
  left_min?: number;
  right_min?: number;
  sleep_kind?: string;
  diaper_kind?: string;
  weight?: number;
  height?: number;
  head?: number;
  hospital_name?: string;
  hospital_type?: string;
  vaccine_name?: string;
  memo?: string;
  recorded_by_name?: string;
  recorded_by_role?: string;
  user_id?: string;
  created_at?: string;
};

export const EMOJI: Record<string, string> = { sleep: '😴', formula: '🍼', breast: '🤱', diaper: '💧', growth: '📏', hospital: '🏥', bath: '🛁' };
export const LABEL: Record<string, string> = { sleep: '수면', formula: '분유', breast: '모유', diaper: '기저귀', growth: '성장', hospital: '병원', bath: '목욕' };

const pad = (n: number) => String(n).padStart(2, '0');
export const fmtDate = (d: Date) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export const fmtTime = (iso: string) => { const d = new Date(iso); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
export const nowTime = () => { const d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
export const todayStr = () => fmtDate(new Date());

export function elapsed(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return '방금 전';
  if (m < 60) return m + '분 전';
  const h = Math.floor(m / 60), rm = m % 60;
  return h + '시간' + (rm ? ' ' + rm + '분' : '') + ' 전';
}

function durMin(s: string, e: string) { return Math.round((new Date(e).getTime() - new Date(s).getTime()) / 60000); }
function durLabel(m: number) { return m < 60 ? m + '분' : Math.floor(m / 60) + '시간' + (m % 60 ? ' ' + (m % 60) + '분' : ''); }

export function detail(r: BabyRecord): string {
  if (r.type === 'sleep') { const tag = r.sleep_kind === 'nap' ? '낮잠' : '밤잠'; if (r.end_time) return tag + ' · ' + durLabel(durMin(r.start_time, r.end_time)); return tag + ' · 진행 중 ⏱'; }
  if (r.type === 'formula') return (r.ml || 0) + 'ml';
  if (r.type === 'breast') { const p = []; if (r.left_min) p.push('왼쪽 ' + r.left_min + '분'); if (r.right_min) p.push('오른쪽 ' + r.right_min + '분'); const t = (r.left_min || 0) + (r.right_min || 0); if (t) p.push('총 ' + t + '분'); return p.join(' · ') || '모유'; }
  if (r.type === 'diaper') return ({ urine: '💧 소변', stool: '💩 대변', both: '🔄 소변+대변' } as Record<string, string>)[r.diaper_kind || ''] || '기저귀';
  if (r.type === 'growth') { const p = []; if (r.weight) p.push(r.weight + 'kg'); if (r.height) p.push(r.height + 'cm'); if (r.head) p.push('두위 ' + r.head + 'cm'); return p.join(' · ') || '성장 기록'; }
  if (r.type === 'hospital') return r.hospital_name || (r.memo || '병원 방문');
  if (r.type === 'bath') return r.memo || '목욕';
  return '';
}

export function breastToFormulaMl(totalBreastMin: number, babyBirth: string) {
  const mlPerMin = 7.5;
  const rawMl = totalBreastMin * mlPerMin;
  let factor = 0.85;
  if (babyBirth) {
    const days = Math.floor((Date.now() - new Date(babyBirth).getTime()) / 86400000);
    if (days <= 14) factor = 0.95;
    else if (days <= 30) factor = 0.90;
    else if (days <= 120) factor = 0.85;
    else factor = 0.80;
  }
  return Math.round(rawMl * factor);
}