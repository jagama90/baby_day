import { supabase } from './supabase'

export const getBabyLogs = async (babyId: string) => {
  const { data, error } = await supabase
    .from('baby_logs')
    .select('*')
    .eq('baby_id', babyId)
    .order('start_time', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1000)

  if (error) throw error
  return data ?? []
}

export const createBabyLog = async (payload: Record<string, unknown>) => {
  const { data, error } = await supabase.from('baby_logs').insert(payload).select()
  if (error) throw error
  return data
}

export const patchBabyLog = async (id: string, payload: Record<string, unknown>) => {
  const { data, error } = await supabase.from('baby_logs').update(payload).eq('id', id).select()
  if (error) throw error
  return data
}

export const deleteBabyLog = async (id: string) => {
  const { error } = await supabase.from('baby_logs').delete().eq('id', id)
  if (error) throw error
}
