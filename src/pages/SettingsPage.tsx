import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, User, Mail, LogOut, ExternalLink, Info, Check, Edit2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { SectionCard } from '../components/SectionCard'
import { BottomNav } from '../components/BottomNav'

export function SettingsPage() {
  const { user, signOut, updateProfile } = useAuth()
  const [isEditingName, setIsEditingName] = useState(false)
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || '')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleSaveName = async () => {
    if (!displayName.trim()) return

    setSaving(true)
    setSaveSuccess(false)

    const { error } = await updateProfile(displayName.trim())

    if (!error) {
      setIsEditingName(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    }

    setSaving(false)
  }

  const handleSignOut = async () => {
    if (confirm('ログアウトしますか？')) {
      await signOut()
    }
  }

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* ヘッダー */}
      <header className="bg-mahjong-table rounded-b-3xl shadow-lg">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-white/80 hover:text-white transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">設定</h1>
              <p className="text-white/70 text-sm">プロフィールとアプリ設定</p>
            </div>
            <img
              src="/images/mascot-64.png"
              alt=""
              className="w-10 h-10 rounded-full bg-white p-0.5 shadow"
            />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 -mt-3">
        {/* プロフィール */}
        <SectionCard title="プロフィール" icon={<User size={16} />} className="mb-4 animate-slide-up">
          <div className="space-y-4">
            {/* 表示名 */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">表示名</label>
              {isEditingName ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-cream-dark border-2 border-mahjong-table focus:bg-white transition-colors"
                    placeholder="表示名を入力"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={saving || !displayName.trim()}
                    className="px-4 py-2 bg-mahjong-table text-white rounded-xl font-bold hover:bg-mahjong-table/90 transition-colors disabled:opacity-50"
                  >
                    {saving ? '保存中...' : '保存'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingName(false)
                      setDisplayName(user?.user_metadata?.display_name || '')
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="flex-1 px-4 py-2.5 rounded-xl bg-cream-dark text-gray-800 font-medium">
                    {user?.user_metadata?.display_name || '未設定'}
                  </span>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-2.5 rounded-xl bg-cream-dark text-gray-600 hover:bg-mahjong-table/10 hover:text-mahjong-table transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  {saveSuccess && (
                    <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <Check size={16} />
                      保存しました
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* メールアドレス */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-1">
                <Mail size={14} />
                メールアドレス
              </label>
              <span className="block px-4 py-2.5 rounded-xl bg-cream-dark text-gray-600">
                {user?.email}
              </span>
            </div>
          </div>
        </SectionCard>

        {/* リンク */}
        <SectionCard title="リンク" className="mb-4 animate-slide-up">
          <a
            href="https://mahjong-colc.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-xl bg-cream-dark hover:bg-cream-dark/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-mahjong-table/15 rounded-xl flex items-center justify-center">
                <img src="/images/mascot-64.png" alt="" className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-gray-800">テンピタくん</p>
                <p className="text-xs text-gray-500">点数計算アプリ</p>
              </div>
            </div>
            <ExternalLink size={18} className="text-gray-400" />
          </a>
        </SectionCard>

        {/* アプリ情報 */}
        <SectionCard title="アプリ情報" icon={<Info size={16} />} className="mb-4 animate-slide-up">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-cream-dark">
              <span className="text-gray-600">アプリ名</span>
              <span className="font-bold text-gray-800">スコピタちゃん</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-cream-dark">
              <span className="text-gray-600">バージョン</span>
              <span className="font-bold text-gray-800">1.0.0</span>
            </div>
          </div>
        </SectionCard>

        {/* ログアウト */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors"
        >
          <LogOut size={20} />
          ログアウト
        </button>
      </main>

      {/* ボトムナビ */}
      <BottomNav />
    </div>
  )
}
