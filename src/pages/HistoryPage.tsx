import { Link } from 'react-router-dom'
import { ArrowLeft, History, ChevronRight, Calendar } from 'lucide-react'
import { useGameSessions } from '../hooks/useGameSessions'
import { SectionCard } from '../components/SectionCard'
import { BottomNav } from '../components/BottomNav'

export function HistoryPage() {
  const { sessions, loading } = useGameSessions({ limit: undefined })

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  // 月ごとにグループ化
  const sessionsByMonth = sessions.reduce((acc, session) => {
    const date = new Date(session.date)
    const monthKey = `${date.getFullYear()}年${date.getMonth() + 1}月`
    if (!acc[monthKey]) {
      acc[monthKey] = []
    }
    acc[monthKey].push(session)
    return acc
  }, {} as Record<string, typeof sessions>)

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
              <h1 className="text-xl font-bold text-white">対局履歴</h1>
              <p className="text-white/70 text-sm">過去の対局を振り返ろう</p>
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
        {loading ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 border-4 border-mahjong-table border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">読み込み中...</p>
          </div>
        ) : sessions.length === 0 ? (
          <SectionCard className="animate-slide-up">
            <div className="py-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <History size={28} className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">まだ対局記録がありません</p>
              <p className="text-gray-400 text-sm mt-1">「記録」から対局を追加しましょう！</p>
              <Link
                to="/record"
                className="inline-block mt-4 px-6 py-2 bg-mahjong-table text-white rounded-xl font-bold hover:bg-mahjong-table/90 transition-colors"
              >
                対局を記録する
              </Link>
            </div>
          </SectionCard>
        ) : (
          <>
            {/* サマリー */}
            <div className="bg-white rounded-2xl shadow-soft p-4 mb-4 animate-slide-up">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-gray-500 text-xs mb-1">総日数</p>
                  <p className="text-2xl font-bold text-gray-800">{sessions.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 text-xs mb-1">総半荘数</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {sessions.reduce((sum, s) => sum + s.game_count, 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 text-xs mb-1">トータル</p>
                  <p className={`text-2xl font-bold ${
                    sessions.reduce((sum, s) => sum + s.total_score, 0) >= 0
                      ? 'text-green-600'
                      : 'text-red-500'
                  }`}>
                    {sessions.reduce((sum, s) => sum + s.total_score, 0) > 0 ? '+' : ''}
                    {sessions.reduce((sum, s) => sum + s.total_score, 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* 月別履歴 */}
            {Object.entries(sessionsByMonth).map(([month, monthSessions]) => (
              <SectionCard
                key={month}
                title={month}
                icon={<Calendar size={16} />}
                className="mb-4 animate-slide-up"
              >
                <div className="space-y-2">
                  {monthSessions.map((session) => (
                    <Link
                      key={session.id}
                      to={`/sessions/${session.id}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-cream-dark hover:bg-cream-dark/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 w-12 font-medium">
                          {formatDateShort(session.date)}
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
                        <span className={`font-bold text-lg ${
                          session.total_score >= 0 ? 'text-green-600' : 'text-red-500'
                        }`}>
                          {session.total_score > 0 ? '+' : ''}{session.total_score}
                        </span>
                        <ChevronRight size={18} className="text-gray-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              </SectionCard>
            ))}
          </>
        )}
      </main>

      {/* ボトムナビ */}
      <BottomNav />
    </div>
  )
}
