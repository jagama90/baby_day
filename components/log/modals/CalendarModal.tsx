'use client';

import { useState } from 'react';
import { BabyRecord, fmtDate } from '@/lib/logs';
import { pad } from '@/app/log/_utils';

interface Props {
  selDate: Date;
  records: BabyRecord[];
  onSelect: (date: Date) => void;
  onClose: () => void;
}

export default function CalendarModal({ selDate, records, onSelect, onClose }: Props) {
  const [calDate, setCalDate] = useState(new Date(selDate));

  const renderCal = () => {
    const y = calDate.getFullYear(), m = calDate.getMonth();
    const first = new Date(y, m, 1).getDay(), total = new Date(y, m + 1, 0).getDate();
    const logDays = new Set(records.map(r => r.date));
    const todStr = fmtDate(new Date()), selStr = fmtDate(selDate);
    const cells: React.ReactNode[] = [];
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    dayNames.forEach(d => cells.push(<div key={'h' + d} className="cal-dn">{d}</div>));
    for (let i = 0; i < first; i++) cells.push(<div key={'e' + i} className="cal-d empty"></div>);
    for (let d = 1; d <= total; d++) {
      const dStr = y + '-' + pad(m + 1) + '-' + pad(d);
      let cls = 'cal-d';
      if (dStr === todStr) cls += ' today'; else if (dStr === selStr) cls += ' sel';
      if (logDays.has(dStr)) cls += ' has';
      cells.push(<div key={d} className={cls} onClick={() => { onSelect(new Date(dStr + 'T12:00:00')); }}>{d}</div>);
    }
    return cells;
  };

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cal-sheet">
        <div className="drag-bar"></div>
        <div className="cal-head">
          <button onClick={() => { const d = new Date(calDate); d.setMonth(d.getMonth() - 1); setCalDate(d); }}>‹</button>
          <span>{calDate.getFullYear()}년 {calDate.getMonth() + 1}월</span>
          <button onClick={() => { const d = new Date(calDate); d.setMonth(d.getMonth() + 1); setCalDate(d); }}>›</button>
        </div>
        <div className="cal-grid">{renderCal()}</div>
        <button className="cancel-btn" onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}
