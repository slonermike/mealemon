import { Fraction } from 'fraction.js'

// Volume ladder in ascending order, all expressed in tsp
const VOLUME_UNITS: { unit: string; tsp: number }[] = [
  { unit: 'tsp', tsp: 1 },
  { unit: 'tbsp', tsp: 3 },
  { unit: 'fl oz', tsp: 6 },
  { unit: 'cup', tsp: 48 },
]

const TSP_BY_UNIT: Record<string, number> = Object.fromEntries(
  VOLUME_UNITS.map(({ unit, tsp }) => [unit, tsp]),
)

export function isVolumeUnit(unit: string): boolean {
  return unit in TSP_BY_UNIT
}

/**
 * Convert an amount in any volume unit to tsp.
 * Returns null if the unit is not a known volume unit.
 */
export function toTsp(amount: number, unit: string): number | null {
  const factor = TSP_BY_UNIT[unit]
  if (factor === undefined) return null
  return amount * factor
}

/**
 * Coalesce a tsp amount up to the most readable kitchen unit.
 * Strategy: prefer the largest unit that gives a whole number result;
 * if none do, use the largest unit that gives a half or quarter result;
 * otherwise stay in tsp.
 */
export function coalesceVolume(tspAmount: number): { amount: number; unit: string } {
  // Pass 1: largest unit with a whole-number result
  for (let i = VOLUME_UNITS.length - 1; i >= 0; i--) {
    const { unit, tsp } = VOLUME_UNITS[i]
    const converted = tspAmount / tsp
    const frac = new Fraction(converted).simplify(0.01)
    if (Number(frac.d) === 1) {
      return { amount: Number(frac.n), unit }
    }
  }
  // Pass 2: largest unit with a clean fractional result (d ≤ 4)
  for (let i = VOLUME_UNITS.length - 1; i >= 0; i--) {
    const { unit, tsp } = VOLUME_UNITS[i]
    const converted = tspAmount / tsp
    const frac = new Fraction(converted).simplify(0.01)
    if (Number(frac.d) <= 4) {
      return { amount: Number(frac.n) / Number(frac.d), unit }
    }
  }
  return { amount: tspAmount, unit: 'tsp' }
}

/**
 * Format a numeric amount as a readable kitchen fraction string.
 * e.g. 0.25 → "¼", 1.5 → "1½", 2 → "2"
 */
export function formatAmount(amount: number): string {
  if (amount === 0) return '0'
  const frac = new Fraction(amount).simplify(0.01)
  const n = Number(frac.n)
  const d = Number(frac.d)
  const whole = Math.floor(n / d)
  const remainder = n % d

  const unicodeFractions: Record<string, string> = {
    '1/2': '½',
    '1/3': '⅓',
    '2/3': '⅔',
    '1/4': '¼',
    '3/4': '¾',
    '1/8': '⅛',
    '3/8': '⅜',
    '5/8': '⅝',
    '7/8': '⅞',
  }

  if (remainder === 0) return String(whole)

  const fracKey = `${remainder}/${d}`
  const fracStr = unicodeFractions[fracKey] ?? `${remainder}/${d}`

  return whole > 0 ? `${whole}${fracStr}` : fracStr
}
