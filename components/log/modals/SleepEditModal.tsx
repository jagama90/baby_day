'use client';

import { useState } from 'react';
import { BabyRecord, fmtTime, fmtDate } from '@/lib/logs';
import { toAmPm, adjTimeVal, pad, durMin, durLabel } from '@/app/log/_utils';

interface Props {
  record: BabyRecord;
  nowTs: number;
  onSave: (startTime: string, endTime: string | null) => Promise<void>;
  onClose: () => void;
}

export default function SleepEditModal({ record, nowTs, onSave, onClose }: Props) {
  const [startTime, setStartTime] = useState(fmtTime(record.start_time));
  const [endTime, setEndTime] = useState(record.end_time ? fmtTime(record.end_time) : '');

  const handleSave = async () => {
    const newStart = record.date + 'T' + startTime + ':00+09:00';
    let resolvedEndTime: string | null = null;
    if (endTime) {
      const startM = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
      const endM = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
      const endDate = endM < startM ? new Date(new Date(record.date).getTime() + 86400000) : new Date(record.date);
      resolvedEndTime = fmtDate(endDate) + 'T' + endTime + ':00+09:00';
    }
    await onSave(newStart, resolvedEndTime);
  };

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" style={{ padding: 0 }}>
        <div style={{ padding: '20px 16px 32px' }}>
          <div className="drag-bar" style={{ marginBottom: '16px' }}></div>
          <div style={{ fontSize: '16px', fontWeight: 700, textAlign: 'center', marginBottom: '8px' }}>😴 수면 수정</div>
          {!record.end_time
            ? <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--sleep)', fontWeight: 600, marginBottom: '14px' }}>⏱ {durLabel(Math.floor((nowTs - new Date(record.start_time).getTime()) / 60000))} 경과 중</div>
            : <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--txt2)', marginBottom: '14px' }}>총 {durLabel(durMin(record.start_time, record.end_time))}</div>
          }
          <div style={{ fontSize: '12px', color: 'var(--txt2)', fontWeight: 600, marginBottom: '6px' }}>시작 시간</div>
          <div className="time-adj" style={{ marginBottom: '14px' }}>
            <div className="time-adj-val" style={{ color: 'var(--sleep)' }}>{toAmPm(startTime)}</div>
            <div className="time-adj-btns">
              {([-60, -10, -1, 1, 10, 60] as const).map(d => (
                <button key={d} onClick={() => setStartTime(v => adjTimeVal(v, d))}>{d < -59 ? '-1H' : d > 59 ? '+1H' : (d > 0 ? '+' : '') + d + '분'}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--txt2)', fontWeight: 600 }}>종료 시간{!record.end_time ? ' (선택)' : ''}</span>
            {!record.end_time && (
              <button onClick={() => { const n = new Date(); setEndTime(pad(n.getHours()) + ':' + pad(n.getMinutes())); }} style={{ padding: '8px 16px', borderRadius: '20px', border: '2px solid var(--sleep)', background: 'var(--sleep-bg)', color: 'var(--sleep)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>지금 일어났어요!</button>
            )}
          </div>
          <div className="time-adj" style={{ marginBottom: '14px', opacity: (!record.end_time && !endTime) ? 0.5 : 1 }}>
            <div className="time-adj-val" style={{ color: 'var(--sleep)' }}>{endTime ? toAmPm(endTime) : '--:--'}</div>
            <div className="time-adj-btns">
              {([-60, -10, -1, 1, 10, 60] as const).map(d => (
                <button key={d} onClick={() => {
                  const base = endTime || (pad(new Date().getHours()) + ':' + pad(new Date().getMinutes()));
                  setEndTime(adjTimeVal(base, d));
                }}>{d < -59 ? '-1H' : d > 59 ? '+1H' : (d > 0 ? '+' : '') + d + '분'}</button>
              ))}
            </div>
          </div>
          <button className="save-btn" onClick={handleSave}>저장</button>
          <button className="cancel-btn" onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
}
