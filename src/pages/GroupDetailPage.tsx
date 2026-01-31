import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Settings, Users, Trophy, History, Copy, Check } from 'lucide-react'
import { useGroupDetail } from '../hooks/useGroups'

type Tab = 'ranking' | 'history' | 'members'

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const { group, members, rules, loading } = useGroupDetail(groupId || '')
  const [activeTab, setActiveTab] = useState<Tab>('ranking')
  const [copied, setCopied] = useState(false)

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
        <div className="text-mahjong-table">読み込み中...</div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-gray-500">グループが見つかりません</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* ヘッダー */}
      <header className="bg-mahjong-table text-white p-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link to="/" className="hover:opacity-80">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold flex-1">{group.name}</h1>
          <button className="hover:opacity-80">
            <Settings size={24} />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        {/* 招待コード */}
        <div className="card-soft p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">招待コード</p>
              <p className="text-2xl font-bold text-mahjong-table tracking-wider">
                {group.invite_code}
              </p>
            </div>
            <button
              onClick={copyInviteCode}
              className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-600 hover:bg-gray-200"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'コピー済み' : 'コピー'}
            </button>
          </div>
        </div>

        {/* ルール表示 */}
        {rules && (
          <div className="card-soft p-4 mb-4">
            <p className="text-sm text-gray-500 mb-2">ルール設定</p>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="bg-mahjong-table/10 text-mahjong-table px-2 py-1 rounded">
                {rules.game_type}
              </span>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {rules.start_score.toLocaleString()}点持ち
              </span>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {rules.return_score.toLocaleString()}点返し
              </span>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">
                ウマ {Math.abs(rules.uma_second)}-{rules.uma_first}
              </span>
              {rules.has_oka && (
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  オカあり
                </span>
              )}
            </div>
          </div>
        )}

        {/* タブ */}
        <div className="flex mb-4 bg-white rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('ranking')}
            className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'ranking' ? 'bg-mahjong-table text-white' : 'text-gray-500'
            }`}
          >
            <Trophy size={18} />
            ランキング
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'history' ? 'bg-mahjong-table text-white' : 'text-gray-500'
            }`}
          >
            <History size={18} />
            履歴
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'members' ? 'bg-mahjong-table text-white' : 'text-gray-500'
            }`}
          >
            <Users size={18} />
            メンバー
          </button>
        </div>

        {/* タブコンテンツ */}
        <div className="card-soft p-4">
          {activeTab === 'ranking' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-700">ランキング</h3>
                <select className="text-sm border rounded-lg px-2 py-1">
                  <option>月間</option>
                  <option>週間</option>
                  <option>3ヶ月</option>
                  <option>年間</option>
                  <option>通算</option>
                </select>
              </div>
              <p className="text-gray-500 text-center py-8">
                まだ対局記録がありません
              </p>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h3 className="font-bold text-gray-700 mb-4">対局履歴</h3>
              <p className="text-gray-500 text-center py-8">
                まだ対局記録がありません
              </p>
            </div>
          )}

          {activeTab === 'members' && (
            <div>
              <h3 className="font-bold text-gray-700 mb-4">
                メンバー ({members.length}人)
              </h3>
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                  >
                    <div className="w-10 h-10 bg-mahjong-table/20 rounded-full flex items-center justify-center text-mahjong-table font-bold">
                      {member.users.display_name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{member.users.display_name}</p>
                      {member.role === 'admin' && (
                        <span className="text-xs text-mahjong-table">管理者</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
