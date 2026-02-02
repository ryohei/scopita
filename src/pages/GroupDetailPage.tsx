import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Settings, Users, Trophy, History, Copy, Check, Trash2, UserPlus, X, ChevronRight } from 'lucide-react'
import { useGroupDetail } from '../hooks/useGroups'
import { TabSwitch } from '../components/TabSwitch'
import { BottomNav } from '../components/BottomNav'

type Tab = 'ranking' | 'history' | 'members'

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const { group, members, rules, sessions, rankings, loading, addGuestMember, removeMember, isAdmin, updateRules } = useGroupDetail(groupId || '')
  const [activeTab, setActiveTab] = useState<Tab>('ranking')
  const [copied, setCopied] = useState(false)
  const [period, setPeriod] = useState('月間')
  const [showAddGuest, setShowAddGuest] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [saving, setSaving] = useState(false)

  // ルール編集モーダル
  const [showRulesModal, setShowRulesModal] = useState(false)
  const [editingRules, setEditingRules] = useState({
    game_type: '東南' as '東風' | '東南',
    start_score: 25000,
    return_score: 30000,
    uma_first: 20,
    uma_second: 10,
    uma_third: -10,
    uma_fourth: -20,
    has_oka: true,
  })

  // rulesが読み込まれたらeditingRulesを更新
  useEffect(() => {
    if (rules) {
      setEditingRules({
        game_type: rules.game_type,
        start_score: rules.start_score,
        return_score: rules.return_score,
        uma_first: rules.uma_first,
        uma_second: rules.uma_second,
        uma_third: rules.uma_third,
        uma_fourth: rules.uma_fourth,
        has_oka: rules.has_oka,
      })
    }
  }, [rules])

  const copyInviteCode = () => {
    if (group?.invite_code) {
      navigator.clipboard.writeText(group.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-primary-dark font-medium">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-cream-dark rounded-full flex items-center justify-center mx-auto mb-3">
            <Users size={32} className="text-text-secondary/70" />
          </div>
          <p className="text-text-secondary font-medium">グループが見つかりません</p>
          <Link to="/" className="text-primary-dark font-bold mt-3 inline-block hover:underline">
            ホームに戻る
          </Link>
        </div>
      </div>
    )
  }

  const tabOptions = [
    { value: 'ranking' as Tab, label: 'ランキング', icon: <Trophy size={16} /> },
    { value: 'history' as Tab, label: '履歴', icon: <History size={16} /> },
    { value: 'members' as Tab, label: 'メンバー', icon: <Users size={16} /> },
  ]

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* ヘッダー */}
      <header className="bg-primary rounded-b-3xl shadow-lg">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <Link to="/" className="text-white/80 hover:text-white transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold text-white flex-1">{group.name}</h1>
            {isAdmin && (
              <button
                onClick={() => setShowRulesModal(true)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <Settings size={24} />
              </button>
            )}
          </div>

          {/* 招待コード */}
          <div className="bg-white/10 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-white/70 text-xs mb-0.5">招待コード</p>
              <p className="text-xl font-bold text-white tracking-widest">
                {group.invite_code}
              </p>
            </div>
            <button
              onClick={copyInviteCode}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                copied 
                  ? 'bg-green-500 text-white' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'コピー済み' : 'コピー'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 -mt-3">
        {/* ルール表示 */}
        {rules && (
          <div className="bg-white rounded-2xl shadow-soft p-4 mb-4 animate-slide-up">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-4 bg-primary rounded-full"></div>
              <span className="text-sm font-bold text-text-primary">ルール設定</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                {rules.game_type}
              </span>
              <span className="bg-cream-dark text-text-secondary px-3 py-1.5 rounded-lg text-sm">
                {rules.start_score.toLocaleString()}点持ち
              </span>
              <span className="bg-cream-dark text-text-secondary px-3 py-1.5 rounded-lg text-sm">
                {rules.return_score.toLocaleString()}点返し
              </span>
              <span className="bg-cream-dark text-text-secondary px-3 py-1.5 rounded-lg text-sm">
                ウマ {Math.abs(rules.uma_second)}-{rules.uma_first}
              </span>
              {rules.has_oka && (
                <span className="bg-cream-dark text-text-secondary px-3 py-1.5 rounded-lg text-sm">
                  オカあり
                </span>
              )}
            </div>
          </div>
        )}

        {/* タブ */}
        <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
          <div className="p-3">
            <TabSwitch 
              options={tabOptions} 
              value={activeTab} 
              onChange={setActiveTab} 
            />
          </div>

          {/* タブコンテンツ */}
          <div className="p-4 pt-0">
            {activeTab === 'ranking' && (
              <div className="animate-slide-up">
                <div className="flex items-center justify-between mb-4 pt-2">
                  <h3 className="font-bold text-text-primary">ランキング</h3>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="text-sm border-2 border-gray-200 rounded-lg px-3 py-1.5 font-medium focus:border-primary focus:outline-none"
                  >
                    <option>週間</option>
                    <option>月間</option>
                    <option>3ヶ月</option>
                    <option>年間</option>
                    <option>通算</option>
                  </select>
                </div>
                {rankings.every(r => r.gameCount === 0) ? (
                  <div className="py-10 text-center">
                    <div className="w-16 h-16 bg-cream-dark rounded-full flex items-center justify-center mx-auto mb-3">
                      <Trophy size={28} className="text-text-secondary/70" />
                    </div>
                    <p className="text-text-secondary">まだ対局記録がありません</p>
                    <p className="text-text-secondary/70 text-sm mt-1">対局を記録してランキングを確認しましょう</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rankings.filter(r => r.gameCount > 0).map((ranking, index) => (
                      <div
                        key={ranking.memberId}
                        className="flex items-center justify-between p-3 rounded-xl bg-cream-dark"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                            index === 0 ? 'bg-yellow-400 text-white' :
                            index === 1 ? 'bg-gray-300 text-text-primary' :
                            index === 2 ? 'bg-orange-400 text-white' : 'bg-cream-dark text-text-secondary'
                          }`}>
                            {index + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-text-primary">{ranking.displayName}</span>
                              {ranking.isGuest && (
                                <span className="text-xs bg-gray-200 text-text-secondary px-1.5 py-0.5 rounded">ゲスト</span>
                              )}
                            </div>
                            <div className="flex gap-1 mt-0.5">
                              <span className="text-xs text-yellow-600">{ranking.rankCounts.first}↑</span>
                              <span className="text-xs text-text-secondary/70">{ranking.rankCounts.second}</span>
                              <span className="text-xs text-orange-400">{ranking.rankCounts.third}</span>
                              <span className="text-xs text-blue-400">{ranking.rankCounts.fourth}↓</span>
                              <span className="text-xs text-text-secondary/70 ml-1">({ranking.gameCount}半荘)</span>
                            </div>
                          </div>
                        </div>
                        <span className={`font-bold text-xl ${
                          ranking.totalScore >= 0 ? 'text-success' : 'text-error'
                        }`}>
                          {ranking.totalScore > 0 ? '+' : ''}{ranking.totalScore}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="animate-slide-up">
                <h3 className="font-bold text-text-primary mb-4 pt-2">対局履歴</h3>
                {sessions.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className="w-16 h-16 bg-cream-dark rounded-full flex items-center justify-center mx-auto mb-3">
                      <History size={28} className="text-text-secondary/70" />
                    </div>
                    <p className="text-text-secondary">まだ対局記録がありません</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((session) => {
                      const date = new Date(session.date)
                      const formatDate = `${date.getMonth() + 1}/${date.getDate()}`
                      return (
                        <Link
                          key={session.id}
                          to={`/sessions/${session.id}`}
                          className="flex items-center justify-between p-3 rounded-xl bg-cream-dark hover:bg-cream-dark/80 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-text-secondary w-12 font-medium">
                              {formatDate}
                            </span>
                            <p className="text-sm text-text-secondary">
                              {session.game_count}半荘
                            </p>
                          </div>
                          <ChevronRight size={18} className="text-text-secondary/70" />
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'members' && (
              <div className="animate-slide-up">
                <div className="flex items-center justify-between mb-4 pt-2">
                  <h3 className="font-bold text-text-primary">
                    メンバー ({members.length}人)
                  </h3>
                  {isAdmin && (
                    <button
                      onClick={() => setShowAddGuest(true)}
                      className="flex items-center gap-1 text-sm font-bold text-primary-dark hover:text-primary-dark/80 transition-colors"
                    >
                      <UserPlus size={16} />
                      ゲスト追加
                    </button>
                  )}
                </div>

                {/* ゲスト追加フォーム */}
                {showAddGuest && (
                  <div className="bg-primary/10 rounded-xl p-3 mb-4">
                    <p className="text-sm font-medium text-text-primary mb-2">ゲストメンバーを追加</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="名前を入力"
                        className="flex-1 px-3 py-2 rounded-lg bg-white border-2 border-transparent focus:border-primary transition-colors"
                        autoFocus
                      />
                      <button
                        onClick={async () => {
                          if (!guestName.trim()) return
                          setSaving(true)
                          await addGuestMember(guestName.trim())
                          setGuestName('')
                          setShowAddGuest(false)
                          setSaving(false)
                        }}
                        disabled={saving || !guestName.trim()}
                        className="px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        追加
                      </button>
                      <button
                        onClick={() => {
                          setShowAddGuest(false)
                          setGuestName('')
                        }}
                        className="px-3 py-2 bg-gray-200 text-text-primary rounded-lg font-medium hover:bg-gray-300 transition-colors"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-cream-dark"
                    >
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg ${
                        member.isGuest
                          ? 'bg-gray-300 text-text-secondary'
                          : 'bg-primary/20 text-primary-dark'
                      }`}>
                        {member.displayName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-text-primary">{member.displayName}</p>
                          {member.isGuest && (
                            <span className="text-xs bg-gray-200 text-text-secondary px-1.5 py-0.5 rounded">ゲスト</span>
                          )}
                        </div>
                        {member.role === 'admin' && (
                          <span className="text-xs text-primary-dark font-medium">管理者</span>
                        )}
                      </div>
                      {isAdmin && member.role !== 'admin' && (
                        <button
                          onClick={async () => {
                            if (!confirm(`${member.displayName}をグループから除外しますか？`)) return
                            setSaving(true)
                            await removeMember(member.id)
                            setSaving(false)
                          }}
                          disabled={saving}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ボトムナビ */}
      <BottomNav />

      {/* ルール編集モーダル */}
      {showRulesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold text-text-primary">ルール設定</h2>
              <button
                onClick={() => setShowRulesModal(false)}
                className="p-2 text-text-secondary/70 hover:text-text-secondary rounded-lg hover:bg-cream-dark transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* ゲームタイプ */}
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">ゲームタイプ</label>
                <div className="flex gap-2">
                  {(['東風', '東南'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setEditingRules(prev => ({ ...prev, game_type: type }))}
                      className={`flex-1 py-2 rounded-xl font-bold transition-colors ${
                        editingRules.game_type === type
                          ? 'bg-primary text-white'
                          : 'bg-cream-dark text-text-secondary hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* 持ち点 */}
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">持ち点</label>
                <input
                  type="number"
                  value={editingRules.start_score}
                  onChange={(e) => setEditingRules(prev => ({ ...prev, start_score: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-cream-dark border-2 border-transparent focus:border-primary focus:bg-white transition-colors"
                />
              </div>

              {/* 返し点 */}
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">返し点</label>
                <input
                  type="number"
                  value={editingRules.return_score}
                  onChange={(e) => setEditingRules(prev => ({ ...prev, return_score: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-cream-dark border-2 border-transparent focus:border-primary focus:bg-white transition-colors"
                />
              </div>

              {/* ウマ */}
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">ウマ</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-text-secondary">1着</span>
                    <input
                      type="number"
                      value={editingRules.uma_first}
                      onChange={(e) => setEditingRules(prev => ({ ...prev, uma_first: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 rounded-xl bg-cream-dark border-2 border-transparent focus:border-primary focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-text-secondary">2着</span>
                    <input
                      type="number"
                      value={editingRules.uma_second}
                      onChange={(e) => setEditingRules(prev => ({ ...prev, uma_second: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 rounded-xl bg-cream-dark border-2 border-transparent focus:border-primary focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-text-secondary">3着</span>
                    <input
                      type="number"
                      value={editingRules.uma_third}
                      onChange={(e) => setEditingRules(prev => ({ ...prev, uma_third: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 rounded-xl bg-cream-dark border-2 border-transparent focus:border-primary focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-text-secondary">4着</span>
                    <input
                      type="number"
                      value={editingRules.uma_fourth}
                      onChange={(e) => setEditingRules(prev => ({ ...prev, uma_fourth: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 rounded-xl bg-cream-dark border-2 border-transparent focus:border-primary focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* オカ */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-secondary">オカあり</label>
                <button
                  onClick={() => setEditingRules(prev => ({ ...prev, has_oka: !prev.has_oka }))}
                  className={`w-14 h-8 rounded-full transition-colors ${
                    editingRules.has_oka ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    editingRules.has_oka ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>

            <div className="p-4 border-t flex gap-2">
              <button
                onClick={() => setShowRulesModal(false)}
                className="flex-1 py-3 rounded-xl bg-gray-200 text-text-primary font-bold hover:bg-gray-300 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={async () => {
                  setSaving(true)
                  await updateRules(editingRules)
                  setSaving(false)
                  setShowRulesModal(false)
                }}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
