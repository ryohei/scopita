import { Link } from 'react-router-dom'

interface AppHeaderProps {
  showCharacter?: boolean
  compact?: boolean
}

export function AppHeader({ showCharacter = true, compact = false }: AppHeaderProps) {
  if (compact) {
    return (
      <header className="bg-mahjong-table rounded-b-3xl shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="/images/mascot-64.png" 
              alt="スコピタちゃん" 
              className="w-10 h-10 rounded-full bg-white p-0.5 shadow"
            />
            <span className="text-white font-bold text-lg">スコピタちゃん</span>
          </Link>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-mahjong-table rounded-b-3xl shadow-lg px-4 pt-6 pb-8">
      <div className="max-w-2xl mx-auto">
        {/* 吹き出し */}
        <div className="flex justify-center mb-3">
          <div className="relative bg-white rounded-full px-5 py-2 shadow-md">
            <span className="text-sm font-bold text-mahjong-table">
              スコア記録はわたしに任せて！🀄
            </span>
            {/* 吹き出しの三角形 */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-white"></div>
          </div>
        </div>

        {/* キャラクター */}
        {showCharacter && (
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 rounded-full bg-white/90 p-1 shadow-lg flex items-center justify-center">
              <img 
                src="/images/mascot-256.png" 
                alt="スコピタちゃん" 
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          </div>
        )}

        {/* タイトル */}
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-1">スコピタちゃん</h1>
          <p className="text-sm opacity-90">君たちのスコア、ピタッと記録！</p>
        </div>
      </div>
    </header>
  )
}
