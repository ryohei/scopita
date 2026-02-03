import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Trophy, Users, Calendar, UserCircle, ChevronDown, Settings } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useGroups } from '../hooks/useGroups'
import { supabase } from '../lib/supabase'
import { SectionCard } from '../components/SectionCard'
import { TabSwitch } from '../components/TabSwitch'
import { YAKUMAN_TYPES } from '../constants/mahjong'
import { calculateAllScores, DEFAULT_RULES, type Rules } from '../utils/scoreCalculator'

interface Player {
  id: string
  name: string
  isGuest: boolean
  userId?: string
  memberId?: string // group_members.id（グループモード時）
}

interface GroupMember {
  id: string
  user_id: string | null
  guest_name: string | null
  displayName: string
  isGuest: boolean
}

interface GameScore {
  playerId: string
  rawScore: string
  rank: number
  score: number
}

interface Game {
  id: string
  selectedPlayers: Player[] // この半荘でプレイする4人
  scores: GameScore[]
  yakuman: { playerId: string; type: string }[]
}

export function RecordPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { groups } = useGroups()

  const [mode, setMode] = useState<'group' | 'free'>('free')
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])

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
  const [showRules, setShowRules] = useState(false)
  const [showPlayerSelect, setShowPlayerSelect] = useState(false)
  const [tempSelectedPlayers, setTempSelectedPlayers] = useState<string[]>([]) // 選択中のmemberIdまたはplayerId
  const [showFreePlayerEdit, setShowFreePlayerEdit] = useState(false)
  const [tempFreePlayerNames, setTempFreePlayerNames] = useState<string[]>(['', '', '', '']) // 単発モード用の名前入力

  // ルール設定（デフォルト）
  const [rules, setRules] = useState<Rules>(DEFAULT_RULES)

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

  // グループ選択時にルールとメンバーを読み込み
  useEffect(() => {
    if (selectedGroupId && user) {
      const loadGroupData = async () => {
        // ルールを読み込み
        const { data: rulesData } = await supabase
          .from('group_rules')
          .select('*')
          .eq('group_id', selectedGroupId)
          .single()

        if (rulesData) {
          setRules({
            returnScore: rulesData.return_score,
            umaFirst: rulesData.uma_first,
            umaSecond: rulesData.uma_second,
            umaThird: rulesData.uma_third,
            umaFourth: rulesData.uma_fourth,
            hasOka: rulesData.has_oka,
            startScore: rulesData.start_score,
          })
        }

        // メンバーを読み込み
        const { data: membersData } = await supabase
          .from('group_members')
          .select('id, user_id, guest_name')
          .eq('group_id', selectedGroupId)

        if (membersData) {
          // ユーザー情報を取得
          const userIds = membersData.filter(m => m.user_id).map(m => m.user_id)
          let userMap: Record<string, string> = {}

          if (userIds.length > 0) {
            const { data: usersData } = await supabase
              .from('users')
              .select('id, display_name')
              .in('id', userIds)

            if (usersData) {
              usersData.forEach(u => {
                userMap[u.id] = u.display_name
              })
            }
          }

          const members: GroupMember[] = membersData.map(m => ({
            id: m.id,
            user_id: m.user_id,
            guest_name: m.guest_name,
            displayName: m.user_id
              ? (userMap[m.user_id] || 'Unknown')
              : (m.guest_name || 'ゲスト'),
            isGuest: !m.user_id,
          }))

          setGroupMembers(members)

          // 自分を先頭に、残り3人を自動選択
          const myMember = members.find(m => m.user_id === user.id)
          const otherMembers = members.filter(m => m.user_id !== user.id)

          const newPlayers: Player[] = [
            {
              id: '1',
              name: myMember?.displayName || myName,
              isGuest: false,
              userId: user.id,
              memberId: myMember?.id,
            },
            ...otherMembers.slice(0, 3).map((m, i) => ({
              id: String(i + 2),
              name: m.displayName,
              isGuest: m.isGuest,
              userId: m.user_id || undefined,
              memberId: m.id,
            })),
          ]

          // 4人未満の場合は空のプレイヤーを追加
          while (newPlayers.length < 4) {
            newPlayers.push({
              id: String(newPlayers.length + 1),
              name: '',
              isGuest: true,
            })
          }

          setPlayers(newPlayers)
        }
      }
      loadGroupData()
    } else if (!selectedGroupId) {
      // グループ選択解除時はリセット
      setGroupMembers([])
      setPlayers([
        { id: '1', name: myName, isGuest: false, userId: user?.id },
        { id: '2', name: '', isGuest: true },
        { id: '3', name: '', isGuest: true },
        { id: '4', name: '', isGuest: true },
      ])
      setRules(DEFAULT_RULES)
    }
  }, [selectedGroupId, user, myName])

  const addGame = (selectedPlayers?: Player[]) => {
    // 選択されたプレイヤー、または現在のプレイヤーを使用
    const gamePlayers = selectedPlayers || players
    const newGame: Game = {
      id: Date.now().toString(),
      selectedPlayers: [...gamePlayers],
      scores: gamePlayers.map((p) => ({
        playerId: p.id,
        rawScore: '',
        rank: 0,
        score: 0,
      })),
      yakuman: [],
    }
    setGames(prevGames => [...prevGames, newGame])
  }

  const updateRawScore = (gameId: string, playerId: string, rawScore: string) => {
    setGames(prevGames => prevGames.map(game => {
      if (game.id !== gameId) return game

      const newScores = game.scores.map(s =>
        s.playerId === playerId ? { ...s, rawScore } : s
      )

      // 全員のスコアが入力されたら順位と計算後スコアを算出
      const allFilled = newScores.every(s => s.rawScore !== '')
      if (allFilled) {
        // 順位を先に計算
        const sorted = [...newScores].sort((a, b) =>
          parseInt(b.rawScore) - parseInt(a.rawScore)
        )
        newScores.forEach(s => {
          const rank = sorted.findIndex(ss => ss.playerId === s.playerId) + 1
          s.rank = rank
        })

        // 全員分のスコアを一括計算（合計が0になるように1位を調整）
        const results = newScores.map(s => ({
          rawScore: parseInt(s.rawScore),
          rank: s.rank!
        }))
        const calculatedScores = calculateAllScores(results, rules)
        newScores.forEach((s, i) => {
          s.score = calculatedScores[i]
        })
      }

      return { ...game, scores: newScores }
    }))
  }

  const removeGame = (gameId: string) => {
    setGames(prevGames => prevGames.filter(g => g.id !== gameId))
  }

  const addYakuman = (gameId: string, playerId: string, type: string) => {
    setGames(prevGames => prevGames.map(game => {
      if (game.id !== gameId) return game
      return {
        ...game,
        yakuman: [...game.yakuman, { playerId, type }]
      }
    }))
  }

  const removeYakuman = (gameId: string, index: number) => {
    setGames(prevGames => prevGames.map(game => {
      if (game.id !== gameId) return game
      return {
        ...game,
        yakuman: game.yakuman.filter((_, i) => i !== index)
      }
    }))
  }

  const getTotalScore = (playerId: string, memberIdOrName?: string): number => {
    return games.reduce((sum, game) => {
      const gamePlayers = game.selectedPlayers || players
      // グループ: memberIdで検索、単発: 名前で検索
      const player = memberIdOrName
        ? gamePlayers.find(p => p.memberId === memberIdOrName || p.name === memberIdOrName)
        : gamePlayers.find(p => p.id === playerId)
      if (!player) return sum
      const score = game.scores.find(s => s.playerId === player.id)
      return sum + (score?.score || 0)
    }, 0)
  }

  // 全半荘に参加したユニークなプレイヤーを取得
  const getAllParticipants = (): Player[] => {
    const participantMap = new Map<string, Player>()

    games.forEach(game => {
      const gamePlayers = game.selectedPlayers || players
      gamePlayers.forEach(p => {
        // グループモード: memberIdをキー
        // 単発モード: 名前をキー（同じ名前は同一人物）
        const key = p.memberId || p.name
        if (!participantMap.has(key)) {
          participantMap.set(key, p)
        }
      })
    })

    // ゲームがない場合は現在のplayers
    if (participantMap.size === 0) {
      return players
    }

    return Array.from(participantMap.values())
  }

  const handleSave = async () => {
    if (!user) return
    // 全半荘の参加プレイヤーの名前をチェック
    const allParticipants = getAllParticipants()
    if (allParticipants.some(p => !p.name.trim())) {
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

      // 全参加プレイヤーを登録
      const { data: sessionPlayers, error: playersError } = await supabase
        .from('session_players')
        .insert(
          allParticipants.map((p, index) => ({
            session_id: session.id,
            user_id: p.userId || null,
            guest_name: p.isGuest ? p.name : null,
            player_index: index,
          }))
        )
        .select()

      if (playersError) throw playersError

      // プレイヤーIDマッピング（グループ: memberId、単発: 名前をキーに）
      const playerIdMap = new Map<string, string>()
      allParticipants.forEach((p, index) => {
        const key = p.memberId || p.name
        playerIdMap.set(key, sessionPlayers[index].id)
      })

      // 各半荘を保存
      for (let i = 0; i < games.length; i++) {
        const game = games[i]
        const gamePlayers = game.selectedPlayers || players

        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .insert({
            session_id: session.id,
            game_number: i + 1,
          })
          .select()
          .single()

        if (gameError) throw gameError

        // 結果を保存（この半荘の4人のみ）
        const { error: resultsError } = await supabase
          .from('game_results')
          .insert(
            game.scores.map(s => {
              const gamePlayer = gamePlayers.find(p => p.id === s.playerId)
              // グループ: memberId、単発: 名前をキーに
              const key = gamePlayer?.memberId || gamePlayer?.name || ''
              return {
                game_id: gameData.id,
                player_id: playerIdMap.get(key),
                rank: s.rank,
                raw_score: parseInt(s.rawScore),
                score: s.score,
              }
            })
          )

        if (resultsError) throw resultsError

        // 役満を保存
        if (game.yakuman.length > 0) {
          const { error: yakumanError } = await supabase
            .from('yakuman')
            .insert(
              game.yakuman.map(y => {
                const gamePlayer = gamePlayers.find(p => p.id === y.playerId)
                // グループ: memberId、単発: 名前をキーに
                const key = gamePlayer?.memberId || gamePlayer?.name || ''
                return {
                  game_id: gameData.id,
                  player_id: playerIdMap.get(key),
                  type: y.type,
                }
              })
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
      <header className="bg-primary rounded-b-3xl shadow-lg">
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
            <p className="text-sm font-medium text-text-secondary mb-2">対局モード</p>
            <TabSwitch options={modeOptions} value={mode} onChange={setMode} />
          </div>

          {mode === 'group' && (
            <div className="mb-4">
              <p className="text-sm font-medium text-text-secondary mb-2">グループ選択</p>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-cream-dark border-2 border-transparent focus:border-primary focus:bg-white transition-colors font-medium"
              >
                <option value="">グループを選択してください</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm font-medium text-text-secondary mb-2 flex items-center gap-1.5">
              <Calendar size={14} />
              日付
            </p>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-cream-dark border-2 border-transparent focus:border-primary focus:bg-white transition-colors font-medium"
            />
          </div>

          {/* ルール設定 */}
          <div>
            <button
              onClick={() => setShowRules(!showRules)}
              className="w-full flex items-center justify-between text-sm font-medium text-text-secondary mb-2"
            >
              <span className="flex items-center gap-1.5">
                <Settings size={14} />
                ルール設定
              </span>
              <ChevronDown size={16} className={`transition-transform ${showRules ? 'rotate-180' : ''}`} />
            </button>

            {/* ルールプレビュー（閉じている時） */}
            {!showRules && (
              <div className="flex flex-wrap gap-1.5">
                <span className="bg-cream-dark text-text-secondary px-2 py-1 rounded-lg text-xs">
                  {rules.startScore.toLocaleString()}点持ち
                </span>
                <span className="bg-cream-dark text-text-secondary px-2 py-1 rounded-lg text-xs">
                  {rules.returnScore.toLocaleString()}点返し
                </span>
                <span className="bg-cream-dark text-text-secondary px-2 py-1 rounded-lg text-xs">
                  ウマ {Math.abs(rules.umaSecond)}-{rules.umaFirst}
                </span>
                {rules.hasOka && (
                  <span className="bg-cream-dark text-text-secondary px-2 py-1 rounded-lg text-xs">
                    オカあり
                  </span>
                )}
              </div>
            )}

            {/* ルール編集（開いている時） */}
            {showRules && (
              <div className="space-y-3 bg-cream-dark rounded-xl p-3">
                {/* 持ち点・返し点 */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-gray-500">持ち点</span>
                    <input
                      type="number"
                      value={rules.startScore}
                      onChange={(e) => setRules(prev => ({ ...prev, startScore: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 rounded-lg bg-white border-2 border-transparent focus:border-primary transition-colors text-sm"
                      disabled={mode === 'group' && !!selectedGroupId}
                    />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">返し点</span>
                    <input
                      type="number"
                      value={rules.returnScore}
                      onChange={(e) => setRules(prev => ({ ...prev, returnScore: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 rounded-lg bg-white border-2 border-transparent focus:border-primary transition-colors text-sm"
                      disabled={mode === 'group' && !!selectedGroupId}
                    />
                  </div>
                </div>

                {/* ウマ */}
                <div>
                  <span className="text-xs text-gray-500">ウマ</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    <div>
                      <span className="text-xs text-gray-400">1着</span>
                      <input
                        type="number"
                        value={rules.umaFirst}
                        onChange={(e) => setRules(prev => ({ ...prev, umaFirst: parseInt(e.target.value) || 0 }))}
                        className="w-full px-2 py-1.5 rounded-lg bg-white border-2 border-transparent focus:border-primary transition-colors text-sm text-center"
                        disabled={mode === 'group' && !!selectedGroupId}
                      />
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">2着</span>
                      <input
                        type="number"
                        value={rules.umaSecond}
                        onChange={(e) => setRules(prev => ({ ...prev, umaSecond: parseInt(e.target.value) || 0 }))}
                        className="w-full px-2 py-1.5 rounded-lg bg-white border-2 border-transparent focus:border-primary transition-colors text-sm text-center"
                        disabled={mode === 'group' && !!selectedGroupId}
                      />
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">3着</span>
                      <input
                        type="number"
                        value={rules.umaThird}
                        onChange={(e) => setRules(prev => ({ ...prev, umaThird: parseInt(e.target.value) || 0 }))}
                        className="w-full px-2 py-1.5 rounded-lg bg-white border-2 border-transparent focus:border-primary transition-colors text-sm text-center"
                        disabled={mode === 'group' && !!selectedGroupId}
                      />
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">4着</span>
                      <input
                        type="number"
                        value={rules.umaFourth}
                        onChange={(e) => setRules(prev => ({ ...prev, umaFourth: parseInt(e.target.value) || 0 }))}
                        className="w-full px-2 py-1.5 rounded-lg bg-white border-2 border-transparent focus:border-primary transition-colors text-sm text-center"
                        disabled={mode === 'group' && !!selectedGroupId}
                      />
                    </div>
                  </div>
                </div>

                {/* オカ */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">オカあり</span>
                  <button
                    onClick={() => {
                      if (mode === 'group' && selectedGroupId) return
                      setRules(prev => ({ ...prev, hasOka: !prev.hasOka }))
                    }}
                    disabled={mode === 'group' && !!selectedGroupId}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      rules.hasOka ? 'bg-primary' : 'bg-gray-300'
                    } ${mode === 'group' && selectedGroupId ? 'opacity-50' : ''}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      rules.hasOka ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                {mode === 'group' && selectedGroupId && (
                  <p className="text-xs text-gray-400 text-center">
                    グループのルールが適用されています
                  </p>
                )}
              </div>
            )}
          </div>
        </SectionCard>

        {/* プレイヤー入力（グループモードのみ表示） */}
        {mode === 'group' && (
        <SectionCard title="参加者" icon={<Users size={16} />} className="mb-4">
          <div className="space-y-2">
            {players.map((player, index) => (
              <div key={player.id} className="flex items-center gap-3">
                <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                  index === 0 ? 'bg-primary text-white' : 'bg-cream-dark text-text-secondary'
                }`}>
                  {index + 1}
                </span>
                {mode === 'group' && selectedGroupId && groupMembers.length > 0 ? (
                  // グループモード: プルダウンで選択
                  index === 0 ? (
                    // 自分は固定表示
                    <span className="flex-1 px-4 py-2.5 rounded-xl bg-cream-dark text-text-primary font-medium">
                      {player.name}
                    </span>
                  ) : (
                    // 他のプレイヤーはプルダウン
                    <div className="flex-1 relative">
                      <select
                        value={player.memberId || ''}
                        onChange={(e) => {
                          const memberId = e.target.value
                          const member = groupMembers.find(m => m.id === memberId)
                          const newPlayers = [...players]
                          if (member) {
                            newPlayers[index] = {
                              id: player.id,
                              name: member.displayName,
                              isGuest: member.isGuest,
                              userId: member.user_id || undefined,
                              memberId: member.id,
                            }
                          } else {
                            newPlayers[index] = {
                              id: player.id,
                              name: '',
                              isGuest: true,
                              memberId: undefined,
                            }
                          }
                          setPlayers(newPlayers)
                        }}
                        className="w-full px-4 py-2.5 rounded-xl bg-cream-dark border-2 border-transparent focus:border-primary focus:bg-white transition-colors appearance-none cursor-pointer font-medium"
                      >
                        <option value="">選択してください</option>
                        {groupMembers
                          .filter(m => {
                            // 自分以外で、他のプレイヤー枠で選択されていないメンバー
                            const isMe = m.user_id === user?.id
                            const isSelectedByOthers = players.some(
                              (p, i) => i !== index && p.memberId === m.id
                            )
                            return !isMe && !isSelectedByOthers
                          })
                          .map(m => (
                            <option key={m.id} value={m.id}>
                              {m.displayName}{m.isGuest ? ' (ゲスト)' : ''}
                            </option>
                          ))}
                        {/* 現在選択中のメンバーも表示 */}
                        {player.memberId && (
                          <option value={player.memberId} hidden>
                            {player.name}
                          </option>
                        )}
                      </select>
                      <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  )
                ) : (
                  // グループ未選択時: テキスト入力
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => {
                      const newPlayers = [...players]
                      newPlayers[index].name = e.target.value
                      setPlayers(newPlayers)
                    }}
                    placeholder={`プレイヤー${index + 1}`}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-cream-dark border-2 border-transparent focus:border-primary focus:bg-white transition-colors"
                    disabled={index === 0}
                  />
                )}
              </div>
            ))}
          </div>
        </SectionCard>
        )}

        {/* 半荘入力 */}
        {games.map((game, gameIndex) => (
          <div key={game.id} className="bg-white rounded-2xl shadow-soft p-4 mb-4 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="bg-primary text-white text-sm font-bold px-3 py-1 rounded-lg">
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
              {(game.selectedPlayers || players).map((player, playerIndex) => {
                const scoreData = game.scores.find(s => s.playerId === player.id)
                return (
                  <div key={player.id} className="flex items-center gap-2">
                    <span className="w-20 text-sm font-medium text-text-primary truncate">
                      {player.name || `P${playerIndex + 1}`}
                    </span>
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        value={scoreData?.rawScore || ''}
                        onChange={(e) => updateRawScore(game.id, player.id, e.target.value)}
                        placeholder="素点"
                        className="w-full px-4 py-2.5 rounded-xl bg-cream-dark border-2 border-transparent focus:border-primary focus:bg-white transition-colors text-right font-medium"
                      />
                    </div>
                    <div className="w-16 text-right">
                      {scoreData?.rank ? (
                        <span className={`font-bold text-lg ${
                          scoreData.score >= 0 ? 'text-success' : 'text-error'
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
                <span className="text-sm font-bold text-text-primary">役満が出た？</span>
              </div>
              {game.yakuman.map((y, index) => (
                <div key={index} className="flex items-center gap-2 mb-2 bg-yellow-50 p-2 rounded-lg">
                  <Trophy size={14} className="text-yellow-500" />
                  <span className="text-sm font-medium flex-1">
                    {(game.selectedPlayers || players).find(p => p.id === y.playerId)?.name}: {y.type}
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
                  {(game.selectedPlayers || players).map((p, i) => (
                    <option key={p.id} value={p.id}>{p.name || `P${i + 1}`}</option>
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
          onClick={() => {
            if (mode === 'group') {
              // グループモードで5人以上いる場合はプレイヤー選択モーダルを表示
              if (groupMembers.length > 4) {
                const lastGame = games[games.length - 1]
                if (lastGame) {
                  setTempSelectedPlayers(lastGame.selectedPlayers.map(p => p.memberId || p.id))
                } else {
                  setTempSelectedPlayers(players.filter(p => p.memberId).map(p => p.memberId!))
                }
                setShowPlayerSelect(true)
              } else {
                addGame()
              }
            } else {
              // 単発モード: 名前編集モーダルを表示
              const lastGame = games[games.length - 1]
              if (lastGame) {
                setTempFreePlayerNames(lastGame.selectedPlayers.map(p => p.name))
              } else {
                setTempFreePlayerNames(players.map(p => p.name))
              }
              setShowFreePlayerEdit(true)
            }
          }}
          className="w-full border-2 border-dashed border-primary/30 text-primary-dark py-4 rounded-2xl font-bold hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 mb-4"
        >
          <Plus size={22} />
          半荘を追加
        </button>

        {/* 集計 */}
        {games.length > 0 && (
          <SectionCard title="本日の集計" icon={<Trophy size={16} />} className="mb-4">
            <div className="space-y-2">
              {getAllParticipants()
                .map(p => ({ ...p, total: getTotalScore(p.id, p.memberId || p.name) }))
                .sort((a, b) => b.total - a.total)
                .map((player, index) => (
                  <div key={player.memberId || player.id} className="flex items-center justify-between p-3 rounded-xl bg-cream-dark">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                        index === 0 ? 'bg-yellow-400 text-white' :
                        index === 1 ? 'bg-gray-300 text-text-primary' :
                        index === 2 ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="font-bold text-text-primary">{player.name}</span>
                    </div>
                    <span className={`font-bold text-xl ${
                      player.total >= 0 ? 'text-success' : 'text-error'
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
      <div className="fixed bottom-0 left-0 right-0 bg-primary shadow-lg safe-area-bottom">
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
            className="bg-white text-primary-dark px-8 py-3 rounded-xl font-bold btn-pressable disabled:opacity-50 shadow-lg"
          >
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>

      {/* プレイヤー選択モーダル（5人以上の場合） */}
      {showPlayerSelect && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-text-primary">この半荘のプレイヤー</h2>
              <button
                onClick={() => setShowPlayerSelect(false)}
                className="p-2 text-text-secondary/70 hover:text-text-secondary rounded-lg hover:bg-cream-dark transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              <p className="text-sm text-text-secondary mb-3">4人を選択してください</p>
              <div className="space-y-2">
                {groupMembers.map(member => {
                  const isSelected = tempSelectedPlayers.includes(member.id)
                  return (
                    <button
                      key={member.id}
                      onClick={() => {
                        if (isSelected) {
                          setTempSelectedPlayers(prev => prev.filter(id => id !== member.id))
                        } else if (tempSelectedPlayers.length < 4) {
                          setTempSelectedPlayers(prev => [...prev, member.id])
                        }
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                        isSelected
                          ? 'bg-primary/20 border-2 border-primary'
                          : 'bg-cream-dark border-2 border-transparent hover:border-primary/30'
                      } ${tempSelectedPlayers.length >= 4 && !isSelected ? 'opacity-50' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        isSelected ? 'bg-primary text-white' : 'bg-gray-300 text-text-secondary'
                      }`}>
                        {member.displayName.charAt(0)}
                      </div>
                      <span className="font-medium text-text-primary">{member.displayName}</span>
                      {member.isGuest && (
                        <span className="text-xs bg-gray-200 text-text-secondary px-1.5 py-0.5 rounded">ゲスト</span>
                      )}
                      {isSelected && (
                        <span className="ml-auto text-primary font-bold">✓</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="p-4 border-t sticky bottom-0 bg-white">
              <button
                onClick={() => {
                  if (tempSelectedPlayers.length !== 4) {
                    alert('4人を選択してください')
                    return
                  }
                  // 選択されたメンバーからPlayerを作成
                  const selectedPlayersData: Player[] = tempSelectedPlayers.map((memberId, index) => {
                    const member = groupMembers.find(m => m.id === memberId)!
                    return {
                      id: String(index + 1),
                      name: member.displayName,
                      isGuest: member.isGuest,
                      userId: member.user_id || undefined,
                      memberId: member.id,
                    }
                  })
                  addGame(selectedPlayersData)
                  setShowPlayerSelect(false)
                }}
                disabled={tempSelectedPlayers.length !== 4}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                半荘を追加（{tempSelectedPlayers.length}/4人選択中）
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 単発モード用プレイヤー名編集モーダル */}
      {showFreePlayerEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold text-text-primary">この半荘のプレイヤー</h2>
              <button
                onClick={() => setShowFreePlayerEdit(false)}
                className="p-2 text-text-secondary/70 hover:text-text-secondary rounded-lg hover:bg-cream-dark transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3">
              {tempFreePlayerNames.map((name, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary-dark font-bold">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      const newNames = [...tempFreePlayerNames]
                      newNames[index] = e.target.value
                      setTempFreePlayerNames(newNames)
                    }}
                    placeholder={`プレイヤー${index + 1}`}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-cream-dark border-2 border-transparent focus:border-primary focus:bg-white transition-colors"
                  />
                </div>
              ))}
            </div>

            <div className="p-4 border-t">
              <button
                onClick={() => {
                  if (tempFreePlayerNames.some(n => !n.trim())) {
                    alert('全員の名前を入力してください')
                    return
                  }
                  // 入力された名前からPlayerを作成（ユニークなIDを生成）
                  const timestamp = Date.now()
                  const selectedPlayersData: Player[] = tempFreePlayerNames.map((name, index) => ({
                    id: `${timestamp}-${index}`,
                    name: name.trim(),
                    isGuest: index !== 0 || !user, // プレイヤー1は自分（ログインユーザー）
                    userId: index === 0 ? user?.id : undefined,
                  }))
                  addGame(selectedPlayersData)
                  setShowFreePlayerEdit(false)
                }}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
              >
                半荘を追加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
