import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Trophy, Users, Calendar } from 'lucide-react'
import { useSessionDetail } from '../hooks/useSessionDetail'
import { SectionCard } from '../components/SectionCard'
import { YAKUMAN_TYPES } from '../constants/mahjong'
import { BottomNav } from '../components/BottomNav'

export function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const {
    session,
    loading,
    error,
    addGame,
    deleteGame,
    updateGameResult,
    addYakuman,
    removeYakuman,
    updatePlayerName,
    getTotalScore,
    deleteSession,
  } = useSessionDetail(sessionId)

  const [editingScores, setEditingScores] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-mahjong-table border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'セッションが見つかりません'}</p>
          <Link to="/" className="text-mahjong-table font-bold">
            ホームに戻る
          </Link>
        </div>
      </div>
    )
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
  }

  const handleRawScoreChange = (gameId: string, playerId: string, value: string) => {
    setEditingScores(prev => ({
      ...prev,
      [`${gameId}-${playerId}`]: value,
    }))
  }

  const getRawScoreValue = (gameId: string, playerId: string, result: { rawScore: number } | undefined): string => {
    const key = `${gameId}-${playerId}`
    if (key in editingScores) {
      return editingScores[key]
    }
    if (!result || result.rawScore === 0) {
      return ''
    }
    return result.rawScore.toString()
  }

  const handleRawScoreBlur = async (gameId: string, playerId: string) => {
    const key = `${gameId}-${playerId}`
    const value = editingScores[key]
    if (value === undefined) return

    const rawScore = parseInt(value) || 0
    setSaving(true)
    await updateGameResult(gameId, playerId, rawScore)
    setSaving(false)

    // 編集状態をクリア
    setEditingScores(prev => {
      const newState = { ...prev }
      delete newState[key]
      return newState
    })
  }

  const handleAddGame = async () => {
    setSaving(true)
    await addGame()
    setSaving(false)
  }

  const handleDeleteGame = async (gameId: string) => {
    if (!confirm('この半荘を削除しますか？')) return
    setSaving(true)
    await deleteGame(gameId)
    setSaving(false)
  }

  const handleAddYakuman = async (gameId: string) => {
    const playerSelect = document.getElementById(`yakuman-player-${gameId}`) as HTMLSelectElement
    const typeSelect = document.getElementById(`yakuman-type-${gameId}`) as HTMLSelectElement
    if (!playerSelect || !typeSelect) return

    setSaving(true)
    await addYakuman(gameId, playerSelect.value, typeSelect.value)
    setSaving(false)
  }

  const handleRemoveYakuman = async (gameId: string, yakumanId: string) => {
    setSaving(true)
    await removeYakuman(gameId, yakumanId)
    setSaving(false)
  }

  const getPlayerDisplayName = (playerId: string) => {
    const player = session.players.find(p => p.id === playerId)
    return player?.displayName || 'Unknown'
  }

  const handleDeleteSession = async () => {
    if (!confirm('この対局を削除しますか？この操作は取り消せません。')) return
    setSaving(true)
    const { error } = await deleteSession()
    setSaving(false)
    if (!error) {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-cream pb-32">
      {/* ヘッダー */}
      <header className="bg-mahjong-table rounded-b-3xl shadow-lg">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-white/80 hover:text-white transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">
                {session.groupName || '単発対局'}
              </h1>
              <p className="text-white/70 text-sm flex items-center gap-1">
                <Calendar size={12} />
                {formatDate(session.date)}
              </p>
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
        {/* プレイヤー一覧 */}
        <SectionCard title="参加者" icon={<Users size={16} />} className="mb-4 animate-slide-up">
          <div className="space-y-2">
            {session.players.map((player, index) => (
              <div key={player.id} className="flex items-center gap-3">
                <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                  index === 0 ? 'bg-mahjong-table text-white' : 'bg-cream-dark text-gray-600'
                }`}>
                  {index + 1}
                </span>
                {player.userId ? (
                  <span className="flex-1 px-4 py-2.5 rounded-xl bg-cream-dark text-gray-700">
                    {player.displayName}
                  </span>
                ) : (
                  <input
                    type="text"
                    value={player.displayName}
                    onChange={(e) => updatePlayerName(player.id, e.target.value)}
                    placeholder={`プレイヤー${index + 1}`}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-cream-dark border-2 border-transparent focus:border-mahjong-table focus:bg-white transition-colors"
                  />
                )}
              </div>
            ))}
          </div>
        </SectionCard>

        {/* 半荘一覧 */}
        {session.games.map((game) => (
          <div key={game.id} className="bg-white rounded-2xl shadow-soft p-4 mb-4 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="bg-mahjong-table text-white text-sm font-bold px-3 py-1 rounded-lg">
                  半荘 {game.gameNumber}
                </span>
              </div>
              <button
                onClick={() => handleDeleteGame(game.id)}
                disabled={saving}
                className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {session.players.map((player) => {
                const result = game.results.find(r => r.playerId === player.id)
                return (
                  <div key={player.id} className="flex items-center gap-2">
                    <span className="w-20 text-sm font-medium text-gray-700 truncate">
                      {player.displayName}
                    </span>
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        value={getRawScoreValue(game.id, player.id, result)}
                        onChange={(e) => handleRawScoreChange(game.id, player.id, e.target.value)}
                        onBlur={() => handleRawScoreBlur(game.id, player.id)}
                        placeholder="素点"
                        className="w-full px-4 py-2.5 rounded-xl bg-cream-dark border-2 border-transparent focus:border-mahjong-table focus:bg-white transition-colors text-right font-medium"
                      />
                    </div>
                    <div className="w-16 text-right">
                      {result?.rank ? (
                        <span className={`font-bold text-lg ${
                          result.score >= 0 ? 'text-green-600' : 'text-red-500'
                        }`}>
                          {result.score > 0 ? '+' : ''}{result.score}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 役満記録 */}
            <div className="border-t-2 border-cream-dark pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={16} className="text-yellow-500" />
                <span className="text-sm font-bold text-gray-700">役満が出た？</span>
              </div>
              {game.yakuman.map((y) => (
                <div key={y.id} className="flex items-center gap-2 mb-2 bg-yellow-50 p-2 rounded-lg">
                  <Trophy size={14} className="text-yellow-500" />
                  <span className="text-sm font-medium flex-1">
                    {getPlayerDisplayName(y.playerId)}: {y.type}
                  </span>
                  <button
                    onClick={() => handleRemoveYakuman(game.id, y.id)}
                    disabled={saving}
                    className="text-red-400 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <select
                  className="flex-1 px-3 py-2 rounded-xl bg-cream-dark text-sm font-medium"
                  id={`yakuman-player-${game.id}`}
                >
                  {session.players.map(p => (
                    <option key={p.id} value={p.id}>{p.displayName}</option>
                  ))}
                </select>
                <select
                  className="flex-1 px-3 py-2 rounded-xl bg-cream-dark text-sm font-medium"
                  id={`yakuman-type-${game.id}`}
                >
                  {YAKUMAN_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleAddYakuman(game.id)}
                  disabled={saving}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-xl text-sm font-bold hover:bg-yellow-600 transition-colors shadow-sm disabled:opacity-50"
                >
                  追加
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={handleAddGame}
          disabled={saving}
          className="w-full border-2 border-dashed border-mahjong-table/30 text-mahjong-table py-4 rounded-2xl font-bold hover:border-mahjong-table hover:bg-mahjong-table/5 transition-all flex items-center justify-center gap-2 mb-4 disabled:opacity-50"
        >
          <Plus size={22} />
          半荘を追加
        </button>

        {/* 集計 */}
        {session.games.length > 0 && (
          <SectionCard title="集計" icon={<Trophy size={16} />} className="mb-4">
            <div className="space-y-2">
              {session.players
                .map(p => ({ ...p, total: getTotalScore(p.id) }))
                .sort((a, b) => b.total - a.total)
                .map((player, index) => (
                  <div key={player.id} className="flex items-center justify-between p-3 rounded-xl bg-cream-dark">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                        index === 0 ? 'bg-yellow-400 text-white' :
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                        index === 2 ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="font-bold text-gray-800">{player.displayName}</span>
                    </div>
                    <span className={`font-bold text-xl ${
                      player.total >= 0 ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {player.total > 0 ? '+' : ''}{player.total}
                    </span>
                  </div>
                ))}
            </div>
          </SectionCard>
        )}

        {/* 削除ボタン */}
        <button
          onClick={handleDeleteSession}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors mb-4 disabled:opacity-50"
        >
          <Trash2 size={20} />
          この対局を削除
        </button>
      </main>

      {/* ボトムナビ */}
      <BottomNav />
    </div>
  )
}
