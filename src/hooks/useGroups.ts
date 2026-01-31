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
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
  users: {
    display_name: string
    avatar_url: string | null
  }
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
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [rules, setRules] = useState<GroupRule | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGroupDetail = async () => {
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
          *,
          users (
            display_name,
            avatar_url
          )
        `)
        .eq('group_id', groupId)

      setMembers(membersData as GroupMember[] || [])

      // ルール
      const { data: rulesData } = await supabase
        .from('group_rules')
        .select('*')
        .eq('group_id', groupId)
        .single()

      setRules(rulesData)

      setLoading(false)
    }

    if (groupId) {
      fetchGroupDetail()
    }
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

  return {
    group,
    members,
    rules,
    loading,
    updateRules,
  }
}
