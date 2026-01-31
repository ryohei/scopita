import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

interface GameSession {
  id: string
  date: string
  group_id: string | null
  created_at: string
  group_name: string | null
  total_score: number
  game_count: number
}

interface UseGameSessionsOptions {
  limit?: number // デフォルト10、undefinedで全件
}

export function useGameSessions(options: UseGameSessionsOptions = {}) {
  const { limit = 10 } = options
  const { user } = useAuth()
  const [sessions, setSessions] = useState<GameSession[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSessions = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      // 自分が作成したセッションを取得
      let query = supabase
        .from('game_sessions')
        .select(`
          id,
          date,
          group_id,
          created_at,
          groups (name)
        `)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })

      if (limit) {
        query = query.limit(limit)
      }

      const { data: sessionData, error } = await query

      if (error) {
        console.error('Error fetching sessions:', error)
        setLoading(false)
        return
      }

      console.log('Fetched sessions:', sessionData)

      // 各セッションの集計を取得
      const sessionsWithStats = await Promise.all(
        (sessionData || []).map(async (session) => {
          // セッション内の自分のプレイヤーIDを取得（user_idで検索）
          const { data: playerData, error: playerError } = await supabase
            .from('session_players')
            .select('id')
            .eq('session_id', session.id)
            .eq('user_id', user.id)
            .maybeSingle()

          console.log('Player data for session', session.id, ':', playerData, playerError)

          let totalScore = 0
          let gameCount = 0

          if (playerData) {
            // 結果を集計
            const { data: results, error: resultsError } = await supabase
              .from('game_results')
              .select('score, game_id')
              .eq('player_id', playerData.id)

            console.log('Results for player', playerData.id, ':', results, resultsError)

            if (results) {
              totalScore = results.reduce((sum, r) => sum + r.score, 0)
              gameCount = results.length
            }
          }

          return {
            id: session.id,
            date: session.date,
            group_id: session.group_id,
            created_at: session.created_at,
            group_name: (session.groups as any)?.name || null,
            total_score: totalScore,
            game_count: gameCount,
          }
        })
      )

      console.log('Sessions with stats:', sessionsWithStats)
      setSessions(sessionsWithStats)
    } catch (err) {
      console.error('Error in fetchSessions:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [user])

  const deleteSession = async (sessionId: string) => {
    const { error } = await supabase
      .from('game_sessions')
      .delete()
      .eq('id', sessionId)

    if (error) {
      console.error('Error deleting session:', error)
      return { error }
    }

    // ローカルの状態を更新
    setSessions(prev => prev.filter(s => s.id !== sessionId))
    return { error: null }
  }

  return {
    sessions,
    loading,
    refetch: fetchSessions,
    deleteSession,
  }
}
