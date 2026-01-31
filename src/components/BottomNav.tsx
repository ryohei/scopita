import { Link, useLocation } from 'react-router-dom'
import { Home, PlusCircle, Calculator, Clock, Settings } from 'lucide-react'

export function BottomNav() {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-primary shadow-lg safe-area-bottom">
      <div className="max-w-2xl mx-auto flex items-center justify-around py-2">
        <Link
          to="/"
          className={`flex flex-col items-center py-2 px-3 rounded-xl transition-colors ${
            isActive('/') ? 'text-white' : 'text-white/60'
          }`}
        >
          <Home size={22} />
          <span className="text-xs mt-1 font-medium">ホーム</span>
        </Link>

        <Link
          to="/history"
          className={`flex flex-col items-center py-2 px-3 rounded-xl transition-colors ${
            isActive('/history') ? 'text-white' : 'text-white/60'
          }`}
        >
          <Clock size={22} />
          <span className="text-xs mt-1 font-medium">履歴</span>
        </Link>

        <Link
          to="/record"
          className="flex flex-col items-center py-2 px-3"
        >
          <div className={`w-14 h-14 -mt-6 rounded-full flex items-center justify-center shadow-lg ${
            isActive('/record') ? 'bg-white' : 'bg-cream'
          }`}>
            <PlusCircle size={32} className="text-primary-dark" />
          </div>
          <span className={`text-xs mt-1 font-medium ${
            isActive('/record') ? 'text-white' : 'text-white/60'
          }`}>記録</span>
        </Link>

        <a
          href="https://mahjong-colc.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center py-2 px-3 text-white/60"
        >
          <Calculator size={22} />
          <span className="text-xs mt-1 font-medium">テンピタ</span>
        </a>

        <Link
          to="/settings"
          className={`flex flex-col items-center py-2 px-3 rounded-xl transition-colors ${
            isActive('/settings') ? 'text-white' : 'text-white/60'
          }`}
        >
          <Settings size={22} />
          <span className="text-xs mt-1 font-medium">設定</span>
        </Link>
      </div>
    </nav>
  )
}
