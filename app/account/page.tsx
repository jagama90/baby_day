'use client'
import { useAuth } from '@/components/AuthProvider'
import { signOut, signOutAll, deleteAccount } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export default function AccountPage() {
  const { user } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const handleSignOutAll = async () => {
    await signOutAll()
    router.push('/login')
  }

  const handleDelete = async () => {
    if (!confirm('정말 탈퇴하시겠어요? 모든 데이터가 삭제됩니다.')) return
    await deleteAccount()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-500">← 뒤로</button>
          <h1 className="text-xl font-bold">내 계정</h1>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <p className="text-sm text-gray-500 mb-1">이메일</p>
          <p className="font-medium">{user?.email}</p>
          <p className="text-sm text-gray-500 mt-3 mb-1">로그인 방식</p>
          <p className="font-medium capitalize">{user?.app_metadata?.provider}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <button onClick={handleSignOut} className="w-full text-left px-6 py-4 border-b border-gray-100 text-gray-700">
            로그아웃
          </button>
          <button onClick={handleSignOutAll} className="w-full text-left px-6 py-4 border-b border-gray-100 text-gray-700">
            모든 기기에서 로그아웃
          </button>
          <a href="/terms" className="block px-6 py-4 border-b border-gray-100 text-gray-700">이용약관</a>
          <a href="/privacy" className="block px-6 py-4 text-gray-700">개인정보처리방침</a>
        </div>

        <button onClick={handleDelete} className="w-full text-red-400 text-sm py-4">
          회원탈퇴
        </button>
      </div>
    </div>
  )
}