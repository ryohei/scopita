import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { calculateAllScores, DEFAULT_RULES, type Rules } from '../utils/scoreCalculator'

export interface SessionPlayer {
  id: string
  userId: string | null
  guestName: string | null
  playerIndex: number
  displayName: string
}

export interface GameResult {
  id: string
  playerId: string
  rank: number
  rawScore: number
  score: number
}

export interface Yakuman {
  id: string
  playerId: string
  type: string
}

export interface GameData {
  id: string
  gameNumber: number
  results: GameResult[]
  yakuman: Yakuman[]
}

export interface SessionDetail {
  id: string
  date: string
  groupId: string | null
  groupName: string | null
  createdBy: string
  players: SessionPlayer[]
  games: GameData[]
  rules: Rules
}

export function useSessionDetail(sessionId: string | undefined) {
  const { user } = useAuth()
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSession = useCallback(async () => {
    if (!sessionId || !user) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // セッション基本情報を取得
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select(`
          id,
          date,
          group_id,
          created_by,
          groups (name)
        `)
        .eq('id', sessionId)
        .single()

      if (sessionError) throw sessionError

      // ルールを取得（グループがある場合）
      let rules = DEFAULT_RULES
      if (sessionData.group_id) {
        const { data: rulesData } = await supabase
          .from('group_rules')
          .select('*')
          .eq('group_id', sessionData.group_id)
          .single()

        if (rulesData) {
          rules = {
            returnScore: rulesData.return_score,
            umaFirst: rulesData.uma_first,
            umaSecond: rulesData.uma_second,
            umaThird: rulesData.uma_third,
            umaFourth: rulesData.uma_fourth,
            hasOka: rulesData.has_oka,
            startScore: rulesData.start_score,
          }
        }
      }

      // プレイヤー情報を取得
      const { data: playersData, error: playersError } = await supabase
        .from('session_players')
        .select(`
          id,
          user_id,
          guest_name,
          player_index
        `)
        .eq('session_id', sessionId)
        .order('player_index')

      if (playersError) throw playersError

      // ユーザー名を取得するため、user_idがあるプレイヤーの情報を取得
      const userIds = playersData
        .filter(p => p.user_id)
        .map(p => p.user_id)

      let userNames: Record<string, string> = {}
      if (userIds.length > 0) {
        // usersテーブルから名前を取得
        const { data: usersData } = await supabase
          .from('users')
          .select('id, display_name')
          .in('id', userIds)

        if (usersData) {
          usersData.forEach(u => {
            userNames[u.id] = u.display_name
          })
        }
      }

      const players: SessionPlayer[] = playersData.map(p => ({
        id: p.id,
        userId: p.user_id,
        guestName: p.guest_name,
        playerIndex: p.player_index,
        displayName: p.user_id
          ? (userNames[p.user_id] || `プレイヤー${p.player_index + 1}`)
          : (p.guest_name || `プレイヤー${p.player_index + 1}`),
      }))

      // 半荘情報を取得
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select('id, game_number')
        .eq('session_id', sessionId)
        .order('game_number')

      if (gamesError) throw gamesError

      // 各半荘の結果と役満を取得
      const games: GameData[] = await Promise.all(
        (gamesData || []).map(async (game) => {
          const { data: resultsData } = await supabase
            .from('game_results')
            .select('id, player_id, rank, raw_score, score')
            .eq('game_id', game.id)

          const { data: yakumanData } = await supabase
            .from('yakuman')
            .select('id, player_id, type')
            .eq('game_id', game.id)

          return {
            id: game.id,
            gameNumber: game.game_number,
            results: (resultsData || []).map(r => ({
              id: r.id,
              playerId: r.player_id,
              rank: r.rank,
              rawScore: r.raw_score,
              score: r.score,
            })),
            yakuman: (yakumanData || []).map(y => ({
              id: y.id,
              playerId: y.player_id,
              type: y.type,
            })),
          }
        })
      )

      setSession({
        id: sessionData.id,
        date: sessionData.date,
        groupId: sessionData.group_id,
        groupName: (sessionData.groups as any)?.name || null,
        createdBy: sessionData.created_by,
        players,
        games,
        rules,
      })
    } catch (err: any) {
      console.error('Error fetching session:', err)
      setError(err.message || 'Failed to fetch session')
    } finally {
      setLoading(false)
    }
  }, [sessionId, user])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  // 半荘を追加
  // playerIds: グループ対局で参加するプレイヤーIDのリスト
  // playerNames: 単発対局で参加するプレイヤー名のリスト（新規プレイヤーは自動追加）
  const addGame = async (playerIds?: string[], playerNames?: string[]): Promise<{ error: Error | null }> => {
    if (!session) return { error: new Error('Session not found') }

    try {
      // データベースから最大のgame_numberを取得
      const { data: maxData } = await supabase
        .from('games')
        .select('game_number')
        .eq('session_id', session.id)
        .order('game_number', { ascending: false })
        .limit(1)
        .single()

      const newGameNumber = (maxData?.game_number || 0) + 1

      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert({
          session_id: session.id,
          game_number: newGameNumber,
        })
        .select()
        .single()

      if (gameError) throw gameError

      let targetPlayers: SessionPlayer[] = []
      let newPlayersAdded: SessionPlayer[] = []

      if (playerNames) {
        // 単発対局: 名前でプレイヤーを特定、新規は追加
        for (const name of playerNames) {
          const existingPlayer = session.players.find(p => p.displayName === name)
          if (existingPlayer) {
            targetPlayers.push(existingPlayer)
          } else {
            // 新しいプレイヤーをsession_playersに追加
            const { data: newPlayerData, error: newPlayerError } = await supabase
              .from('session_players')
              .insert({
                session_id: session.id,
                guest_name: name,
                player_index: session.players.length + newPlayersAdded.length,
              })
              .select()
              .single()

            if (newPlayerError) throw newPlayerError

            const newPlayer: SessionPlayer = {
              id: newPlayerData.id,
              userId: null,
              guestName: name,
              playerIndex: newPlayerData.player_index,
              displayName: name,
            }
            targetPlayers.push(newPlayer)
            newPlayersAdded.push(newPlayer)
          }
        }
      } else if (playerIds) {
        // グループ対局: IDでプレイヤーを特定
        targetPlayers = session.players.filter(p => playerIds.includes(p.id))
      } else {
        // デフォルト: 全プレイヤー
        targetPlayers = session.players
      }

      // 各プレイヤーの初期結果を作成
      const initialResults = targetPlayers.map(p => ({
        game_id: gameData.id,
        player_id: p.id,
        rank: 0,
        raw_score: 0,
        score: 0,
      }))

      const { data: resultsData, error: resultsError } = await supabase
        .from('game_results')
        .insert(initialResults)
        .select()

      if (resultsError) throw resultsError

      // ローカル状態を更新
      setSession(prev => {
        if (!prev) return prev
        return {
          ...prev,
          players: [...prev.players, ...newPlayersAdded],
          games: [
            ...prev.games,
            {
              id: gameData.id,
              gameNumber: newGameNumber,
              results: resultsData.map(r => ({
                id: r.id,
                playerId: r.player_id,
                rank: r.rank,
                rawScore: r.raw_score,
                score: r.score,
              })),
              yakuman: [],
            },
          ],
        }
      })

      return { error: null }
    } catch (err: any) {
      console.error('Error adding game:', err)
      return { error: err }
    }
  }

  // 半荘を削除
  const deleteGame = async (gameId: string): Promise<{ error: Error | null }> => {
    try {
      const { error: deleteError } = await supabase
        .from('games')
        .delete()
        .eq('id', gameId)

      if (deleteError) throw deleteError

      // ローカル状態を更新
      setSession(prev => {
        if (!prev) return prev
        return {
          ...prev,
          games: prev.games.filter(g => g.id !== gameId),
        }
      })

      return { error: null }
    } catch (err: any) {
      console.error('Error deleting game:', err)
      return { error: err }
    }
  }

  // スコアを更新
  const updateGameResult = async (
    gameId: string,
    playerId: string,
    rawScore: number
  ): Promise<{ error: Error | null }> => {
    if (!session) return { error: new Error('Session not found') }

    try {
      const game = session.games.find(g => g.id === gameId)
      if (!game) throw new Error('Game not found')

      // 更新後の結果を計算
      const updatedResults = game.results.map(r => {
        if (r.playerId === playerId) {
          return { ...r, rawScore }
        }
        return r
      })

      // 全員の素点が入力されているかチェック
      const allFilled = updatedResults.every(r => r.rawScore !== 0)

      if (allFilled) {
        // 順位を先に計算
        const sorted = [...updatedResults].sort((a, b) => b.rawScore - a.rawScore)
        updatedResults.forEach(r => {
          const rank = sorted.findIndex(s => s.playerId === r.playerId) + 1
          r.rank = rank
        })

        // 全員分のスコアを一括計算（合計が0になるように1位を調整）
        const results = updatedResults.map(r => ({
          rawScore: r.rawScore,
          rank: r.rank
        }))
        const calculatedScores = calculateAllScores(results, session.rules)
        updatedResults.forEach((r, i) => {
          r.score = calculatedScores[i]
        })
      }

      // DBを更新
      for (const result of updatedResults) {
        const { error: updateError } = await supabase
          .from('game_results')
          .update({
            raw_score: result.rawScore,
            rank: result.rank,
            score: result.score,
          })
          .eq('id', result.id)

        if (updateError) throw updateError
      }

      // ローカル状態を更新
      setSession(prev => {
        if (!prev) return prev
        return {
          ...prev,
          games: prev.games.map(g => {
            if (g.id === gameId) {
              return { ...g, results: updatedResults }
            }
            return g
          }),
        }
      })

      return { error: null }
    } catch (err: any) {
      console.error('Error updating game result:', err)
      return { error: err }
    }
  }

  // 役満を追加
  const addYakuman = async (
    gameId: string,
    playerId: string,
    type: string
  ): Promise<{ error: Error | null }> => {
    try {
      const { data: yakumanData, error: yakumanError } = await supabase
        .from('yakuman')
        .insert({
          game_id: gameId,
          player_id: playerId,
          type,
        })
        .select()
        .single()

      if (yakumanError) throw yakumanError

      // ローカル状態を更新
      setSession(prev => {
        if (!prev) return prev
        return {
          ...prev,
          games: prev.games.map(g => {
            if (g.id === gameId) {
              return {
                ...g,
                yakuman: [
                  ...g.yakuman,
                  {
                    id: yakumanData.id,
                    playerId: yakumanData.player_id,
                    type: yakumanData.type,
                  },
                ],
              }
            }
            return g
          }),
        }
      })

      return { error: null }
    } catch (err: any) {
      console.error('Error adding yakuman:', err)
      return { error: err }
    }
  }

  // 役満を削除
  const removeYakuman = async (
    gameId: string,
    yakumanId: string
  ): Promise<{ error: Error | null }> => {
    try {
      const { error: deleteError } = await supabase
        .from('yakuman')
        .delete()
        .eq('id', yakumanId)

      if (deleteError) throw deleteError

      // ローカル状態を更新
      setSession(prev => {
        if (!prev) return prev
        return {
          ...prev,
          games: prev.games.map(g => {
            if (g.id === gameId) {
              return {
                ...g,
                yakuman: g.yakuman.filter(y => y.id !== yakumanId),
              }
            }
            return g
          }),
        }
      })

      return { error: null }
    } catch (err: any) {
      console.error('Error removing yakuman:', err)
      return { error: err }
    }
  }

  // プレイヤー名を更新（ゲストのみ）
  const updatePlayerName = async (
    playerId: string,
    name: string
  ): Promise<{ error: Error | null }> => {
    if (!session) return { error: new Error('Session not found') }

    const player = session.players.find(p => p.id === playerId)
    if (!player) return { error: new Error('Player not found') }
    if (player.userId) return { error: new Error('Cannot update registered user name') }

    try {
      const { error: updateError } = await supabase
        .from('session_players')
        .update({ guest_name: name })
        .eq('id', playerId)

      if (updateError) throw updateError

      // ローカル状態を更新
      setSession(prev => {
        if (!prev) return prev
        return {
          ...prev,
          players: prev.players.map(p => {
            if (p.id === playerId) {
              return { ...p, guestName: name, displayName: name }
            }
            return p
          }),
        }
      })

      return { error: null }
    } catch (err: any) {
      console.error('Error updating player name:', err)
      return { error: err }
    }
  }

  // トータルスコアを計算
  const getTotalScore = (playerId: string): number => {
    if (!session) return 0
    return session.games.reduce((sum, game) => {
      const result = game.results.find(r => r.playerId === playerId)
      return sum + (result?.score || 0)
    }, 0)
  }

  // セッションを削除
  const deleteSession = async (): Promise<{ error: Error | null }> => {
    if (!session) return { error: new Error('Session not found') }

    try {
      const { error: deleteError } = await supabase
        .from('game_sessions')
        .delete()
        .eq('id', session.id)

      if (deleteError) throw deleteError

      return { error: null }
    } catch (err: any) {
      console.error('Error deleting session:', err)
      return { error: err }
    }
  }

  return {
    session,
    loading,
    error,
    refetch: fetchSession,
    addGame,
    deleteGame,
    updateGameResult,
    addYakuman,
    removeYakuman,
    updatePlayerName,
    getTotalScore,
    deleteSession,
  }
}
