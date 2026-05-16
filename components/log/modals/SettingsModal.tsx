'use client';

import { useState } from 'react';
import { AppSettings } from '@/lib/settingsStore';

interface Props {
  settings: AppSettings;
  darkMode: boolean;
  onSave: (updates: Partial<AppSettings>) => void;
  onToggleDark: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onClose: () => void;
}

export default function SettingsModal({ settings, darkMode, onSave, onToggleDark, onLogout, onDeleteAccount, onClose }: Props) {
  const [sGoal, setSGoal] = useState(settings.formulaGoal || '');
  const [sWeight, setSWeight] = useState(settings.babyWeight || '');
  const [sAvgFormula, setSAvgFormula] = useState(settings.avgFormulaMl || '');
  const [sWarn, setSWarn] = useState(settings.feedWarnHour || '3');

  const handleSave = () => {
    onSave({
      formulaGoal: sGoal,
      feedWarnHour: sWarn || '3',
      babyWeight: sWeight,
      avgFormulaMl: sAvgFormula,
    });
  };

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
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
        <div className="settings-row"><div><div className="settings-lbl">🌙 다크모드</div></div><button className={`toggle${darkMode ? ' on' : ''}`} onClick={onToggleDark}></button></div>
        <button
          className="cancel-btn"
          style={{ color: '#FF6B6B', marginTop: '8px' }}
          onClick={onLogout}
        >
          🚪 로그아웃
        </button>
        <button className="save-btn" style={{ marginTop: '8px' }} onClick={handleSave}>저장</button>
        <button className="cancel-btn" onClick={onClose}>닫기</button>
        <button onClick={onDeleteAccount} style={{ width: '100%', padding: '8px', background: 'none', border: 'none', color: 'var(--txt3)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', marginTop: '4px' }}>
          회원탈퇴
        </button>
      </div>
    </div>
  );
}
