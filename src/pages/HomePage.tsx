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
      <header className="bg-primary rounded-b-3xl shadow-lg px-4 pt-6 pb-8">
        <div className="max-w-2xl mx-auto">
          {/* 上部ナビ */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <img 
                src="/images/mascot-64.png" 
                alt="" 
                className="w-8 h-8 rounded-full bg-white p-0.5"
              />
              <span className="text-white/90 text-sm font-medium">スコピタちゃん</span>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-1 text-white/80 text-sm hover:text-white transition-colors"
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
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-button">
              <Plus size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg text-text-primary">対局を記録する</p>
              <p className="text-sm text-text-secondary">新しい対局結果を入力</p>
            </div>
            <ChevronRight size={24} className="text-text-secondary" />
          </div>
        </Link>

        {/* 最近の対局 */}
        <SectionCard title="最近の対局" icon={<History size={18} />} className="mb-4">
          {sessionsLoading ? (
            <div className="py-6 text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-text-secondary text-sm">読み込み中...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 bg-cream-dark rounded-full flex items-center justify-center mx-auto mb-3">
                <History size={28} className="text-text-secondary" />
              </div>
              <p className="text-text-secondary">まだ対局記録がありません</p>
              <p className="text-text-secondary/70 text-sm mt-1">「対局を記録する」から始めましょう！</p>
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
                    <span className="text-sm text-text-secondary w-12 font-medium">
                      {formatDate(session.date)}
                    </span>
                    <div>
                      <p className="font-bold text-text-primary">
                        {session.group_name || '単発対局'}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {session.game_count}半荘
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-xl ${
                      session.total_score >= 0 ? 'text-success' : 'text-error'
                    }`}>
                      {session.total_score > 0 ? '+' : ''}{session.total_score}
                    </span>
                    <ChevronRight size={18} className="text-text-secondary" />
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
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-text-secondary text-sm">読み込み中...</p>
            </div>
          ) : (
            <>
              {groups.length === 0 ? (
                <div className="py-6 text-center">
                  <div className="w-16 h-16 bg-cream-dark rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users size={28} className="text-text-secondary" />
                  </div>
                  <p className="text-text-secondary">まだグループに参加していません</p>
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
                        <div className="w-12 h-12 bg-primary/15 rounded-xl flex items-center justify-center">
                          <Users size={22} className="text-primary-dark" />
                        </div>
                        <div>
                          <p className="font-bold text-text-primary">{group.name}</p>
                          <p className="text-sm text-text-secondary">
                            {group.member_count}人のメンバー
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-text-secondary" />
                    </Link>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowGroupModal(true)}
                className="w-full border-2 border-dashed border-primary/40 text-primary-dark py-3.5 rounded-xl font-bold hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
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
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-cream-dark rounded-xl p-4 text-center">
                <p className="text-text-secondary text-sm mb-1">半荘数</p>
                <p className="text-2xl font-bold text-text-primary">
                  {sessions.reduce((sum, s) => sum + s.game_count, 0)}
                </p>
              </div>
              <div className="bg-cream-dark rounded-xl p-4 text-center">
                <p className="text-text-secondary text-sm mb-1">トータル</p>
                <p className={`text-2xl font-bold ${
                  sessions.reduce((sum, s) => sum + s.total_score, 0) >= 0
                    ? 'text-success'
                    : 'text-error'
                }`}>
                  {sessions.reduce((sum, s) => sum + s.total_score, 0) > 0 ? '+' : ''}
                  {sessions.reduce((sum, s) => sum + s.total_score, 0)}
                </p>
              </div>
            </div>
            {/* 順位分布 */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-yellow-50 rounded-xl p-3 text-center">
                <p className="text-yellow-600 text-xs mb-1">1着</p>
                <p className="text-xl font-bold text-yellow-600">
                  {sessions.reduce((sum, s) => sum + s.rank_counts.first, 0)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-gray-500 text-xs mb-1">2着</p>
                <p className="text-xl font-bold text-gray-600">
                  {sessions.reduce((sum, s) => sum + s.rank_counts.second, 0)}
                </p>
              </div>
              <div className="bg-orange-50 rounded-xl p-3 text-center">
                <p className="text-orange-500 text-xs mb-1">3着</p>
                <p className="text-xl font-bold text-orange-500">
                  {sessions.reduce((sum, s) => sum + s.rank_counts.third, 0)}
                </p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-blue-500 text-xs mb-1">4着</p>
                <p className="text-xl font-bold text-blue-500">
                  {sessions.reduce((sum, s) => sum + s.rank_counts.fourth, 0)}
                </p>
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
