'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
  const handleCallback = async () => {
    // 카카오/구글 OAuth code → session 교환
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(
      window.location.search
    ).catch(() => ({ data: { session: null }, error: true }))
    
    // exchangeCodeForSession 실패 시 기존 세션 확인 (구글 등)
    const finalSession = session ?? (await supabase.auth.getSession()).data.session
    
    if (!finalSession) {
      router.push('/login')
      return
    }

      const user = finalSession.user

      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existing) {
        await supabase.from('users').insert({
          id: user.id,
          email: user.email,
          provider: user.app_metadata.provider,
          nickname: user.user_metadata.name || user.user_metadata.full_name
        })
        router.push('/onboarding')
      } else {
        // 기존 유저 → 아기 있는지 확인
        const { data: babies } = await supabase
          .from('baby_members')
          .select('baby_id')
          .eq('user_id', user.id)
          .limit(1)

        if (babies && babies.length > 0) {
          router.push(`/log?babyId=${babies[0].baby_id}`)
        } else {
          router.push('/dashboard')
        }
      }
    }

    handleCallback()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">로그인 처리 중...</p>
    </div>
  )
}