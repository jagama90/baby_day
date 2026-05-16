'use client';

import { useState } from 'react';
import { BabyRecord, fmtTime } from '@/lib/logs';
import { toAmPm, adjTimeVal } from '@/app/log/_utils';

interface Props {
  record: BabyRecord;
  onSave: (ml: number, startTime: string) => Promise<void>;
  onClose: () => void;
}

export default function FormulaEditModal({ record, onSave, onClose }: Props) {
  const [ml, setMl] = useState(Number(record.ml || 0));
  const [startTime, setStartTime] = useState(fmtTime(record.start_time));

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" style={{ padding: 0 }}>
        <div style={{ padding: '20px 16px 32px' }}>
          <div className="drag-bar" style={{ marginBottom: '8px' }}></div>
          <div style={{ fontSize: '16px', fontWeight: 700, textAlign: 'center', marginBottom: '4px' }}>🍼 분유 수정</div>
          <div className="time-adj">
            <div className="time-adj-val" style={{ color: 'var(--formula)' }}>{toAmPm(startTime)}</div>
            <div className="time-adj-btns">
              {([-60, -10, -1, 1, 10, 60] as const).map(d => (
                <button key={d} onClick={() => setStartTime(v => adjTimeVal(v, d))}>{d < -59 ? '-1H' : d > 59 ? '+1H' : (d > 0 ? '+' : '') + d + '분'}</button>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'center', margin: '10px 0 6px' }}>
            <div style={{ fontSize: '40px', fontWeight: 900, color: 'var(--formula)', lineHeight: 1 }}>{ml}</div>
            <div style={{ fontSize: '13px', color: 'var(--txt2)', marginTop: '4px' }}>ml</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '5px', marginBottom: '16px' }}>
            {([-20, -10, -5, 5, 10, 20] as const).map(d => (
              <button key={d} style={{ padding: '9px 2px', background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--txt)' }}
                onClick={() => setMl(m => Math.max(0, m + d))}>{d > 0 ? '+' : ''}{d}</button>
            ))}
          </div>
          <button className="save-btn" onClick={() => onSave(ml, startTime)}>저장</button>
          <button className="cancel-btn" onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
}
