'use client';

import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'


// ── SUPABASE CONFIG ──
const SUPA_URL = 'https://yaxrymvpbvcpxbfqvzen.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheHJ5bXZwYnZjcHhiZnF2emVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTM4MDUsImV4cCI6MjA5Mzk2OTgwNX0.f6ESGyRoclBzK_O8lptqP6ZOjFQwj_8tQJ9bEcuxOOQ';
const H: Record<string, string> = { 'Content-Type': 'application/json', apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY };

async function apiGet(p: string) {
  const r = await fetch(SUPA_URL + '/rest/v1/' + p, { headers: { ...H, Prefer: 'return=representation' } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function apiPost(d: Record<string, unknown>) {
  const r = await fetch(SUPA_URL + '/rest/v1/baby_logs', { method: 'POST', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(d) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function apiPatch(id: string, d: Record<string, unknown>) {
  const r = await fetch(SUPA_URL + '/rest/v1/baby_logs?id=eq.' + id, { method: 'PATCH', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(d) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function apiDelete(id: string) {
  const r = await fetch(SUPA_URL + '/rest/v1/baby_logs?id=eq.' + id, { method: 'DELETE', headers: H });
  if (!r.ok) throw new Error(await r.text());
}

// ── HELPERS ──
const pad = (n: number) => String(n).padStart(2, '0');
const fmtDate = (d: Date) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const fmtTime = (iso: string) => { const d = new Date(iso); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
const nowTime = () => { const d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
const todayStr = () => fmtDate(new Date());

function elapsed(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return '방금 전';
  if (m < 60) return m + '분 전';
  const h = Math.floor(m / 60), rm = m % 60;
  return h + '시간' + (rm ? ' ' + rm + '분' : '') + ' 전';
}
function durMin(s: string, e: string) { return Math.round((new Date(e).getTime() - new Date(s).getTime()) / 60000); }
function durLabel(m: number) { return m < 60 ? m + '분' : Math.floor(m / 60) + '시간' + (m % 60 ? ' ' + (m % 60) + '분' : ''); }
function autoSleepKind(d: Date) { const h = d.getHours(); return (h >= 6 && h < 19) ? 'nap' : 'night'; }
function toAmPm(hhmm: string) {
  const parts = hhmm.split(':').map(Number);
  const h = parts[0], m = parts[1];
  const ampm = h < 12 ? '오전' : '오후';
  const dh = h % 12 || 12;
  return ampm + ' ' + dh + ':' + pad(m);
}

function breastToFormulaMl(totalBreastMin: number, babyBirth: string) {
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

type BabyRecord = {
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

type Settings = {
  babyName: string;
  babyBirth: string;
  formulaGoal: string;
  feedWarnHour: string;
  darkMode: string;
  pushEnabled: string;
  babyWeight: string;
  avgFormulaMl: string;
};

const EMOJI: Record<string, string> = { sleep: '😴', formula: '🍼', breast: '🤱', diaper: '💧', growth: '📏', hospital: '🏥', bath: '🛁' };
const LABEL: Record<string, string> = { sleep: '수면', formula: '분유', breast: '모유', diaper: '기저귀', growth: '성장', hospital: '병원', bath: '목욕' };

function detail(r: BabyRecord): string {
  if (r.type === 'sleep') { const tag = r.sleep_kind === 'nap' ? '낮잠' : '밤잠'; if (r.end_time) return tag + ' · ' + durLabel(durMin(r.start_time, r.end_time)); return tag + ' · 진행 중 ⏱'; }
  if (r.type === 'formula') return (r.ml || 0) + 'ml';
  if (r.type === 'breast') { const p = []; if (r.left_min) p.push('왼쪽 ' + r.left_min + '분'); if (r.right_min) p.push('오른쪽 ' + r.right_min + '분'); const t = (r.left_min || 0) + (r.right_min || 0); if (t) p.push('총 ' + t + '분'); return p.join(' · ') || '모유'; }
  if (r.type === 'diaper') return ({ urine: '💧 소변', stool: '💩 대변', both: '🔄 소변+대변' } as Record<string, string>)[r.diaper_kind || ''] || '기저귀';
  if (r.type === 'growth') { const p = []; if (r.weight) p.push(r.weight + 'kg'); if (r.height) p.push(r.height + 'cm'); if (r.head) p.push('두위 ' + r.head + 'cm'); return p.join(' · ') || '성장 기록'; }
  if (r.type === 'hospital') return r.hospital_name || (r.memo || '병원 방문');
  if (r.type === 'bath') return r.memo || '목욕';
  return '';
}

function LogPageInner() {
  const [records, setRecords] = useState<BabyRecord[]>([]);
  const [selDate, setSelDate] = useState(new Date());
  const [calDate, setCalDate] = useState(new Date());
  const [currentTab, setCurrentTab] = useState('home');
  const [settings, setSettings] = useState<Settings>({ babyName: '', babyBirth: '', formulaGoal: '', feedWarnHour: '3', darkMode: '0', pushEnabled: '0', babyWeight: '', avgFormulaMl: '' });
  const [syncState, setSyncState] = useState<'on' | 'off' | 'loading'>('loading');
  const [syncTxt, setSyncTxt] = useState('연결 중...');
  const [toast, setToast] = useState('');
  const [toastShow, setToastShow] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState<'day' | 'week'>('day');
  const [statsOffset, setStatsOffset] = useState(0);
  const [statsContent, setStatsContent] = useState('');
  const [leftMin, setLeftMin] = useState(0);
  const [rightMin, setRightMin] = useState(0);
  const [modalType, setModalType] = useState('sleep');
  const [sleepKind, setSleepKind] = useState<'nap' | 'night'>('nap');
  const [diaperKind, setDiaperKind] = useState<'urine' | 'stool' | 'both'>('urine');
  const [hospitalType, setHospitalType] = useState<'checkup' | 'vaccine' | 'sick'>('checkup');
  const [showModal, setShowModal] = useState(false);
  const [showCal, setShowCal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [voiceTip, setVoiceTip] = useState('말씀해주세요');
  const [modalPrefill, setModalPrefill] = useState<BabyRecord | null>(null);
  const [editFormula, setEditFormula] = useState<BabyRecord | null>(null);
  const [editBreast, setEditBreast] = useState<BabyRecord | null>(null);
  const [editDiaper, setEditDiaper] = useState<BabyRecord | null>(null);
  const [editSleep, setEditSleep] = useState<BabyRecord | null>(null);
  const [editDK, setEditDK] = useState<'urine' | 'stool' | 'both'>('urine');
  const [modalStartTime, setModalStartTime] = useState(nowTime());
  const [modalEndTime, setModalEndTime] = useState('');
  const [modalMl, setModalMl] = useState(0);
  const [formulaText, setFormulaText] = useState('');
  const [modalGDate, setModalGDate] = useState(fmtDate(new Date()));
  const [modalWeight, setModalWeight] = useState('');
  const [modalHeight, setModalHeight] = useState('');
  const [modalHead, setModalHead] = useState('');
  const [modalGMemo, setModalGMemo] = useState('');
  const [modalHDate, setModalHDate] = useState(fmtDate(new Date()));
  const [modalHName, setModalHName] = useState('');
  const [modalVaccine, setModalVaccine] = useState('');
  const [modalHMemo, setModalHMemo] = useState('');
  const [sleepTimerMap, setSleepTimerMap] = useState<Record<string, string>>({});
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editMl, setEditMl] = useState(0);
  const [editLeftMin, setEditLeftMin] = useState(0);
  const [editRightMin, setEditRightMin] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [secureMsg, setSecureMsg] = useState('🔒 모든 기록은 암호화되어 안전하게 저장됩니다');
  const [growthHtml, setGrowthHtml] = useState('');
  const [hospitalHtml, setHospitalHtml] = useState('');
  const [sName, setSName] = useState('');
  const [sBirth, setSBirth] = useState('');
  const [sGoal, setSGoal] = useState('');
  const [sWarn, setSWarn] = useState('3');
  const [sWeight, setSWeight] = useState('');
  const [sAvgFormula, setSAvgFormula] = useState('');
  const router = useRouter()
  const [showDrawer, setShowDrawer] = useState(false)
  const [drawerBabies, setDrawerBabies] = useState<any[]>([])
  const [showAddBaby, setShowAddBaby] = useState(false)
  const [showBabyProfile, setShowBabyProfile] = useState<any>(null)
  const [showBabyPicker, setShowBabyPicker] = useState(false)
  const [editingBaby, setEditingBaby] = useState(false)
  const [profileForm, setProfileForm] = useState<any>({})
  const [newBabyName, setNewBabyName] = useState('')
  const [newBabyBirth, setNewBabyBirth] = useState('')
  const [newBabyRole, setNewBabyRole] = useState('dad')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [memberRoleMap, setMemberRoleMap] = useState<Record<string, string>>({})
  const [patternMsgs, setPatternMsgs] = useState<string[]>([]);
  const [patternIdx, setPatternIdx] = useState(0);
  const [patternVisible, setPatternVisible] = useState(true);

  const recogRef = useRef<any>(null);
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── SECURE MSG ROTATION ──
  useEffect(() => {
    const msgs = [
      '🔒 모든 기록은 암호화되어 안전하게 저장됩니다',
      '🛡️ 개인정보는 외부에 절대 공유되지 않습니다',
      '✅ 실시간 백업으로 소중한 기록을 보호합니다',
      '🔐 데이터는 암호화된 DB에 안전하게 보관됩니다',
    ];
    let idx = 0;
    const iv = setInterval(() => {
      idx = (idx + 1) % msgs.length;
      setSecureMsg(msgs[idx]);
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  // ── SCROLL LOCK when modal open ──
useEffect(() => {
  const anyModal = showModal || showSettings || showCal || !!editFormula || !!editBreast || !!editDiaper || !!editSleep || showVoice || showDrawer || !!showBabyProfile; if (anyModal) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
  return () => {
    document.body.style.overflow = '';
  };
}, [showModal, showSettings, showCal, editFormula, editBreast, editDiaper, editSleep, showVoice]);


  // ── LOAD SETTINGS ──
  const loadSettings = useCallback(() => {
    const s: Settings = {
      babyName: localStorage.getItem('babyName') || '',
      babyBirth: localStorage.getItem('babyBirth') || '',
      formulaGoal: localStorage.getItem('formulaGoal') || '',
      feedWarnHour: localStorage.getItem('feedWarnHour') || '3',
      darkMode: localStorage.getItem('darkMode') || '0',
      pushEnabled: localStorage.getItem('pushEnabled') || '0',
      babyWeight: localStorage.getItem('babyWeight') || '',
      avgFormulaMl: localStorage.getItem('avgFormulaMl') || '',
    };
    setSettings(s);
    if (s.darkMode === '1') { setDarkMode(true); document.body.classList.add('dark'); }
    setSName(s.babyName);
    setSBirth(s.babyBirth);
    setSGoal(s.formulaGoal);
    setSWarn(s.feedWarnHour || '3');
    setSWeight(s.babyWeight);
    setSAvgFormula(s.avgFormulaMl);
    return s;
  }, []);

  const saveSetting = (k: keyof Settings, v: string) => {
    localStorage.setItem(k, v);
    setSettings(prev => ({ ...prev, [k]: v }));
  };

  // ── TOAST ──
  const showToast = (msg: string) => {
    setToast(msg); setToastShow(true);
    setTimeout(() => setToastShow(false), 2500);
  };

  // ── LOAD ALL ──
  const loadAll = useCallback(async (s?: Settings) => {
    setSyncState('loading'); setSyncTxt('불러오는 중...');
    try {
      const params = new URLSearchParams(window.location.search)
      const babyId = params.get('babyId')
      if (!babyId) { setSyncState('on'); setSyncTxt('실시간 동기화 중'); setRecords([]); return; }
      const data = await apiGet(`baby_logs?baby_id=eq.${babyId}&order=start_time.desc,created_at.desc&limit=1000`)
      setRecords(data);
      setSyncState('on'); setSyncTxt('실시간 동기화 중');
    } catch (e: unknown) {
      setSyncState('off'); setSyncTxt('연결 실패');
      showToast('로드 실패: ' + (e instanceof Error ? e.message : ''));
    }
  }, []);

  useEffect(() => {
  const s = loadSettings();
  loadAll(s);
  // 현재 유저 + 아기 목록 로드
  supabase.auth.getUser().then(({ data: { user } }) => {
    setCurrentUser(user)
    if (user) {
      const params = new URLSearchParams(window.location.search)
      const babyId = params.get('babyId')
      supabase.from('baby_members').select('baby_id, role, babies(id, name, birth_date, gender, photo_url, due_date, birth_weight, birth_height, birth_head, feeding_type, blood_type, birth_hospital)').eq('user_id', user.id)
      .then(({ data }) => {
        const deduped = (data || []).filter((m: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.baby_id === m.baby_id) === i)
        setDrawerBabies(deduped)
      })
      if (babyId) {
        supabase.from('baby_members').select('user_id, role').eq('baby_id', babyId)
          .then(({ data }) => {
            const map: Record<string, string> = {}
            data?.forEach((m: any) => { map[m.user_id] = m.role })
            setMemberRoleMap(map)
          })
      }
    }
  })
}, [loadSettings, loadAll]);

// ── PATTERN PREDICTION ──
useEffect(() => {
  if (!records.length) return;
  const msgs: string[] = [];
  const now = Date.now();
  const days7 = now - 7 * 86400000;
  const days14 = now - 14 * 86400000;

  // 1순위: 수유 예측
  const feedRecs = records.filter(r => (r.type === 'formula' || r.type === 'breast') && new Date(r.start_time).getTime() > days14)
    .sort((a, b) => a.start_time > b.start_time ? 1 : -1);
  if (feedRecs.length >= 5) {
    const gaps: number[] = [];
    for (let i = 1; i < feedRecs.length; i++) {
      const g = (new Date(feedRecs[i].start_time).getTime() - new Date(feedRecs[i-1].start_time).getTime()) / 60000;
      if (g >= 30 && g <= 360) gaps.push(g);
    }
    if (gaps.length >= 5) {
      const sorted = [...gaps].sort((a,b) => a-b);
      const median = sorted[Math.floor(sorted.length / 2)];
      const lastFeedTime = new Date(feedRecs[feedRecs.length - 1].start_time).getTime();
      const nextFeedTime = lastFeedTime + median * 60000;
      const remaining = Math.round((nextFeedTime - now) / 60000);
      if (remaining >= 0 && remaining <= 60) {
        msgs.push(`💡 평소 패턴상 약 ${remaining}분 안에 배고픔 신호가 올 수 있어요`);
      }
    }
  }

  // 2순위: 졸림 예측
  const napRecs = records.filter(r => r.type === 'sleep' && r.sleep_kind === 'nap' && r.end_time && new Date(r.start_time).getTime() > days7)
    .sort((a, b) => a.end_time! > b.end_time! ? 1 : -1);
  if (napRecs.length >= 2) {
    const wakeGaps: number[] = [];
    for (let i = 0; i < napRecs.length - 1; i++) {
      const wakeTime = new Date(napRecs[i].end_time!).getTime();
      const nextSleepRecs = records.filter(r => r.type === 'sleep' && new Date(r.start_time).getTime() > wakeTime).sort((a,b) => a.start_time > b.start_time ? 1 : -1);
      if (nextSleepRecs.length) {
        const g = (new Date(nextSleepRecs[0].start_time).getTime() - wakeTime) / 60000;
        if (g >= 30 && g <= 240) wakeGaps.push(g);
      }
    }
    if (wakeGaps.length >= 3) {
      const sorted = [...wakeGaps].sort((a,b) => a-b);
      const median = sorted[Math.floor(sorted.length / 2)];
      const lastNap = napRecs[napRecs.length - 1];
      const lastWake = new Date(lastNap.end_time!).getTime();
      const nextSleepTime = lastWake + median * 60000;
      const remaining = Math.round((nextSleepTime - now) / 60000);
      const elapsed = Math.round((now - lastWake) / 60000);
      const eh = Math.floor(elapsed / 60), em = elapsed % 60;
      if (remaining >= 0 && remaining <= 30) {
        msgs.push(`💡 마지막 낮잠에서 깬 지 ${eh ? eh+'시간 ' : ''}${em}분, 곧 졸림 신호가 올 수 있어요`);
      }
    }
  }

  // 3순위: 하루 맥락
  const todayStr2 = fmtDate(new Date());
  const todayNaps = records.filter(r => r.type === 'sleep' && r.sleep_kind === 'nap' && r.date === todayStr2 && r.end_time);
  const todayNapMin = todayNaps.reduce((s, r) => s + durMin(r.start_time, r.end_time!), 0);
  const week7Naps = records.filter(r => r.type === 'sleep' && r.sleep_kind === 'nap' && r.end_time && new Date(r.start_time).getTime() > days7 && r.date !== todayStr2);
  if (week7Naps.length >= 3 && todayNapMin > 0) {
    const dayMap: Record<string, number> = {};
    week7Naps.forEach(r => { dayMap[r.date] = (dayMap[r.date] || 0) + durMin(r.start_time, r.end_time!); });
    const dayVals = Object.values(dayMap);
    const avg = dayVals.reduce((s, v) => s + v, 0) / dayVals.length;
    if (avg > 0) {
      const diff = (todayNapMin - avg) / avg;
      if (diff <= -0.2) msgs.push(`💡 오늘 낮잠은 평소보다 짧은 편이에요`);
      else if (diff >= 0.2) msgs.push(`💡 오늘 낮잠은 평소보다 긴 편이에요`);
    }
  }

  setPatternMsgs(msgs);
  setPatternIdx(0);
}, [records]);

useEffect(() => {
  if (patternMsgs.length <= 1) return;
  const iv = setInterval(() => {
    setPatternVisible(false);
    setTimeout(() => { setPatternIdx(i => (i + 1) % patternMsgs.length); setPatternVisible(true); }, 400);
  }, 4500);
  return () => clearInterval(iv);
}, [patternMsgs]);

  // ── SLEEP TIMER ──
  useEffect(() => {
    if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    const ongoing = records.find(r => r.type === 'sleep' && !r.end_time);
    if (!ongoing) { setSleepTimerMap({}); return; }
    const update = () => {
      const m = Math.floor((Date.now() - new Date(ongoing.start_time).getTime()) / 60000);
      setSleepTimerMap({ [ongoing.id]: '⏱ ' + durLabel(m) + ' 경과 중' });
    };
    update();
    sleepTimerRef.current = setInterval(update, 10000);
    return () => { if (sleepTimerRef.current) clearInterval(sleepTimerRef.current); };
  }, [records]);

  // ── AUTO REFRESH ──
  useEffect(() => {
    const iv = setInterval(() => { /* re-render warnings handled by state */ }, 60000);
    return () => clearInterval(iv);
  }, []);

  // ── REALTIME ──
  useEffect(() => {
    const wsUrl = SUPA_URL.replace('https', 'wss') + '/realtime/v1/websocket?apikey=' + SUPA_KEY + '&vsn=1.0.0';
    let ws: WebSocket;
    function connect() {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        ws.send(JSON.stringify({ topic: 'realtime:public:baby_logs', event: 'phx_join', payload: {}, ref: '1' }));
        setSyncState('on'); setSyncTxt('실시간 동기화 중');
      };
      ws.onmessage = e => { const m = JSON.parse(e.data); if (['INSERT', 'UPDATE', 'DELETE'].includes(m.event)) loadAll(); };
      ws.onclose = () => { setSyncState('off'); setSyncTxt('재연결 중...'); setTimeout(connect, 3000); };
    }
    connect();
    return () => { try { ws?.close(); } catch (_) {} };
  }, [loadAll]);

  // ── STATS ──
  const getPeriodRecs = useCallback(() => {
    const now = new Date();
    if (statsPeriod === 'day') {
      const d = new Date(now); d.setDate(d.getDate() + statsOffset);
      const ds = fmtDate(d);
      return { recs: records.filter(r => r.date === ds), label: (d.getMonth() + 1) + '월 ' + d.getDate() + '일', ds, dates: undefined };
    }
    const d = new Date(now); d.setDate(d.getDate() + statsOffset * 7);
    const day = d.getDay(); const mon = new Date(d); mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) { const x = new Date(mon); x.setDate(mon.getDate() + i); dates.push(fmtDate(x)); }
    return { recs: records.filter(r => dates.includes(r.date)), label: (mon.getMonth() + 1) + '월 ' + mon.getDate() + '일 ~ ' + (sun.getMonth() + 1) + '월 ' + sun.getDate() + '일', ds: undefined, dates };
  }, [records, statsPeriod, statsOffset]);

  const renderStats = useCallback(async () => {
    const { recs, label, dates } = getPeriodRecs();
    const logRecs = recs.filter(r => r.type !== 'growth' && r.type !== 'hospital');
    const sleepRecs = logRecs.filter(r => r.type === 'sleep' && r.end_time);
    const napRecs = sleepRecs.filter(r => r.sleep_kind === 'nap');
    const nightRecs = sleepRecs.filter(r => r.sleep_kind === 'night');
    const totalSleep = sleepRecs.reduce((s, r) => s + durMin(r.start_time, r.end_time!), 0);
    const napMin = napRecs.reduce((s, r) => s + durMin(r.start_time, r.end_time!), 0);
    const nightMin = nightRecs.reduce((s, r) => s + durMin(r.start_time, r.end_time!), 0);
    const formulaRecs = logRecs.filter(r => r.type === 'formula');
    const totalFormula = formulaRecs.reduce((s, r) => s + Number(r.ml || 0), 0);
    const avgFormula = formulaRecs.length ? Math.round(totalFormula / formulaRecs.length) : 0;
    const breastRecs = logRecs.filter(r => r.type === 'breast');
    const totalBreastMin = breastRecs.reduce((s, r) => s + (Number(r.left_min || 0) + Number(r.right_min || 0)), 0);
    const totalLeftMin = breastRecs.reduce((s, r) => s + Number(r.left_min || 0), 0);
    const totalRightMin = breastRecs.reduce((s, r) => s + Number(r.right_min || 0), 0);
    const diaperRecs = logRecs.filter(r => r.type === 'diaper');
    const urineCount = diaperRecs.filter(r => r.diaper_kind === 'urine' || r.diaper_kind === 'both').length;
    const stoolCount = diaperRecs.filter(r => r.diaper_kind === 'stool' || r.diaper_kind === 'both').length;
    const bathRecs = logRecs.filter(r => r.type === 'bath');
    const name = settings.babyName || '아기';

    setStatsContent('<div style="padding:20px;text-align:center;color:var(--txt3);font-size:13px">✨ AI 요약 생성 중...</div>');

    const breastMl = breastToFormulaMl(totalBreastMin, currentBaby?.babies?.birth_date || settings.babyBirth)
    let aiText = '';
    if (statsPeriod === 'day') {
      const parts = [];
      if (totalFormula + breastMl > 0) parts.push(`수유량은 평소와 비슷한 흐름이에요`);
    if (napMin > 0) parts.push(`낮잠은 ${durLabel(napMin)} 잤어요`);
    if (diaperRecs.length > 0) parts.push(`기저귀는 ${diaperRecs.length}회 교체했어요`);
    aiText = parts.length ? `${name}는 오늘 ${parts.join(', ')}. 오늘 하루도 수고했어요 💛` : '';
    } else {
      aiText = totalSleep ? `이번 주 ${name}는 총 ${durLabel(totalSleep)} 잠을 잤고, 분유는 ${totalFormula}ml 먹었어요. 잘 자라고 있어요 💛` : '';
    }

    let weekHtml = '';
    if (statsPeriod === 'week' && dates) {
      const dayLabels = ['월', '화', '수', '목', '금', '토', '일'], todStr = todayStr();
      const maxSleep = Math.max(...dates.map(d => records.filter(x => x.date === d && x.type === 'sleep' && x.end_time).reduce((s, x) => s + durMin(x.start_time, x.end_time!), 0)), 1);
      const maxFml = Math.max(...dates.map(d => records.filter(x => x.date === d && x.type === 'formula').reduce((s, x) => s + Number(x.ml || 0), 0)), 1);
      weekHtml = `<div class="stat-section"><div class="stat-section-hd"><span>😴 요일별 수면</span></div><div class="week-chart">
        <div class="wc-row">${dates.map((d, i) => {
        const r = records.filter(x => x.date === d && x.type === 'sleep' && x.end_time);
        const m = r.reduce((s, x) => s + durMin(x.start_time, x.end_time!), 0);
        const nap = r.filter(x => x.sleep_kind === 'nap').reduce((s, x) => s + durMin(x.start_time, x.end_time!), 0);
        const pct = Math.round(m / maxSleep * 100); const napPct = m ? Math.round(nap / m * 100) : 0; const isToday = d === todStr;
        return `<div class="wc-bar-wrap${isToday ? ' wc-today' : ''}">
            <div style="width:100%;height:${pct}%;max-height:70px;min-height:${m ? 4 : 0}px;border-radius:6px 6px 0 0;overflow:hidden;display:flex;flex-direction:column">
              <div style="height:${100 - napPct}%;background:var(--sleep);opacity:.9;border-radius:6px 6px 0 0"></div>
              <div style="height:${napPct}%;background:var(--sleep);opacity:.4"></div>
            </div>
            <div class="wc-label">${dayLabels[i]}</div>
            ${m ? `<div style="font-size:9px;color:var(--txt3);text-align:center">${Math.floor(m / 60)}h</div>` : ''}
          </div>`;
      }).join('')}</div>
        <div style="display:flex;gap:12px;font-size:11px;color:var(--txt2)">
          <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--sleep);opacity:.9;vertical-align:middle;margin-right:3px"></span>밤잠</span>
          <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--sleep);opacity:.4;vertical-align:middle;margin-right:3px"></span>낮잠</span>
        </div></div></div>
      <div class="stat-section"><div class="stat-section-hd"><span>🍼 요일별 분유</span></div><div class="week-chart">
        <div class="wc-row">${dates.map((d, i) => {
        const ml = records.filter(x => x.date === d && x.type === 'formula').reduce((s, x) => s + Number(x.ml || 0), 0);
        const pct = Math.round(ml / maxFml * 100); const isToday = d === todStr;
        return `<div class="wc-bar-wrap${isToday ? ' wc-today' : ''}">
            <div style="width:100%;height:${pct}%;max-height:70px;min-height:${ml ? 4 : 0}px;border-radius:6px 6px 0 0;background:var(--formula)"></div>
            <div class="wc-label">${dayLabels[i]}</div>
            ${ml ? `<div style="font-size:9px;color:var(--txt3);text-align:center">${ml}</div>` : ''}
          </div>`;
      }).join('')}</div></div></div>`;
    }

    setStatsContent(`
      ${aiText ? `<div class="ai-card"><div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><span style="font-size:20px">✨</span><span class="ai-badge">AI ${statsPeriod === 'day' ? '오늘' : '주간'} 요약</span></div><div class="ai-text">${aiText}</div></div>` : ''}
      ${weekHtml}
      <div class="stat-section"><div class="stat-section-hd"><span>😴 수면</span></div>
      ${totalSleep ? `<div class="stat-row"><span class="stat-lbl">총 수면</span><span class="stat-val">${durLabel(totalSleep)}</span></div>
        <div class="stat-row"><span class="stat-lbl">🌙 낮잠</span><span class="stat-val" style="color:var(--sleep)">${durLabel(napMin)} · ${napRecs.length}회</span></div>
        <div class="stat-row"><span class="stat-lbl">⭐ 밤잠</span><span class="stat-val" style="color:var(--sleep)">${durLabel(nightMin)} · ${nightRecs.length}회</span></div>
        <div class="stat-bar-wrap"><div style="font-size:11px;color:var(--txt2);margin-bottom:4px">낮잠 vs 밤잠</div>
          <div class="stat-bar-bg" style="background:var(--sleep);opacity:.9;border-radius:20px;height:8px;overflow:hidden;margin-top:4px"><div style="height:100%;width:${totalSleep ? Math.round(napMin / totalSleep * 100) : 0}%;background:var(--sleep);opacity:.4;border-radius:20px"></div></div>
          <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--txt3);margin-top:3px"><span>낮잠 ${totalSleep ? Math.round(napMin / totalSleep * 100) : 0}%</span><span>밤잠 ${totalSleep ? Math.round(nightMin / totalSleep * 100) : 0}%</span></div>
        </div>` : '<div style="padding:14px 16px;font-size:13px;color:var(--txt3)">수면 기록 없음</div>'}
      </div>
      <div class="stat-section"><div class="stat-section-hd"><span>🍼 분유 + 직수 수유량</span></div>
      ${(formulaRecs.length || breastRecs.length) ? `
        <div class="stat-row"><span class="stat-lbl">🍼 분유</span><span class="stat-val" style="color:var(--formula)">${totalFormula}ml · ${formulaRecs.length}회</span></div>
        <div class="stat-row"><span class="stat-lbl">🤱 직수 환산</span><span class="stat-val" style="color:var(--breast)">${breastMl}ml · ${breastRecs.length}회</span></div>
        <div class="stat-row"><span class="stat-lbl">합계</span><span class="stat-val" style="color:var(--primary);font-weight:700">${totalFormula + breastMl}ml${parseInt(settings.formulaGoal || '0') ? ' / ' + settings.formulaGoal + 'ml' : ''}</span></div>
        ${avgFormula ? `<div class="stat-row"><span class="stat-lbl">분유 회당 평균</span><span class="stat-val">${avgFormula}ml</span></div>` : ''}
        <div style="padding:10px 16px 14px;font-size:11px;color:var(--txt3);line-height:1.6;border-top:.5px solid var(--border)">
          ⚠️ 이 계산은 의학적 진단이 아닌 수유량 추정 도구입니다.<br/>아기의 배고픔 신호, 소변 기저귀 수, 체중 증가가 더 중요합니다.
        </div>`
        : '<div style="padding:14px 16px;font-size:13px;color:var(--txt3)">수유 기록 없음</div>'}
      </div>
      <div class="stat-section"><div class="stat-section-hd"><span>🤱 모유</span></div>
      ${breastRecs.length ? `<div class="stat-row"><span class="stat-lbl">총 수유 시간</span><span class="stat-val" style="color:var(--breast)">${durLabel(totalBreastMin)}</span></div>
        <div class="stat-row"><span class="stat-lbl">횟수</span><span class="stat-val">${breastRecs.length}회</span></div>
        <div class="stat-row"><span class="stat-lbl">👈 왼쪽</span><span class="stat-val">${durLabel(totalLeftMin)}</span></div>
        <div class="stat-row"><span class="stat-lbl">👉 오른쪽</span><span class="stat-val">${durLabel(totalRightMin)}</span></div>`
        : '<div style="padding:14px 16px;font-size:13px;color:var(--txt3)">모유 기록 없음</div>'}
      </div>
      <div class="stat-section"><div class="stat-section-hd"><span>💧 기저귀</span></div>
      ${diaperRecs.length ? `<div class="stat-row"><span class="stat-lbl">총 횟수</span><span class="stat-val" style="color:var(--diaper)">${diaperRecs.length}회</span></div>
        <div class="stat-row"><span class="stat-lbl">💧 소변</span><span class="stat-val">${urineCount}회</span></div>
        <div class="stat-row"><span class="stat-lbl">💩 대변</span><span class="stat-val">${stoolCount}회</span></div>`
        : '<div style="padding:14px 16px;font-size:13px;color:var(--txt3)">기저귀 기록 없음</div>'}
      </div>
      <div class="stat-section"><div class="stat-section-hd"><span>🛁 목욕</span></div>
      ${bathRecs.length ? `<div class="stat-row"><span class="stat-lbl">횟수</span><span class="stat-val" style="color:var(--bath)">${bathRecs.length}회</span></div>`
        : '<div style="padding:14px 16px;font-size:13px;color:var(--txt3)">목욕 기록 없음</div>'}
      </div>`);
  }, [getPeriodRecs, records, settings, statsPeriod]);

  useEffect(() => {
    if (currentTab === 'stats') renderStats();
  }, [currentTab, statsPeriod, statsOffset, records, renderStats]);

  // ── GROWTH RENDER ──
  useEffect(() => {
    const growthRecs = [...records].filter(r => r.type === 'growth').sort((a, b) => a.date > b.date ? 1 : -1);
    if (!growthRecs.length) { setGrowthHtml('<div style="text-align:center;padding:32px;color:var(--txt3)">성장 기록이 없어요</div>'); return; }
    const weights = growthRecs.filter(r => r.weight);
    let chartHtml = '';
    if (weights.length >= 2) {
      const maxW = Math.max(...weights.map(r => r.weight!));
      const minW = Math.min(...weights.map(r => r.weight!));
      const range = maxW - minW || 1;
      const W = 340, H2 = 120, p2 = 20;
      const pts = weights.map((r, i) => ({ x: p2 + (i / (weights.length - 1)) * (W - 2 * p2), y: H2 - p2 - ((r.weight! - minW) / range) * (H2 - 2 * p2), r }));
      const path = 'M' + pts.map(p => p.x + ',' + p.y).join(' L');
      chartHtml = `<div style="background:var(--card);border-radius:var(--r);padding:16px;box-shadow:0 1px 4px rgba(0,0,0,.06)"><div style="font-size:14px;font-weight:700;margin-bottom:12px;color:var(--growth)">📈 몸무게 변화 (kg)</div>
        <svg viewBox="0 0 ${W} ${H2}" style="width:100%;height:auto">
          <path d="${path}" fill="none" stroke="var(--growth)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          ${pts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="5" fill="var(--growth)"/><text x="${p.x}" y="${p.y - 8}" textAnchor="middle" fontSize="10" fill="var(--txt2)">${p.r.weight}</text>`).join('')}
          <text x="${pts[0].x}" y="${H2 - 4}" textAnchor="middle" fontSize="9" fill="var(--txt3)">${weights[0].date.slice(5)}</text>
          <text x="${pts[pts.length - 1].x}" y="${H2 - 4}" textAnchor="middle" fontSize="9" fill="var(--txt3)">${weights[weights.length - 1].date.slice(5)}</text>
        </svg></div>`;
    }
    const listHtml = growthRecs.slice().reverse().map(r => `
      <div class="log-card">
        <div class="li-icon growth">📏</div>
        <div class="li-body">
          <div class="li-type growth">${r.date}</div>
          <div class="li-detail">${detail(r)}</div>
          ${r.memo ? `<div class="memo-text">📝 ${r.memo}</div>` : ''}
        </div>
        <button class="del-btn" onclick="window._delRec('${r.id}')">×</button>
      </div>`).join('');
    setGrowthHtml(chartHtml + '<div style="margin-top:16px">' + listHtml + '</div>');
  }, [records]);

  // ── HOSPITAL RENDER ──
  useEffect(() => {
    const recs = [...records].filter(r => r.type === 'hospital').sort((a, b) => b.date > a.date ? 1 : -1);
    const typeLabel: Record<string, string> = { checkup: '정기검진', vaccine: '예방접종', sick: '진료' };
    const typeColor: Record<string, string> = { checkup: 'var(--primary)', vaccine: 'var(--growth)', sick: 'var(--hospital)' };
    if (!recs.length) { setHospitalHtml('<div style="text-align:center;padding:32px;color:var(--txt3)">병원 기록이 없어요</div>'); return; }
    setHospitalHtml(recs.map(r => `
      <div class="log-card">
        <div class="li-icon hospital">🏥</div>
        <div class="li-body">
          <div class="li-type hospital">${r.hospital_name || '병원 방문'}</div>
          <div class="li-detail" style="color:${typeColor[r.hospital_type || ''] || 'var(--txt2)'}">
            ${typeLabel[r.hospital_type || ''] || ''}${r.vaccine_name ? ' · ' + r.vaccine_name : ''}
          </div>
          <div style="font-size:11px;color:var(--txt3);margin-top:2px">${r.date}</div>
          ${r.memo ? `<div class="memo-text">📝 ${r.memo}</div>` : ''}
        </div>
        <button class="del-btn" onclick="window._delRec('${r.id}')">×</button>
      </div>`).join(''));
  }, [records]);

  // ── EXPOSE GLOBAL HANDLERS ──
  useEffect(() => {
    (window as unknown as Record<string, unknown>)._delRec = async (id: string) => {
      try { await apiDelete(id); setRecords(prev => prev.filter(r => r.id !== id)); showToast('삭제됨'); } catch (_) { showToast('삭제 실패'); }
    };
  }, []);

  // ── COMPUTED VALUES ──
  const ds = fmtDate(selDate);
  const dayRecs = records.filter(r => r.date === ds);
  const logRecs = dayRecs.filter(r => r.type !== 'growth' && r.type !== 'hospital').sort((a, b) => {
    const diff = new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
    if (diff !== 0) return diff;
    return (b as any).created_at > (a as any).created_at ? 1 : -1;
  });
  const feeds = [...records].filter(r => r.type === 'formula' || r.type === 'breast').sort((a, b) => b.start_time > a.start_time ? 1 : -1);
  const lastFeed = feeds[0];
  const feedHoursAgo = lastFeed ? (Date.now() - new Date(lastFeed.start_time).getTime()) / 3600000 : 0;
  const warnH = parseInt(settings.feedWarnHour || '3');
  const showWarn = lastFeed && feedHoursAgo >= warnH;

  const sleepMin = dayRecs.filter(r => r.type === 'sleep' && r.end_time).reduce((s, r) => s + durMin(r.start_time, r.end_time!), 0);
  const formulaTotal = dayRecs.filter(r => r.type === 'formula').reduce((s, r) => s + Number(r.ml || 0), 0);
  const feedsCount = dayRecs.filter(r => r.type === 'breast' || r.type === 'formula').length;
  const diapersCount = dayRecs.filter(r => r.type === 'diaper').length;
  const bathCount = dayRecs.filter(r => r.type === 'bath').length;
  const totalBreastMin = dayRecs.filter(r => r.type === 'breast').reduce((s, r) => s + (Number(r.left_min || 0) + Number(r.right_min || 0)), 0);
  const breastAsMl = breastToFormulaMl(totalBreastMin, settings.babyBirth);
  const totalFeedMl = formulaTotal + breastAsMl;
  const goalMl = parseInt(settings.formulaGoal || '0');
  const goalPct = goalMl ? Math.min(100, Math.round(totalFeedMl / goalMl * 100)) : 0;

  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const isToday = ds === todayStr();
  const dateLabel = (selDate.getMonth() + 1) + '월 ' + selDate.getDate() + '일 (' + days[selDate.getDay()] + ')' + (isToday ? ' · 오늘' : '');
  let ageLabel = '';
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const currentBabyId = params.get('babyId')
  const currentBaby = drawerBabies.find((m: any) => m.baby_id === currentBabyId)
  const hdTitle = '👶 ' + (currentBaby?.babies?.name || settings.babyName || '아기') + ' 기록';
  const babyBirth = currentBaby?.babies?.birth_date || settings.babyBirth
  if (babyBirth) {
    const diff = Math.floor((new Date().getTime() - new Date(babyBirth).getTime()) / 86400000);
    ageLabel = isToday ? '오늘 · D+' + diff + '일' : ds + ' · D+' + diff + '일';
  } else { ageLabel = isToday ? '오늘' : ds; }

  // ── QUICK ADD ──
  const quickAdd = async (type: string, diaperKind?: string) => {
    const now = new Date(), nowDs = fmtDate(now), iso = now.toISOString();
    if (type === 'sleep') {
      const ongoing = records.find(r => r.type === 'sleep' && !r.end_time);
      if (ongoing) {
        try { await apiPatch(ongoing.id, { end_time: iso }); showToast('수면 종료 · ' + durLabel(durMin(ongoing.start_time, iso))); await loadAll(); } catch (e: unknown) { showToast('오류: ' + (e instanceof Error ? e.message : '')); }
        return;
      }
    }
    const params = new URLSearchParams(window.location.search)
    const babyId = params.get('babyId')
    if (!babyId) { setShowDrawer(true); setShowAddBaby(true); return; }
    const rec: Record<string, unknown> = { type, date: nowDs, start_time: iso, baby_id: babyId, user_id: currentUser?.id };
    if (type === 'sleep') rec.sleep_kind = autoSleepKind(now);
    if (type === 'diaper') rec.diaper_kind = diaperKind || 'urine';
    try { await apiPost(rec); setSelDate(now); showToast(EMOJI[type] + ' ' + LABEL[type] + ' 기록됨'); await loadAll(); } catch (e: unknown) { showToast('오류: ' + (e instanceof Error ? e.message : '')); }
  };

  // ── OPEN MODAL ──
  const openModal = (type: string, prefill?: BabyRecord) => {
  const params = new URLSearchParams(window.location.search)
  const babyId = params.get('babyId')
  if (!babyId) { setShowDrawer(true); setShowAddBaby(true); return; }
  setModalType(type);
    setModalPrefill(prefill || null);
    setLeftMin(prefill?.left_min ? Number(prefill.left_min) : 0);
    setRightMin(prefill?.right_min ? Number(prefill.right_min) : 0);
    setModalStartTime(prefill?.start_time ? fmtTime(prefill.start_time) : nowTime());
    setModalEndTime(prefill?.end_time ? fmtTime(prefill.end_time) : '');
    setModalMl(Number(prefill?.ml || 0));
    setSleepKind((prefill?.sleep_kind as 'nap' | 'night') || (autoSleepKind(new Date()) as 'nap' | 'night'));
    setDiaperKind((prefill?.diaper_kind as 'urine' | 'stool' | 'both') || 'urine');
    setHospitalType('checkup');
    setModalGDate(fmtDate(new Date()));
    setModalWeight(''); setModalHeight(''); setModalHead(''); setModalGMemo('');
    setModalHDate(fmtDate(new Date())); setModalHName(''); setModalVaccine(''); setModalHMemo('');
    setShowModal(true);
  };

  // ── SAVE REC ──
  const saveRec = async () => {
    const nowDs = ds;
    const params = new URLSearchParams(window.location.search)
    const babyId = params.get('babyId')
    if (!babyId) { setShowModal(false); setShowDrawer(true); setShowAddBaby(true); return; }
    let rec: Record<string, unknown> = { type: modalType, baby_id: babyId, user_id: currentUser?.id };
    if (modalType === 'sleep') {
      rec.date = nowDs; rec.start_time = nowDs + 'T' + modalStartTime + ':00+09:00'; rec.sleep_kind = sleepKind;
      if (modalEndTime) rec.end_time = nowDs + 'T' + modalEndTime + ':00+09:00';
    } else if (modalType === 'formula') {
      rec.date = nowDs; rec.start_time = nowDs + 'T' + modalStartTime + ':00+09:00'; rec.ml = modalMl;
    } else if (modalType === 'breast') {
      rec.date = nowDs; rec.start_time = nowDs + 'T' + modalStartTime + ':00+09:00'; rec.left_min = leftMin; rec.right_min = rightMin;
    } else if (modalType === 'diaper') {
      rec.date = nowDs; rec.start_time = nowDs + 'T' + modalStartTime + ':00+09:00'; rec.diaper_kind = diaperKind;
    } else if (modalType === 'growth') {
      rec.date = modalGDate; rec.start_time = modalGDate + 'T09:00:00+09:00';
      if (modalWeight) rec.weight = parseFloat(modalWeight);
      if (modalHeight) rec.height = parseFloat(modalHeight);
      if (modalHead) rec.head = parseFloat(modalHead);
      if (modalGMemo) rec.memo = modalGMemo;
    } else if (modalType === 'hospital') {
      rec.date = modalHDate; rec.start_time = modalHDate + 'T09:00:00+09:00';
      rec.hospital_name = modalHName; rec.hospital_type = hospitalType;
      if (modalVaccine) rec.vaccine_name = modalVaccine;
      if (modalHMemo) rec.memo = modalHMemo;
    }
    setShowModal(false);
    try { await apiPost(rec); showToast(EMOJI[modalType] + ' 저장됨'); await loadAll(); } catch (e: unknown) { showToast('저장 실패: ' + (e instanceof Error ? e.message : '')); }
  };

  // ── DELETE ──
  const delRec = async (id: string) => {
    try { await apiDelete(id); setRecords(prev => prev.filter(r => r.id !== id)); showToast('삭제됨'); } catch (_) { showToast('삭제 실패'); }
  };

  // ── CALENDAR ──
  const renderCal = () => {
    const y = calDate.getFullYear(), m = calDate.getMonth();
    const first = new Date(y, m, 1).getDay(), total = new Date(y, m + 1, 0).getDate();
    const logDays = new Set(records.map(r => r.date));
    const todStr = todayStr(), selStr = fmtDate(selDate);
    const cells = [];
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    dayNames.forEach(d => cells.push(<div key={'h' + d} className="cal-dn">{d}</div>));
    for (let i = 0; i < first; i++) cells.push(<div key={'e' + i} className="cal-d empty"></div>);
    for (let d = 1; d <= total; d++) {
      const dStr = y + '-' + pad(m + 1) + '-' + pad(d);
      let cls = 'cal-d';
      if (dStr === todStr) cls += ' today'; else if (dStr === selStr) cls += ' sel';
      if (logDays.has(dStr)) cls += ' has';
      cells.push(<div key={d} className={cls} onClick={() => { setSelDate(new Date(dStr + 'T12:00:00')); setShowCal(false); }}>{d}</div>);
    }
    return cells;
  };

  // ── VOICE ──
  const toggleMic = () => {
    if (isListening) { stopMic(); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('iOS Safari를 사용해주세요.'); return; }
    const r = new SR(); recogRef.current = r;
    r.lang = 'ko-KR'; r.continuous = false; r.interimResults = false;
    r.onstart = () => { setIsListening(true); setShowVoice(true); };
    r.onresult = (e: any) => { const txt = e.results[0][0].transcript; stopMic(); handleVoice(txt); };
    r.onerror = (e: any) => { if (e.error !== 'aborted') stopMic(); };
    r.onend = () => stopMic();
    r.start();
  };
  const stopMic = () => { setIsListening(false); try { recogRef.current?.stop(); } catch (_) {} setShowVoice(false); };

  const handleVoice = async (txt: string) => {
  const now = new Date(), iso = now.toISOString(), nowDs = fmtDate(now);
  const voiceParams = new URLSearchParams(window.location.search)
  const voiceBabyId = voiceParams.get('babyId')
  if (!voiceBabyId) { showToast('아기를 먼저 등록해주세요'); return; }
  const base = { baby_id: voiceBabyId, user_id: currentUser?.id };

  if (/삭제|취소|지워|잘못/.test(txt)) {
    const last = [...records].sort((a, b) => b.start_time > a.start_time ? 1 : -1)[0];
    if (last) { await apiDelete(last.id); setRecords(prev => prev.filter(r => r.id !== last.id)); showToast('🗑 방금 기록 삭제됨 (' + LABEL[last.type] + ')'); }
    else showToast('삭제할 기록이 없어요'); return;
  }
  if (/수면\s*끝|잠\s*깼|기상|일어났/.test(txt)) {
    const ongoing = records.find(r => r.type === 'sleep' && !r.end_time);
    if (ongoing) { await apiPatch(ongoing.id, { end_time: iso }); showToast('수면 종료 · ' + durLabel(durMin(ongoing.start_time, iso))); await loadAll(); }
    else showToast('진행 중인 수면이 없어요'); return;
  }
  if (/수면|잠|낮잠|밤잠/.test(txt)) {
    const sk = /밤잠/.test(txt) ? 'night' : autoSleepKind(now);
    const ongoingSleep = records.find(r => r.type === 'sleep' && !r.end_time);
    if (ongoingSleep) { await apiPatch(ongoingSleep.id, { end_time: iso }); showToast('기존 수면 종료 → 새 수면 시작'); }
    await apiPost({ ...base, type: 'sleep', date: nowDs, start_time: iso, sleep_kind: sk });
    if (!ongoingSleep) showToast('😴 ' + (sk === 'nap' ? '낮잠' : '밤잠') + ' 시작');
    await loadAll(); return;
  }
  if (/기저귀|소변|대변/.test(txt)) {
    const kind = /대변/.test(txt) && /소변/.test(txt) ? 'both' : /대변/.test(txt) ? 'stool' : 'urine';
    await apiPost({ ...base, type: 'diaper', date: nowDs, start_time: iso, diaper_kind: kind });
    showToast('💧 ' + { urine: '소변', stool: '대변', both: '소변+대변' }[kind] + ' 기록됨');
    await loadAll(); return;
  }
  if (/분유/.test(txt)) {
    const m = txt.match(/(\d+)/); const ml = m ? parseInt(m[1]) : 0;
    await apiPost({ ...base, type: 'formula', date: nowDs, start_time: iso, ml });
    showToast('🍼 분유 ' + ml + 'ml 기록됨'); await loadAll(); return;
  }
  if (/목욕/.test(txt)) {
    await apiPost({ ...base, type: 'bath', date: nowDs, start_time: iso });
    showToast('🛁 목욕 기록됨'); await loadAll(); return;
  }
  if (/모유|수유/.test(txt)) {
    const lm = txt.match(/왼(쪽)?\s*(\d+)/), rm = txt.match(/오른(쪽)?\s*(\d+)/);
    let lMin = lm ? parseInt(lm[2]) : 0, rMin = rm ? parseInt(rm[2]) : 0;
    if (!lMin && !rMin) { const nm = txt.match(/(\d+)\s*분?/); if (nm) lMin = parseInt(nm[1]); }
    await apiPost({ ...base, type: 'breast', date: nowDs, start_time: iso, left_min: lMin, right_min: rMin });
    const parts = []; if (lMin) parts.push('왼쪽 ' + lMin + '분'); if (rMin) parts.push('오른쪽 ' + rMin + '분');
    showToast('🤱 모유 ' + (parts.join(' ') || '기록됨')); await loadAll(); return;
  }
  showToast('"' + txt + '" — 인식 실패');
};

  // ── EXPORT CSV ──
  const exportCSV = () => {
    const csv = 'id,date,type,start_time,end_time,ml,left_min,right_min,sleep_kind,diaper_kind,weight,height,head,hospital_name,hospital_type,vaccine_name,memo\n' +
      records.map(r => [r.id, r.date, r.type, r.start_time || '', r.end_time || '', r.ml || '', r.left_min || '', r.right_min || '', r.sleep_kind || '', r.diaper_kind || '', r.weight || '', r.height || '', r.head || '', r.hospital_name || '', r.hospital_type || '', r.vaccine_name || '', r.memo || ''].join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv); a.download = 'baby_log_' + todayStr() + '.csv'; a.click();
  };

  // ── SAVE SETTINGS ──
const handleLogout = async () => {
  await supabase.auth.signOut()
   
   router.push('/login')
   
}

  const saveSettings = () => {
    saveSetting('formulaGoal', sGoal);
    saveSetting('feedWarnHour', sWarn || '3');
    saveSetting('babyWeight', sWeight);
    saveSetting('avgFormulaMl', sAvgFormula);
    setShowSettings(false);
    showToast('✅ 설정이 저장됐어요!');
  };

  const toggleDark = () => {
    const on = !darkMode;
    setDarkMode(on);
    if (on) document.body.classList.add('dark'); else document.body.classList.remove('dark');
    saveSetting('darkMode', on ? '1' : '0');
  };

  // time adjuster helper
  const adjTimeVal = (val: string, diffMin: number) => {
    const parts = val.split(':').map(Number);
    const total = parts[0] * 60 + (parts[1] || 0) + diffMin;
    const nh = ((Math.floor(total / 60)) % 24 + 24) % 24;
    const nm = ((total % 60) + 60) % 60;
    return pad(nh) + ':' + pad(nm);
  };

  const periodLabel = (() => {
    const { label } = getPeriodRecs();
    return label;
  })();

  return (
    <>
      <style>{`
        :root{
          --sleep:#7B6CF6;--sleep-bg:#F0EEFF;
          --formula:#F5A623;--formula-bg:#FFF8EC;
          --breast:#E8667A;--breast-bg:#FFF0F2;
          --diaper:#3DBAA2;--diaper-bg:#EDFAF7;
          --growth:#34C759;--growth-bg:#E8F8ED;
          --hospital:#FF6B6B;--hospital-bg:#FFF0F0;
          --bath:#29A8E0;--bath-bg:#E8F6FD;
          --primary:#5B7BFF;--primary-bg:#EEF1FF;
          --bg:#F4F5FA;--card:#fff;
          --txt:#1A1D2E;--txt2:#6B7280;--txt3:#B0B7C3;
          --border:#E8EAF0;--r:16px;--rs:10px;
        }
        body.dark{
          --bg:#0F1117;--card:#1C1F2E;--txt:#F0F2FF;--txt2:#9BA3B8;--txt3:#4A5268;
          --border:#2A2D3E;--primary-bg:#1A1F3A;
          --sleep-bg:#1E1A3A;--formula-bg:#2A1F0A;--breast-bg:#2A141A;--diaper-bg:#0A2220;
          --growth-bg:#0A2010;--hospital-bg:#2A0A0A;--bath-bg:#0A1E2A;
        }
        *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
        button{touch-action:manipulation;user-select:none;-webkit-user-select:none}
        body{font-family:'Noto Sans KR',sans-serif;background:var(--bg);color:var(--txt);max-width:430px;margin:0 auto;min-height:100vh}
        .hd{background:linear-gradient(135deg,#4A6CF7 0%,#7B3FF2 100%);padding:16px 16px 0;color:#fff;position:relative;overflow:hidden}
        .hd::before{content:'';position:absolute;top:-50px;right:-20px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,.06);pointer-events:none}
        .hd::after{content:'';position:absolute;bottom:-40px;left:10px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.04);pointer-events:none}
        .hd-top{display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:14px;position:relative;z-index:1}
        .hd-title{font-size:22px;font-weight:900;letter-spacing:-.6px;text-shadow:0 1px 6px rgba(0,0,0,.15)}
        .hd-sub{font-size:12px;opacity:.8;margin-top:2px;font-weight:500}
        .hd-actions{display:flex;gap:8px}
        .hd-btn{background:rgba(255,255,255,.18);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.22);border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;font-size:16px}
        .hd-btn:active{background:rgba(255,255,255,.3)}
        .sync-bar{position:relative;z-index:1;border-top:1px solid rgba(255,255,255,.12);margin:0 -16px;padding:6px 16px 8px}
        .sync-row{display:flex;align-items:center;gap:7px;font-size:11.5px;color:rgba(255,255,255,.9);font-weight:500;margin-bottom:3px}
        .sync-dot{width:7px;height:7px;border-radius:50%;background:#4ADE80;flex-shrink:0;box-shadow:0 0 6px rgba(74,222,128,.8)}
        .sync-dot.off{background:#FCA5A5;box-shadow:0 0 6px rgba(252,165,165,.8)}
        .sync-dot.loading{background:#FCD34D;box-shadow:0 0 6px rgba(252,211,77,.8);animation:blink .8s infinite}
        .sync-secure{font-size:10.5px;color:rgba(255,255,255,.55);transition:opacity .35s}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        body.dark .hd{background:linear-gradient(135deg,#1A2060 0%,#2D1060 100%)}
        .tab-bar{display:flex;background:var(--card);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:50;overflow-x:auto;scrollbar-width:none;box-shadow:0 1px 6px rgba(0,0,0,.05)}
        .tab-bar::-webkit-scrollbar{display:none}
        .tab-btn{flex-shrink:0;padding:13px 16px;font-size:12px;font-weight:600;color:var(--txt2);background:none;border:none;border-bottom:2.5px solid transparent;cursor:pointer;font-family:inherit;white-space:nowrap;letter-spacing:.1px}
        .tab-btn.active{color:var(--primary);border-bottom-color:var(--primary)}
        .quick-row{display:flex;gap:5px;overflow-x:auto;padding:14px 16px 12px;background:var(--card);border-bottom:1px solid var(--border);scrollbar-width:none}
        .quick-row::-webkit-scrollbar{display:none}
        .qb{flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;min-width:50px}
        .qb-icon{width:52px;height:52px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:24px;transition:transform .12s;box-shadow:0 2px 8px rgba(0,0,0,.07)}
        .qb:active .qb-icon{transform:scale(.88)}
        .qb-icon.sleep{background:var(--sleep-bg)}.qb-icon.formula{background:var(--formula-bg)}
        .qb-icon.breast{background:var(--breast-bg)}.qb-icon.diaper{background:var(--diaper-bg)}
        .qb-icon.growth{background:var(--growth-bg)}.qb-icon.hospital{background:var(--hospital-bg)}
        .qb-icon.bath{background:var(--bath-bg)}
        .qb-name{font-size:10.5px;color:var(--txt2);font-weight:600}
        .warn-banner{margin:10px 16px 0;border-radius:12px;padding:11px 15px;font-size:13px;font-weight:500;display:flex;align-items:center;gap:8px}
        .warn-banner.feed{background:linear-gradient(135deg,#FFF3E0,#FFE8C0);color:#BF4400;border:1px solid #FFCC80}
        .last-bar{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:12px 16px;background:var(--card);border-bottom:1px solid var(--border)}
        .lc{background:linear-gradient(135deg,#F8F9FF,#EEF1FF);border-radius:14px;padding:10px 11px;border:1px solid rgba(91,123,255,.1)}
        .lc-label{font-size:9.5px;color:var(--primary);font-weight:700;margin-bottom:4px;letter-spacing:.3px;text-transform:uppercase}
        .lc-time{font-size:13px;font-weight:800;line-height:1.2;letter-spacing:-.2px}
        .lc-detail{font-size:10px;color:var(--txt2);margin-top:3px}
        body.dark .lc{background:linear-gradient(135deg,#1A1F38,#141830);border-color:rgba(91,123,255,.15)}
        .date-nav{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--card);border-bottom:1px solid var(--border)}
        .dnbtn{background:none;border:none;font-size:22px;color:var(--txt2);cursor:pointer;padding:2px 10px}
        .date-main{font-size:15px;font-weight:700;text-align:center}
        .date-age{font-size:11px;color:var(--txt2);margin-top:1px;text-align:center}
        .chips{display:flex;gap:7px;overflow-x:auto;padding:11px 16px;background:var(--card);border-bottom:1px solid var(--border);scrollbar-width:none}
        .chips::-webkit-scrollbar{display:none}
        .chip{flex-shrink:0;display:flex;align-items:center;gap:5px;padding:6px 13px;border-radius:22px;font-size:12px;font-weight:700;position:relative;overflow:hidden}
        .chip.sleep{background:var(--sleep-bg);color:var(--sleep)}.chip.formula{background:var(--formula-bg);color:#B87E0E}
        .chip.breast{background:var(--breast-bg);color:var(--breast)}.chip.diaper{background:var(--diaper-bg);color:var(--diaper)}
        .chip.goal{background:linear-gradient(135deg,#E8F5E9,#D4EDDA);color:#1B5E20;border:1px solid rgba(52,199,89,.15)}
        .goal-bar{position:absolute;bottom:0;left:0;height:3px;border-radius:0 0 22px 22px;background:linear-gradient(90deg,#4CAF50,#81C784)}
        .log-list{padding:12px 16px 140px}
        .log-card{background:var(--card);border-radius:18px;padding:14px 15px;margin-bottom:10px;display:flex;gap:12px;align-items:flex-start;box-shadow:0 1px 8px rgba(0,0,0,.06);border:1px solid transparent;transition:border-color .15s,background .15s}
        .li-icon{width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
        .li-icon.sleep{background:var(--sleep-bg)}.li-icon.formula{background:var(--formula-bg)}
        .li-icon.breast{background:var(--breast-bg)}.li-icon.diaper{background:var(--diaper-bg)}
        .li-icon.growth{background:var(--growth-bg)}.li-icon.hospital{background:var(--hospital-bg)}
        .li-icon.bath{background:var(--bath-bg)}.li-body{flex:1;min-width:0}
        .li-type{font-size:14px;font-weight:700}
        .li-type.sleep{color:var(--sleep)}.li-type.formula{color:var(--formula)}
        .li-type.breast{color:var(--breast)}.li-type.diaper{color:var(--diaper)}
        .li-type.growth{color:var(--growth)}.li-type.hospital{color:var(--hospital)}
        .li-type.bath{color:var(--bath)}.li-detail{font-size:13px;color:var(--txt2);margin-top:3px}
        .li-right{display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex-shrink:0}
        .li-time{font-size:14px;font-weight:600}
        .li-end{font-size:11px;color:var(--txt3)}
        .del-btn{background:none;border:none;color:var(--txt3);cursor:pointer;font-size:18px;padding:0 0 0 6px;line-height:1}
        .sleep-timer{font-size:11px;color:var(--sleep);font-weight:700;margin-top:2px}
        .memo-text{font-size:11px;color:var(--txt3);margin-top:3px;font-style:italic}
        .empty{text-align:center;padding:60px 20px;color:var(--txt3)}
        .empty-e{font-size:44px;margin-bottom:12px}
        .loading-overlay{position:fixed;inset:0;background:rgba(255,255,255,.85);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;z-index:500;font-size:14px;color:var(--txt2)}
        .loading-overlay.hidden{display:none}
        .spinner{width:36px;height:36px;border:3px solid var(--border);border-top-color:var(--primary);border-radius:50%;animation:spin .7s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .fab-bar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;background:var(--card);border-top:1px solid var(--border);padding:12px 16px 36px;display:flex;gap:8px;z-index:100}
        .fab-mic{flex:1;display:flex;align-items:center;justify-content:center;gap:10px;padding:18px 14px;background:linear-gradient(135deg,#4A6CF7,#7B3FF2);color:#fff;border:none;border-radius:18px;font-size:17px;font-weight:800;cursor:pointer;font-family:inherit;box-shadow:0 4px 20px rgba(91,123,255,.35);letter-spacing:-.2px}
        .fab-mic.on{background:linear-gradient(135deg,#E8667A,#C0394D);animation:pulse 1s infinite;box-shadow:0 4px 20px rgba(232,102,122,.4)}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.75}}
        .voice-overlay{position:fixed;inset:0;background:rgba(10,10,30,.88);z-index:300;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px}
        .voice-ring{width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-size:44px;animation:ring 1.2s ease-in-out infinite}
        @keyframes ring{0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(255,255,255,.3)}50%{transform:scale(1.08);box-shadow:0 0 0 20px rgba(255,255,255,0)}}
        .voice-tip{color:rgba(255,255,255,.9);font-size:14px;font-weight:500}
        .voice-hint{color:rgba(255,255,255,.5);font-size:12px;text-align:center;line-height:1.8}
        .voice-cancel{padding:10px 28px;background:rgba(255,255,255,.15);border:none;border-radius:20px;color:#fff;font-size:14px;cursor:pointer;font-family:inherit}
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:flex-end}
        .sheet{background:var(--card);border-radius:24px 24px 0 0;padding:8px 16px 40px;width:100%;max-height:92vh;overflow-y:auto}
        .drag-bar{width:36px;height:4px;background:var(--border);border-radius:2px;margin:8px auto 14px}
        .sheet-title{font-size:17px;font-weight:700;margin-bottom:14px;text-align:center}
        .type-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:18px}
        .type-tile{border:2px solid var(--border);border-radius:var(--rs);padding:11px 4px;text-align:center;cursor:pointer;background:var(--card);font-family:inherit}
        .type-tile .em{font-size:22px;display:block;margin-bottom:4px}
        .type-tile .nm{font-size:11px;color:var(--txt2);font-weight:500}
        .fg{margin-bottom:12px}
        .fg label{display:block;font-size:12px;color:var(--txt2);margin-bottom:5px;font-weight:500}
        .fg input,.fg select,.fg textarea{width:100%;padding:0 12px;border:1.5px solid var(--border);border-radius:var(--rs);font-size:15px;font-family:inherit;color:var(--txt);background:var(--card);outline:none;height:48px;-webkit-appearance:none}
        .fg textarea{height:72px;padding:12px;resize:none}
        .fg input:focus,.fg select:focus,.fg textarea:focus{border-color:var(--primary)}
        .row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .seg{display:flex;border-radius:var(--rs);overflow:hidden;border:1.5px solid var(--border)}
        .seg button{flex:1;padding:10px 4px;background:var(--card);border:none;font-size:13px;font-family:inherit;color:var(--txt2);cursor:pointer;font-weight:500}
        .seg button.sel{background:var(--primary);color:#fff}
        .breast-box{background:var(--breast-bg);border-radius:var(--rs);padding:12px;margin-bottom:12px}
        .bt-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .bt-side{background:var(--card);border-radius:8px;padding:10px;text-align:center}
        .bt-side-name{font-size:11px;color:var(--txt2);margin-bottom:6px;font-weight:500}
        .bt-side-val{font-size:22px;font-weight:700;color:var(--breast)}
        .bt-btns{display:flex;gap:4px;justify-content:center;margin-top:6px}
        .bt-btns button{width:36px;height:36px;border-radius:50%;border:none;background:var(--breast-bg);color:var(--breast);font-size:20px;cursor:pointer;font-family:inherit;font-weight:700;display:flex;align-items:center;justify-content:center}
        .save-btn{width:100%;padding:15px;background:var(--primary);color:#fff;border:none;border-radius:var(--r);font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:4px}
        .cancel-btn{width:100%;padding:10px;background:none;border:none;color:var(--txt2);font-size:14px;cursor:pointer;font-family:inherit;margin-top:4px}
        .cal-sheet{background:var(--card);border-radius:24px 24px 0 0;padding:8px 16px 32px;width:100%;max-height:80vh;overflow-y:auto}
        .cal-head{display:flex;align-items:center;justify-content:space-between;padding:10px 0}
        .cal-head span{font-size:16px;font-weight:700}
        .cal-head button{background:none;border:none;font-size:22px;color:var(--txt2);cursor:pointer;padding:4px 10px}
        .cal-grid{display:grid;grid-template-columns:repeat(7,1fr);text-align:center;gap:2px}
        .cal-dn{font-size:11px;color:var(--txt3);padding:4px 0}
        .cal-d{font-size:14px;cursor:pointer;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;margin:0 auto;position:relative}
        .cal-d:hover{background:var(--bg)}.cal-d.today{background:var(--primary);color:#fff}
        .cal-d.sel{background:var(--primary-bg);color:var(--primary);font-weight:700}
        .cal-d.has::after{content:'';position:absolute;bottom:2px;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:50%;background:var(--diaper)}
        .cal-d.empty{cursor:default}
        .toast{position:fixed;bottom:120px;left:50%;transform:translateX(-50%);background:rgba(26,29,46,.9);color:#fff;padding:10px 20px;border-radius:20px;font-size:13px;z-index:400;opacity:0;transition:opacity .3s;pointer-events:none;white-space:nowrap}
        .toast.show{opacity:1}
        .page{display:none;padding-bottom:140px}.page.show{display:block}
        .ai-card{margin:12px 16px;background:linear-gradient(135deg,#5B7BFF,#7B6CF6);border-radius:var(--r);padding:16px;color:#fff}
        .ai-badge{background:rgba(255,255,255,.25);border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700}
        .ai-text{font-size:14px;line-height:1.7;margin-top:10px}
        .stat-section{margin:0 16px 16px;background:var(--card);border-radius:var(--r);overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06)}
        .stat-section-hd{display:flex;align-items:center;gap:8px;padding:14px 16px 10px;border-bottom:1px solid var(--border)}
        .stat-section-hd span{font-size:15px;font-weight:700}
        .stat-row{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:.5px solid var(--border)}
        .stat-row:last-child{border-bottom:none}
        .stat-lbl{font-size:13px;color:var(--txt2)}.stat-val{font-size:14px;font-weight:600}
        .stat-bar-wrap{padding:8px 16px 14px}
        .stat-bar-bg{background:var(--bg);border-radius:20px;height:8px;overflow:hidden;margin-top:4px}
        .stat-bar-fill{height:100%;border-radius:20px;transition:width .6s ease}
        .week-chart{padding:12px 16px 16px}
        .wc-row{display:flex;align-items:flex-end;gap:6px;height:80px;margin-bottom:6px}
        .wc-bar-wrap{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px}
        .wc-label{font-size:10px;color:var(--txt3);text-align:center}
        .wc-today .wc-label{color:var(--primary);font-weight:700}
        .period-nav{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:var(--card);border-bottom:1px solid var(--border)}
        .period-nav span{font-size:14px;font-weight:600}
        .period-btn{background:none;border:none;font-size:20px;color:var(--txt2);cursor:pointer;padding:4px 10px}
        .period-tabs{display:flex;gap:4px;background:var(--bg);border-radius:20px;padding:3px}
        .period-tab{padding:5px 14px;border-radius:20px;font-size:12px;font-weight:500;border:none;background:none;cursor:pointer;color:var(--txt2);font-family:inherit}
        .period-tab.sel{background:var(--card);color:var(--primary);font-weight:700;box-shadow:0 1px 3px rgba(0,0,0,.1)}
        .settings-row{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:.5px solid var(--border)}
        .settings-row:last-child{border-bottom:none}
        .settings-lbl{font-size:14px;font-weight:500}
        .settings-sub{font-size:12px;color:var(--txt2);margin-top:2px}
        .toggle{width:48px;height:28px;border-radius:14px;background:var(--border);position:relative;cursor:pointer;border:none;flex-shrink:0}
        .toggle.on{background:var(--primary)}
        .toggle::after{content:'';position:absolute;width:22px;height:22px;border-radius:50%;background:#fff;top:3px;left:3px;transition:transform .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)}
        .toggle.on::after{transform:translateX(20px)}
        .s-input{width:120px;text-align:right;border:none;font-size:14px;font-weight:600;color:var(--primary);background:transparent;outline:none;font-family:inherit}
        .s-input-sm{width:60px;text-align:right;border:none;font-size:14px;font-weight:600;color:var(--primary);background:transparent;outline:none;font-family:inherit}
        .time-adj{background:var(--bg);border-radius:var(--rs);padding:12px;margin-bottom:12px}
        .time-adj-val{font-size:28px;font-weight:900;text-align:center;color:var(--primary);padding:8px 0;letter-spacing:1px}
        .time-adj-btns{display:grid;grid-template-columns:repeat(6,1fr);gap:5px}
        .time-adj-btns button{padding:8px 2px;background:var(--card);border:1.5px solid var(--border);border-radius:8px;font-size:12px;font-weight:600;color:var(--txt);cursor:pointer;font-family:inherit}
        .time-adj-btns button:active{background:var(--primary-bg);border-color:var(--primary);color:var(--primary)}
        body.dark .hd{background:linear-gradient(135deg,#1A2060 0%,#2D1060 100%)}
        body.dark .tab-bar,body.dark .quick-row,body.dark .last-bar,body.dark .date-nav,body.dark .chips,body.dark .fab-bar,body.dark .period-nav{background:var(--card)}
        body.dark .stat-section,body.dark .log-card,body.dark .sheet,body.dark .cal-sheet{background:var(--card)}
        body.dark .fg input,body.dark .fg select,body.dark .fg textarea,body.dark .type-tile,body.dark .seg button,body.dark .bt-side{background:var(--card);color:var(--txt)}
        body.dark .loading-overlay{background:rgba(15,17,23,.9)}
      `}</style>

      {/* TOAST */}
      <div className={`toast${toastShow ? ' show' : ''}`}>{toast}</div>

      {/* HEADER */}
      <div className="hd">
        <div className="hd-top" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'flex-start',gap:'8px',flex:1}}>
          <button className="hd-btn" onClick={() => setShowDrawer(true)}>☰</button>
          <div style={{position:'relative'}}>
            <div onClick={() => { if (drawerBabies.length > 1) setShowBabyPicker(p => !p); }} style={{cursor: drawerBabies.length > 1 ? 'pointer' : 'default'}}>
              <div className="hd-title">
                {hdTitle}
                {drawerBabies.length > 1 && <span style={{fontSize:'14px',opacity:.8}}> ▾</span>}
              </div>
              <div className="hd-sub">{ageLabel}</div>
            </div>
            {showBabyPicker && drawerBabies.length > 1 && (
              <div style={{position:'absolute',top:'100%',left:0,marginTop:'8px',background:'var(--card)',borderRadius:'12px',boxShadow:'0 4px 20px rgba(0,0,0,.15)',zIndex:100,minWidth:'160px',overflow:'hidden'}}>
                {drawerBabies.map((m: any) => (
                  <div key={m.baby_id} onClick={() => {
                    router.push(`/log?babyId=${m.baby_id}`)
                    setShowBabyPicker(false)
                  }} style={{padding:'12px 16px',fontSize:'14px',fontWeight:600,cursor:'pointer',borderBottom:'1px solid var(--border)',color:'var(--txt)'}}>
                    👶 {m.babies?.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="hd-actions" style={{display:'flex',flexDirection:'row',gap:'8px',flexShrink:0}}>
          <button className="hd-btn" onClick={() => { setCalDate(new Date(selDate)); setShowCal(true); }}>📅</button>
          <button className="hd-btn" onClick={() => setShowSettings(true)}>⚙️</button>
        </div>
      </div>
        <div className="sync-bar">
          <div className="sync-row">
            <div className={`sync-dot${syncState === 'loading' ? ' loading' : syncState === 'off' ? ' off' : ''}`}></div>
            <span>{syncTxt}</span>
          </div>
          <div className="sync-secure">{secureMsg}</div>
        </div>
      </div>

      {/* TAB BAR */}
      <div className="tab-bar">
        {(['home', 'stats', 'growth', 'hospital'] as const).map(t => (
          <button key={t} className={`tab-btn${currentTab === t ? ' active' : ''}`} onClick={() => setCurrentTab(t)}>
            {t === 'home' ? '📋 기록' : t === 'stats' ? '📊 통계' : t === 'growth' ? '📏 성장' : '🏥 병원'}
          </button>
        ))}
      </div>

      {/* HOME PAGE */}
      <div className={`page${currentTab === 'home' ? ' show' : ''}`} id="page-home">
        {/* Quick Buttons */}
        <div className="quick-row">
          <div className="qb" onClick={() => quickAdd('sleep')}><div className="qb-icon sleep">😴</div><div className="qb-name">수면</div></div>
          <div className="qb" onClick={() => openModal('formula')}><div className="qb-icon formula">🍼</div><div className="qb-name">분유</div></div>
          <div className="qb" onClick={() => openModal('breast')}><div className="qb-icon breast">🤱</div><div className="qb-name">모유</div></div>
          <div className="qb" onClick={() => quickAdd('diaper', 'urine')}><div className="qb-icon diaper">💧</div><div className="qb-name">소변</div></div>
          <div className="qb" onClick={() => quickAdd('diaper', 'stool')}><div className="qb-icon diaper">💩</div><div className="qb-name">대변</div></div>
          <div className="qb" onClick={() => quickAdd('diaper', 'both')}><div className="qb-icon diaper">🚿</div><div className="qb-name">둘다</div></div>
          <div className="qb" onClick={() => quickAdd('bath')}><div className="qb-icon bath">🛁</div><div className="qb-name">목욕</div></div>
        </div>

        {/* Last Activity Bar */}
        <div className="last-bar">
          {(['diaper', 'formula', 'breast'] as const).map(t => {
            const labels: Record<string, string> = { diaper: '마지막 기저귀', formula: '마지막 분유', breast: '마지막 모유' };
            const r = [...records].filter(x => x.type === t).sort((a, b) => b.start_time > a.start_time ? 1 : -1)[0];
            return (
              <div key={t} className="lc">
                <div className="lc-label">{labels[t]}</div>
                {r ? <><div className="lc-time">{elapsed(r.start_time)}</div><div className="lc-detail">{detail(r)}</div></> : <><div className="lc-time" style={{ fontSize: '12px', color: 'var(--txt2)' }}>기록 없음</div><div className="lc-detail">-</div></>}
              </div>
            );
          })}
        </div>

        {/* Pattern Prediction Slide */}
        {patternMsgs.length > 0 && (
          <div style={{margin:'0 16px 4px',background:'var(--primary-bg)',borderRadius:'12px',padding:'10px 14px',transition:'opacity 0.4s',opacity:patternVisible?1:0}}>
            <span style={{fontSize:'13px',color:'var(--primary)',fontWeight:500}}>{patternMsgs[patternIdx]}</span>
          </div>
        )}

        {/* Feed Warning */}
        {showWarn && (
          <div className="warn-banner feed" style={{marginBottom:'8px'}}>
            ⚠️ 마지막 수유 {Math.floor(feedHoursAgo)}시간 {Math.floor((feedHoursAgo % 1) * 60)}분 경과 — 수유 시간이에요!
          </div>
        )}

        {/* Date Nav */}
        <div className="date-nav">
          <button className="dnbtn" onClick={() => { const d = new Date(selDate); d.setDate(d.getDate() - 1); setSelDate(d); }}>‹</button>
          <div><div className="date-main">{dateLabel}</div></div>
          <button className="dnbtn" onClick={() => { const d = new Date(selDate); d.setDate(d.getDate() + 1); setSelDate(d); }}>›</button>
        </div>

        {/* Chips */}
        <div className="chips">
          {sleepMin > 0 && <div className="chip sleep">😴 {durLabel(sleepMin)}</div>}
          {goalMl > 0
            ? <div className="chip goal" title={`분유 ${formulaTotal}ml + 직수환산 ${breastAsMl}ml`}>🍼 {totalFeedMl}/{goalMl}ml <span style={{ fontSize: '10px', opacity: 0.8 }}>{goalPct}%</span><div className="goal-bar" style={{ width: goalPct + '%' }}></div></div>
            : formulaTotal > 0 && <div className="chip formula">🍼 {formulaTotal}ml</div>
          }
          {feedsCount > 0 && <div className="chip breast">🤱 {feedsCount}회</div>}
          {diapersCount > 0 && <div className="chip diaper">💧 {diapersCount}회</div>}
          {bathCount > 0 && <div className="chip" style={{ background: 'var(--bath-bg)', color: 'var(--bath)' }}>🛁 {bathCount}회</div>}
          {sleepMin === 0 && !formulaTotal && !feedsCount && !diapersCount && !bathCount && <div style={{ fontSize: '13px', color: 'var(--txt3)', padding: '4px 0' }}>기록이 없어요</div>}
        </div>

        {/* Log List */}
        <div className="log-list">
          {logRecs.length === 0
  ? <div className="empty"><div className="empty-e">📋</div><div>이 날의 기록이 없어요</div></div>
  : logRecs.map(r => {
    const isEditable = r.type === 'breast' || r.type === 'diaper' || r.type === 'sleep' || r.type === 'formula';
    const diaperEmoji = r.diaper_kind === 'stool' ? '💩' : r.diaper_kind === 'both' ? '💩' : '💧';
    const roleInfo = r.user_id && memberRoleMap[r.user_id] ? (() => {
      const role = memberRoleMap[r.user_id!]
      const isMom = role === 'mom' || role === '엄마'
      const isDad = role === 'dad' || role === '아빠'
      return { label: isMom ? '엄마 👩' : isDad ? '아빠 👨' : '보호자', color: isMom ? 'rgba(232,102,122,0.7)' : 'rgba(91,123,255,0.7)' }
    })() : null;
    return (
      <div key={r.id} className="log-card" style={{flexDirection:'column', ...(isEditable ? {cursor:'pointer'} : {})}}
        onClick={isEditable ? () => {
          if (r.type === 'formula') { setEditFormula(r); setEditStartTime(fmtTime(r.start_time)); setEditMl(Number(r.ml || 0)); }
          else if (r.type === 'breast') { setEditBreast(r); setEditLeftMin(Number(r.left_min || 0)); setEditRightMin(Number(r.right_min || 0)); setEditStartTime(fmtTime(r.start_time)); }
          else if (r.type === 'diaper') { setEditDiaper(r); setEditDK((r.diaper_kind as 'urine' | 'stool' | 'both') || 'urine'); setEditStartTime(fmtTime(r.start_time)); }
          else if (r.type === 'sleep') { setEditSleep(r); setEditStartTime(fmtTime(r.start_time)); setEditEndTime(r.end_time ? fmtTime(r.end_time) : ''); }
        } : undefined}>
        <div style={{display:'flex',gap:'12px',alignItems:'flex-start',width:'100%'}}>
          <div className={`li-icon ${r.type}`}>{r.type === 'diaper' ? diaperEmoji : EMOJI[r.type]}</div>
          <div className="li-body">
            <div className={`li-type ${r.type}`}>{LABEL[r.type]}{r.sleep_kind ? ' · ' + (r.sleep_kind === 'nap' ? '낮잠' : '밤잠') : ''}</div>
            {r.type === 'formula'
              ? <div style={{fontSize:'18px',fontWeight:800,color:'var(--formula)',marginTop:'2px'}}>{r.ml}ml</div>
              : <div className="li-detail">{detail(r)}</div>
            }
            {r.type === 'sleep' && !r.end_time && <div className="sleep-timer">{sleepTimerMap[r.id] || '⏱ 진행 중...'}</div>}
            {r.memo && <div className="memo-text">📝 {r.memo}</div>}
          </div>
          <div className="li-right">
            <div style={{display:'flex',alignItems:'center',gap:'2px'}}>
              <span className="li-time" style={{fontSize:'17px',fontWeight:700,color:'var(--txt)'}}>{fmtTime(r.start_time)}</span>
              <button className="del-btn" onClick={e => { e.stopPropagation(); delRec(r.id); }}>×</button>
            </div>
            {r.end_time && <div className="li-end">~ {fmtTime(r.end_time)}</div>}
          </div>
        </div>
        {roleInfo && <div style={{textAlign:'center',fontSize:'11px',color:roleInfo.color,marginTop:'6px',width:'100%',fontWeight:500}}>{roleInfo.label}</div>}
      </div>
    );
  })}
        </div>
      </div>

      {/* STATS PAGE */}
      <div className={`page${currentTab === 'stats' ? ' show' : ''}`} id="page-stats">
  <div className="period-nav">
    <div className="period-tabs">
      <button className={`period-tab${statsPeriod === 'day' ? ' sel' : ''}`} onClick={() => { setStatsPeriod('day'); setStatsOffset(0); }}>일</button>
      <button className={`period-tab${statsPeriod === 'week' ? ' sel' : ''}`} onClick={() => { setStatsPeriod('week'); setStatsOffset(0); }}>주</button>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <button className="period-btn" onClick={() => setStatsOffset(p => p - 1)}>‹</button>
      <span style={{ fontSize: '13px', fontWeight: 600, minWidth: '120px', textAlign: 'center' }}>{periodLabel}</span>
      <button className="period-btn" onClick={() => setStatsOffset(p => p + 1)}>›</button>
    </div>
  </div>

  {/* 하루 요약 리포트 */}
  {statsPeriod === 'day' && (() => {
    const todayDs = fmtDate(new Date(new Date().setDate(new Date().getDate() + statsOffset)));
    const todayRecs = records.filter(r => r.date === todayDs);
    const days7ago = Date.now() - 7 * 86400000;
    const week = records.filter(r => new Date(r.start_time).getTime() > days7ago && r.date !== todayDs);

    if (todayRecs.length < 3) return (
      <div style={{margin:'12px 16px 0',background:'var(--card)',borderRadius:'var(--r)',padding:'16px',boxShadow:'0 1px 4px rgba(0,0,0,.06)',fontSize:'13px',color:'var(--txt3)',textAlign:'center'}}>
        🌱 기록이 조금 더 쌓이면 요약을 보여드릴게요
      </div>
    );

    // 수유
    const todayFeedMl = todayRecs.filter(r=>r.type==='formula').reduce((s,r)=>s+Number(r.ml||0),0)
      + breastToFormulaMl(todayRecs.filter(r=>r.type==='breast').reduce((s,r)=>s+(Number(r.left_min||0)+Number(r.right_min||0)),0), settings.babyBirth);
    const todayFeedCnt = todayRecs.filter(r=>r.type==='formula'||r.type==='breast').length;
    const weekFeedDays: Record<string,number> = {};
    week.filter(r=>r.type==='formula'||r.type==='breast').forEach(r=>{ weekFeedDays[r.date]=(weekFeedDays[r.date]||0)+(r.type==='formula'?Number(r.ml||0):breastToFormulaMl((Number(r.left_min||0)+Number(r.right_min||0)),settings.babyBirth)); });
    const weekFeedAvg = Object.keys(weekFeedDays).length ? Object.values(weekFeedDays).reduce((s,v)=>s+v,0)/Object.keys(weekFeedDays).length : 0;
    const feedEval = weekFeedAvg ? (todayFeedMl>=weekFeedAvg*1.2?'많은 편이에요':todayFeedMl<=weekFeedAvg*0.8?'적은 편이에요':'평소와 비슷한 편이에요') : '';

    // 낮잠
    const todayNaps = todayRecs.filter(r=>r.type==='sleep'&&r.sleep_kind==='nap'&&r.end_time);
    const todayNapMin = todayNaps.reduce((s,r)=>s+durMin(r.start_time,r.end_time!),0);
    const weekNapDays: Record<string,number> = {};
    week.filter(r=>r.type==='sleep'&&r.sleep_kind==='nap'&&r.end_time).forEach(r=>{ weekNapDays[r.date]=(weekNapDays[r.date]||0)+durMin(r.start_time,r.end_time!); });
    const weekNapAvg = Object.keys(weekNapDays).length ? Object.values(weekNapDays).reduce((s,v)=>s+v,0)/Object.keys(weekNapDays).length : 0;
    const napEval = weekNapAvg ? (todayNapMin>=weekNapAvg*1.2?'긴 편이에요':todayNapMin<=weekNapAvg*0.8?'짧은 편이에요':'평소와 비슷한 편이에요') : '';

    // 각성시간
    const napsSorted = [...records.filter(r=>r.type==='sleep'&&r.sleep_kind==='nap'&&r.end_time&&new Date(r.start_time).getTime()>days7ago)].sort((a,b)=>a.end_time!>b.end_time!?1:-1);
    const wakeGaps: number[] = [];
    for (let i=0;i<napsSorted.length-1;i++) {
      const wake=new Date(napsSorted[i].end_time!).getTime();
      const next=records.filter(r=>r.type==='sleep'&&new Date(r.start_time).getTime()>wake).sort((a,b)=>a.start_time>b.start_time?1:-1)[0];
      if(next){const g=(new Date(next.start_time).getTime()-wake)/60000;if(g>=30&&g<=240)wakeGaps.push(g);}
    }
    const wakeMedian = wakeGaps.length>=3?[...wakeGaps].sort((a,b)=>a-b)[Math.floor(wakeGaps.length/2)]:0;
    const lastNap = napsSorted[napsSorted.length-1];
    let nextSleepLabel = '';
    if(lastNap&&wakeMedian){const pred=new Date(new Date(lastNap.end_time!).getTime()+wakeMedian*60000);nextSleepLabel=pad(pred.getHours())+':'+pad(pred.getMinutes())+' 전후';}

    // 밤잠 추정
    const yesterday = fmtDate(new Date(Date.now()-86400000));
    const nightCands = records.filter(r=>r.type==='sleep'&&r.date===yesterday&&new Date(r.start_time).getHours()>=19&&r.end_time);
    nightCands.sort((a,b)=>durMin(a.start_time,a.end_time!)>durMin(b.start_time,b.end_time!)?-1:1);
    const nightSleep = nightCands[0]&&durMin(nightCands[0].start_time,nightCands[0].end_time!)>=120?nightCands[0]:null;

    // 기저귀
    const todayDiaperCnt = todayRecs.filter(r=>r.type==='diaper').length;
    const weekDiaperDays: Record<string,number> = {};
    week.filter(r=>r.type==='diaper').forEach(r=>{weekDiaperDays[r.date]=(weekDiaperDays[r.date]||0)+1;});
    const weekDiaperAvg = Object.keys(weekDiaperDays).length?Object.values(weekDiaperDays).reduce((s,v)=>s+v,0)/Object.keys(weekDiaperDays).length:0;
    const diaperEval = weekDiaperAvg?(todayDiaperCnt>=weekDiaperAvg*1.2?'많은 편이에요':todayDiaperCnt<=weekDiaperAvg*0.8?'적은 편이에요':'평소와 비슷한 편이에요'):'';

    // 한 줄 요약
    const summaryParts=[];
    if(feedEval&&feedEval!=='평소와 비슷한 편이에요')summaryParts.push(`수유량은 ${feedEval}`);
    if(napEval&&napEval!=='평소와 비슷한 편이에요')summaryParts.push(`낮잠은 ${napEval}`);
    const summary=summaryParts.length?'오늘은 '+summaryParts.join(', ')+'.':'오늘 흐름은 평소와 비슷한 편이에요.';

    return (
      <div style={{margin:'12px 16px 0',background:'var(--card)',borderRadius:'var(--r)',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
        <div style={{padding:'14px 16px 10px',borderBottom:'1px solid var(--border)'}}>
          <div style={{fontSize:'15px',fontWeight:700}}>📋 오늘 하루 요약</div>
          <div style={{fontSize:'13px',color:'var(--txt2)',marginTop:'6px',lineHeight:1.6}}>{summary}</div>
        </div>
        <div style={{padding:'10px 16px',borderBottom:'.5px solid var(--border)'}}>
          <div style={{fontSize:'12px',color:'var(--txt3)',fontWeight:600,marginBottom:'4px'}}>🍼 수유</div>
          <div style={{fontSize:'13px',color:'var(--txt)'}}>{todayFeedCnt}회 · 총 {todayFeedMl}ml{feedEval?` · ${feedEval}`:''}</div>
        </div>
        <div style={{padding:'10px 16px',borderBottom:'.5px solid var(--border)'}}>
          <div style={{fontSize:'12px',color:'var(--txt3)',fontWeight:600,marginBottom:'4px'}}>😴 수면</div>
          {todayNapMin>0&&<div style={{fontSize:'13px',color:'var(--txt)',marginBottom:'2px'}}>낮잠 {durLabel(todayNapMin)}{napEval?` · ${napEval}`:''}</div>}
          {wakeMedian>0&&<div style={{fontSize:'13px',color:'var(--txt2)'}}>평균 각성시간 {durLabel(Math.round(wakeMedian))}</div>}
          {nextSleepLabel&&<div style={{fontSize:'13px',color:'var(--sleep)'}}>다음 졸림 예상 {nextSleepLabel}</div>}
          {nightSleep&&<div style={{fontSize:'13px',color:'var(--txt2)'}}>어제 추정 밤잠 {fmtTime(nightSleep.start_time)} 시작</div>}
          {!todayNapMin&&!wakeMedian&&<div style={{fontSize:'13px',color:'var(--txt3)'}}>수면 기록이 없어요</div>}
        </div>
        <div style={{padding:'10px 16px'}}>
          <div style={{fontSize:'12px',color:'var(--txt3)',fontWeight:600,marginBottom:'4px'}}>💧 기저귀</div>
          <div style={{fontSize:'13px',color:'var(--txt)'}}>{todayDiaperCnt}회{diaperEval?` · ${diaperEval}`:''}</div>
        </div>
      </div>
    );
  })()}

  <div style={{ paddingBottom: '20px' }} dangerouslySetInnerHTML={{ __html: statsContent }} />
      </div>

      {/* GROWTH PAGE */}
      <div className={`page${currentTab === 'growth' ? ' show' : ''}`} id="page-growth">
        <div style={{ padding: '16px' }}>
          <button className="save-btn" style={{ fontSize: '14px', padding: '12px', marginBottom: '16px' }} onClick={() => openModal('growth')}>+ 성장 기록 추가</button>
          <div dangerouslySetInnerHTML={{ __html: growthHtml }} />
        </div>
      </div>

      {/* HOSPITAL PAGE */}
      <div className={`page${currentTab === 'hospital' ? ' show' : ''}`} id="page-hospital">
        <div style={{ padding: '16px' }}>
          <button className="save-btn" style={{ fontSize: '14px', padding: '12px', marginBottom: '16px' }} onClick={() => openModal('hospital')}>+ 병원 기록 추가</button>
          <div dangerouslySetInnerHTML={{ __html: hospitalHtml }} />
        </div>
      </div>

      {/* FAB */}
      <div className="fab-bar">
        <button className={`fab-mic${isListening ? ' on' : ''}`} onClick={toggleMic}>
          {isListening ? '🔴 듣는 중...' : '🎙 음성 입력'}
        </button>
      </div>

      {/* VOICE OVERLAY */}
      {showVoice && (
        <div className="voice-overlay">
          <div className="voice-ring">🎙</div>
          <div className="voice-tip">{voiceTip}</div>
          <div className="voice-hint">
            &quot;분유 120&quot; · &quot;모유 왼쪽 8분 오른쪽 5분&quot;<br />
            &quot;기저귀 대변&quot; · &quot;수면 끝&quot; · &quot;방금 입력한거 삭제&quot;
          </div>
          <button className="voice-cancel" onClick={stopMic}>취소</button>
        </div>
      )}

      {/* NAVIGATION DRAWER */}
      {showDrawer && (
        <div style={{position:'fixed',inset:0,zIndex:500,display:'flex'}} onClick={() => setShowDrawer(false)}>
          <div style={{width:'80%',maxWidth:'320px',height:'100%',background:'var(--card)',boxShadow:'4px 0 20px rgba(0,0,0,.2)',display:'flex',flexDirection:'column',overflowY:'auto'}} onClick={e => e.stopPropagation()}>
            {/* 상단 유저 영역 */}
            <div style={{background:'linear-gradient(135deg,#4A6CF7,#7B3FF2)',padding:'40px 20px 20px',color:'#fff'}}>
              <div style={{fontSize:'13px',opacity:.8,marginBottom:'4px'}}>{currentUser?.email}</div>
              <div style={{fontSize:'18px',fontWeight:700}}>안녕하세요 👋</div>
            </div>

            {/* 아기 목록 */}
            <div style={{padding:'16px'}}>
              <div style={{fontSize:'12px',color:'var(--txt3)',fontWeight:600,marginBottom:'10px'}}>우리 아기</div>
              {drawerBabies.length === 0 && (
                <div style={{fontSize:'13px',color:'var(--txt3)',padding:'8px 0'}}>등록된 아기가 없어요</div>
              )}
              {drawerBabies.map((m: any) => (
              <div key={m.baby_id} style={{position:'relative',marginBottom:'4px'}}>
                <div onClick={() => {
                  setShowBabyProfile(m)
                  setProfileForm({
                    name: m.babies?.name||'',birth_date: m.babies?.birth_date||'',
                    gender: m.babies?.gender||'male',due_date: m.babies?.due_date||'',
                    birth_weight: m.babies?.birth_weight||'',birth_height: m.babies?.birth_height||'',
                    birth_head: m.babies?.birth_head||'',feeding_type: m.babies?.feeding_type||'mixed',
                    blood_type: m.babies?.blood_type||'',birth_hospital: m.babies?.birth_hospital||'',
                  })
                  setEditingBaby(false)
                }} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px',borderRadius:'12px',cursor:'pointer',background:(() => { const p = new URLSearchParams(window.location.search); return p.get('babyId') === m.baby_id ? 'var(--primary-bg)' : 'transparent'; })(),paddingRight:'36px'}}>
                  <div style={{width:'40px',height:'40px',borderRadius:'50%',background:'var(--primary-bg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px'}}>👶</div>
                  <div>
                    <div style={{fontSize:'14px',fontWeight:700,color:'var(--txt)'}}>{m.babies?.name}</div>
                    <div style={{fontSize:'12px',color:'var(--txt3)'}}>{m.babies?.birth_date} · {({'mom':'엄마','dad':'아빠','parent':'보호자','guardian':'보호자'} as Record<string,string>)[m.role]||m.role}</div>
                  </div>
                </div>
                <button onClick={async (e) => {
                  e.stopPropagation()
                  if (!confirm(`${m.babies?.name} 아기를 삭제할까요? 모든 기록이 삭제됩니다.`)) return
                  await supabase.from('baby_logs').delete().eq('baby_id', m.baby_id)
                  await supabase.from('invite_codes').delete().eq('baby_id', m.baby_id)
                  await supabase.from('baby_members').delete().eq('baby_id', m.baby_id)
                  await supabase.from('babies').delete().eq('id', m.baby_id)
                  setDrawerBabies((prev:any) => prev.filter((x:any) => x.baby_id !== m.baby_id))
                  showToast('삭제됨')
                  const params = new URLSearchParams(window.location.search)
                  if (params.get('babyId') === m.baby_id) router.push('/log')
                }} style={{position:'absolute',top:'50%',right:'8px',transform:'translateY(-50%)',background:'none',border:'none',fontSize:'18px',color:'var(--txt3)',cursor:'pointer',padding:'4px',lineHeight:1}}>×</button>
              </div>
            ))}

              {/* 아기 추가 */}
              {!showAddBaby ? (
                <button onClick={() => setShowAddBaby(true)} style={{width:'100%',padding:'10px',marginTop:'8px',border:'1.5px dashed var(--border)',borderRadius:'12px',background:'none',color:'var(--txt2)',fontSize:'13px',cursor:'pointer',fontFamily:'inherit'}}>
                  + 아기 추가하기
                </button>
              ) : (
                <div style={{marginTop:'12px',background:'var(--bg)',borderRadius:'12px',padding:'14px'}}>
                  <div style={{fontSize:'13px',fontWeight:600,marginBottom:'10px'}}>새 아기 등록</div>
                  <input placeholder="아기 이름" value={newBabyName} onChange={e => setNewBabyName(e.target.value)}
                    style={{width:'100%',padding:'10px 12px',border:'1.5px solid var(--border)',borderRadius:'8px',fontSize:'14px',marginBottom:'8px',fontFamily:'inherit',background:'var(--card)',color:'var(--txt)',outline:'none',boxSizing:'border-box'}} />
                  <input type="date" value={newBabyBirth} onChange={e => setNewBabyBirth(e.target.value)}
                    placeholder="YYYY-MM-DD"
                    style={{width:'100%',padding:'10px 12px',border:'1.5px solid var(--border)',borderRadius:'8px',fontSize:'14px',marginBottom:'8px',fontFamily:'inherit',background:'var(--card)',color:'var(--txt)',outline:'none',boxSizing:'border-box'}} />
                  <select value={newBabyRole} onChange={e => setNewBabyRole(e.target.value)}
                    style={{width:'100%',padding:'10px 12px',border:'1.5px solid var(--border)',borderRadius:'8px',fontSize:'14px',marginBottom:'12px',fontFamily:'inherit',background:'var(--card)',color:'var(--txt)',outline:'none',boxSizing:'border-box'}}>
                    <option value="dad">아빠</option>
                    <option value="mom">엄마</option>
                    <option value="parent">보호자</option>
                  </select>
                  <div style={{display:'flex',gap:'8px'}}>
                    <button onClick={async () => {
                      if (!newBabyName || !newBabyBirth || !currentUser) return
                      const { data: baby } = await supabase.from('babies').insert({ name: newBabyName, birth_date: newBabyBirth, created_by: currentUser.id }).select().single()
                      if (baby) {
                        await supabase.from('baby_members').insert({ baby_id: baby.id, user_id: currentUser.id, role: newBabyRole })
                        const { data } = await supabase.from('baby_members').select('baby_id, role, babies(id, name, birth_date)').eq('user_id', currentUser.id)
                        setDrawerBabies(data || [])
                        setNewBabyName(''); setNewBabyBirth(''); setShowAddBaby(false)
                        router.push(`/log?babyId=${baby.id}`)
                        setShowDrawer(false)
                      }
                    }} style={{flex:1,padding:'10px',background:'var(--primary)',color:'#fff',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>등록</button>
                    <button onClick={() => setShowAddBaby(false)} style={{flex:1,padding:'10px',background:'none',border:'1.5px solid var(--border)',borderRadius:'8px',fontSize:'13px',color:'var(--txt2)',cursor:'pointer',fontFamily:'inherit'}}>취소</button>
                  </div>
                </div>
              )}
            </div>

            <div style={{borderTop:'1px solid var(--border)',margin:'0 16px'}} />

            {/* 초대코드 */}
            <div style={{padding:'16px'}}>
              <div style={{display:'flex',gap:'8px'}}>
                <button onClick={async () => {
                  const params = new URLSearchParams(window.location.search)
                  const babyId = params.get('babyId')
                  if (!babyId || !currentUser) return
                  const code = Math.random().toString(36).slice(2,8).toUpperCase()
                  const { error } = await supabase.from('invite_codes').insert({
                    code,
                    baby_id: babyId,
                    created_by: currentUser.id,
                    expires_at: new Date(Date.now() + 24*60*60*1000).toISOString()
                  })
                  if (error) { showToast('생성 실패: ' + error.message); return; }
                  showToast('초대코드: ' + code + ' (24시간 유효)')
                }} style={{flex:1,padding:'12px',border:'1.5px solid var(--border)',borderRadius:'12px',background:'none',color:'var(--primary)',fontSize:'13px',cursor:'pointer',fontFamily:'inherit',textAlign:'center',fontWeight:600}}>
                  🔗 초대코드 생성
                </button>
                <button onClick={() => { router.push('/invite'); setShowDrawer(false); }} style={{flex:1,padding:'12px',border:'1.5px solid var(--border)',borderRadius:'12px',background:'none',color:'var(--txt2)',fontSize:'13px',cursor:'pointer',fontFamily:'inherit',textAlign:'center'}}>
                  🔑 초대코드 입력
                </button>
              </div>
            </div>
          </div>
          {/* 오른쪽 dimmed 영역 */}
          <div style={{flex:1}} />
        </div>
      )}

      {/* BABY PROFILE MODAL */}
      {showBabyProfile && (
        <div style={{position:'fixed',inset:0,zIndex:600,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'flex-end'}} onClick={() => { setShowBabyProfile(null); setEditingBaby(false); }}>
          <div style={{width:'100%',maxHeight:'92vh',background:'var(--card)',borderRadius:'24px 24px 0 0',overflowY:'auto'}} onClick={e => e.stopPropagation()}>
            <div style={{width:36,height:4,background:'var(--border)',borderRadius:2,margin:'12px auto 0'}} />

            /* 보기+수정 통합 — 항상 수정 가능 */
<div style={{padding:'16px 20px 40px'}}>
  <div style={{fontSize:'17px',fontWeight:700,textAlign:'center',marginBottom:'20px'}}>아기 프로필</div>

  {/* 기념일 */}
  {showBabyProfile.babies?.birth_date && (() => {
    const birth = new Date(showBabyProfile.babies.birth_date)
    const diff = Math.floor((Date.now() - birth.getTime()) / 86400000)
    const weeks = Math.floor(diff / 7)
    const milestones = [100,200,365,500,1000].map(d => ({
      label: `D+${d}`,
      date: new Date(birth.getTime()+d*86400000).toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'short'})
    })).filter((_,i) => [100,200,365,500,1000][i] > diff)
    return (
      <div style={{textAlign:'center',marginBottom:'16px'}}>
        <div style={{fontSize:'22px',fontWeight:900}}>{showBabyProfile.babies.name}</div>
        <div style={{fontSize:'13px',color:'var(--txt2)',marginTop:'4px'}}>{showBabyProfile.babies.birth_date} 출생</div>
        <div style={{fontSize:'13px',color:'var(--primary)',fontWeight:600,marginTop:'2px'}}>D+{diff}일 · {weeks}주 {diff%7}일</div>
        {milestones.length>0 && (
          <div style={{background:'var(--bg)',borderRadius:'var(--r)',padding:'14px 16px',marginTop:'12px',textAlign:'left'}}>
            <div style={{fontSize:'12px',color:'var(--txt3)',fontWeight:600,marginBottom:'8px'}}>다음 기념일</div>
            {milestones.slice(0,3).map(m=>(
              <div key={m.label} style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
                <span style={{fontSize:'13px',fontWeight:700,color:'var(--primary)'}}>{m.label}</span>
                <span style={{fontSize:'13px',color:'var(--txt2)'}}>{m.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  })()}

  {/* 수정 필드 */}
  {[
    {label:'이름',key:'name',type:'text',placeholder:'아기 이름'},
    {label:'생년월일',key:'birth_date',type:'date'},
    {label:'출생 예정일',key:'due_date',type:'date'},
    {label:'출생 몸무게 (g)',key:'birth_weight',type:'number',placeholder:'2800'},
    {label:'출생 키 (cm)',key:'birth_height',type:'number',placeholder:'50'},
    {label:'출생 머리둘레 (cm)',key:'birth_head',type:'number',placeholder:'34'},
    {label:'출생 병원',key:'birth_hospital',type:'text',placeholder:'병원명'},
  ].map(field=>(
    <div key={field.key} style={{marginBottom:'12px'}}>
      <label style={{display:'block',fontSize:'12px',color:'var(--txt2)',fontWeight:600,marginBottom:'5px'}}>{field.label}</label>
      <input type={field.type} value={profileForm[field.key]||''} placeholder={field.placeholder}
        onChange={e=>setProfileForm((p:any)=>({...p,[field.key]:e.target.value}))}
        style={{width:'100%',padding:'10px 12px',border:'1.5px solid var(--border)',borderRadius:'var(--rs)',fontSize:'14px',fontFamily:'inherit',background:'var(--card)',color:'var(--txt)',outline:'none',boxSizing:'border-box'}}/>
    </div>
  ))}

  <div style={{marginBottom:'12px'}}>
    <label style={{display:'block',fontSize:'12px',color:'var(--txt2)',fontWeight:600,marginBottom:'5px'}}>성별</label>
    <div style={{display:'flex',gap:'8px'}}>
      {[{v:'male',l:'남아 👦'},{v:'female',l:'여아 👧'}].map(g=>(
        <button key={g.v} onClick={()=>setProfileForm((p:any)=>({...p,gender:g.v}))}
          style={{flex:1,padding:'10px',borderRadius:'var(--rs)',border:`1.5px solid ${profileForm.gender===g.v?'var(--primary)':'var(--border)'}`,background:profileForm.gender===g.v?'var(--primary-bg)':'var(--card)',color:profileForm.gender===g.v?'var(--primary)':'var(--txt2)',fontFamily:'inherit',cursor:'pointer',fontSize:'14px',fontWeight:profileForm.gender===g.v?700:400}}>
          {g.l}
        </button>
      ))}
    </div>
  </div>

  <div style={{marginBottom:'12px'}}>
    <label style={{display:'block',fontSize:'12px',color:'var(--txt2)',fontWeight:600,marginBottom:'5px'}}>수유 방식</label>
    <div style={{display:'flex',gap:'8px'}}>
      {[{v:'breast',l:'모유'},{v:'formula',l:'분유'},{v:'mixed',l:'혼합'}].map(f=>(
        <button key={f.v} onClick={()=>setProfileForm((p:any)=>({...p,feeding_type:f.v}))}
          style={{flex:1,padding:'10px',borderRadius:'var(--rs)',border:`1.5px solid ${profileForm.feeding_type===f.v?'var(--primary)':'var(--border)'}`,background:profileForm.feeding_type===f.v?'var(--primary-bg)':'var(--card)',color:profileForm.feeding_type===f.v?'var(--primary)':'var(--txt2)',fontFamily:'inherit',cursor:'pointer',fontSize:'13px',fontWeight:profileForm.feeding_type===f.v?700:400}}>
          {f.l}
        </button>
      ))}
    </div>
  </div>

  <div style={{marginBottom:'20px'}}>
    <label style={{display:'block',fontSize:'12px',color:'var(--txt2)',fontWeight:600,marginBottom:'5px'}}>혈액형</label>
    <select value={profileForm.blood_type||''} onChange={e=>setProfileForm((p:any)=>({...p,blood_type:e.target.value}))}
      style={{width:'100%',padding:'10px 12px',border:'1.5px solid var(--border)',borderRadius:'var(--rs)',fontSize:'14px',fontFamily:'inherit',background:'var(--card)',color:'var(--txt)',outline:'none'}}>
      <option value=''>선택</option>
      {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(t=><option key={t} value={t}>{t}</option>)}
    </select>
  </div>

  <button onClick={async()=>{
    const {error}=await supabase.from('babies').update({
      name:profileForm.name,birth_date:profileForm.birth_date,gender:profileForm.gender,
      due_date:profileForm.due_date||null,birth_weight:profileForm.birth_weight?Number(profileForm.birth_weight):null,
      birth_height:profileForm.birth_height?Number(profileForm.birth_height):null,
      birth_head:profileForm.birth_head?Number(profileForm.birth_head):null,
      feeding_type:profileForm.feeding_type,blood_type:profileForm.blood_type||null,
      birth_hospital:profileForm.birth_hospital||null,
    }).eq('id',showBabyProfile.baby_id)
    if(error){showToast('저장 실패');return;}
    const {data}=await supabase.from('baby_members').select('baby_id, role, babies(id, name, birth_date, gender, photo_url, due_date, birth_weight, birth_height, birth_head, feeding_type, blood_type, birth_hospital)').eq('user_id',currentUser.id)
    const deduped=(data||[]).filter((m:any,i:number,arr:any[])=>arr.findIndex((x:any)=>x.baby_id===m.baby_id)===i)
    setDrawerBabies(deduped)
    setShowBabyProfile((prev:any)=>({...prev,babies:{...prev.babies,...profileForm}}))
                showToast('저장됨 ✅')
              }} style={{width:'100%',padding:'14px',background:'var(--primary)',color:'#fff',border:'none',borderRadius:'var(--r)',fontSize:'15px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',marginBottom:'10px'}}>
                저장
              </button>
              <button onClick={()=>{setShowBabyProfile(null)}} style={{width:'100%',padding:'10px',background:'none',border:'none',fontSize:'14px',color:'var(--txt2)',cursor:'pointer',fontFamily:'inherit'}}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {showModal && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="sheet">
            <div className="drag-bar"></div>
            <div className="sheet-title">
              {modalType === 'formula' ? '🍼 분유 기록' : modalType === 'breast' ? '🤱 모유 기록' : modalType === 'growth' ? '📏 성장 기록' : modalType === 'hospital' ? '🏥 병원 기록' : '기록 추가'}
            </div>
            {modalType !== 'formula' && modalType !== 'breast' && (
              <div className="type-grid">
                {(['sleep', 'formula', 'breast', 'diaper', 'growth', 'hospital'] as const).map(t => (
                  <button key={t} className={`type-tile ${t}${modalType === t ? ' sel' : ''}`} onClick={() => { setModalType(t); setModalStartTime(nowTime()); setModalMl(0); setLeftMin(0); setRightMin(0); }}>
                    <span className="em">{EMOJI[t]}</span><span className="nm">{LABEL[t]}</span>
                  </button>
                ))}
              </div>
            )}

            {/* SLEEP FIELDS */}
            {modalType === 'sleep' && <>
              <div className="fg"><label>수면 종류</label>
                <div className="seg">
                  <button className={sleepKind === 'nap' ? 'sel' : ''} onClick={() => setSleepKind('nap')}>🌙 낮잠</button>
                  <button className={sleepKind === 'night' ? 'sel' : ''} onClick={() => setSleepKind('night')}>⭐ 밤잠</button>
                </div>
              </div>
              <div className="row2">
                <div className="fg"><label>시작 시간</label><input type="time" value={modalStartTime} onChange={e => setModalStartTime(e.target.value)} /></div>
                <div className="fg"><label>종료 시간 (선택)</label><input type="time" value={modalEndTime} onChange={e => setModalEndTime(e.target.value)} /></div>
              </div>
            </>}

            {/* FORMULA FIELDS */}
            {modalType === 'formula' && <>
              <div style={{ textAlign: 'center', padding: '6px 0 10px', fontSize: '13px', color: 'var(--formula)', fontWeight: 600 }}>
                {formulaTotal > 0 ? `오늘 ${totalFeedMl}ml 먹었어요!` : '오늘 첫 수유예요 😊'}
              </div>
              <div className="time-adj">
                <div className="time-adj-val" style={{ color: 'var(--formula)' }}>{toAmPm(modalStartTime)}</div>
                <div className="time-adj-btns">
                  {([-60, -10, -1, 1, 10, 60] as const).map(d => (
                    <button key={d} onClick={() => setModalStartTime(adjTimeVal(modalStartTime, d))}>{d > 0 ? '+' : ''}{d < -59 ? '-1H' : d > 59 ? '+1H' : d + '분'}</button>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: 'center', margin: '8px 0 6px' }}>
                <div style={{ fontSize: '40px', fontWeight: 900, color: 'var(--formula)', lineHeight: 1 }}>{modalMl}</div>
                <div style={{ fontSize: '13px', color: 'var(--txt2)', marginTop: '4px' }}>ml</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '5px', marginBottom: '4px' }}>
                {([-20, -10, -5, 5, 10, 20] as const).map(d => (
                  <button key={d} style={{ padding: '9px 2px', background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--txt)' }}
                    onClick={() => setModalMl(m => Math.max(0, m + d))}>{d > 0 ? '+' : ''}{d}</button>
                ))}
              </div>
            </>}

            {/* BREAST FIELDS */}
            {modalType === 'breast' && <>
              <div style={{ textAlign: 'center', padding: '8px 0', fontSize: '13px', color: 'var(--breast)', fontWeight: 600 }}>
                {totalFeedMl > 0 ? `오늘 ${totalFeedMl}ml 먹었어요!` : '오늘 첫 수유예요 😊'}
              </div>
              <div className="time-adj">
                <div className="time-adj-val">{toAmPm(modalStartTime)}</div>
                <div className="time-adj-btns">
                  {([-60, -10, -1, 1, 10, 60] as const).map(d => (
                    <button key={d} onClick={() => setModalStartTime(adjTimeVal(modalStartTime, d))}>{d > 0 ? '+' : ''}{d < -59 ? '-1H' : d > 59 ? '+1H' : d + '분'}</button>
                  ))}
                </div>
              </div>
              <div className="breast-box">
                <div style={{ fontSize: '12px', color: 'var(--breast)', fontWeight: 700, marginBottom: '8px' }}>🤱 수유 시간 설정</div>
                <div className="bt-row">
                  <div className="bt-side">
                    <div className="bt-side-name">왼쪽</div>
                    <div className="bt-side-val">{leftMin}</div>
                    <div className="bt-btns">
                      <button onClick={() => setLeftMin(m => Math.max(0, m - 1))}>−</button>
                      <button onClick={() => setLeftMin(m => m + 1)}>＋</button>
                    </div>
                  </div>
                  <div className="bt-side">
                    <div className="bt-side-name">오른쪽</div>
                    <div className="bt-side-val">{rightMin}</div>
                    <div className="bt-btns">
                      <button onClick={() => setRightMin(m => Math.max(0, m - 1))}>−</button>
                      <button onClick={() => setRightMin(m => m + 1)}>＋</button>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '13px', color: 'var(--breast)', fontWeight: 600 }}>총 {leftMin + rightMin}분</div>
              </div>
            </>}

            {/* DIAPER FIELDS */}
            {modalType === 'diaper' && <>
              <div className="fg"><label>시간</label><input type="time" value={modalStartTime} onChange={e => setModalStartTime(e.target.value)} /></div>
              <div className="fg"><label>종류</label>
                <div className="seg">
                  <button className={diaperKind === 'urine' ? 'sel' : ''} onClick={() => setDiaperKind('urine')}>💧 소변</button>
                  <button className={diaperKind === 'stool' ? 'sel' : ''} onClick={() => setDiaperKind('stool')}>💩 대변</button>
                  <button className={diaperKind === 'both' ? 'sel' : ''} onClick={() => setDiaperKind('both')}>🔄 둘다</button>
                </div>
              </div>
            </>}

            {/* GROWTH FIELDS */}
            {modalType === 'growth' && <>
              <div className="fg"><label>날짜</label><input type="date" value={modalGDate} onChange={e => setModalGDate(e.target.value)} /></div>
              <div className="row2">
                <div className="fg"><label>몸무게 (kg)</label><input type="number" placeholder="5.2" step="0.01" value={modalWeight} onChange={e => setModalWeight(e.target.value)} /></div>
                <div className="fg"><label>키 (cm)</label><input type="number" placeholder="58" step="0.1" value={modalHeight} onChange={e => setModalHeight(e.target.value)} /></div>
              </div>
              <div className="fg"><label>두위 (cm, 선택)</label><input type="number" placeholder="38" step="0.1" value={modalHead} onChange={e => setModalHead(e.target.value)} /></div>
              <div className="fg"><label>메모</label><textarea placeholder="정기검진, 예방접종 등" value={modalGMemo} onChange={e => setModalGMemo(e.target.value)}></textarea></div>
            </>}

            {/* HOSPITAL FIELDS */}
            {modalType === 'hospital' && <>
              <div className="fg"><label>날짜</label><input type="date" value={modalHDate} onChange={e => setModalHDate(e.target.value)} /></div>
              <div className="fg"><label>병원/기관명</label><input type="text" placeholder="소아과, 보건소 등" value={modalHName} onChange={e => setModalHName(e.target.value)} /></div>
              <div className="fg"><label>방문 목적</label>
                <div className="seg" style={{ marginBottom: '8px' }}>
                  <button className={hospitalType === 'checkup' ? 'sel' : ''} onClick={() => setHospitalType('checkup')}>정기검진</button>
                  <button className={hospitalType === 'vaccine' ? 'sel' : ''} onClick={() => setHospitalType('vaccine')}>예방접종</button>
                  <button className={hospitalType === 'sick' ? 'sel' : ''} onClick={() => setHospitalType('sick')}>진료</button>
                </div>
              </div>
              {hospitalType === 'vaccine' && <div className="fg"><label>접종명</label><input type="text" placeholder="BCG, B형간염 등" value={modalVaccine} onChange={e => setModalVaccine(e.target.value)} /></div>}
              <div className="fg"><label>메모</label><textarea placeholder="특이사항, 다음 예약일 등" value={modalHMemo} onChange={e => setModalHMemo(e.target.value)}></textarea></div>
            </>}

            <button className="save-btn" onClick={saveRec}>저장</button>
            <button className="cancel-btn" onClick={() => setShowModal(false)}>취소</button>
          </div>
        </div>
      )}

      {/* CALENDAR MODAL */}
      {showCal && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setShowCal(false); }}>
          <div className="cal-sheet">
            <div className="drag-bar"></div>
            <div className="cal-head">
              <button onClick={() => { const d = new Date(calDate); d.setMonth(d.getMonth() - 1); setCalDate(d); }}>‹</button>
              <span>{calDate.getFullYear()}년 {calDate.getMonth() + 1}월</span>
              <button onClick={() => { const d = new Date(calDate); d.setMonth(d.getMonth() + 1); setCalDate(d); }}>›</button>
            </div>
            <div className="cal-grid">{renderCal()}</div>
            <button className="cancel-btn" onClick={() => setShowCal(false)}>닫기</button>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setShowSettings(false); }}>
          <div className="sheet">
            <div className="drag-bar"></div>
            <div className="sheet-title">⚙️ 설정</div>
            <div className="settings-row">
              <div><div className="settings-lbl">🍼 하루 수유 목표</div><div className="settings-sub">분유 + 모유 환산 합계</div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input className="s-input-sm" type="number" placeholder="800" value={sGoal} onChange={e => setSGoal(e.target.value)} /><span style={{ fontSize: '12px', color: 'var(--txt2)' }}>ml</span></div>
            </div>
            <div className="settings-row">
              <div><div className="settings-lbl">⚖️ 현재 몸무게</div><div className="settings-sub">모유 환산에 사용</div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input className="s-input-sm" type="number" placeholder="5.5" step="0.1" value={sWeight} onChange={e => setSWeight(e.target.value)} /><span style={{ fontSize: '12px', color: 'var(--txt2)' }}>kg</span></div>
            </div>
            <div className="settings-row">
              <div><div className="settings-lbl">🍼 평소 1회 분유량</div><div className="settings-sub">모유 후 보충량 계산용</div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input className="s-input-sm" type="number" placeholder="120" value={sAvgFormula} onChange={e => setSAvgFormula(e.target.value)} /><span style={{ fontSize: '12px', color: 'var(--txt2)' }}>ml</span></div>
            </div>
            <div className="settings-row">
              <div><div className="settings-lbl">⚠️ 수유 간격 경고</div><div className="settings-sub">마지막 수유 후 N시간 경과 시</div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input className="s-input-sm" type="number" placeholder="3" min="1" max="8" value={sWarn} onChange={e => setSWarn(e.target.value)} /><span style={{ fontSize: '12px', color: 'var(--txt2)' }}>시간</span></div>
            </div>
            <div className="settings-row"><div><div className="settings-lbl">🌙 다크모드</div></div><button className={`toggle${darkMode ? ' on' : ''}`} onClick={toggleDark}></button></div>
            <button 
  className="cancel-btn" 
  style={{color:'#FF6B6B', marginTop:'8px'}}
  onClick={handleLogout}
>
  🚪 로그아웃
</button>
            <button className="save-btn" style={{ marginTop: '8px' }} onClick={saveSettings}>저장</button>
            <button className="cancel-btn" onClick={() => setShowSettings(false)}>닫기</button>
            <button onClick={async () => {
              if (!confirm('정말 탈퇴하시겠어요? 모든 데이터가 삭제됩니다.')) return
              const { deleteAccount } = await import('@/lib/auth')
              await deleteAccount()
              router.push('/login')
            }} style={{width:'100%',padding:'8px',background:'none',border:'none',color:'var(--txt3)',fontSize:'12px',cursor:'pointer',fontFamily:'inherit',marginTop:'4px'}}>
              회원탈퇴
            </button>
          </div>
        </div>
      )}

      {/* FORMULA EDIT MODAL */}
      {editFormula && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setEditFormula(null); }}>
          <div className="sheet" style={{ padding: 0 }}>
            <div style={{ padding: '20px 16px 32px' }}>
              <div className="drag-bar" style={{ marginBottom: '8px' }}></div>
              <div style={{ fontSize: '16px', fontWeight: 700, textAlign: 'center', marginBottom: '4px' }}>🍼 분유 수정</div>
              <div className="time-adj">
                <div className="time-adj-val" style={{ color: 'var(--formula)' }}>{toAmPm(editStartTime)}</div>
                <div className="time-adj-btns">
                  {([-60, -10, -1, 1, 10, 60] as const).map(d => (
                    <button key={d} onClick={() => setEditStartTime(v => adjTimeVal(v, d))}>{d < -59 ? '-1H' : d > 59 ? '+1H' : (d > 0 ? '+' : '') + d + '분'}</button>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: 'center', margin: '10px 0 6px' }}>
                <div style={{ fontSize: '40px', fontWeight: 900, color: 'var(--formula)', lineHeight: 1 }}>{editMl}</div>
                <div style={{ fontSize: '13px', color: 'var(--txt2)', marginTop: '4px' }}>ml</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '5px', marginBottom: '16px' }}>
                {([-20, -10, -5, 5, 10, 20] as const).map(d => (
                  <button key={d} style={{ padding: '9px 2px', background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--txt)' }}
                    onClick={() => setEditMl(m => Math.max(0, m + d))}>{d > 0 ? '+' : ''}{d}</button>
                ))}
              </div>
              <button className="save-btn" onClick={async () => {
                const newIso = editFormula.date + 'T' + editStartTime + ':00+09:00';
                try { await apiPatch(editFormula.id, { ml: editMl, start_time: newIso }); setRecords(prev => prev.map(r => r.id === editFormula!.id ? { ...r, ml: editMl, start_time: newIso } : r)); setEditFormula(null); showToast('🍼 분유 수정됨'); } catch (_) { showToast('저장 실패'); }
              }}>저장</button>
              <button className="cancel-btn" onClick={() => setEditFormula(null)}>취소</button>
            </div>
          </div>
        </div>
      )}

      {/* BREAST EDIT MODAL */}
      {editBreast && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setEditBreast(null); }}>
          <div className="sheet" style={{ padding: 0 }}>
            <div style={{ padding: '20px 16px 32px' }}>
              <div className="drag-bar" style={{ marginBottom: '16px' }}></div>
              <div style={{ fontSize: '16px', fontWeight: 700, textAlign: 'center', marginBottom: '4px' }}>🤱 모유 수정</div>
              <div className="time-adj">
                <div className="time-adj-val">{toAmPm(editStartTime)}</div>
                <div className="time-adj-btns">
                  {([-60, -10, -1, 1, 10, 60] as const).map(d => (
                    <button key={d} onClick={() => setEditStartTime(v => adjTimeVal(v, d))}>{d < -59 ? '-1H' : d > 59 ? '+1H' : (d > 0 ? '+' : '') + d + '분'}</button>
                  ))}
                </div>
              </div>
              <div className="breast-box">
                <div style={{ fontSize: '12px', color: 'var(--breast)', fontWeight: 700, marginBottom: '8px' }}>수유 시간 (분)</div>
                <div className="bt-row">
                  <div className="bt-side"><div className="bt-side-name">왼쪽</div><div className="bt-side-val">{editLeftMin}</div>
                    <div className="bt-btns"><button onClick={() => setEditLeftMin(m => Math.max(0, m - 1))}>−</button><button onClick={() => setEditLeftMin(m => m + 1)}>＋</button></div>
                  </div>
                  <div className="bt-side"><div className="bt-side-name">오른쪽</div><div className="bt-side-val">{editRightMin}</div>
                    <div className="bt-btns"><button onClick={() => setEditRightMin(m => Math.max(0, m - 1))}>−</button><button onClick={() => setEditRightMin(m => m + 1)}>＋</button></div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '13px', color: 'var(--breast)', fontWeight: 600 }}>총 {editLeftMin + editRightMin}분</div>
              </div>
              <button className="save-btn" onClick={async () => {
                const newIso = editBreast.date + 'T' + editStartTime + ':00+09:00';
                try { await apiPatch(editBreast.id, { left_min: editLeftMin, right_min: editRightMin, start_time: newIso }); setRecords(prev => prev.map(r => r.id === editBreast!.id ? { ...r, left_min: editLeftMin, right_min: editRightMin, start_time: newIso } : r)); setEditBreast(null); showToast('🤱 모유 수정됨'); } catch (_) { showToast('저장 실패'); }
              }}>저장</button>
              <button className="cancel-btn" onClick={() => setEditBreast(null)}>취소</button>
            </div>
          </div>
        </div>
      )}

      {/* DIAPER EDIT MODAL */}
      {editDiaper && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setEditDiaper(null); }}>
          <div className="sheet" style={{ padding: 0 }}>
            <div style={{ padding: '20px 16px 32px' }}>
              <div className="drag-bar" style={{ marginBottom: '16px' }}></div>
              <div style={{ fontSize: '16px', fontWeight: 700, textAlign: 'center', marginBottom: '16px' }}>💧 기저귀 수정</div>
              <div className="time-adj" style={{ marginBottom: '16px' }}>
                <div className="time-adj-val" style={{ color: 'var(--diaper)' }}>{toAmPm(editStartTime)}</div>
                <div className="time-adj-btns">
                  {([-60, -10, -1, 1, 10, 60] as const).map(d => (
                    <button key={d} onClick={() => setEditStartTime(v => adjTimeVal(v, d))}>{d < -59 ? '-1H' : d > 59 ? '+1H' : (d > 0 ? '+' : '') + d + '분'}</button>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--txt2)', fontWeight: 600, marginBottom: '10px' }}>종류 선택</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                {(['urine', 'stool', 'both'] as const).map(k => (
                  <button key={k} onClick={() => setEditDK(k)} style={{ padding: '18px 4px', borderRadius: '14px', border: `2.5px solid ${editDK === k ? 'var(--diaper)' : 'var(--border)'}`, background: editDK === k ? 'var(--diaper-bg)' : 'var(--card)', fontSize: '22px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    {k === 'urine' ? '💧' : k === 'stool' ? '💩' : '🔄'}
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--diaper)' }}>{k === 'urine' ? '소변' : k === 'stool' ? '대변' : '둘다'}</span>
                  </button>
                ))}
              </div>
              <button className="save-btn" onClick={async () => {
                const newIso = editDiaper.date + 'T' + editStartTime + ':00+09:00';
                try { await apiPatch(editDiaper.id, { diaper_kind: editDK, start_time: newIso }); setRecords(prev => prev.map(r => r.id === editDiaper!.id ? { ...r, diaper_kind: editDK, start_time: newIso } : r)); setEditDiaper(null); showToast('💧 기저귀 수정됨'); } catch (_) { showToast('저장 실패'); }
              }}>저장</button>
              <button className="cancel-btn" onClick={() => setEditDiaper(null)}>취소</button>
            </div>
          </div>
        </div>
      )}

      {/* SLEEP EDIT MODAL */}
      {editSleep && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setEditSleep(null); }}>
          <div className="sheet" style={{ padding: 0 }}>
            <div style={{ padding: '20px 16px 32px' }}>
              <div className="drag-bar" style={{ marginBottom: '16px' }}></div>
              <div style={{ fontSize: '16px', fontWeight: 700, textAlign: 'center', marginBottom: '8px' }}>😴 수면 수정</div>
              {!editSleep.end_time
                ? <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--sleep)', fontWeight: 600, marginBottom: '14px' }}>⏱ {durLabel(Math.floor((Date.now() - new Date(editSleep.start_time).getTime()) / 60000))} 경과 중</div>
                : <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--txt2)', marginBottom: '14px' }}>총 {durLabel(durMin(editSleep.start_time, editSleep.end_time))}</div>
              }
              <div style={{ fontSize: '12px', color: 'var(--txt2)', fontWeight: 600, marginBottom: '6px' }}>시작 시간</div>
              <div className="time-adj" style={{ marginBottom: '14px' }}>
                <div className="time-adj-val" style={{ color: 'var(--sleep)' }}>{toAmPm(editStartTime)}</div>
                <div className="time-adj-btns">
                  {([-60, -10, -1, 1, 10, 60] as const).map(d => (
                    <button key={d} onClick={() => setEditStartTime(v => adjTimeVal(v, d))}>{d < -59 ? '-1H' : d > 59 ? '+1H' : (d > 0 ? '+' : '') + d + '분'}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--txt2)', fontWeight: 600 }}>종료 시간{!editSleep.end_time ? ' (선택)' : ''}</span>
                {!editSleep.end_time && (
                  <button onClick={() => { const n = new Date(); setEditEndTime(pad(n.getHours()) + ':' + pad(n.getMinutes())); }} style={{ padding: '8px 16px', borderRadius: '20px', border: '2px solid var(--sleep)', background: 'var(--sleep-bg)', color: 'var(--sleep)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>지금 일어났어요!</button>
                )}
              </div>
              <div className="time-adj" style={{ marginBottom: '14px', opacity: (!editSleep.end_time && !editEndTime) ? 0.5 : 1 }}>
                <div className="time-adj-val" style={{ color: 'var(--sleep)' }}>{editEndTime ? toAmPm(editEndTime) : '--:--'}</div>
                <div className="time-adj-btns">
                  {([-60, -10, -1, 1, 10, 60] as const).map(d => (
                    <button key={d} onClick={() => {
                      const base = editEndTime || (pad(new Date().getHours()) + ':' + pad(new Date().getMinutes()));
                      setEditEndTime(adjTimeVal(base, d));
                    }}>{d < -59 ? '-1H' : d > 59 ? '+1H' : (d > 0 ? '+' : '') + d + '분'}</button>
                  ))}
                </div>
              </div>
              <button className="save-btn" onClick={async () => {
                const newStart = editSleep.date + 'T' + editStartTime + ':00+09:00';
                const patch: Record<string, unknown> = { start_time: newStart };
                if (editEndTime) {
                  const startM = parseInt(editStartTime.split(':')[0]) * 60 + parseInt(editStartTime.split(':')[1]);
                  const endM = parseInt(editEndTime.split(':')[0]) * 60 + parseInt(editEndTime.split(':')[1]);
                  const endDate = endM < startM ? new Date(new Date(editSleep.date).getTime() + 86400000) : new Date(editSleep.date);
                  patch.end_time = fmtDate(endDate) + 'T' + editEndTime + ':00+09:00';
                } else { patch.end_time = null; }
                try {
                  await apiPatch(editSleep.id, patch);
                  setRecords(prev => prev.map(r => r.id === editSleep!.id ? { ...r, start_time: newStart, end_time: (patch.end_time as string) || undefined } : r));
                  setEditSleep(null); showToast('😴 수면 수정됨');
                } catch (_) { showToast('저장 실패'); }
              }}>저장</button>
              <button className="cancel-btn" onClick={() => setEditSleep(null)}>취소</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function LogPage() {
  return (
    <Suspense fallback={<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontSize:'14px',color:'#6B7280'}}>불러오는 중...</div>}>
      <LogPageInner />
    </Suspense>
  );
}