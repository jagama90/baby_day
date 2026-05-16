'use client';

import { useState } from 'react';
import { EMOJI, LABEL, nowTime } from '@/lib/logs';
import { toAmPm, adjTimeVal } from '@/app/log/_utils';

interface Props {
  initialType: string;
  selDateStr: string;
  babyId: string;
  userId: string;
  formulaTotal: number;
  totalFeedMl: number;
  onSave: (rec: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
}

export default function AddRecordModal({ initialType, selDateStr, babyId, userId, formulaTotal, totalFeedMl, onSave, onClose }: Props) {
  const [modalType, setModalType] = useState(initialType);
  const [modalStartTime, setModalStartTime] = useState(nowTime());
  const [modalEndTime, setModalEndTime] = useState('');
  const [modalMl, setModalMl] = useState(0);
  const [leftMin, setLeftMin] = useState(0);
  const [rightMin, setRightMin] = useState(0);
  const [sleepKind, setSleepKind] = useState<'nap' | 'night'>('nap');
  const [diaperKind, setDiaperKind] = useState<'urine' | 'stool' | 'both'>('urine');
  const [hospitalType, setHospitalType] = useState<'checkup' | 'vaccine' | 'sick'>('checkup');
  const [modalGDate, setModalGDate] = useState(selDateStr);
  const [modalWeight, setModalWeight] = useState('');
  const [modalHeight, setModalHeight] = useState('');
  const [modalHead, setModalHead] = useState('');
  const [modalGMemo, setModalGMemo] = useState('');
  const [modalHDate, setModalHDate] = useState(selDateStr);
  const [modalHName, setModalHName] = useState('');
  const [modalVaccine, setModalVaccine] = useState('');
  const [modalHMemo, setModalHMemo] = useState('');

  const handleSave = async () => {
    const nowDs = selDateStr;
    let rec: Record<string, unknown> = { type: modalType, baby_id: babyId, user_id: userId };
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
    await onSave(rec);
  };

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
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

        <button className="save-btn" onClick={handleSave}>저장</button>
        <button className="cancel-btn" onClick={onClose}>취소</button>
      </div>
    </div>
  );
}
