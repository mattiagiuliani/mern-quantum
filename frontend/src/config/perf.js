import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals'

function emitMetric(metric) {
  if (import.meta.env.DEV) {
    // Keep local visibility simple without extra dashboard wiring.
    console.info('[web-vitals]', metric.name, Math.round(metric.value * 100) / 100)
  }
}

export function startPerfMonitoring() {
  onCLS(emitMetric)
  onFCP(emitMetric)
  onINP(emitMetric)
  onLCP(emitMetric)
  onTTFB(emitMetric)
}
