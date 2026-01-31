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

export function calculateScore(rawScore: number, rank: number, rules: Rules): number {
  // 素点から返し点を引いて千点単位に
  let score = Math.round((rawScore - rules.returnScore) / 1000)

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
