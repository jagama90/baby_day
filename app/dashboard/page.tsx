'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { getBabies } from '@/lib/babies'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [babies, setBabies] = useState<any[]>([])

  useEffect(() => {
    if (!loading && !user) router.push('/login')
    if (user) getBabies(user.id).then(data => setBabies(data || []))
  }, [user, loading])

  if (loading) return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">👶 아기 기록</h1>
          <Link href="/account" className="text-sm text-gray-500">내 계정</Link>
        </div>

        {babies.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <p className="text-gray-500 mb-4">등록된 아기가 없어요</p>
            <Link href="/baby" className="bg-blue-500 text-white px-6 py-3 rounded-xl inline-block">
              아기 등록하기
            </Link>
          </div>
        ) : (
          babies.map((member: any) => (
            <Link key={member.baby_id} href={`/log?babyId=${member.baby_id}`}>
              <div className="bg-white rounded-2xl p-6 shadow-sm mb-4 flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                  👶
                </div>
                <div>
                  <h2 className="text-xl font-bold">{member.babies?.name}</h2>
                  <p className="text-gray-500 text-sm">
                    {member.babies?.birth_date} 출생 · {member.role}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}

        <div className="mt-4 flex gap-3">
          <Link href="/baby" className="flex-1 bg-white border border-blue-300 text-blue-500 py-3 rounded-xl text-center text-sm">
            + 새 아기 등록
          </Link>
          <Link href="/invite" className="flex-1 bg-white border border-green-300 text-green-500 py-3 rounded-xl text-center text-sm">
            초대코드 입력
          </Link>
        </div>
      </div>
    </div>
  )
}