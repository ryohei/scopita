import { useAuth } from '../hooks/useAuth'
import { LogOut, Plus, Users, Calculator } from 'lucide-react'
import { Link } from 'react-router-dom'

export function HomePage() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-cream">
      {/* ヘッダー */}
      <header className="bg-mahjong-table text-white p-4 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">🀄 スコピタくん</h1>
          <button
            onClick={signOut}
            className="flex items-center gap-1 text-sm opacity-80 hover:opacity-100"
          >
            <LogOut size={18} />
            ログアウト
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        {/* ウェルカムメッセージ */}
        <div className="card-soft p-4 mb-6">
          <p className="text-mahjong-table font-bold">
            ようこそ、{user?.user_metadata?.display_name || 'ゲスト'}さん！
          </p>
          <p className="text-gray-600 text-sm mt-1">
            スコアを記録して、仲間とランキングを競おう！
          </p>
        </div>

        {/* メインアクション */}
        <button className="w-full bg-mahjong-table text-white py-4 rounded-2xl font-bold btn-pressable flex items-center justify-center gap-2 mb-6 shadow-lg">
          <Plus size={24} />
          対局を記録する
        </button>

        {/* 最近の対局 */}
        <section className="mb-6">
          <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
            📊 最近の対局
          </h2>
          <div className="card-soft p-4">
            <p className="text-gray-500 text-center py-4">
              まだ対局記録がありません
            </p>
          </div>
        </section>

        {/* 参加グループ */}
        <section className="mb-6">
          <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Users size={20} />
            参加グループ
          </h2>
          <div className="card-soft p-4">
            <p className="text-gray-500 text-center py-4">
              まだグループに参加していません
            </p>
            <button className="w-full mt-2 border-2 border-dashed border-gray-300 text-gray-500 py-3 rounded-xl font-bold hover:border-mahjong-table hover:text-mahjong-table transition-colors flex items-center justify-center gap-2">
              <Plus size={20} />
              グループを作成 / 参加
            </button>
          </div>
        </section>

        {/* テンピタくんへのリンク */}
        <Link
          to="https://mahjong-colc.vercel.app"
          target="_blank"
          className="card-soft p-4 flex items-center gap-3 hover:shadow-lg transition-shadow"
        >
          <div className="bg-mahjong-table text-white p-3 rounded-xl">
            <Calculator size={24} />
          </div>
          <div>
            <p className="font-bold text-mahjong-table">テンピタくん</p>
            <p className="text-sm text-gray-500">符計算・点数計算はこちら</p>
          </div>
        </Link>
      </main>
    </div>
  )
}
