'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthCallback() {
  const router = useRouter()
  const [debug, setDebug] = useState<string[]>([])

  const log = (msg: string) => {
    console.log(msg)
    setDebug(prev => [...prev, msg])
  }

  useEffect(() => {
    const handleCallback = async () => {
      log('1. 시작 URL: ' + window.location.href)
      
      const code = new URLSearchParams(window.location.search).get('code')
      log('2. code: ' + (code ? code.slice(0,20)+'...' : '없음'))

      if (code) {
        const { error: exchErr } = await supabase.auth.exchangeCodeForSession(code)
        log('3. exchangeCode error: ' + JSON.stringify(exchErr))
      }

      const { data: { session }, error } = await supabase.auth.getSession()
      log('4. session: ' + (session ? session.user.email || session.user.id : 'null'))
      log('5. error: ' + JSON.stringify(error))

      if (error || !session) {
        log('6. → /login으로 이동')
        router.push('/login')
        return
      }

      const user = session.user
      const { data: existing } = await supabase.from('users').select('id').eq('id', user.id).single()
      log('7. existing user: ' + JSON.stringify(existing))

      if (!existing) {
        await supabase.from('users').insert({
          id: user.id,
          email: user.email,
          provider: user.app_metadata.provider,
          nickname: user.user_metadata.name || user.user_metadata.full_name
        })
        router.push('/onboarding')
      } else {
        const { data: babies } = await supabase.from('baby_members').select('baby_id').eq('user_id', user.id).limit(1)
        log('8. babies: ' + JSON.stringify(babies))
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <p className="text-gray-400 mb-4">로그인 처리 중...</p>
      <div className="text-xs text-left bg-gray-100 p-3 rounded w-full max-w-md">
        {debug.map((d, i) => <div key={i} className="mb-1">{d}</div>)}
      </div>
    </div>
  )
}