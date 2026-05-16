'use client';

import { useState } from 'react';
import { BabyRecord, fmtTime } from '@/lib/logs';
import { toAmPm, adjTimeVal } from '@/app/log/_utils';

interface Props {
  record: BabyRecord;
  onSave: (kind: 'urine' | 'stool' | 'both', startTime: string) => Promise<void>;
  onClose: () => void;
}

export default function DiaperEditModal({ record, onSave, onClose }: Props) {
  const [diaperKind, setDiaperKind] = useState<'urine' | 'stool' | 'both'>((record.diaper_kind as 'urine' | 'stool' | 'both') || 'urine');
  const [startTime, setStartTime] = useState(fmtTime(record.start_time));

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" style={{ padding: 0 }}>
        <div style={{ padding: '20px 16px 32px' }}>
          <div className="drag-bar" style={{ marginBottom: '16px' }}></div>
          <div style={{ fontSize: '16px', fontWeight: 700, textAlign: 'center', marginBottom: '16px' }}>💧 기저귀 수정</div>
          <div className="time-adj" style={{ marginBottom: '16px' }}>
            <div className="time-adj-val" style={{ color: 'var(--diaper)' }}>{toAmPm(startTime)}</div>
            <div className="time-adj-btns">
              {([-60, -10, -1, 1, 10, 60] as const).map(d => (
                <button key={d} onClick={() => setStartTime(v => adjTimeVal(v, d))}>{d < -59 ? '-1H' : d > 59 ? '+1H' : (d > 0 ? '+' : '') + d + '분'}</button>
              ))}
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--txt2)', fontWeight: 600, marginBottom: '10px' }}>종류 선택</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            {(['urine', 'stool', 'both'] as const).map(k => (
              <button key={k} onClick={() => setDiaperKind(k)} style={{ padding: '18px 4px', borderRadius: '14px', border: `2.5px solid ${diaperKind === k ? 'var(--diaper)' : 'var(--border)'}`, background: diaperKind === k ? 'var(--diaper-bg)' : 'var(--card)', fontSize: '22px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                {k === 'urine' ? '💧' : k === 'stool' ? '💩' : '🔄'}
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--diaper)' }}>{k === 'urine' ? '소변' : k === 'stool' ? '대변' : '둘다'}</span>
              </button>
            ))}
          </div>
          <button className="save-btn" onClick={() => onSave(diaperKind, startTime)}>저장</button>
          <button className="cancel-btn" onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
}
