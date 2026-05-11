import { supabase } from './supabase'

export const getBabies = async (userId: string) => {
  const { data } = await supabase
    .from('baby_members')
    .select('baby_id, role, babies(*)')
    .eq('user_id', userId)
  return data
}

export const createBaby = async (userId: string, name: string, birthDate: string, gender: string) => {
  const { data: baby, error } = await supabase
    .from('babies')
    .insert({ name, birth_date: birthDate, gender, created_by: userId })
    .select().single()
  if (error || !baby) return null

  await supabase.from('baby_members').insert({
    baby_id: baby.id,
    user_id: userId,
    role: '아빠'
  })
  return baby
}

export const generateInviteCode = async (babyId: string, userId: string) => {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('invite_codes')
    .insert({ code, baby_id: babyId, created_by: userId, expires_at: expiresAt })
    .select().single()
  return data
}

export const joinByInviteCode = async (code: string, userId: string) => {
  const { data: invite } = await supabase
    .from('invite_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .is('used_by', null)
    .gt('expires_at', new Date().toISOString())
    .single()
  if (!invite) return { error: '유효하지 않은 초대코드예요' }

  await supabase.from('baby_members').insert({
    baby_id: invite.baby_id,
    user_id: userId,
    role: '엄마'
  })
  await supabase.from('invite_codes').update({
    used_by: userId,
    used_at: new Date().toISOString()
  }).eq('id', invite.id)

  return { success: true, babyId: invite.baby_id }
}