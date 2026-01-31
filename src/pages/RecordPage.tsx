import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Trophy, Users, Calendar, UserCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useGroups } from '../hooks/useGroups'
import { supabase } from '../lib/supabase'
import { SectionCard } from '../components/SectionCard'
import { TabSwitch } from '../components/TabSwitch'

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

  // プレイヤー1は自分（ログインユーザー）
  const myName = user?.user_metadata?.display_name || 'プレイヤー1'
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: myName, isGuest: false, userId: user?.id },
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

  // ユーザー情報が更新されたらプレイヤー1を更新
  useEffect(() => {
    if (user) {
      setPlayers(prev => {
        const updated = [...prev]
        updated[0] = {
          id: '1',
          name: user.user_metadata?.display_name || 'プレイヤー1',
          isGuest: false,
          userId: user.id,
        }
        return updated
      })
    }
  }, [user])

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
    } catch (error: any) {
      console.error('Save error:', error)
      alert(`保存に失敗しました: ${error?.message || JSON.stringify(error)}`)
    } finally {
      setSaving(false)
    }
  }

  const modeOptions = [
    { value: 'group' as const, label: 'グループ', icon: <Users size={16} /> },
    { value: 'free' as const, label: '単発', icon: <UserCircle size={16} /> },
  ]

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
              <h1 className="text-xl font-bold text-white">対局記録</h1>
              <p className="text-white/70 text-sm">スコアを入力してね！</p>
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
        {/* 基本設定 */}
        <SectionCard title="基本設定" className="mb-4 animate-slide-up">
          {/* モード選択 */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-600 mb-2">対局モード</p>
            <TabSwitch options={modeOptions} value={mode} onChange={setMode} />
          </div>

          {mode === 'group' && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-600 mb-2">グループ選択</p>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-cream-dark border-2 border-transparent focus:border-mahjong-table focus:bg-white transition-colors font-medium"
              >
                <option value="">グループを選択してください</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-1.5">
              <Calendar size={14} />
              日付
            </p>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-cream-dark border-2 border-transparent focus:border-mahjong-table focus:bg-white transition-colors font-medium"
            />
          </div>
        </SectionCard>

        {/* プレイヤー入力 */}
        <SectionCard title="参加者" icon={<Users size={16} />} className="mb-4">
          <div className="space-y-2">
            {players.map((player, index) => (
              <div key={player.id} className="flex items-center gap-3">
                <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                  index === 0 ? 'bg-mahjong-table text-white' : 'bg-cream-dark text-gray-600'
                }`}>
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
                  className="flex-1 px-4 py-2.5 rounded-xl bg-cream-dark border-2 border-transparent focus:border-mahjong-table focus:bg-white transition-colors"
                  disabled={index === 0}
                />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* 半荘入力 */}
        {games.map((game, gameIndex) => (
          <div key={game.id} className="bg-white rounded-2xl shadow-soft p-4 mb-4 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="bg-mahjong-table text-white text-sm font-bold px-3 py-1 rounded-lg">
                  半荘 {gameIndex + 1}
                </span>
              </div>
              <button
                onClick={() => removeGame(game.id)}
                className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {players.map((player) => {
                const scoreData = game.scores.find(s => s.playerId === player.id)
                return (
                  <div key={player.id} className="flex items-center gap-2">
                    <span className="w-20 text-sm font-medium text-gray-700 truncate">
                      {player.name || `P${players.indexOf(player) + 1}`}
                    </span>
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        value={scoreData?.rawScore || ''}
                        onChange={(e) => updateRawScore(game.id, player.id, e.target.value)}
                        placeholder="素点"
                        className="w-full px-4 py-2.5 rounded-xl bg-cream-dark border-2 border-transparent focus:border-mahjong-table focus:bg-white transition-colors text-right font-medium"
                      />
                    </div>
                    <div className="w-16 text-right">
                      {scoreData?.rank ? (
                        <span className={`font-bold text-lg ${
                          scoreData.score >= 0 ? 'text-green-600' : 'text-red-500'
                        }`}>
                          {scoreData.score > 0 ? '+' : ''}{scoreData.score}
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
              {game.yakuman.map((y, index) => (
                <div key={index} className="flex items-center gap-2 mb-2 bg-yellow-50 p-2 rounded-lg">
                  <Trophy size={14} className="text-yellow-500" />
                  <span className="text-sm font-medium flex-1">
                    {players.find(p => p.id === y.playerId)?.name}: {y.type}
                  </span>
                  <button
                    onClick={() => removeYakuman(game.id, index)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <select className="flex-1 px-3 py-2 rounded-xl bg-cream-dark text-sm font-medium" id={`yakuman-player-${game.id}`}>
                  {players.map(p => (
                    <option key={p.id} value={p.id}>{p.name || `P${players.indexOf(p) + 1}`}</option>
                  ))}
                </select>
                <select className="flex-1 px-3 py-2 rounded-xl bg-cream-dark text-sm font-medium" id={`yakuman-type-${game.id}`}>
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
                  className="px-4 py-2 bg-yellow-500 text-white rounded-xl text-sm font-bold hover:bg-yellow-600 transition-colors shadow-sm"
                >
                  追加
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addGame}
          className="w-full border-2 border-dashed border-mahjong-table/30 text-mahjong-table py-4 rounded-2xl font-bold hover:border-mahjong-table hover:bg-mahjong-table/5 transition-all flex items-center justify-center gap-2 mb-4"
        >
          <Plus size={22} />
          半荘を追加
        </button>

        {/* 集計 */}
        {games.length > 0 && (
          <SectionCard title="本日の集計" icon={<Trophy size={16} />} className="mb-4">
            <div className="space-y-2">
              {players
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
                      <span className="font-bold text-gray-800">{player.name || `P${players.indexOf(player) + 1}`}</span>
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
      </main>

      {/* 固定フッター */}
      <div className="fixed bottom-0 left-0 right-0 bg-mahjong-table shadow-lg safe-area-bottom">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="flex-1">
            {games.length > 0 && (
              <div className="text-white">
                <span className="text-white/70 text-sm">{games.length}半荘</span>
                <span className="ml-2 text-lg font-bold">
                  合計: {games.reduce((sum, g) => {
                    const myScore = g.scores.find(s => s.playerId === '1')
                    return sum + (myScore?.score || 0)
                  }, 0) > 0 ? '+' : ''}
                  {games.reduce((sum, g) => {
                    const myScore = g.scores.find(s => s.playerId === '1')
                    return sum + (myScore?.score || 0)
                  }, 0)}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving || games.length === 0}
            className="bg-white text-mahjong-table px-8 py-3 rounded-xl font-bold btn-pressable disabled:opacity-50 shadow-lg"
          >
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  )
}
