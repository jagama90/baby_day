'use client';

import { useState } from 'react';
import { pad } from '@/app/log/_utils';

interface Props {
  member: any;
  nowTs: number;
  currentUserId: string;
  onSave: (babyId: string, form: Record<string, any>) => Promise<void>;
  onClose: () => void;
}

export default function BabyProfileModal({ member, nowTs, currentUserId: _currentUserId, onSave, onClose }: Props) {
  const [profileForm, setProfileForm] = useState<any>({
    name: member.babies?.name || '',
    birth_date: member.babies?.birth_date || '',
    gender: member.babies?.gender || 'male',
    due_date: member.babies?.due_date || '',
    birth_weight: member.babies?.birth_weight || '',
    birth_height: member.babies?.birth_height || '',
    birth_head: member.babies?.birth_head || '',
    feeding_type: member.babies?.feeding_type || 'mixed',
    blood_type: member.babies?.blood_type || '',
    birth_hospital: member.babies?.birth_hospital || '',
  });
  const [editingBaby, setEditingBaby] = useState(false);

  // editingBaby is managed locally; unused warning suppressed via assignment
  void editingBaby;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'flex-end' }} onClick={() => { onClose(); setEditingBaby(false); }}>
      <div style={{ width: '100%', maxHeight: '92vh', background: 'var(--card)', borderRadius: '24px 24px 0 0', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '12px auto 0' }} />

        <div style={{ padding: '16px 20px 40px' }}>
          <div style={{ fontSize: '17px', fontWeight: 700, textAlign: 'center', marginBottom: '20px' }}>아기 프로필</div>

          {/* 기념일 */}
          {member.babies?.birth_date && (() => {
            const birth = new Date(member.babies.birth_date);
            const diff = Math.floor((nowTs - birth.getTime()) / 86400000);
            const weeks = Math.floor(diff / 7);
            const milestones = [100, 200, 365, 500, 1000].map((d, i) => ({
              label: `D+${d}`,
              date: new Date(birth.getTime() + d * 86400000).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
            })).filter((_, i) => [100, 200, 365, 500, 1000][i] > diff);
            return (
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '22px', fontWeight: 900 }}>{member.babies.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--txt2)', marginTop: '4px' }}>{member.babies.birth_date} 출생</div>
                <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600, marginTop: '2px' }}>D+{diff}일 · {weeks}주 {diff % 7}일</div>
                {milestones.length > 0 && (
                  <div style={{ background: 'var(--bg)', borderRadius: 'var(--r)', padding: '14px 16px', marginTop: '12px', textAlign: 'left' }}>
                    <div style={{ fontSize: '12px', color: 'var(--txt3)', fontWeight: 600, marginBottom: '8px' }}>다음 기념일</div>
                    {milestones.slice(0, 3).map(m => (
                      <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>{m.label}</span>
                        <span style={{ fontSize: '13px', color: 'var(--txt2)' }}>{m.date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* 수정 필드 */}
          {[
            { label: '이름', key: 'name', type: 'text', placeholder: '아기 이름' },
            { label: '생년월일', key: 'birth_date', type: 'date' },
            { label: '출생 예정일', key: 'due_date', type: 'date' },
            { label: '출생 몸무게 (g)', key: 'birth_weight', type: 'number', placeholder: '2800' },
            { label: '출생 키 (cm)', key: 'birth_height', type: 'number', placeholder: '50' },
            { label: '출생 머리둘레 (cm)', key: 'birth_head', type: 'number', placeholder: '34' },
            { label: '출생 병원', key: 'birth_hospital', type: 'text', placeholder: '병원명' },
          ].map(field => (
            <div key={field.key} style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--txt2)', fontWeight: 600, marginBottom: '5px' }}>{field.label}</label>
              <input type={field.type} value={profileForm[field.key] || ''} placeholder={field.placeholder}
                onChange={e => setProfileForm((p: any) => ({ ...p, [field.key]: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 'var(--rs)', fontSize: '14px', fontFamily: 'inherit', background: 'var(--card)', color: 'var(--txt)', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          ))}

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--txt2)', fontWeight: 600, marginBottom: '5px' }}>성별</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[{ v: 'male', l: '남아 👦' }, { v: 'female', l: '여아 👧' }].map(g => (
                <button key={g.v} onClick={() => setProfileForm((p: any) => ({ ...p, gender: g.v }))}
                  style={{ flex: 1, padding: '10px', borderRadius: 'var(--rs)', border: `1.5px solid ${profileForm.gender === g.v ? 'var(--primary)' : 'var(--border)'}`, background: profileForm.gender === g.v ? 'var(--primary-bg)' : 'var(--card)', color: profileForm.gender === g.v ? 'var(--primary)' : 'var(--txt2)', fontFamily: 'inherit', cursor: 'pointer', fontSize: '14px', fontWeight: profileForm.gender === g.v ? 700 : 400 }}>
                  {g.l}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--txt2)', fontWeight: 600, marginBottom: '5px' }}>수유 방식</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[{ v: 'breast', l: '모유' }, { v: 'formula', l: '분유' }, { v: 'mixed', l: '혼합' }].map(f => (
                <button key={f.v} onClick={() => setProfileForm((p: any) => ({ ...p, feeding_type: f.v }))}
                  style={{ flex: 1, padding: '10px', borderRadius: 'var(--rs)', border: `1.5px solid ${profileForm.feeding_type === f.v ? 'var(--primary)' : 'var(--border)'}`, background: profileForm.feeding_type === f.v ? 'var(--primary-bg)' : 'var(--card)', color: profileForm.feeding_type === f.v ? 'var(--primary)' : 'var(--txt2)', fontFamily: 'inherit', cursor: 'pointer', fontSize: '13px', fontWeight: profileForm.feeding_type === f.v ? 700 : 400 }}>
                  {f.l}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--txt2)', fontWeight: 600, marginBottom: '5px' }}>혈액형</label>
            <select value={profileForm.blood_type || ''} onChange={e => setProfileForm((p: any) => ({ ...p, blood_type: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 'var(--rs)', fontSize: '14px', fontFamily: 'inherit', background: 'var(--card)', color: 'var(--txt)', outline: 'none' }}>
              <option value=''>선택</option>
              {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <button onClick={() => onSave(member.baby_id, profileForm)} style={{ width: '100%', padding: '14px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--r)', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: '10px' }}>
            저장
          </button>
          <button onClick={onClose} style={{ width: '100%', padding: '10px', background: 'none', border: 'none', fontSize: '14px', color: 'var(--txt2)', cursor: 'pointer', fontFamily: 'inherit' }}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
