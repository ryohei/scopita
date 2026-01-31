import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Settings, Users, Trophy, History, Copy, Check } from 'lucide-react'
import { useGroupDetail } from '../hooks/useGroups'
import { TabSwitch } from '../components/TabSwitch'
import { BottomNav } from '../components/BottomNav'

type Tab = 'ranking' | 'history' | 'members'

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const { group, members, rules, loading } = useGroupDetail(groupId || '')
  const [activeTab, setActiveTab] = useState<Tab>('ranking')
  const [copied, setCopied] = useState(false)
  const [period, setPeriod] = useState('月間')

  const copyInviteCode = () => {
    if (group?.invite_code) {
      navigator.clipboard.writeText(group.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-mahjong-table border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-mahjong-table font-medium">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users size={32} className="text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">グループが見つかりません</p>
          <Link to="/" className="text-mahjong-table font-bold mt-3 inline-block hover:underline">
            ホームに戻る
          </Link>
        </div>
      </div>
    )
  }

  const tabOptions = [
    { value: 'ranking' as Tab, label: 'ランキング', icon: <Trophy size={16} /> },
    { value: 'history' as Tab, label: '履歴', icon: <History size={16} /> },
    { value: 'members' as Tab, label: 'メンバー', icon: <Users size={16} /> },
  ]

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* ヘッダー */}
      <header className="bg-mahjong-table rounded-b-3xl shadow-lg">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <Link to="/" className="text-white/80 hover:text-white transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold text-white flex-1">{group.name}</h1>
            <button className="text-white/80 hover:text-white transition-colors">
              <Settings size={24} />
            </button>
          </div>

          {/* 招待コード */}
          <div className="bg-white/10 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-white/70 text-xs mb-0.5">招待コード</p>
              <p className="text-xl font-bold text-white tracking-widest">
                {group.invite_code}
              </p>
            </div>
            <button
              onClick={copyInviteCode}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                copied 
                  ? 'bg-green-500 text-white' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'コピー済み' : 'コピー'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 -mt-3">
        {/* ルール表示 */}
        {rules && (
          <div className="bg-white rounded-2xl shadow-soft p-4 mb-4 animate-slide-up">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-4 bg-mahjong-table rounded-full"></div>
              <span className="text-sm font-bold text-gray-700">ルール設定</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="bg-mahjong-table text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                {rules.game_type}
              </span>
              <span className="bg-cream-dark text-gray-600 px-3 py-1.5 rounded-lg text-sm">
                {rules.start_score.toLocaleString()}点持ち
              </span>
              <span className="bg-cream-dark text-gray-600 px-3 py-1.5 rounded-lg text-sm">
                {rules.return_score.toLocaleString()}点返し
              </span>
              <span className="bg-cream-dark text-gray-600 px-3 py-1.5 rounded-lg text-sm">
                ウマ {Math.abs(rules.uma_second)}-{rules.uma_first}
              </span>
              {rules.has_oka && (
                <span className="bg-cream-dark text-gray-600 px-3 py-1.5 rounded-lg text-sm">
                  オカあり
                </span>
              )}
            </div>
          </div>
        )}

        {/* タブ */}
        <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
          <div className="p-3">
            <TabSwitch 
              options={tabOptions} 
              value={activeTab} 
              onChange={setActiveTab} 
            />
          </div>

          {/* タブコンテンツ */}
          <div className="p-4 pt-0">
            {activeTab === 'ranking' && (
              <div className="animate-slide-up">
                <div className="flex items-center justify-between mb-4 pt-2">
                  <h3 className="font-bold text-gray-700">ランキング</h3>
                  <select 
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="text-sm border-2 border-gray-200 rounded-lg px-3 py-1.5 font-medium focus:border-mahjong-table focus:outline-none"
                  >
                    <option>週間</option>
                    <option>月間</option>
                    <option>3ヶ月</option>
                    <option>年間</option>
                    <option>通算</option>
                  </select>
                </div>
                <div className="py-10 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Trophy size={28} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500">まだ対局記録がありません</p>
                  <p className="text-gray-400 text-sm mt-1">対局を記録してランキングを確認しましょう</p>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="animate-slide-up">
                <h3 className="font-bold text-gray-700 mb-4 pt-2">対局履歴</h3>
                <div className="py-10 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <History size={28} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500">まだ対局記録がありません</p>
                </div>
              </div>
            )}

            {activeTab === 'members' && (
              <div className="animate-slide-up">
                <h3 className="font-bold text-gray-700 mb-4 pt-2">
                  メンバー ({members.length}人)
                </h3>
                <div className="space-y-2">
                  {members.map((member, index) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-cream-dark"
                    >
                      <div className="w-11 h-11 bg-mahjong-table/20 rounded-full flex items-center justify-center text-mahjong-table font-bold text-lg">
                        {member.users.display_name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800">{member.users.display_name}</p>
                        {member.role === 'admin' && (
                          <span className="text-xs text-mahjong-table font-medium">管理者</span>
                        )}
                      </div>
                      <span className="text-gray-400 text-sm">#{index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ボトムナビ */}
      <BottomNav />
    </div>
  )
}
