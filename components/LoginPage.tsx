'use client'
import { signInWithKakao, signInWithGoogle } from '@/lib/auth'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">👶 아기 기록</h1>
      <button
        onClick={signInWithKakao}
        className="w-72 h-12 bg-yellow-400 rounded-xl flex items-center justify-center gap-3 font-medium text-gray-900 hover:bg-yellow-500 transition"
      >
        💬 카카오로 시작하기
      </button>
      <button
        onClick={signInWithGoogle}
        className="w-72 h-12 bg-white border border-gray-300 rounded-xl flex items-center justify-center gap-3 font-medium text-gray-700 hover:bg-gray-50 transition"
      >
        🔵 Google로 시작하기
      </button>
    </div>
  )
}