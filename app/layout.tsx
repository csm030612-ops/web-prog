import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'TalentEx — 재능과 경험을 교환하세요',
  description: '재능과 경험을 교환하고, 크레딧으로 도움을 주고받는 커뮤니티 플랫폼',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  )
}
