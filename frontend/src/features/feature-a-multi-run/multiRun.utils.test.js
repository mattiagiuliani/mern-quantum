import { describe, it, expect } from 'vitest'
import { calculatePercentage, resolveExecutedShots } from './multiRun.utils'
import { DEFAULT_SHOTS } from './multiRun.constants'

describe('calculatePercentage', () => {
  it('calculates correct percentage', () => {
    expect(calculatePercentage(512, 1024)).toBe('50.0')
  })

  it('returns 0.0 for zero count', () => {
    expect(calculatePercentage(0, 1024)).toBe('0.0')
  })

  it('handles zero shots gracefully (no division by zero)', () => {
    expect(calculatePercentage(5, 0)).toBe('500.0')
  })
})

describe('resolveExecutedShots', () => {
  it('returns the api value when valid', () => {
    expect(resolveExecutedShots(512)).toBe(512)
  })

  it('truncates float to integer', () => {
    expect(resolveExecutedShots(100.9)).toBe(100)
  })

  it('falls back to DEFAULT_SHOTS for NaN', () => {
    expect(resolveExecutedShots(NaN)).toBe(DEFAULT_SHOTS)
  })

  it('falls back for non-positive value', () => {
    expect(resolveExecutedShots(-1)).toBe(DEFAULT_SHOTS)
  })
})
