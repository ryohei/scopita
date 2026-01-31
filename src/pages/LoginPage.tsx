import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LogIn, Calculator } from 'lucide-react'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError('メールアドレスまたはパスワードが正しくありません')
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* ヘッダー */}
      <header className="bg-primary rounded-b-3xl shadow-lg px-4 pt-8 pb-10">
        <div className="max-w-md mx-auto">
          {/* 吹き出し */}
          <div className="flex justify-center mb-4">
            <div className="relative bg-white rounded-full px-5 py-2 shadow-md">
              <span className="text-sm font-bold text-primary-dark">
                スコア記録はわたしに任せて！📊
              </span>
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-white"></div>
            </div>
          </div>

          {/* キャラクター */}
          <div className="flex justify-center mb-5">
            <div className="w-28 h-28 rounded-full bg-white/90 p-1.5 shadow-lg animate-float">
              <img 
                src="/images/mascot-256.png" 
                alt="スコピタちゃん" 
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          </div>

          {/* タイトル */}
          <div className="text-center text-white">
            <h1 className="text-3xl font-bold mb-1">スコピタちゃん</h1>
            <p className="text-sm opacity-90">君たちのスコア、ピタッと記録！</p>
          </div>
        </div>
      </header>

      {/* フォーム */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-card p-6 animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-bold text-text-primary mb-2">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-xl bg-cream-dark border-2 border-transparent focus:border-primary focus:bg-white transition-colors text-text-primary"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-text-primary mb-2">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-xl bg-cream-dark border-2 border-transparent focus:border-primary focus:bg-white transition-colors text-text-primary"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold btn-pressable flex items-center justify-center gap-2 disabled:opacity-50 shadow-button text-lg"
            >
              <LogIn size={22} />
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-text-secondary">
              アカウントをお持ちでない方は
              <Link to="/signup" className="text-primary-dark font-bold ml-1 hover:underline">
                新規登録
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
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Calculator size={24} className="text-primary-dark" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-primary-dark">テンピタくん</p>
            <p className="text-sm text-text-secondary">符計算・点数計算はこちら →</p>
          </div>
        </a>
      </main>

      {/* フッター */}
      <footer className="py-6 text-center text-gray-400 text-sm">
        <p>© 2025 スコピタちゃん</p>
      </footer>
    </div>
  )
}
