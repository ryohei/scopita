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
    loading,
    updateRules,
    addGuestMember,
    removeMember,
    isAdmin,
    refetch: fetchGroupDetail,
  }
}
