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
  await supabase.from('users').update({ deleted_at: new Date().toISOString() }).eq('id', user.id)
  await supabase.auth.signOut()
}