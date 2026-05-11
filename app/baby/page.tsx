'use client'
import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { createBaby } from '@/lib/babies'
import { useRouter } from 'next/navigation'

export default function BabyPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState('남')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!user || !name || !birthDate) return
    setLoading(true)
    const baby = await createBaby(user.id, name, birthDate, gender)
    if (baby) router.push('/dashboard')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">👶 아기 등록</h1>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">아기 이름</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="이름 입력"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">생년월일</label>
            <input
              type="date"
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">성별</label>
            <div className="flex gap-3">
              {['남', '여'].map(g => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`flex-1 py-3 rounded-xl border transition ${
                    gender === g ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {g === '남' ? '👦 남아' : '👧 여아'}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !name || !birthDate}
            className="w-full bg-blue-500 text-white py-4 rounded-xl font-medium disabled:opacity-50 mt-2"
          >
            {loading ? '등록 중...' : '등록하기'}
          </button>
        </div>
      </div>
    </div>
  )
}