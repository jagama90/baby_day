import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  display: 'swap',
})


export const metadata: Metadata = {
  title: '아기 기록',
  description: '우리 아기 성장 기록',
   applicationName: 'BabyDay',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  interactiveWidget: 'resizes-content',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4F5FA' },
    { media: '(prefers-color-scheme: dark)', color: '#0F1117' },
  ],
}


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
        <body className={`${notoSansKr.className} native-shell`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}