import { supabase } from './supabase'

export const signInWithKakao = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
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
    options: { redirectTo: `${window.location.origin}/auth/callback` }
  })
  if (error) console.error(error)
}

export const signOut = async () => await supabase.auth.signOut()

export const signOutAll = async () => await supabase.auth.signOut({ scope: 'global' })

export const deleteAccount = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const SERVICE_ROLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

  // users 테이블 삭제 표시
  await supabase.from('users').update({ deleted_at: new Date().toISOString() }).eq('id', user.id)

  // Auth 유저 삭제
  await fetch(`${SUPA_URL}/functions/v1/hyper-service`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ userId: user.id })
  })
  await supabase.auth.signOut()
}