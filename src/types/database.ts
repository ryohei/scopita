export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type YakumanType =
  | '国士無双'
  | '四暗刻'
  | '大三元'
  | '字一色'
  | '小四喜'
  | '大四喜'
  | '緑一色'
  | '清老頭'
  | '九蓮宝燈'
  | '四槓子'
  | '天和'
  | '地和'

export type GameType = '東風' | '東南'

export type MemberRole = 'admin' | 'member'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          invite_code: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          invite_code: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          invite_code?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: MemberRole
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: MemberRole
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: MemberRole
          joined_at?: string
        }
      }
      group_rules: {
        Row: {
          id: string
          group_id: string
          game_type: GameType
          start_score: number
          return_score: number
          uma_first: number
          uma_second: number
          uma_third: number
          uma_fourth: number
          has_oka: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          game_type?: GameType
          start_score?: number
          return_score?: number
          uma_first?: number
          uma_second?: number
          uma_third?: number
          uma_fourth?: number
          has_oka?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          game_type?: GameType
          start_score?: number
          return_score?: number
          uma_first?: number
          uma_second?: number
          uma_third?: number
          uma_fourth?: number
          has_oka?: boolean
          updated_at?: string
        }
      }
      game_sessions: {
        Row: {
          id: string
          group_id: string | null
          date: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id?: string | null
          date: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string | null
          date?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      session_players: {
        Row: {
          id: string
          session_id: string
          user_id: string | null
          guest_name: string | null
          player_index: number
        }
        Insert: {
          id?: string
          session_id: string
          user_id?: string | null
          guest_name?: string | null
          player_index: number
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string | null
          guest_name?: string | null
          player_index?: number
        }
      }
      games: {
        Row: {
          id: string
          session_id: string
          game_number: number
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          game_number: number
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          game_number?: number
          created_at?: string
        }
      }
      game_results: {
        Row: {
          id: string
          game_id: string
          player_id: string
          rank: number
          raw_score: number
          score: number
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          player_id: string
          rank: number
          raw_score: number
          score: number
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          player_id?: string
          rank?: number
          raw_score?: number
          score?: number
          created_at?: string
        }
      }
      yakuman: {
        Row: {
          id: string
          game_id: string
          player_id: string
          type: YakumanType
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          player_id: string
          type: YakumanType
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          player_id?: string
          type?: YakumanType
          created_at?: string
        }
      }
    }
  }
}
