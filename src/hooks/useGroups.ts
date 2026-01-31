import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

interface Group {
  id: string
  name: string
  invite_code: string
  created_by: string
  created_at: string
}

interface GroupMember {
  id: string
  group_id: string
  user_id: string | null
  guest_name: string | null
  role: 'admin' | 'member'
  joined_at: string
  users: {
    display_name: string
    avatar_url: string | null
  } | null
  // 表示用
  displayName: string
  isGuest: boolean
}

interface GroupRule {
  id: string
  group_id: string
  game_type: '東風' | '東南'
  start_score: number
  return_score: number
  uma_first: number
  uma_second: number
  uma_third: number
  uma_fourth: number
  has_oka: boolean
}

interface GroupSession {
  id: string
  date: string
  game_count: number
  created_at: string
}

interface MemberRanking {
  memberId: string
  displayName: string
  isGuest: boolean
  totalScore: number
  gameCount: number
  rankCounts: {
    first: number
    second: number
    third: number
    fourth: number
  }
}

interface GroupWithDetails extends Group {
  member_count: number
  my_role: 'admin' | 'member'
}

export function useGroups() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<GroupWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const fetchGroups = async () => {
    if (!user) return

    setLoading(true)

    // 自分が参加しているグループを取得
    const { data: memberData, error: memberError } = await supabase
      .from('group_members')
      .select(`
        role,
        groups (
          id,
          name,
          invite_code,
          created_by,
          created_at
        )
      `)
      .eq('user_id', user.id)

    if (memberError) {
      console.error('Error fetching groups:', memberError)
      setLoading(false)
      return
    }

    // 各グループのメンバー数を取得
    const groupsWithDetails: GroupWithDetails[] = await Promise.all(
      (memberData || []).map(async (m) => {
        const group = m.groups as unknown as Group
        const { count } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id)

        return {
          ...group,
          member_count: count || 0,
          my_role: m.role as 'admin' | 'member',
        }
      })
    )

    setGroups(groupsWithDetails)
    setLoading(false)
  }

  useEffect(() => {
    fetchGroups()
  }, [user])

  const createGroup = async (name: string) => {
    if (!user) return { error: new Error('Not authenticated') }

    // ランダムな招待コードを生成
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    const { data, error } = await supabase
      .from('groups')
      .insert({
        name,
        invite_code: inviteCode,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Create group error:', error)
    } else {
      await fetchGroups()
    }

    return { data, error }
  }

  const joinGroup = async (inviteCode: string) => {
    if (!user) return { error: new Error('Not authenticated') }

    // 招待コードでグループを検索
    const { data: group, error: findError } = await supabase
      .from('groups')
      .select('id')
      .eq('invite_code', inviteCode.toUpperCase())
      .single()

    if (findError || !group) {
      return { error: new Error('招待コードが見つかりません') }
    }

    // 既に参加しているかチェック
    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      return { error: new Error('既にこのグループに参加しています') }
    }

    // グループに参加
    const { error: joinError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: 'member',
      })

    if (!joinError) {
      await fetchGroups()
    }

    return { error: joinError }
  }

  return {
    groups,
    loading,
    createGroup,
    joinGroup,
    refetch: fetchGroups,
  }
}

export function useGroupDetail(groupId: string) {
  const { user } = useAuth()
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [rules, setRules] = useState<GroupRule | null>(null)
  const [sessions, setSessions] = useState<GroupSession[]>([])
  const [rankings, setRankings] = useState<MemberRanking[]>([])
  const [loading, setLoading] = useState(true)

  const fetchGroupDetail = async () => {
    if (!groupId) return

    setLoading(true)

    // グループ情報
    const { data: groupData } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single()

    setGroup(groupData)

    // メンバー一覧
    const { data: membersData } = await supabase
      .from('group_members')
      .select(`
        id,
        group_id,
        user_id,
        guest_name,
        role,
        joined_at
      `)
      .eq('group_id', groupId)

    // ユーザー情報を取得（user_idがあるメンバーのみ）
    const userIds = (membersData || [])
      .filter(m => m.user_id)
      .map(m => m.user_id)

    let userMap: Record<string, { display_name: string; avatar_url: string | null }> = {}

    if (userIds.length > 0) {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, display_name, avatar_url')
        .in('id', userIds)

      if (usersData) {
        usersData.forEach(u => {
          userMap[u.id] = { display_name: u.display_name, avatar_url: u.avatar_url }
        })
      }
    }

    // メンバーデータを整形
    const formattedMembers: GroupMember[] = (membersData || []).map(m => ({
      id: m.id,
      group_id: m.group_id,
      user_id: m.user_id,
      guest_name: m.guest_name,
      role: m.role as 'admin' | 'member',
      joined_at: m.joined_at,
      users: m.user_id ? userMap[m.user_id] || null : null,
      displayName: m.user_id
        ? (userMap[m.user_id]?.display_name || 'Unknown')
        : (m.guest_name || 'ゲスト'),
      isGuest: !m.user_id,
    }))

    setMembers(formattedMembers)

    // ルール
    const { data: rulesData } = await supabase
      .from('group_rules')
      .select('*')
      .eq('group_id', groupId)
      .single()

    setRules(rulesData)

    // セッション（対局履歴）
    const { data: sessionsData } = await supabase
      .from('game_sessions')
      .select('id, date, created_at')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })

    // 各セッションのゲーム数を取得
    const sessionsWithGameCount = await Promise.all(
      (sessionsData || []).map(async (session) => {
        const { count } = await supabase
          .from('games')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', session.id)

        return {
          id: session.id,
          date: session.date,
          created_at: session.created_at,
          game_count: count || 0,
        }
      })
    )

    setSessions(sessionsWithGameCount)

    // ランキング集計
    // このグループのセッションに参加したプレイヤーの成績を集計
    const sessionIds = sessionsWithGameCount.map(s => s.id)

    const memberRankings: MemberRanking[] = []

    if (sessionIds.length > 0) {
      // このグループのセッションに参加した全プレイヤーを取得
      const { data: allSessionPlayers } = await supabase
        .from('session_players')
        .select('id, session_id, user_id, guest_name')
        .in('session_id', sessionIds)

      if (allSessionPlayers) {
        // メンバーごとに成績を集計
        for (const member of formattedMembers) {
          // このメンバーに対応するセッションプレイヤーを探す
          const matchingPlayers = allSessionPlayers.filter(sp => {
            if (member.user_id && sp.user_id) {
              return sp.user_id === member.user_id
            }
            if (member.guest_name && sp.guest_name) {
              return sp.guest_name === member.guest_name
            }
            return false
          })

          let totalScore = 0
          let gameCount = 0
          const rankCounts = { first: 0, second: 0, third: 0, fourth: 0 }

          if (matchingPlayers.length > 0) {
            const playerIds = matchingPlayers.map(p => p.id)

            // 各プレイヤーの結果を取得
            const { data: results } = await supabase
              .from('game_results')
              .select('score, rank')
              .in('player_id', playerIds)

            if (results) {
              results.forEach(r => {
                totalScore += r.score
                gameCount++
                if (r.rank === 1) rankCounts.first++
                else if (r.rank === 2) rankCounts.second++
                else if (r.rank === 3) rankCounts.third++
                else if (r.rank === 4) rankCounts.fourth++
              })
            }
          }

          memberRankings.push({
            memberId: member.id,
            displayName: member.displayName,
            isGuest: member.isGuest,
            totalScore,
            gameCount,
            rankCounts,
          })
        }
      }
    } else {
      // セッションがない場合は全メンバーを0で初期化
      for (const member of formattedMembers) {
        memberRankings.push({
          memberId: member.id,
          displayName: member.displayName,
          isGuest: member.isGuest,
          totalScore: 0,
          gameCount: 0,
          rankCounts: { first: 0, second: 0, third: 0, fourth: 0 },
        })
      }
    }

    // スコア順でソート
    memberRankings.sort((a, b) => b.totalScore - a.totalScore)
    setRankings(memberRankings)

    setLoading(false)
  }

  useEffect(() => {
    fetchGroupDetail()
  }, [groupId])

  const updateRules = async (newRules: Partial<GroupRule>) => {
    if (!groupId) return { error: new Error('No group ID') }

    const { error } = await supabase
      .from('group_rules')
      .update(newRules)
      .eq('group_id', groupId)

    if (!error && rules) {
      setRules({ ...rules, ...newRules })
    }

    return { error }
  }

  // ゲストメンバーを追加
  const addGuestMember = async (guestName: string) => {
    if (!groupId) return { error: new Error('No group ID') }

    const { data, error } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        guest_name: guestName,
        role: 'member',
      })
      .select()
      .single()

    if (!error) {
      await fetchGroupDetail()
    }

    return { data, error }
  }

  // メンバーを削除（ゲストのみ削除可能）
  const removeMember = async (memberId: string) => {
    const member = members.find(m => m.id === memberId)
    if (!member) return { error: new Error('Member not found') }

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('id', memberId)

    if (!error) {
      await fetchGroupDetail()
    }

    return { error }
  }

  // 自分が管理者かどうか
  const isAdmin = members.some(m => m.user_id === user?.id && m.role === 'admin')

  return {
    group,
    members,
    rules,
    sessions,
    rankings,
    loading,
    updateRules,
    addGuestMember,
    removeMember,
    isAdmin,
    refetch: fetchGroupDetail,
  }
}
