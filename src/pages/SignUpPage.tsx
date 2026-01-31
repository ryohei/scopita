import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { UserPlus, Calculator } from 'lucide-react'

export function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください')
      return
    }

    if (displayName.trim().length === 0) {
      setError('表示名を入力してください')
      return
    }

    setLoading(true)

    const { error } = await signUp(email, password, displayName.trim())

    if (error) {
      if (error.message.includes('already registered')) {
        setError('このメールアドレスは既に登録されています')
      } else {
        setError('登録に失敗しました。もう一度お試しください')
      }
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* ヘッダー */}
      <header className="bg-mahjong-table rounded-b-3xl shadow-lg px-4 pt-6 pb-8">
        <div className="max-w-md mx-auto">
          {/* キャラクター（コンパクト） */}
          <div className="flex justify-center mb-3">
            <div className="w-20 h-20 rounded-full bg-white/90 p-1 shadow-lg animate-float">
              <img 
                src="/images/mascot-256.png" 
                alt="スコピタくん" 
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          </div>

          {/* タイトル */}
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-1">スコピタくん</h1>
            <p className="text-sm opacity-90">新規登録</p>
          </div>
        </div>
      </header>

      {/* フォーム */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-card p-6 animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="displayName" className="block text-sm font-bold text-gray-700 mb-2">
                表示名
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-xl bg-cream-dark border-2 border-transparent focus:border-mahjong-table focus:bg-white transition-colors"
                placeholder="ニックネーム"
              />
              <p className="text-xs text-gray-500 mt-1.5">他のユーザーに表示される名前です</p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-xl bg-cream-dark border-2 border-transparent focus:border-mahjong-table focus:bg-white transition-colors"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-xl bg-cream-dark border-2 border-transparent focus:border-mahjong-table focus:bg-white transition-colors"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-500 mt-1.5">6文字以上</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-mahjong-table text-white py-4 rounded-2xl font-bold btn-pressable flex items-center justify-center gap-2 disabled:opacity-50 shadow-button text-lg mt-6"
            >
              <UserPlus size={22} />
              {loading ? '登録中...' : '登録する'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              アカウントをお持ちの方は
              <Link to="/login" className="text-mahjong-table font-bold ml-1 hover:underline">
                ログイン
              </Link>
            </p>
          </div>
        </div>

        {/* テンピタくんへのリンク */}
        <a
          href="https://mahjong-colc.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 bg-white rounded-2xl shadow-soft p-4 flex items-center gap-3 card-interactive block"
        >
          <div className="w-12 h-12 bg-mahjong-table/10 rounded-xl flex items-center justify-center">
            <Calculator size={24} className="text-mahjong-table" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-mahjong-table">テンピタくん</p>
            <p className="text-sm text-gray-500">符計算・点数計算はこちら →</p>
          </div>
        </a>
      </main>

      {/* フッター */}
      <footer className="py-6 text-center text-gray-400 text-sm">
        <p>© 2025 スコピタくん</p>
      </footer>
    </div>
  )
}
