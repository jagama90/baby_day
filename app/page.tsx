'use client'
import { useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) router.push('/dashboard')
      else router.push('/login')
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">로딩 중...</p>
    </div>
  )
}