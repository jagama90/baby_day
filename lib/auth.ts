import { Capacitor } from '@capacitor/core'
import { clearStoredValues } from './platformStorage'
import { supabase } from './supabase'
const getAuthRedirectUrl = () => {
  const explicit = process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL
  if (explicit) return explicit
  
  if (Capacitor.isNativePlatform()) {
    return 'https://localhost/auth/callback'
  }

  if (typeof window !== 'undefined') return `${window.location.origin}/auth/callback`
  return ''
}


export const signInWithKakao = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: getAuthRedirectUrl(),
      skipBrowserRedirect: false,
      queryParams: {
        response_type: 'code',
      }
    }
  })
  if (error) console.error(error)
}

export const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: getAuthRedirectUrl() }
  })
  if (error) console.error(error)
}

export const signOut = async () => await supabase.auth.signOut()

export const signOutAll = async () => await supabase.auth.signOut({ scope: 'global' })

export const deleteAccount = async () => {
  const [{ data: { user } }, { data: { session } }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession(),
  ])
  if (!user || !session?.access_token) return

  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!SUPA_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured')
  }

  // users 테이블 삭제 표시
  await supabase.from('users').update({ deleted_at: new Date().toISOString() }).eq('id', user.id)

  // Auth 유저 삭제
  const body = JSON.stringify({ userId: user.id })
  console.log('탈퇴 요청 body:', body)
  const res = await fetch(`${SUPA_URL}/functions/v1/hyper-service`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`
    },
    body
  })
  const result = await res.json()
  console.log('탈퇴 결과:', result)
  await clearStoredValues()
  await supabase.auth.signOut()
}