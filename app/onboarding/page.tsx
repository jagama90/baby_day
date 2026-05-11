'use client'
import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Onboarding() {
  const { user } = useAuth()
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [userType, setUserType] = useState('아빠')
  const [region, setRegion] = useState('')
  const [loading, setLoading] = useState(false)

  const regions = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']
  const userTypes = ['아빠', '엄마', '예비아빠', '예비엄마', '조부모', '기타']

  const handleSubmit = async () => {
    if (!user || !nickname || !region) return
    setLoading(true)
    await supabase.from('users').upsert({
      id: user.id,
      nickname,
      user_type: userType,
      region,
      email: user.email,
      provider: user.app_metadata.provider
    })
    router.push('/dashboard')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-2">환영해요! 🎉</h1>
        <p className="text-gray-500 text-center text-sm mb-8">기본 정보를 입력해주세요</p>

        <div className="space-y-5">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">닉네임</label>
            <input value={nickname} onChange={e => setNickname(e.target.value)}
              placeholder="예: 승준파파"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-400" />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-2 block">유형</label>
            <div className="grid grid-cols-3 gap-2">
              {userTypes.map(t => (
                <button key={t} onClick={() => setUserType(t)}
                  className={`py-2 rounded-xl border text-sm transition ${userType === t ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-200 text-gray-600'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">거주지 (시/도)</label>
            <select value={region} onChange={e => setRegion(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-400">
              <option value="">선택해주세요</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <button onClick={handleSubmit} disabled={loading || !nickname || !region}
            className="w-full bg-blue-500 text-white py-4 rounded-xl font-medium disabled:opacity-50">
            {loading ? '저장 중...' : '시작하기'}
          </button>
        </div>
      </div>
    </div>
  )
}