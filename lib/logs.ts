import { supabase } from './supabase'

export type LogType = 'sleep' | 'formula' | 'breast' | 'diaper' | 'growth' | 'hospital' | 'bath' | 'vaccine'

export const getLogs = async (babyId: string, date?: string) => {
  let query = supabase
    .from('baby_logs')
    .select('*')
    .eq('baby_id', babyId)
    .order('start_time', { ascending: false })
  if (date) query = query.eq('date', date)
  const { data } = await query
  return data
}

export const createLog = async (log: {
  baby_id: string
  user_id: string
  type: LogType
  date: string
  start_time: string
  end_time?: string
  ml?: number
  left_min?: number
  right_min?: number
  sleep_kind?: string
  diaper_kind?: string
  memo?: string
  weight?: number
  height?: number
  head?: number
}) => {
  const { data, error } = await supabase.from('baby_logs').insert(log).select().single()
  return { data, error }
}

export const deleteLog = async (id: string) => {
  await supabase.from('baby_logs').delete().eq('id', id)
}

export const updateLog = async (id: string, updates: Partial<ReturnType<typeof createLog>>) => {
  const { data } = await supabase.from('baby_logs').update(updates).eq('id', id).select().single()
  return data
}