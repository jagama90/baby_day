'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Props {
  currentUser: any;
  drawerBabies: any[];
  currentBabyId: string | null;
  onBabySelect: (m: any) => void;
  onBabyProfileClick: (m: any) => void;
  onBabyDelete: (m: any) => void;
  onAddBaby: (name: string, birth: string, role: string) => Promise<void>;
  onInviteCodeCreate: () => Promise<void>;
  onInviteCodeJoin: () => void;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export default function NavDrawer({
  currentUser,
  drawerBabies,
  currentBabyId,
  onBabySelect,
  onBabyProfileClick,
  onBabyDelete,
  onAddBaby,
  onInviteCodeCreate,
  onInviteCodeJoin,
  onClose,
  showToast,
}: Props) {
  const [showAddBaby, setShowAddBaby] = useState(false);
  const [newBabyName, setNewBabyName] = useState('');
  const [newBabyBirth, setNewBabyBirth] = useState('');
  const [newBabyRole, setNewBabyRole] = useState('dad');

  const handleAddBaby = async () => {
    if (!newBabyName || !newBabyBirth) return;
    await onAddBaby(newBabyName, newBabyBirth, newBabyRole);
    setNewBabyName('');
    setNewBabyBirth('');
    setShowAddBaby(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex' }} onClick={onClose}>
      <div style={{ width: '80%', maxWidth: '320px', height: '100%', background: 'var(--card)', boxShadow: '4px 0 20px rgba(0,0,0,.2)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        {/* 상단 유저 영역 */}
        <div style={{ background: 'linear-gradient(135deg,#4A6CF7,#7B3FF2)', padding: '40px 20px 20px', color: '#fff' }}>
          <div style={{ fontSize: '13px', opacity: .8, marginBottom: '4px' }}>{currentUser?.email}</div>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>안녕하세요 👋</div>
        </div>

        {/* 아기 목록 */}
        <div style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--txt3)', fontWeight: 600, marginBottom: '10px' }}>우리 아기</div>
          {drawerBabies.length === 0 && (
            <div style={{ fontSize: '13px', color: 'var(--txt3)', padding: '8px 0' }}>등록된 아기가 없어요</div>
          )}
          {drawerBabies.map((m: any) => (
            <div key={m.baby_id} style={{ position: 'relative', marginBottom: '4px' }}>
              <div onClick={() => onBabyProfileClick(m)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '12px', cursor: 'pointer', background: currentBabyId === m.baby_id ? 'var(--primary-bg)' : 'transparent', paddingRight: '36px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>👶</div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--txt)' }}>{m.babies?.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--txt3)' }}>{m.babies?.birth_date} · {({ mom: '엄마', dad: '아빠', parent: '보호자', guardian: '보호자' } as Record<string, string>)[m.role] || m.role}</div>
                </div>
              </div>
              <button onClick={async (e) => {
                e.stopPropagation();
                onBabyDelete(m);
              }} style={{ position: 'absolute', top: '50%', right: '8px', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: '18px', color: 'var(--txt3)', cursor: 'pointer', padding: '4px', lineHeight: 1 }}>×</button>
            </div>
          ))}

          {/* 아기 추가 */}
          {!showAddBaby ? (
            <button onClick={() => setShowAddBaby(true)} style={{ width: '100%', padding: '10px', marginTop: '8px', border: '1.5px dashed var(--border)', borderRadius: '12px', background: 'none', color: 'var(--txt2)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
              + 아기 추가하기
            </button>
          ) : (
            <div style={{ marginTop: '12px', background: 'var(--bg)', borderRadius: '12px', padding: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>새 아기 등록</div>
              <input placeholder="아기 이름" value={newBabyName} onChange={e => setNewBabyName(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '14px', marginBottom: '8px', fontFamily: 'inherit', background: 'var(--card)', color: 'var(--txt)', outline: 'none', boxSizing: 'border-box' }} />
              <input type="date" value={newBabyBirth} onChange={e => setNewBabyBirth(e.target.value)}
                placeholder="YYYY-MM-DD"
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '14px', marginBottom: '8px', fontFamily: 'inherit', background: 'var(--card)', color: 'var(--txt)', outline: 'none', boxSizing: 'border-box' }} />
              <select value={newBabyRole} onChange={e => setNewBabyRole(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '14px', marginBottom: '12px', fontFamily: 'inherit', background: 'var(--card)', color: 'var(--txt)', outline: 'none', boxSizing: 'border-box' }}>
                <option value="dad">아빠</option>
                <option value="mom">엄마</option>
                <option value="parent">보호자</option>
              </select>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleAddBaby} style={{ flex: 1, padding: '10px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>등록</button>
                <button onClick={() => setShowAddBaby(false)} style={{ flex: 1, padding: '10px', background: 'none', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '13px', color: 'var(--txt2)', cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
              </div>
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', margin: '0 16px' }} />

        {/* 초대코드 */}
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onInviteCodeCreate} style={{ flex: 1, padding: '12px', border: '1.5px solid var(--border)', borderRadius: '12px', background: 'none', color: 'var(--primary)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', fontWeight: 600 }}>
              🔗 초대코드 생성
            </button>
            <button onClick={onInviteCodeJoin} style={{ flex: 1, padding: '12px', border: '1.5px solid var(--border)', borderRadius: '12px', background: 'none', color: 'var(--txt2)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>
              🔑 초대코드 입력
            </button>
          </div>
        </div>
      </div>
      {/* 오른쪽 dimmed 영역 */}
      <div style={{ flex: 1 }} />
    </div>
  );
}
