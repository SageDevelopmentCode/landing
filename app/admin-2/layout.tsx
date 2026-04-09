import { Inter } from 'next/font/google'
import { Sidebar } from './components/Sidebar'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter-2' })

export default function Admin2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${inter.variable} h-screen flex overflow-hidden`}
      style={{ backgroundColor: '#0D0D0D', fontFamily: 'var(--font-inter-2, Inter, sans-serif)' }}
    >
      <Sidebar />
      <main className="flex-1 overflow-auto px-6 py-6">
        {children}
      </main>
    </div>
  )
}
