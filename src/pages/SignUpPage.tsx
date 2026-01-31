import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { UserPlus } from 'lucide-react'

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
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-mahjong-table mb-2">
            🀄 スコピタくん
          </h1>
          <p className="text-gray-600">新規登録</p>
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
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                表示名
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-mahjong-table"
                placeholder="ニックネーム"
              />
              <p className="text-xs text-gray-500 mt-1">他のユーザーに表示される名前です</p>
            </div>

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
              <p className="text-xs text-gray-500 mt-1">6文字以上</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-mahjong-table text-white py-3 rounded-xl font-bold btn-pressable flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <UserPlus size={20} />
              {loading ? '登録中...' : '登録する'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              アカウントをお持ちの方は
              <Link to="/login" className="text-mahjong-table font-bold ml-1 hover:underline">
                ログイン
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
