'use client'
import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { joinByInviteCode } from '@/lib/babies'
import { useRouter } from 'next/navigation'

export default function InvitePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleJoin = async () => {
    if (!user || !code) return
    setLoading(true)
    const result = await joinByInviteCode(code, user.id)
    if (result.error) setError(result.error)
    else router.push(`/log?babyId=${result.babyId}`)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-sm">
        <h1 className="text-2xl font-bold mb-2 text-center">초대코드 입력</h1>
        <p className="text-gray-500 text-sm text-center mb-6">공동양육자에게 받은 6자리 코드를 입력해줘요</p>

        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="ABC123"
          maxLength={6}
          className="w-full border border-gray-200 rounded-xl px-4 py-4 text-center text-2xl font-bold tracking-widest outline-none focus:border-blue-400 mb-4"
        />
        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        <button
          onClick={handleJoin}
          disabled={loading || code.length < 6}
          className="w-full bg-blue-500 text-white py-4 rounded-xl font-medium disabled:opacity-50"
        >
          {loading ? '확인 중...' : '참여하기'}
        </button>
      </div>
    </div>
  )
}