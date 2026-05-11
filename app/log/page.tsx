'use client'
import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { getLogs, createLog, deleteLog, LogType } from '@/lib/logs'
import { generateInviteCode } from '@/lib/babies'
import { useRouter, useSearchParams } from 'next/navigation'

const LOG_TYPES = [
  { type: 'sleep', label: '수면', emoji: '😴', color: 'bg-blue-100 text-blue-700' },
  { type: 'formula', label: '분유', emoji: '🍼', color: 'bg-orange-100 text-orange-700' },
  { type: 'breast', label: '모유', emoji: '🤱', color: 'bg-pink-100 text-pink-700' },
  { type: 'diaper', label: '기저귀', emoji: '🩲', color: 'bg-green-100 text-green-700' },
  { type: 'growth', label: '성장', emoji: '📏', color: 'bg-emerald-100 text-emerald-700' },
  { type: 'hospital', label: '병원', emoji: '🏥', color: 'bg-red-100 text-red-700' },
  { type: 'bath', label: '목욕', emoji: '🛁', color: 'bg-cyan-100 text-cyan-700' },
  { type: 'vaccine', label: '예방접종', emoji: '💉', color: 'bg-purple-100 text-purple-700' },
]

function LogContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const babyId = searchParams.get('babyId') || ''
  const [logs, setLogs] = useState<any[]>([])
  const [selectedType, setSelectedType] = useState<LogType>('sleep')
  const [showForm, setShowForm] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [ml, setMl] = useState('')
  const [leftMin, setLeftMin] = useState('')
  const [rightMin, setRightMin] = useState('')
  const [diaperKind, setDiaperKind] = useState('소변')
  const [memo, setMemo] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')

  useEffect(() => {
    if (babyId) loadLogs()
  }, [babyId, date])

  const loadLogs = async () => {
    const data = await getLogs(babyId, date)
    setLogs(data || [])
  }

  const handleSubmit = async () => {
    if (!user || !startTime) return
    await createLog({
      baby_id: babyId,
      user_id: user.id,
      type: selectedType,
      date,
      start_time: `${date}T${startTime}:00`,
      end_time: endTime ? `${date}T${endTime}:00` : undefined,
      ml: ml ? parseInt(ml) : undefined,
      left_min: leftMin ? parseInt(leftMin) : undefined,
      right_min: rightMin ? parseInt(rightMin) : undefined,
      diaper_kind: diaperKind || undefined,
      memo: memo || undefined,
      weight: weight ? parseFloat(weight) : undefined,
      height: height ? parseFloat(height) : undefined,
    })
    setShowForm(false)
    setStartTime(''); setEndTime(''); setMl(''); setMemo('')
    loadLogs()
  }

  const handleGenerateCode = async () => {
    if (!user) return
    const code = await generateInviteCode(babyId, user.id)
    if (code) setInviteCode(code.code)
  }

  const typeInfo = (type: string) => LOG_TYPES.find(t => t.type === type) || LOG_TYPES[0]

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-md mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => router.push('/dashboard')} className="text-gray-500">← 뒤로</button>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1 text-sm" />
          <button onClick={handleGenerateCode} className="text-sm text-green-600 font-medium">초대코드</button>
        </div>

        {inviteCode && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 text-center">
            <p className="text-sm text-green-600 mb-1">초대코드 (24시간 유효)</p>
            <p className="text-3xl font-bold tracking-widest text-green-700">{inviteCode}</p>
          </div>
        )}

        <div className="grid grid-cols-4 gap-2 mb-4">
          {LOG_TYPES.map(t => (
            <button key={t.type} onClick={() => { setSelectedType(t.type as LogType); setShowForm(true) }}
              className={`rounded-xl p-3 text-center transition ${selectedType === t.type && showForm ? t.color : 'bg-white'}`}>
              <div className="text-xl">{t.emoji}</div>
              <div className="text-xs mt-1">{t.label}</div>
            </button>
          ))}
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <h3 className="font-bold mb-4">{typeInfo(selectedType).emoji} {typeInfo(selectedType).label} 기록</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-500">시작 시간</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1" />
                </div>
                {['sleep', 'breast'].includes(selectedType) && (
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">종료 시간</label>
                    <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1" />
                  </div>
                )}
              </div>

              {selectedType === 'formula' && (
                <div>
                  <label className="text-xs text-gray-500">분유량 (ml)</label>
                  <input type="number" value={ml} onChange={e => setMl(e.target.value)} placeholder="120"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1" />
                </div>
              )}

              {selectedType === 'breast' && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">왼쪽 (분)</label>
                    <input type="number" value={leftMin} onChange={e => setLeftMin(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">오른쪽 (분)</label>
                    <input type="number" value={rightMin} onChange={e => setRightMin(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1" />
                  </div>
                </div>
              )}

              {selectedType === 'diaper' && (
                <div className="flex gap-2">
                  {['소변', '대변', '혼합'].map(k => (
                    <button key={k} onClick={() => setDiaperKind(k)}
                      className={`flex-1 py-2 rounded-lg text-sm border transition ${diaperKind === k ? 'bg-green-500 text-white border-green-500' : 'border-gray-200'}`}>
                      {k}
                    </button>
                  ))}
                </div>
              )}

              {selectedType === 'growth' && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">몸무게 (kg)</label>
                    <input type="number" step="0.01" value={weight} onChange={e => setWeight(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">키 (cm)</label>
                    <input type="number" step="0.1" value={height} onChange={e => setHeight(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1" />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-500">메모</label>
                <textarea value={memo} onChange={e => setMemo(e.target.value)} placeholder="메모 입력"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 h-20 resize-none" />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600">취소</button>
                <button onClick={handleSubmit}
                  className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium">저장</button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400">오늘 기록이 없어요</div>
          ) : (
            logs.map(log => {
              const info = typeInfo(log.type)
              return (
                <div key={log.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${info.color}`}>
                    {info.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{info.label}</p>
                    <p className="text-sm text-gray-500">
                      {log.start_time?.slice(11, 16)}
                      {log.end_time && ` ~ ${log.end_time?.slice(11, 16)}`}
                      {log.ml && ` · ${log.ml}ml`}
                      {log.diaper_kind && ` · ${log.diaper_kind}`}
                      {log.weight && ` · ${log.weight}kg`}
                    </p>
                    {log.memo && <p className="text-xs text-gray-400 mt-1">{log.memo}</p>}
                  </div>
                  <button onClick={async () => { await deleteLog(log.id); loadLogs() }}
                    className="text-gray-300 hover:text-red-400 text-lg">×</button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default function LogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">로딩 중...</div>}>
      <LogContent />
    </Suspense>
  )
}