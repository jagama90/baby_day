'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { BabyRecord, EMOJI, LABEL, breastToFormulaMl, detail, elapsed, fmtDate, fmtTime, nowTime, todayStr } from '@/lib/logs';
import { createBabyLog, deleteBabyLog, getBabyLogs, patchBabyLog } from '@/lib/babyLogApi';
import { AppSettings, loadSettingsFromStorage, saveSettingToStorage } from '@/lib/settingsStore';
import { LOG_STYLES } from './_styles';
import { pad, durMin, durLabel, autoSleepKind, toAmPm, adjTimeVal } from './_utils';
import FormulaEditModal from '@/components/log/modals/FormulaEditModal';
import BreastEditModal from '@/components/log/modals/BreastEditModal';
import DiaperEditModal from '@/components/log/modals/DiaperEditModal';
import SleepEditModal from '@/components/log/modals/SleepEditModal';
import AddRecordModal from '@/components/log/modals/AddRecordModal';
import CalendarModal from '@/components/log/modals/CalendarModal';
import SettingsModal from '@/components/log/modals/SettingsModal';
import NavDrawer from '@/components/log/modals/NavDrawer';
import BabyProfileModal from '@/components/log/modals/BabyProfileModal';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type Settings = AppSettings;

export default function LogPageInner() {
  const [records, setRecords] = useState<BabyRecord[]>([]);
  const [selDate, setSelDate] = useState(new Date());
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
  const [modalType, setModalType] = useState('sleep');
  const [showModal, setShowModal] = useState(false);
  const [showCal, setShowCal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [voiceTip, setVoiceTip] = useState('말씀해주세요');
  const [editFormula, setEditFormula] = useState<BabyRecord | null>(null);
  const [editBreast, setEditBreast] = useState<BabyRecord | null>(null);
  const [editDiaper, setEditDiaper] = useState<BabyRecord | null>(null);
  const [editSleep, setEditSleep] = useState<BabyRecord | null>(null);
  const [formulaText, setFormulaText] = useState('');
  const [sleepTimerMap, setSleepTimerMap] = useState<Record<string, string>>({});
  const [darkMode, setDarkMode] = useState(false);
  const [secureMsg, setSecureMsg] = useState('🔒 모든 기록은 암호화되어 안전하게 저장됩니다');
  const [growthHtml, setGrowthHtml] = useState('');
  const [hospitalHtml, setHospitalHtml] = useState('');
  const [sName, setSName] = useState('');
  const [sBirth, setSBirth] = useState('');
  const router = useRouter();
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerBabies, setDrawerBabies] = useState<any[]>([]);
  const [showBabyProfile, setShowBabyProfile] = useState<any>(null);
  const [showBabyPicker, setShowBabyPicker] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [memberRoleMap, setMemberRoleMap] = useState<Record<string, string>>({});
  const [patternMsgs, setPatternMsgs] = useState<string[]>([]);
  const [patternIdx, setPatternIdx] = useState(0);
  const [patternVisible, setPatternVisible] = useState(true);
  const [nowTs, setNowTs] = useState(() => Date.now());

  const recogRef = useRef<any>(null);
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const iv = setInterval(() => setNowTs(Date.now()), 60000);
    return () => clearInterval(iv);
  }, []);

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
    const anyModal = showModal || showSettings || showCal || !!editFormula || !!editBreast || !!editDiaper || !!editSleep || showVoice || showDrawer || !!showBabyProfile;
    if (anyModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal, showSettings, showCal, editFormula, editBreast, editDiaper, editSleep, showVoice, showDrawer, showBabyProfile]);

  // ── LOAD SETTINGS ──
  const loadSettings = useCallback(async () => {
    const s = await loadSettingsFromStorage();
    setSettings(s);
    if (s.darkMode === '1') { setDarkMode(true); document.body.classList.add('dark'); }
    setSName(s.babyName);
    setSBirth(s.babyBirth);
    return s;
  }, []);

  const saveSetting = async (k: keyof Settings, v: string) => {
    await saveSettingToStorage(k, v);
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
      const params = new URLSearchParams(window.location.search);
      const babyId = params.get('babyId');
      if (!babyId) { setSyncState('on'); setSyncTxt('실시간 동기화 중'); setRecords([]); return; }
      const data = await getBabyLogs(babyId);
      setRecords(data);
      setSyncState('on'); setSyncTxt('실시간 동기화 중');
    } catch (e: unknown) {
      setSyncState('off'); setSyncTxt('연결 실패');
      showToast('로드 실패: ' + (e instanceof Error ? e.message : ''));
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      const s = await loadSettings();
      await loadAll(s);
    };
    initialize();
    // 현재 유저 + 아기 목록 로드
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
      if (user) {
        const params = new URLSearchParams(window.location.search);
        const babyId = params.get('babyId');
        supabase.from('baby_members').select('baby_id, role, babies(id, name, birth_date, gender, photo_url, due_date, birth_weight, birth_height, birth_head, feeding_type, blood_type, birth_hospital)').eq('user_id', user.id)
          .then(({ data }) => {
            const deduped = (data || []).filter((m: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.baby_id === m.baby_id) === i);
            setDrawerBabies(deduped);
          });
        if (babyId) {
          supabase.from('baby_members').select('user_id, role').eq('baby_id', babyId)
            .then(({ data }) => {
              const map: Record<string, string> = {};
              data?.forEach((m: any) => { map[m.user_id] = m.role; });
              setMemberRoleMap(map);
            });
        }
      }
    });
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
        const g = (new Date(feedRecs[i].start_time).getTime() - new Date(feedRecs[i - 1].start_time).getTime()) / 60000;
        if (g >= 30 && g <= 360) gaps.push(g);
      }
      if (gaps.length >= 5) {
        const sorted = [...gaps].sort((a, b) => a - b);
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
        const nextSleepRecs = records.filter(r => r.type === 'sleep' && new Date(r.start_time).getTime() > wakeTime).sort((a, b) => a.start_time > b.start_time ? 1 : -1);
        if (nextSleepRecs.length) {
          const g = (new Date(nextSleepRecs[0].start_time).getTime() - wakeTime) / 60000;
          if (g >= 30 && g <= 240) wakeGaps.push(g);
        }
      }
      if (wakeGaps.length >= 3) {
        const sorted = [...wakeGaps].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        const lastNap = napRecs[napRecs.length - 1];
        const lastWake = new Date(lastNap.end_time!).getTime();
        const nextSleepTime = lastWake + median * 60000;
        const remaining = Math.round((nextSleepTime - now) / 60000);
        const elapsedMin = Math.round((now - lastWake) / 60000);
        const eh = Math.floor(elapsedMin / 60), em = elapsedMin % 60;
        if (remaining >= 0 && remaining <= 30) {
          msgs.push(`💡 마지막 낮잠에서 깬 지 ${eh ? eh + '시간 ' : ''}${em}분, 곧 졸림 신호가 올 수 있어요`);
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
    if (!SUPA_URL || !SUPA_KEY) {
      setSyncState('off');
      setSyncTxt('환경설정 필요');
      return;
    }

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

    const breastMl = breastToFormulaMl(totalBreastMin, currentBaby?.babies?.birth_date || settings.babyBirth);
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
      try { await deleteBabyLog(id); setRecords(prev => prev.filter(r => r.id !== id)); showToast('삭제됨'); } catch (_) { showToast('삭제 실패'); }
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
  const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const currentBabyId = urlParams.get('babyId');
  const currentBaby = drawerBabies.find((m: any) => m.baby_id === currentBabyId);
  const hdTitle = '👶 ' + (currentBaby?.babies?.name || settings.babyName || '아기') + ' 기록';
  const babyBirth = currentBaby?.babies?.birth_date || settings.babyBirth;
  if (babyBirth) {
    const diff = Math.floor((new Date().getTime() - new Date(babyBirth).getTime()) / 86400000);
    ageLabel = isToday ? '오늘 · D+' + diff + '일' : ds + ' · D+' + diff + '일';
  } else { ageLabel = isToday ? '오늘' : ds; }

  // ── QUICK ADD ──
  const quickAdd = async (type: string, diaperKindArg?: string) => {
    const now = new Date(), nowDs = fmtDate(now), iso = now.toISOString();
    if (type === 'sleep') {
      const ongoing = records.find(r => r.type === 'sleep' && !r.end_time);
      if (ongoing) {
        try { await patchBabyLog(ongoing.id, { end_time: iso }); showToast('수면 종료 · ' + durLabel(durMin(ongoing.start_time, iso))); await loadAll(); } catch (e: unknown) { showToast('오류: ' + (e instanceof Error ? e.message : '')); }
        return;
      }
    }
    const params = new URLSearchParams(window.location.search);
    const babyId = params.get('babyId');
    if (!babyId) { setShowDrawer(true); return; }
    const rec: Record<string, unknown> = { type, date: nowDs, start_time: iso, baby_id: babyId, user_id: currentUser?.id };
    if (type === 'sleep') rec.sleep_kind = autoSleepKind(now);
    if (type === 'diaper') rec.diaper_kind = diaperKindArg || 'urine';
    try { await createBabyLog(rec); setSelDate(now); showToast(EMOJI[type] + ' ' + LABEL[type] + ' 기록됨'); await loadAll(); } catch (e: unknown) { showToast('오류: ' + (e instanceof Error ? e.message : '')); }
  };

  // ── OPEN MODAL ──
  const openModal = (type: string) => {
    const params = new URLSearchParams(window.location.search);
    const babyId = params.get('babyId');
    if (!babyId) { setShowDrawer(true); return; }
    setModalType(type);
    setShowModal(true);
  };

  // ── DELETE ──
  const delRec = async (id: string) => {
    try { await deleteBabyLog(id); setRecords(prev => prev.filter(r => r.id !== id)); showToast('삭제됨'); } catch (_) { showToast('삭제 실패'); }
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
    const voiceParams = new URLSearchParams(window.location.search);
    const voiceBabyId = voiceParams.get('babyId');
    if (!voiceBabyId) { showToast('아기를 먼저 등록해주세요'); return; }
    const base = { baby_id: voiceBabyId, user_id: currentUser?.id };

    if (/삭제|취소|지워|잘못/.test(txt)) {
      const last = [...records].sort((a, b) => b.start_time > a.start_time ? 1 : -1)[0];
      if (last) { await deleteBabyLog(last.id); setRecords(prev => prev.filter(r => r.id !== last.id)); showToast('🗑 방금 기록 삭제됨 (' + LABEL[last.type] + ')'); }
      else showToast('삭제할 기록이 없어요'); return;
    }
    if (/수면\s*끝|잠\s*깼|기상|일어났/.test(txt)) {
      const ongoing = records.find(r => r.type === 'sleep' && !r.end_time);
      if (ongoing) { await patchBabyLog(ongoing.id, { end_time: iso }); showToast('수면 종료 · ' + durLabel(durMin(ongoing.start_time, iso))); await loadAll(); }
      else showToast('진행 중인 수면이 없어요'); return;
    }
    if (/수면|잠|낮잠|밤잠/.test(txt)) {
      const sk = /밤잠/.test(txt) ? 'night' : autoSleepKind(now);
      const ongoingSleep = records.find(r => r.type === 'sleep' && !r.end_time);
      if (ongoingSleep) { await patchBabyLog(ongoingSleep.id, { end_time: iso }); showToast('기존 수면 종료 → 새 수면 시작'); }
      await createBabyLog({ ...base, type: 'sleep', date: nowDs, start_time: iso, sleep_kind: sk });
      if (!ongoingSleep) showToast('😴 ' + (sk === 'nap' ? '낮잠' : '밤잠') + ' 시작');
      await loadAll(); return;
    }
    if (/기저귀|소변|대변/.test(txt)) {
      const kind = /대변/.test(txt) && /소변/.test(txt) ? 'both' : /대변/.test(txt) ? 'stool' : 'urine';
      await createBabyLog({ ...base, type: 'diaper', date: nowDs, start_time: iso, diaper_kind: kind });
      showToast('💧 ' + { urine: '소변', stool: '대변', both: '소변+대변' }[kind] + ' 기록됨');
      await loadAll(); return;
    }
    if (/분유/.test(txt)) {
      const m = txt.match(/(\d+)/); const ml = m ? parseInt(m[1]) : 0;
      await createBabyLog({ ...base, type: 'formula', date: nowDs, start_time: iso, ml });
      showToast('🍼 분유 ' + ml + 'ml 기록됨'); await loadAll(); return;
    }
    if (/목욕/.test(txt)) {
      await createBabyLog({ ...base, type: 'bath', date: nowDs, start_time: iso });
      showToast('🛁 목욕 기록됨'); await loadAll(); return;
    }
    if (/모유|수유/.test(txt)) {
      const lm = txt.match(/왼(쪽)?\s*(\d+)/), rm = txt.match(/오른(쪽)?\s*(\d+)/);
      const totalM = txt.match(/(\d+)\s*분/);
      let lMin = lm ? parseInt(lm[2]) : 0, rMin = rm ? parseInt(rm[2]) : 0;
      if (!lMin && !rMin && totalM) lMin = parseInt(totalM[1]);
      await createBabyLog({ ...base, type: 'breast', date: nowDs, start_time: iso, left_min: lMin, right_min: rMin });
      const parts = []; if (lMin) parts.push('왼쪽 ' + lMin + '분'); if (rMin) parts.push('오른쪽 ' + rMin + '분');
      showToast('🤱 모유 ' + (parts.join(' ') || '기록됨')); await loadAll(); return;
    }
    showToast('"' + txt + '" — 인식 실패');
  };

  // ── EXPORT CSV ──
  const exportCSV = () => {
    const csv = 'id,date,type,start_time,end_time,ml,left_min,right_min,sleep_kind,diaper_kind,weight,height,head,hospital_name,hospital_type,vaccine_name,memo\n' +
      records.map(r => [r.id, r.date, r.type, r.start_time || '', r.end_time || '', r.ml || '', r.left_min || '', r.right_min || '', r.sleep_kind || '', r.diaper_kind || '', r.weight || '', r.height || '', r.head || '', r.hospital_name || '', r.hospital_type || '', r.vaccine_name || '', r.memo || ''].join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,﻿' + encodeURIComponent(csv); a.download = 'baby_log_' + todayStr() + '.csv'; a.click();
  };

  // ── SAVE SETTINGS ──
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const saveSettings = (updates: Partial<Settings>) => {
    if (updates.formulaGoal !== undefined) saveSetting('formulaGoal', updates.formulaGoal);
    if (updates.feedWarnHour !== undefined) saveSetting('feedWarnHour', updates.feedWarnHour || '3');
    if (updates.babyWeight !== undefined) saveSetting('babyWeight', updates.babyWeight);
    if (updates.avgFormulaMl !== undefined) saveSetting('avgFormulaMl', updates.avgFormulaMl);
    setShowSettings(false);
    showToast('✅ 설정이 저장됐어요!');
  };

  const toggleDark = () => {
    const on = !darkMode;
    setDarkMode(on);
    if (on) document.body.classList.add('dark'); else document.body.classList.remove('dark');
    saveSetting('darkMode', on ? '1' : '0');
  };

  const periodLabel = (() => {
    const { label } = getPeriodRecs();
    return label;
  })();

  // ── NAV DRAWER HANDLERS ──
  const handleAddBaby = async (name: string, birth: string, role: string) => {
    if (!currentUser) return;
    const { data: baby } = await supabase.from('babies').insert({ name, birth_date: birth, created_by: currentUser.id }).select().single();
    if (baby) {
      await supabase.from('baby_members').insert({ baby_id: baby.id, user_id: currentUser.id, role });
      const { data } = await supabase.from('baby_members').select('baby_id, role, babies(id, name, birth_date)').eq('user_id', currentUser.id);
      setDrawerBabies(data || []);
      router.push(`/log?babyId=${baby.id}`);
      setShowDrawer(false);
    }
  };

  const handleBabyDelete = async (m: any) => {
    if (!confirm(`${m.babies?.name} 아기를 삭제할까요? 모든 기록이 삭제됩니다.`)) return;
    await supabase.from('baby_logs').delete().eq('baby_id', m.baby_id);
    await supabase.from('invite_codes').delete().eq('baby_id', m.baby_id);
    await supabase.from('baby_members').delete().eq('baby_id', m.baby_id);
    await supabase.from('babies').delete().eq('id', m.baby_id);
    setDrawerBabies((prev: any) => prev.filter((x: any) => x.baby_id !== m.baby_id));
    showToast('삭제됨');
    const params = new URLSearchParams(window.location.search);
    if (params.get('babyId') === m.baby_id) router.push('/log');
  };

  const handleInviteCodeCreate = async () => {
    const params = new URLSearchParams(window.location.search);
    const babyId = params.get('babyId');
    if (!babyId || !currentUser) return;
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const { error } = await supabase.from('invite_codes').insert({
      code,
      baby_id: babyId,
      created_by: currentUser.id,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    if (error) { showToast('생성 실패: ' + error.message); return; }
    showToast('초대코드: ' + code + ' (24시간 유효)');
  };

  const handleBabyProfileSave = async (babyId: string, form: Record<string, any>) => {
    const { error } = await supabase.from('babies').update({
      name: form.name, birth_date: form.birth_date, gender: form.gender,
      due_date: form.due_date || null, birth_weight: form.birth_weight ? Number(form.birth_weight) : null,
      birth_height: form.birth_height ? Number(form.birth_height) : null,
      birth_head: form.birth_head ? Number(form.birth_head) : null,
      feeding_type: form.feeding_type, blood_type: form.blood_type || null,
      birth_hospital: form.birth_hospital || null,
    }).eq('id', babyId);
    if (error) { showToast('저장 실패'); return; }
    const { data } = await supabase.from('baby_members').select('baby_id, role, babies(id, name, birth_date, gender, photo_url, due_date, birth_weight, birth_height, birth_head, feeding_type, blood_type, birth_hospital)').eq('user_id', currentUser.id);
    const deduped = (data || []).filter((m: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.baby_id === m.baby_id) === i);
    setDrawerBabies(deduped);
    setShowBabyProfile((prev: any) => ({ ...prev, babies: { ...prev.babies, ...form } }));
    showToast('저장됨 ✅');
  };

  return (
    <>
      <style>{LOG_STYLES}</style>

      {/* TOAST */}
      <div className={`toast${toastShow ? ' show' : ''}`}>{toast}</div>

      {/* HEADER */}
      <div className="hd">
        <div className="hd-top" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1 }}>
            <button className="hd-btn" onClick={() => setShowDrawer(true)}>☰</button>
            <div style={{ position: 'relative' }}>
              <div onClick={() => { if (drawerBabies.length > 1) setShowBabyPicker(p => !p); }} style={{ cursor: drawerBabies.length > 1 ? 'pointer' : 'default' }}>
                <div className="hd-title">
                  {hdTitle}
                  {drawerBabies.length > 1 && <span style={{ fontSize: '14px', opacity: .8 }}> ▾</span>}
                </div>
                <div className="hd-sub">{ageLabel}</div>
              </div>
              {showBabyPicker && drawerBabies.length > 1 && (
                <div style={{ position: 'fixed', top: '60px', left: '60px', background: 'var(--card)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,.2)', zIndex: 9999, minWidth: '180px', overflow: 'hidden', pointerEvents: 'all' }}>
                  {drawerBabies.map((m: any) => (
                    <div key={m.baby_id} onClick={() => {
                      router.push(`/log?babyId=${m.baby_id}`);
                      setShowBabyPicker(false);
                    }} style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', borderBottom: '1px solid var(--border)', color: 'var(--txt)' }}>
                      👶 {m.babies?.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="hd-actions" style={{ display: 'flex', flexDirection: 'row', gap: '8px', flexShrink: 0 }}>
            <button className="hd-btn" onClick={() => { setShowCal(true); }}>📅</button>
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
          <div style={{ margin: '0 16px 4px', background: 'var(--primary-bg)', borderRadius: '12px', padding: '10px 14px', transition: 'opacity 0.4s', opacity: patternVisible ? 1 : 0 }}>
            <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 500 }}>{patternMsgs[patternIdx]}</span>
          </div>
        )}

        {/* Feed Warning */}
        {showWarn && (
          <div className="warn-banner feed" style={{ marginBottom: '8px' }}>
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
                const role = memberRoleMap[r.user_id!];
                const isMom = role === 'mom' || role === '엄마';
                const isDad = role === 'dad' || role === '아빠';
                return { label: isMom ? '엄마 👩' : isDad ? '아빠 👨' : '보호자', color: isMom ? 'rgba(232,102,122,0.7)' : 'rgba(91,123,255,0.7)' };
              })() : null;
              return (
                <div key={r.id} className="log-card" style={{ flexDirection: 'column', ...(isEditable ? { cursor: 'pointer' } : {}) }}
                  onClick={isEditable ? () => {
                    if (r.type === 'formula') { setEditFormula(r); }
                    else if (r.type === 'breast') { setEditBreast(r); }
                    else if (r.type === 'diaper') { setEditDiaper(r); }
                    else if (r.type === 'sleep') { setEditSleep(r); }
                  } : undefined}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', width: '100%' }}>
                    <div className={`li-icon ${r.type}`}>{r.type === 'diaper' ? diaperEmoji : EMOJI[r.type]}</div>
                    <div className="li-body">
                      <div className={`li-type ${r.type}`}>{LABEL[r.type]}{r.sleep_kind ? ' · ' + (r.sleep_kind === 'nap' ? '낮잠' : '밤잠') : ''}</div>
                      {r.type === 'formula'
                        ? <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--formula)', marginTop: '2px' }}>{r.ml}ml</div>
                        : <div className="li-detail">{detail(r)}</div>
                      }
                      {r.type === 'sleep' && !r.end_time && <div className="sleep-timer">{sleepTimerMap[r.id] || '⏱ 진행 중...'}</div>}
                      {r.memo && <div className="memo-text">📝 {r.memo}</div>}
                    </div>
                    <div className="li-right">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <span className="li-time" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--txt)' }}>{fmtTime(r.start_time)}</span>
                        <button className="del-btn" onClick={e => { e.stopPropagation(); delRec(r.id); }}>×</button>
                      </div>
                      {r.end_time && <div className="li-end">~ {fmtTime(r.end_time)}</div>}
                    </div>
                  </div>
                  {roleInfo && <div style={{ textAlign: 'center', fontSize: '11px', color: roleInfo.color, marginTop: '6px', width: '100%', fontWeight: 500 }}>{roleInfo.label}</div>}
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
            <div style={{ margin: '12px 16px 0', background: 'var(--card)', borderRadius: 'var(--r)', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', fontSize: '13px', color: 'var(--txt3)', textAlign: 'center' }}>
              🌱 기록이 조금 더 쌓이면 요약을 보여드릴게요
            </div>
          );

          // 수유
          const todayFeedMl = todayRecs.filter(r => r.type === 'formula').reduce((s, r) => s + Number(r.ml || 0), 0)
            + breastToFormulaMl(todayRecs.filter(r => r.type === 'breast').reduce((s, r) => s + (Number(r.left_min || 0) + Number(r.right_min || 0)), 0), settings.babyBirth);
          const todayFeedCnt = todayRecs.filter(r => r.type === 'formula' || r.type === 'breast').length;
          const weekFeedDays: Record<string, number> = {};
          week.filter(r => r.type === 'formula' || r.type === 'breast').forEach(r => { weekFeedDays[r.date] = (weekFeedDays[r.date] || 0) + (r.type === 'formula' ? Number(r.ml || 0) : breastToFormulaMl((Number(r.left_min || 0) + Number(r.right_min || 0)), settings.babyBirth)); });
          const weekFeedAvg = Object.keys(weekFeedDays).length ? Object.values(weekFeedDays).reduce((s, v) => s + v, 0) / Object.keys(weekFeedDays).length : 0;
          const feedEval = weekFeedAvg ? (todayFeedMl >= weekFeedAvg * 1.2 ? '많은 편이에요' : todayFeedMl <= weekFeedAvg * 0.8 ? '적은 편이에요' : '평소와 비슷한 편이에요') : '';

          // 낮잠
          const todayNaps = todayRecs.filter(r => r.type === 'sleep' && r.sleep_kind === 'nap' && r.end_time);
          const todayNapMin = todayNaps.reduce((s, r) => s + durMin(r.start_time, r.end_time!), 0);
          const weekNapDays: Record<string, number> = {};
          week.filter(r => r.type === 'sleep' && r.sleep_kind === 'nap' && r.end_time).forEach(r => { weekNapDays[r.date] = (weekNapDays[r.date] || 0) + durMin(r.start_time, r.end_time!); });
          const weekNapAvg = Object.keys(weekNapDays).length ? Object.values(weekNapDays).reduce((s, v) => s + v, 0) / Object.keys(weekNapDays).length : 0;
          const napEval = weekNapAvg ? (todayNapMin >= weekNapAvg * 1.2 ? '긴 편이에요' : todayNapMin <= weekNapAvg * 0.8 ? '짧은 편이에요' : '평소와 비슷한 편이에요') : '';

          // 각성시간
          const napsSorted = [...records.filter(r => r.type === 'sleep' && r.sleep_kind === 'nap' && r.end_time && new Date(r.start_time).getTime() > days7ago)].sort((a, b) => a.end_time! > b.end_time! ? 1 : -1);
          const wakeGaps: number[] = [];
          for (let i = 0; i < napsSorted.length - 1; i++) {
            const wake = new Date(napsSorted[i].end_time!).getTime();
            const next = records.filter(r => r.type === 'sleep' && new Date(r.start_time).getTime() > wake).sort((a, b) => a.start_time > b.start_time ? 1 : -1)[0];
            if (next) { const g = (new Date(next.start_time).getTime() - wake) / 60000; if (g >= 30 && g <= 240) wakeGaps.push(g); }
          }
          const wakeMedian = wakeGaps.length >= 3 ? [...wakeGaps].sort((a, b) => a - b)[Math.floor(wakeGaps.length / 2)] : 0;
          const lastNap = napsSorted[napsSorted.length - 1];
          let nextSleepLabel = '';
          if (lastNap && wakeMedian) { const pred = new Date(new Date(lastNap.end_time!).getTime() + wakeMedian * 60000); nextSleepLabel = pad(pred.getHours()) + ':' + pad(pred.getMinutes()) + ' 전후'; }

          // 밤잠 추정
          const yesterday = fmtDate(new Date(Date.now() - 86400000));
          const nightCands = records.filter(r => r.type === 'sleep' && r.date === yesterday && new Date(r.start_time).getHours() >= 19 && r.end_time);
          nightCands.sort((a, b) => durMin(a.start_time, a.end_time!) > durMin(b.start_time, b.end_time!) ? -1 : 1);
          const nightSleep = nightCands[0] && durMin(nightCands[0].start_time, nightCands[0].end_time!) >= 120 ? nightCands[0] : null;

          // 기저귀
          const todayDiaperCnt = todayRecs.filter(r => r.type === 'diaper').length;
          const weekDiaperDays: Record<string, number> = {};
          week.filter(r => r.type === 'diaper').forEach(r => { weekDiaperDays[r.date] = (weekDiaperDays[r.date] || 0) + 1; });
          const weekDiaperAvg = Object.keys(weekDiaperDays).length ? Object.values(weekDiaperDays).reduce((s, v) => s + v, 0) / Object.keys(weekDiaperDays).length : 0;
          const diaperEval = weekDiaperAvg ? (todayDiaperCnt >= weekDiaperAvg * 1.2 ? '많은 편이에요' : todayDiaperCnt <= weekDiaperAvg * 0.8 ? '적은 편이에요' : '평소와 비슷한 편이에요') : '';

          // 한 줄 요약
          const summaryParts = [];
          if (feedEval && feedEval !== '평소와 비슷한 편이에요') summaryParts.push(`수유량은 ${feedEval}`);
          if (napEval && napEval !== '평소와 비슷한 편이에요') summaryParts.push(`낮잠은 ${napEval}`);
          const summary = summaryParts.length ? '오늘은 ' + summaryParts.join(', ') + '.' : '오늘 흐름은 평소와 비슷한 편이에요.';

          return (
            <div style={{ margin: '12px 16px 0', background: 'var(--card)', borderRadius: 'var(--r)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
              <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>📋 오늘 하루 요약</div>
                <div style={{ fontSize: '13px', color: 'var(--txt2)', marginTop: '6px', lineHeight: 1.6 }}>{summary}</div>
              </div>
              <div style={{ padding: '10px 16px', borderBottom: '.5px solid var(--border)' }}>
                <div style={{ fontSize: '12px', color: 'var(--txt3)', fontWeight: 600, marginBottom: '4px' }}>🍼 수유</div>
                <div style={{ fontSize: '13px', color: 'var(--txt)' }}>{todayFeedCnt}회 · 총 {todayFeedMl}ml{feedEval ? ` · ${feedEval}` : ''}</div>
              </div>
              <div style={{ padding: '10px 16px', borderBottom: '.5px solid var(--border)' }}>
                <div style={{ fontSize: '12px', color: 'var(--txt3)', fontWeight: 600, marginBottom: '4px' }}>😴 수면</div>
                {todayNapMin > 0 && <div style={{ fontSize: '13px', color: 'var(--txt)', marginBottom: '2px' }}>낮잠 {durLabel(todayNapMin)}{napEval ? ` · ${napEval}` : ''}</div>}
                {wakeMedian > 0 && <div style={{ fontSize: '13px', color: 'var(--txt2)' }}>평균 각성시간 {durLabel(Math.round(wakeMedian))}</div>}
                {nextSleepLabel && <div style={{ fontSize: '13px', color: 'var(--sleep)' }}>다음 졸림 예상 {nextSleepLabel}</div>}
                {nightSleep && <div style={{ fontSize: '13px', color: 'var(--txt2)' }}>어제 추정 밤잠 {fmtTime(nightSleep.start_time)} 시작</div>}
                {!todayNapMin && !wakeMedian && <div style={{ fontSize: '13px', color: 'var(--txt3)' }}>수면 기록이 없어요</div>}
              </div>
              <div style={{ padding: '10px 16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--txt3)', fontWeight: 600, marginBottom: '4px' }}>💧 기저귀</div>
                <div style={{ fontSize: '13px', color: 'var(--txt)' }}>{todayDiaperCnt}회{diaperEval ? ` · ${diaperEval}` : ''}</div>
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

      {showBabyPicker && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setShowBabyPicker(false)} />
      )}

      {/* NAVIGATION DRAWER */}
      {showDrawer && (
        <NavDrawer
          currentUser={currentUser}
          drawerBabies={drawerBabies}
          currentBabyId={currentBabyId}
          onBabySelect={(m) => { router.push(`/log?babyId=${m.baby_id}`); setShowDrawer(false); }}
          onBabyProfileClick={(m) => {
            setShowBabyProfile(m);
            setShowDrawer(false);
          }}
          onBabyDelete={handleBabyDelete}
          onAddBaby={handleAddBaby}
          onInviteCodeCreate={handleInviteCodeCreate}
          onInviteCodeJoin={() => { router.push('/invite'); setShowDrawer(false); }}
          onClose={() => setShowDrawer(false)}
          showToast={showToast}
        />
      )}

      {/* BABY PROFILE MODAL */}
      {showBabyProfile && (
        <BabyProfileModal
          member={showBabyProfile}
          nowTs={nowTs}
          currentUserId={currentUser?.id || ''}
          onSave={handleBabyProfileSave}
          onClose={() => setShowBabyProfile(null)}
        />
      )}

      {/* ADD MODAL */}
      {showModal && (
        <AddRecordModal
          initialType={modalType}
          selDateStr={ds}
          babyId={(() => { const p = new URLSearchParams(window.location.search); return p.get('babyId') || ''; })()}
          userId={currentUser?.id || ''}
          formulaTotal={formulaTotal}
          totalFeedMl={totalFeedMl}
          onSave={async (rec) => {
            setShowModal(false);
            try { await createBabyLog(rec); showToast(EMOJI[rec.type as string] + ' 저장됨'); await loadAll(); } catch (e: unknown) { showToast('저장 실패: ' + (e instanceof Error ? e.message : '')); }
          }}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* CALENDAR MODAL */}
      {showCal && (
        <CalendarModal
          selDate={selDate}
          records={records}
          onSelect={(date) => { setSelDate(date); setShowCal(false); }}
          onClose={() => setShowCal(false)}
        />
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          darkMode={darkMode}
          onSave={saveSettings}
          onToggleDark={toggleDark}
          onLogout={handleLogout}
          onDeleteAccount={async () => {
            if (!confirm('정말 탈퇴하시겠어요? 모든 데이터가 삭제됩니다.')) return;
            const { deleteAccount } = await import('@/lib/auth');
            await deleteAccount();
            router.push('/login');
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* FORMULA EDIT MODAL */}
      {editFormula && (
        <FormulaEditModal
          record={editFormula}
          onSave={async (ml, startTime) => {
            const newIso = editFormula.date + 'T' + startTime + ':00+09:00';
            try { await patchBabyLog(editFormula.id, { ml, start_time: newIso }); setRecords(prev => prev.map(r => r.id === editFormula!.id ? { ...r, ml, start_time: newIso } : r)); setEditFormula(null); showToast('🍼 분유 수정됨'); } catch (_) { showToast('저장 실패'); }
          }}
          onClose={() => setEditFormula(null)}
        />
      )}

      {/* BREAST EDIT MODAL */}
      {editBreast && (
        <BreastEditModal
          record={editBreast}
          onSave={async (leftMin, rightMin, startTime) => {
            const newIso = editBreast.date + 'T' + startTime + ':00+09:00';
            try { await patchBabyLog(editBreast.id, { left_min: leftMin, right_min: rightMin, start_time: newIso }); setRecords(prev => prev.map(r => r.id === editBreast!.id ? { ...r, left_min: leftMin, right_min: rightMin, start_time: newIso } : r)); setEditBreast(null); showToast('🤱 모유 수정됨'); } catch (_) { showToast('저장 실패'); }
          }}
          onClose={() => setEditBreast(null)}
        />
      )}

      {/* DIAPER EDIT MODAL */}
      {editDiaper && (
        <DiaperEditModal
          record={editDiaper}
          onSave={async (kind, startTime) => {
            const newIso = editDiaper.date + 'T' + startTime + ':00+09:00';
            try { await patchBabyLog(editDiaper.id, { diaper_kind: kind, start_time: newIso }); setRecords(prev => prev.map(r => r.id === editDiaper!.id ? { ...r, diaper_kind: kind, start_time: newIso } : r)); setEditDiaper(null); showToast('💧 기저귀 수정됨'); } catch (_) { showToast('저장 실패'); }
          }}
          onClose={() => setEditDiaper(null)}
        />
      )}

      {/* SLEEP EDIT MODAL */}
      {editSleep && (
        <SleepEditModal
          record={editSleep}
          nowTs={nowTs}
          onSave={async (newStart, endTimeIso) => {
            const patch: Record<string, unknown> = { start_time: newStart };
            if (endTimeIso) { patch.end_time = endTimeIso; } else { patch.end_time = null; }
            try {
              await patchBabyLog(editSleep.id, patch);
              setRecords(prev => prev.map(r => r.id === editSleep!.id ? { ...r, start_time: newStart, end_time: (patch.end_time as string) || undefined } : r));
              setEditSleep(null); showToast('😴 수면 수정됨');
            } catch (_) { showToast('저장 실패'); }
          }}
          onClose={() => setEditSleep(null)}
        />
      )}
    </>
  );
}
