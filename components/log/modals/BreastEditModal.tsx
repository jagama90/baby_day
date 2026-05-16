'use client';

import { useState } from 'react';
import { BabyRecord, fmtTime } from '@/lib/logs';
import { toAmPm, adjTimeVal } from '@/app/log/_utils';

interface Props {
  record: BabyRecord;
  onSave: (leftMin: number, rightMin: number, startTime: string) => Promise<void>;
  onClose: () => void;
}

export default function BreastEditModal({ record, onSave, onClose }: Props) {
  const [leftMin, setLeftMin] = useState(Number(record.left_min || 0));
  const [rightMin, setRightMin] = useState(Number(record.right_min || 0));
  const [startTime, setStartTime] = useState(fmtTime(record.start_time));

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" style={{ padding: 0 }}>
        <div style={{ padding: '20px 16px 32px' }}>
          <div className="drag-bar" style={{ marginBottom: '16px' }}></div>
          <div style={{ fontSize: '16px', fontWeight: 700, textAlign: 'center', marginBottom: '4px' }}>🤱 모유 수정</div>
          <div className="time-adj">
            <div className="time-adj-val">{toAmPm(startTime)}</div>
            <div className="time-adj-btns">
              {([-60, -10, -1, 1, 10, 60] as const).map(d => (
                <button key={d} onClick={() => setStartTime(v => adjTimeVal(v, d))}>{d < -59 ? '-1H' : d > 59 ? '+1H' : (d > 0 ? '+' : '') + d + '분'}</button>
              ))}
            </div>
          </div>
          <div className="breast-box">
            <div style={{ fontSize: '12px', color: 'var(--breast)', fontWeight: 700, marginBottom: '8px' }}>수유 시간 (분)</div>
            <div className="bt-row">
              <div className="bt-side"><div className="bt-side-name">왼쪽</div><div className="bt-side-val">{leftMin}</div>
                <div className="bt-btns"><button onClick={() => setLeftMin(m => Math.max(0, m - 1))}>−</button><button onClick={() => setLeftMin(m => m + 1)}>＋</button></div>
              </div>
              <div className="bt-side"><div className="bt-side-name">오른쪽</div><div className="bt-side-val">{rightMin}</div>
                <div className="bt-btns"><button onClick={() => setRightMin(m => Math.max(0, m - 1))}>−</button><button onClick={() => setRightMin(m => m + 1)}>＋</button></div>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '13px', color: 'var(--breast)', fontWeight: 600 }}>총 {leftMin + rightMin}분</div>
          </div>
          <button className="save-btn" onClick={() => onSave(leftMin, rightMin, startTime)}>저장</button>
          <button className="cancel-btn" onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
}
