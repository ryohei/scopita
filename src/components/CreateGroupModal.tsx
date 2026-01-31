import { useState } from 'react'
import { X, Plus, Users, UserPlus } from 'lucide-react'
import { TabSwitch } from './TabSwitch'

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateGroup: (name: string) => Promise<{ error: Error | null }>
  onJoinGroup: (code: string) => Promise<{ error: Error | null }>
}

export function CreateGroupModal({ isOpen, onClose, onCreateGroup, onJoinGroup }: CreateGroupModalProps) {
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [name, setName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (mode === 'create') {
      if (!name.trim()) {
        setError('グループ名を入力してください')
        setLoading(false)
        return
      }
      const result = await onCreateGroup(name.trim())
      if (result.error) {
        console.error('Create group error:', result.error)
        setError(`グループの作成に失敗しました: ${result.error.message}`)
      } else {
        onClose()
        setName('')
      }
    } else {
      if (!inviteCode.trim()) {
        setError('招待コードを入力してください')
        setLoading(false)
        return
      }
      const { error } = await onJoinGroup(inviteCode.trim())
      if (error) {
        setError(error.message)
      } else {
        onClose()
        setInviteCode('')
      }
    }

    setLoading(false)
  }

  const modeOptions = [
    { value: 'create' as const, label: '新規作成', icon: <Plus size={16} /> },
    { value: 'join' as const, label: '参加する', icon: <UserPlus size={16} /> },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-mahjong-table/10 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-mahjong-table" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">グループ</h2>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <X size={22} />
          </button>
        </div>

        {/* タブ */}
        <div className="mb-5">
          <TabSwitch 
            options={modeOptions} 
            value={mode} 
            onChange={(v) => { setMode(v); setError(null) }}
          />
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 font-medium">
              {error}
            </div>
          )}

          {mode === 'create' ? (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                グループ名
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 週末麻雀会"
                className="w-full px-4 py-3.5 rounded-xl bg-cream-dark border-2 border-transparent focus:border-mahjong-table focus:bg-white transition-colors"
              />
              <p className="text-xs text-gray-500 mt-2">
                作成後、招待コードが発行されます
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                招待コード
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="例: ABC123"
                className="w-full px-4 py-3.5 rounded-xl bg-cream-dark border-2 border-transparent focus:border-mahjong-table focus:bg-white transition-colors uppercase text-center text-xl font-bold tracking-widest"
                maxLength={6}
              />
              <p className="text-xs text-gray-500 mt-2">
                グループの管理者から招待コードを教えてもらってください
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-5 bg-mahjong-table text-white py-4 rounded-2xl font-bold btn-pressable flex items-center justify-center gap-2 disabled:opacity-50 shadow-button text-lg"
          >
            {mode === 'create' ? <Plus size={22} /> : <UserPlus size={22} />}
            {loading ? '処理中...' : mode === 'create' ? 'グループを作成' : 'グループに参加'}
          </button>
        </form>

        {/* モバイル用の下部余白 */}
        <div className="h-2 sm:hidden"></div>
      </div>
    </div>
  )
}
