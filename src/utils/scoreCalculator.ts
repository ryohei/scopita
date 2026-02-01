export interface Rules {
  returnScore: number
  umaFirst: number
  umaSecond: number
  umaThird: number
  umaFourth: number
  hasOka: boolean
  startScore: number
}

export const DEFAULT_RULES: Rules = {
  returnScore: 30000,
  umaFirst: 20,
  umaSecond: 10,
  umaThird: -10,
  umaFourth: -20,
  hasOka: true,
  startScore: 25000,
}

// 五捨六入（5以下は切り捨て、6以上は切り上げ）
function goshaRokunyuu(value: number): number {
  const decimal = Math.abs(value) % 1
  if (decimal <= 0.5) {
    // 五捨: ゼロ方向に切り捨て
    return value >= 0 ? Math.floor(value) : Math.ceil(value)
  } else {
    // 六入: ゼロから離れる方向に切り上げ
    return value >= 0 ? Math.ceil(value) : Math.floor(value)
  }
}

// 単体スコア計算（後方互換性のため残す）
export function calculateScore(rawScore: number, rank: number, rules: Rules): number {
  // 素点から返し点を引いて千点単位に（五捨六入）
  let score = goshaRokunyuu((rawScore - rules.returnScore) / 1000)

  // ウマを加算
  const uma = [rules.umaFirst, rules.umaSecond, rules.umaThird, rules.umaFourth]
  score += uma[rank - 1]

  // オカ（トップ取り）
  if (rules.hasOka && rank === 1) {
    const oka = ((rules.returnScore - rules.startScore) / 1000) * 4
    score += oka
  }

  return score
}

// 4人分のスコアを計算（合計が0になるように1位を調整）
export function calculateAllScores(
  results: { rawScore: number; rank: number }[],
  rules: Rules
): number[] {
  if (results.length !== 4) {
    // 4人揃っていない場合は個別計算
    return results.map(r => calculateScore(r.rawScore, r.rank, rules))
  }

  // 順位でソート（1位が最初）
  const sorted = [...results].sort((a, b) => a.rank - b.rank)

  // 2位〜4位のスコアを先に計算
  const scores: number[] = new Array(4)
  let sumExceptFirst = 0

  for (let i = 1; i < 4; i++) {
    const result = sorted[i]
    // 素点から返し点を引いて千点単位に（五捨六入）
    let score = goshaRokunyuu((result.rawScore - rules.returnScore) / 1000)
    // ウマを加算
    const uma = [rules.umaFirst, rules.umaSecond, rules.umaThird, rules.umaFourth]
    score += uma[result.rank - 1]
    scores[result.rank - 1] = score
    sumExceptFirst += score
  }

  // 1位のスコアは合計が0になるように計算
  scores[0] = -sumExceptFirst

  // 元の順序に戻す
  return results.map(r => scores[r.rank - 1])
}
