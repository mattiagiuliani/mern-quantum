import { useCallback, useState } from 'react'
import { runCircuit as apiRunCircuit } from '../../api/apiClient'
import { DEFAULT_SHOTS } from './multiRun.constants'
import { resolveExecutedShots } from './multiRun.utils'

export function useFeatureAMultiRun() {
  const [selectedShots, setSelectedShots] = useState(DEFAULT_SHOTS)
  const [lastExecutedShots, setLastExecutedShots] = useState(DEFAULT_SHOTS)
  const [runStatus, setRunStatus] = useState('idle')
  const [results, setResults] = useState(null)

  const runCircuitWithSelectedShots = useCallback(async (circuit) => {
    const hasGates = circuit.some(row => row.some(g => g !== null))
    if (!hasGates) return

    setRunStatus('running')
    setResults(null)

    try {
      const { counts, shots } = await apiRunCircuit(circuit, selectedShots)
      setResults(counts)
      setLastExecutedShots(resolveExecutedShots(shots, selectedShots))
      setRunStatus('done')
    } catch (err) {
      console.error('[handleRun]', err)
      setRunStatus('error')
    }
  }, [selectedShots])

  const resetMultiRun = useCallback(() => {
    setResults(null)
    setRunStatus('idle')
    setLastExecutedShots(DEFAULT_SHOTS)
  }, [])

  return {
    selectedShots,
    setSelectedShots,
    lastExecutedShots,
    runStatus,
    results,
    runCircuitWithSelectedShots,
    resetMultiRun,
  }
}
