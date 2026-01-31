import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Trophy, Users } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useGroups } from '../hooks/useGroups'
import { supabase } from '../lib/supabase'

interface Player {
  id: string
  name: string
  isGuest: boolean
  userId?: string
}

interface GameScore {
  playerId: string
  rawScore: string
  rank: number
  score: number
}

interface Game {
  id: string
  scores: GameScore[]
  yakuman: { playerId: string; type: string }[]
}

const YAKUMAN_TYPES = [
  '国士無双', '四暗刻', '大三元', '字一色', '小四喜', '大四喜',
  '緑一色', '清老頭', '九蓮宝燈', '四槓子', '天和', '地和'
]

export function RecordPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { groups } = useGroups()

  const [mode, setMode] = useState<'group' | 'free'>('free')
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: '', isGuest: true },
    { id: '2', name: '', isGuest: true },
    { id: '3', name: '', isGuest: true },
    { id: '4', name: '', isGuest: true },
  ])
  const [games, setGames] = useState<Game[]>([])
  const [saving, setSaving] = useState(false)

  // ルール設定（デフォルト）
  const [rules, setRules] = useState({
    returnScore: 30000,
    umaFirst: 20,
    umaSecond: 10,
    umaThird: -10,
    umaFourth: -20,
    hasOka: true,
    startScore: 25000,
  })

  // グループ選択時にルールを読み込み
  useEffect(() => {
    if (selectedGroupId) {
      const loadGroupRules = async () => {
        const { data } = await supabase
          .from('group_rules')
          .select('*')
          .eq('group_id', selectedGroupId)
          .single()

        if (data) {
          setRules({
            returnScore: data.return_score,
            umaFirst: data.uma_first,
            umaSecond: data.uma_second,
            umaThird: data.uma_third,
            umaFourth: data.uma_fourth,
            hasOka: data.has_oka,
            startScore: data.start_score,
          })
        }
      }
      loadGroupRules()
    }
  }, [selectedGroupId])

  const calculateScore = (rawScore: number, rank: number): number => {
    // 素点から返し点を引いて千点単位に
    let score = Math.round((rawScore - rules.returnScore) / 1000)

    // ウマを加算
    const uma = [rules.umaFirst, rules.umaSecond, rules.umaThird, rules.umaFourth]
    score += uma[rank - 1]

    // オカ（トップ取り）
    if (rules.hasOka && rank === 1) {
      const oka = ((rules.returnScore - rules.startScore) / 1000) * 4
      score += oka
    }

    return score
  }

  const addGame = () => {
    const newGame: Game = {
      id: Date.now().toString(),
      scores: players.map((p) => ({
        playerId: p.id,
        rawScore: '',
        rank: 0,
        score: 0,
      })),
      yakuman: [],
    }
    setGames([...games, newGame])
  }

  const updateRawScore = (gameId: string, playerId: string, rawScore: string) => {
    setGames(games.map(game => {
      if (game.id !== gameId) return game

      const newScores = game.scores.map(s =>
        s.playerId === playerId ? { ...s, rawScore } : s
      )

      // 全員のスコアが入力されたら順位と計算後スコアを算出
      const allFilled = newScores.every(s => s.rawScore !== '')
      if (allFilled) {
        const sorted = [...newScores].sort((a, b) =>
          parseInt(b.rawScore) - parseInt(a.rawScore)
        )
        newScores.forEach(s => {
          const rank = sorted.findIndex(ss => ss.playerId === s.playerId) + 1
          s.rank = rank
          s.score = calculateScore(parseInt(s.rawScore), rank)
        })
      }

      return { ...game, scores: newScores }
    }))
  }

  const removeGame = (gameId: string) => {
    setGames(games.filter(g => g.id !== gameId))
  }

  const addYakuman = (gameId: string, playerId: string, type: string) => {
    setGames(games.map(game => {
      if (game.id !== gameId) return game
      return {
        ...game,
        yakuman: [...game.yakuman, { playerId, type }]
      }
    }))
  }

  const removeYakuman = (gameId: string, index: number) => {
    setGames(games.map(game => {
      if (game.id !== gameId) return game
      return {
        ...game,
        yakuman: game.yakuman.filter((_, i) => i !== index)
      }
    }))
  }

  const getTotalScore = (playerId: string): number => {
    return games.reduce((sum, game) => {
      const score = game.scores.find(s => s.playerId === playerId)
      return sum + (score?.score || 0)
    }, 0)
  }

  const handleSave = async () => {
    if (!user) return
    if (players.some(p => !p.name.trim())) {
      alert('全員の名前を入力してください')
      return
    }
    if (games.length === 0) {
      alert('半荘を1つ以上追加してください')
      return
    }
    if (games.some(g => g.scores.some(s => s.rawScore === ''))) {
      alert('全ての点数を入力してください')
      return
    }

    setSaving(true)

    try {
      // セッション作成
      const { data: session, error: sessionError } = await supabase
        .from('game_sessions')
        .insert({
          group_id: mode === 'group' ? selectedGroupId : null,
          date,
          created_by: user.id,
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // プレイヤー登録
      const { data: sessionPlayers, error: playersError } = await supabase
        .from('session_players')
        .insert(
          players.map((p, index) => ({
            session_id: session.id,
            user_id: p.userId || null,
            guest_name: p.isGuest ? p.name : null,
            player_index: index,
          }))
        )
        .select()

      if (playersError) throw playersError

      // プレイヤーIDマッピング
      const playerIdMap = new Map<string, string>()
      players.forEach((p, index) => {
        playerIdMap.set(p.id, sessionPlayers[index].id)
      })

      // 各半荘を保存
      for (let i = 0; i < games.length; i++) {
        const game = games[i]

        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .insert({
            session_id: session.id,
            game_number: i + 1,
          })
          .select()
          .single()

        if (gameError) throw gameError

        // 結果を保存
        const { error: resultsError } = await supabase
          .from('game_results')
          .insert(
            game.scores.map(s => ({
              game_id: gameData.id,
              player_id: playerIdMap.get(s.playerId),
              rank: s.rank,
              raw_score: parseInt(s.rawScore),
              score: s.score,
            }))
          )

        if (resultsError) throw resultsError

        // 役満を保存
        if (game.yakuman.length > 0) {
          const { error: yakumanError } = await supabase
            .from('yakuman')
            .insert(
              game.yakuman.map(y => ({
                game_id: gameData.id,
                player_id: playerIdMap.get(y.playerId),
                type: y.type,
              }))
            )

          if (yakumanError) throw yakumanError
        }
      }

      navigate('/')
    } catch (error) {
      console.error('Save error:', error)
      alert('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* ヘッダー */}
      <header className="bg-mahjong-table text-white p-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link to="/" className="hover:opacity-80">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold">対局記録</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        {/* モード選択 */}
        <div className="card-soft p-4 mb-4">
          <div className="flex mb-3 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setMode('group')}
              className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-colors ${
                mode === 'group' ? 'bg-white text-mahjong-table shadow' : 'text-gray-500'
              }`}
            >
              <Users size={18} />
              グループ
            </button>
            <button
              onClick={() => setMode('free')}
              className={`flex-1 py-2 rounded-lg font-bold transition-colors ${
                mode === 'free' ? 'bg-white text-mahjong-table shadow' : 'text-gray-500'
              }`}
            >
              単発（フリー）
            </button>
          </div>

          {mode === 'group' && (
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 mb-3"
            >
              <option value="">グループを選択</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300"
            />
          </div>
        </div>

        {/* プレイヤー入力 */}
        <div className="card-soft p-4 mb-4">
          <h3 className="font-bold text-gray-700 mb-3">参加者</h3>
          <div className="space-y-2">
            {players.map((player, index) => (
              <div key={player.id} className="flex items-center gap-2">
                <span className="w-8 h-8 bg-mahjong-table/20 rounded-full flex items-center justify-center text-sm font-bold text-mahjong-table">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => {
                    const newPlayers = [...players]
                    newPlayers[index].name = e.target.value
                    setPlayers(newPlayers)
                  }}
                  placeholder={`プレイヤー${index + 1}`}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 半荘入力 */}
        {games.map((game, gameIndex) => (
          <div key={game.id} className="card-soft p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-700">半荘 {gameIndex + 1}</h3>
              <button
                onClick={() => removeGame(game.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {players.map((player) => {
                const scoreData = game.scores.find(s => s.playerId === player.id)
                return (
                  <div key={player.id} className="flex items-center gap-2">
                    <span className="w-20 text-sm font-medium truncate">
                      {player.name || `P${players.indexOf(player) + 1}`}
                    </span>
                    <input
                      type="number"
                      value={scoreData?.rawScore || ''}
                      onChange={(e) => updateRawScore(game.id, player.id, e.target.value)}
                      placeholder="素点"
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-right"
                    />
                    {scoreData?.rank ? (
                      <span className={`w-16 text-right font-bold ${
                        scoreData.score >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {scoreData.score > 0 ? '+' : ''}{scoreData.score}
                      </span>
                    ) : (
                      <span className="w-16" />
                    )}
                  </div>
                )
              })}
            </div>

            {/* 役満記録 */}
            <div className="border-t pt-3">
              <div className="flex items-center gap-2 mb-2">
                <Trophy size={16} className="text-yellow-500" />
                <span className="text-sm font-medium text-gray-600">役満</span>
              </div>
              {game.yakuman.map((y, index) => (
                <div key={index} className="flex items-center gap-2 mb-2 text-sm">
                  <span>{players.find(p => p.id === y.playerId)?.name}: {y.type}</span>
                  <button
                    onClick={() => removeYakuman(game.id, index)}
                    className="text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <select className="flex-1 px-2 py-1 rounded border text-sm" id={`yakuman-player-${game.id}`}>
                  {players.map(p => (
                    <option key={p.id} value={p.id}>{p.name || `P${players.indexOf(p) + 1}`}</option>
                  ))}
                </select>
                <select className="flex-1 px-2 py-1 rounded border text-sm" id={`yakuman-type-${game.id}`}>
                  {YAKUMAN_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const playerSelect = document.getElementById(`yakuman-player-${game.id}`) as HTMLSelectElement
                    const typeSelect = document.getElementById(`yakuman-type-${game.id}`) as HTMLSelectElement
                    addYakuman(game.id, playerSelect.value, typeSelect.value)
                  }}
                  className="px-3 py-1 bg-yellow-500 text-white rounded text-sm font-bold"
                >
                  追加
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addGame}
          className="w-full border-2 border-dashed border-gray-300 text-gray-500 py-3 rounded-xl font-bold hover:border-mahjong-table hover:text-mahjong-table transition-colors flex items-center justify-center gap-2 mb-4"
        >
          <Plus size={20} />
          半荘を追加
        </button>

        {/* 集計 */}
        {games.length > 0 && (
          <div className="card-soft p-4 mb-4">
            <h3 className="font-bold text-gray-700 mb-3">本日の集計</h3>
            <div className="space-y-2">
              {players
                .map(p => ({ ...p, total: getTotalScore(p.id) }))
                .sort((a, b) => b.total - a.total)
                .map((player, index) => (
                  <div key={player.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-400 text-white' :
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                        index === 2 ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="font-medium">{player.name || `P${players.indexOf(player) + 1}`}</span>
                    </div>
                    <span className={`font-bold ${
                      player.total >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {player.total > 0 ? '+' : ''}{player.total}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>

      {/* 保存ボタン（固定） */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-cream border-t">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleSave}
            disabled={saving || games.length === 0}
            className="w-full bg-mahjong-table text-white py-4 rounded-2xl font-bold btn-pressable disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  )
}
