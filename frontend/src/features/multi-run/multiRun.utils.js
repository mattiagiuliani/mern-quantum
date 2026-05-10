import { DEFAULT_SHOTS } from './multiRun.constants'

export function resolveExecutedShots(apiShots, fallbackShots = DEFAULT_SHOTS) {
  if (typeof apiShots === 'number' && Number.isFinite(apiShots) && apiShots > 0) {
    return Math.trunc(apiShots)
  }
  return fallbackShots
}

export function calculatePercentage(count, shots) {
  if (shots <= 0) return '0.0'
  return ((count / shots) * 100).toFixed(1)
}
