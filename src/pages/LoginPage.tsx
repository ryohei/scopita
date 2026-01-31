import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LogIn } from 'lucide-react'

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
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-mahjong-table mb-2">
            🀄 スコピタくん
          </h1>
          <p className="text-gray-600">ログイン</p>
        </div>

        {/* フォーム */}
        <div className="card-soft p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-mahjong-table"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-mahjong-table"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-mahjong-table text-white py-3 rounded-xl font-bold btn-pressable flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn size={20} />
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              アカウントをお持ちでない方は
              <Link to="/signup" className="text-mahjong-table font-bold ml-1 hover:underline">
                新規登録
              </Link>
            </p>
          </div>
        </div>

        {/* テンピタくんへのリンク */}
        <div className="mt-6 text-center">
          <a
            href="https://mahjong-colc.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-mahjong-table"
          >
            🧮 符計算は「テンピタくん」へ →
          </a>
        </div>
      </div>
    </div>
  )
}
