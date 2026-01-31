import { useState } from 'react'
import { X, Plus } from 'lucide-react'

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
      const { error } = await onCreateGroup(name.trim())
      if (error) {
        setError('グループの作成に失敗しました')
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">グループ</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* タブ */}
        <div className="flex mb-4 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => { setMode('create'); setError(null) }}
            className={`flex-1 py-2 rounded-lg font-bold transition-colors ${
              mode === 'create' ? 'bg-white text-mahjong-table shadow' : 'text-gray-500'
            }`}
          >
            新規作成
          </button>
          <button
            onClick={() => { setMode('join'); setError(null) }}
            className={`flex-1 py-2 rounded-lg font-bold transition-colors ${
              mode === 'join' ? 'bg-white text-mahjong-table shadow' : 'text-gray-500'
            }`}
          >
            参加する
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {mode === 'create' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                グループ名
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 週末麻雀会"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-mahjong-table"
              />
              <p className="text-xs text-gray-500 mt-2">
                作成後、招待コードが発行されます
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                招待コード
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="例: ABC123"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-mahjong-table uppercase"
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
            className="w-full mt-4 bg-mahjong-table text-white py-3 rounded-xl font-bold btn-pressable flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Plus size={20} />
            {loading ? '処理中...' : mode === 'create' ? 'グループを作成' : 'グループに参加'}
          </button>
        </form>
      </div>
    </div>
  )
}
