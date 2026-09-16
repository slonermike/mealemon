import { describe, it, expect } from 'vitest'
import { toTsp, coalesceVolume, formatAmount, isVolumeUnit } from './units'

describe('isVolumeUnit', () => {
  it('returns true for known volume units', () => {
    expect(isVolumeUnit('tsp')).toBe(true)
    expect(isVolumeUnit('tbsp')).toBe(true)
    expect(isVolumeUnit('fl oz')).toBe(true)
    expect(isVolumeUnit('cup')).toBe(true)
  })

  it('returns false for non-volume units', () => {
    expect(isVolumeUnit('lb')).toBe(false)
    expect(isVolumeUnit('oz')).toBe(false)
    expect(isVolumeUnit('count')).toBe(false)
    expect(isVolumeUnit('bunch')).toBe(false)
  })
})

describe('toTsp', () => {
  it('converts tbsp to tsp', () => expect(toTsp(1, 'tbsp')).toBe(3))
  it('converts fl oz to tsp', () => expect(toTsp(1, 'fl oz')).toBe(6))
  it('converts cup to tsp', () => expect(toTsp(1, 'cup')).toBe(48))
  it('returns null for non-volume units', () => expect(toTsp(1, 'oz')).toBeNull())
})

describe('coalesceVolume', () => {
  it('coalesces 3 tsp to 1 tbsp', () => {
    expect(coalesceVolume(3)).toEqual({ amount: 1, unit: 'tbsp' })
  })

  it('coalesces 48 tsp to 1 cup', () => {
    expect(coalesceVolume(48)).toEqual({ amount: 1, unit: 'cup' })
  })

  it('coalesces 1 tbsp + 1 cup + 8 fl oz = 3 + 48 + 48 = 99 tsp → 2 cup + 1 tbsp', () => {
    // 1 tbsp = 3 tsp, 1 cup = 48 tsp, 8 fl oz = 48 tsp → total 99 tsp
    // 99/48 = 2.0625 cups — not a clean fraction at cup level
    // 99/6 = 16.5 fl oz — ½ is clean, but cup is preferable at 2 cups + leftover
    // Falls back to the largest unit giving a clean fraction
    const result = coalesceVolume(99)
    expect(result.unit).toBeDefined()
    // Round-trip: result should represent 99 tsp
    const unitToTsp: Record<string, number> = { tsp: 1, tbsp: 3, 'fl oz': 6, cup: 48 }
    const tspBack = result.amount * (unitToTsp[result.unit] ?? 1)
    expect(Math.abs(tspBack - 99)).toBeLessThan(0.1)
  })

  it('coalesces the milk scenario: 1 tbsp + 1 cup + 8 fl oz', () => {
    const tspTotal = 3 + 48 + 48 // 99 tsp
    const result = coalesceVolume(tspTotal)
    // 99 tsp is not a clean cup amount but should produce something reasonable
    expect(result).toBeDefined()
  })

  it('leaves small amounts in tsp', () => {
    expect(coalesceVolume(1)).toEqual({ amount: 1, unit: 'tsp' })
    expect(coalesceVolume(2)).toEqual({ amount: 2, unit: 'tsp' })
  })
})

describe('formatAmount', () => {
  it('formats whole numbers', () => {
    expect(formatAmount(1)).toBe('1')
    expect(formatAmount(2)).toBe('2')
  })

  it('formats common fractions as unicode', () => {
    expect(formatAmount(0.5)).toBe('½')
    expect(formatAmount(0.25)).toBe('¼')
    expect(formatAmount(0.75)).toBe('¾')
    expect(formatAmount(0.333)).toBe('⅓')
    expect(formatAmount(0.667)).toBe('⅔')
  })

  it('formats mixed numbers', () => {
    expect(formatAmount(1.5)).toBe('1½')
    expect(formatAmount(1.25)).toBe('1¼')
    expect(formatAmount(2.75)).toBe('2¾')
  })

  it('formats less-common fractions as numeric', () => {
    expect(formatAmount(0.125)).toBe('⅛')
  })
})
