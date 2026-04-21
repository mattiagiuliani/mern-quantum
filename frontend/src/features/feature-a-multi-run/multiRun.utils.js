import { DEFAULT_SHOTS } from './multiRun.constants'

export function resolveExecutedShots(apiShots, fallbackShots = DEFAULT_SHOTS) {
  if (typeof apiShots === 'number' && Number.isFinite(apiShots) && apiShots > 0) {
    return Math.trunc(apiShots)
  }
  return fallbackShots
}

export function calculatePercentage(count, shots) {
  const denominator = shots > 0 ? shots : 1
  return ((count / denominator) * 100).toFixed(1)
}
