import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useGroups } from '../hooks/useGroups'
import { useGameSessions } from '../hooks/useGameSessions'
import { LogOut, Plus, Users, ChevronRight, History, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CreateGroupModal } from '../components/CreateGroupModal'
import { SectionCard } from '../components/SectionCard'
import { BottomNav } from '../components/BottomNav'

export function HomePage() {
  const { user, signOut } = useAuth()
  const { groups, loading: groupsLoading, createGroup, joinGroup } = useGroups()
  const { sessions, loading: sessionsLoading } = useGameSessions()
  const [showGroupModal, setShowGroupModal] = useState(false)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const displayName = user?.user_metadata?.display_name || 'ゲスト'

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* ヘッダー */}
      <header className="bg-mahjong-table rounded-b-3xl shadow-lg px-4 pt-6 pb-8">
        <div className="max-w-2xl mx-auto">
          {/* 上部ナビ */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <img 
                src="/images/mascot-64.png" 
                alt="" 
                className="w-8 h-8 rounded-full bg-white p-0.5"
              />
              <span className="text-white/80 text-sm font-medium">スコピタくん</span>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-1 text-white/70 text-sm hover:text-white transition-colors"
            >
              <LogOut size={16} />
              ログアウト
            </button>
          </div>

          {/* ウェルカムメッセージ */}
          <div className="text-center text-white">
            <p className="text-lg mb-1">おかえりなさい！</p>
            <p className="text-2xl font-bold">{displayName}さん</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 -mt-4">
        {/* メインアクション */}
        <Link
          to="/record"
          className="block bg-white rounded-2xl shadow-card p-4 mb-4 card-interactive animate-slide-up"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-mahjong-table rounded-2xl flex items-center justify-center shadow-button">
              <Plus size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg text-gray-800">対局を記録する</p>
              <p className="text-sm text-gray-500">新しい対局結果を入力</p>
            </div>
            <ChevronRight size={24} className="text-gray-400" />
          </div>
        </Link>

        {/* 最近の対局 */}
        <SectionCard title="最近の対局" icon={<History size={18} />} className="mb-4">
          {sessionsLoading ? (
            <div className="py-6 text-center">
              <div className="w-8 h-8 border-2 border-mahjong-table border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-500 text-sm">読み込み中...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <History size={28} className="text-gray-400" />
              </div>
              <p className="text-gray-500">まだ対局記録がありません</p>
              <p className="text-gray-400 text-sm mt-1">「対局を記録する」から始めましょう！</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.slice(0, 5).map((session) => (
                <Link
                  key={session.id}
                  to={`/sessions/${session.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-cream-dark hover:bg-cream-dark/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 w-12 font-medium">
                      {formatDate(session.date)}
                    </span>
                    <div>
                      <p className="font-bold text-gray-700">
                        {session.group_name || '単発対局'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {session.game_count}半荘
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-xl ${
                      session.total_score >= 0 ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {session.total_score > 0 ? '+' : ''}{session.total_score}
                    </span>
                    <ChevronRight size={18} className="text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        {/* 参加グループ */}
        <SectionCard title="参加グループ" icon={<Users size={18} />} className="mb-4">
          {groupsLoading ? (
            <div className="py-6 text-center">
              <div className="w-8 h-8 border-2 border-mahjong-table border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-500 text-sm">読み込み中...</p>
            </div>
          ) : (
            <>
              {groups.length === 0 ? (
                <div className="py-6 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users size={28} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500">まだグループに参加していません</p>
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  {groups.map((group) => (
                    <Link
                      key={group.id}
                      to={`/groups/${group.id}`}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-cream-dark transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-mahjong-table/15 rounded-xl flex items-center justify-center">
                          <Users size={22} className="text-mahjong-table" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{group.name}</p>
                          <p className="text-sm text-gray-500">
                            {group.member_count}人のメンバー
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-gray-400" />
                    </Link>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowGroupModal(true)}
                className="w-full border-2 border-dashed border-mahjong-table/30 text-mahjong-table py-3.5 rounded-xl font-bold hover:border-mahjong-table hover:bg-mahjong-table/5 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                グループを作成 / 参加
              </button>
            </>
          )}
        </SectionCard>

        {/* 成績サマリー */}
        {sessions.length > 0 && (
          <SectionCard title="成績サマリー" icon={<TrendingUp size={18} />}>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-cream-dark rounded-xl p-4 text-center">
                <p className="text-gray-500 text-sm mb-1">半荘数</p>
                <p className="text-2xl font-bold text-gray-800">
                  {sessions.reduce((sum, s) => sum + s.game_count, 0)}
                </p>
              </div>
              <div className="bg-cream-dark rounded-xl p-4 text-center">
                <p className="text-gray-500 text-sm mb-1">トータル</p>
                <p className={`text-2xl font-bold ${
                  sessions.reduce((sum, s) => sum + s.total_score, 0) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-500'
                }`}>
                  {sessions.reduce((sum, s) => sum + s.total_score, 0) > 0 ? '+' : ''}
                  {sessions.reduce((sum, s) => sum + s.total_score, 0)}
                </p>
                <p className="text-xs text-gray-400">ポイント</p>
              </div>
            </div>
          </SectionCard>
        )}
      </main>

      {/* ボトムナビ */}
      <BottomNav />

      {/* グループ作成/参加モーダル */}
      <CreateGroupModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onCreateGroup={createGroup}
        onJoinGroup={joinGroup}
      />
    </div>
  )
}
