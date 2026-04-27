import { useState, useRef, useEffect } from 'react'
import { initialLiveState } from './circuitBuilder.utils'

/**
 * Manages live quantum state, animated cells, and measurement log.
 */
export function useLiveState() {
  const [liveState,      setLiveState]      = useState(initialLiveState)
  const [animatingCells, setAnimatingCells] = useState(() => new Set())
  const [measurementLog, setMeasurementLog] = useState([])
  const liveStateRef = useRef(liveState)
  const measureIdRef = useRef(0)

  useEffect(() => { liveStateRef.current = liveState }, [liveState])

  return {
    liveState, setLiveState, liveStateRef,
    animatingCells, setAnimatingCells,
    measurementLog, setMeasurementLog,
    measureIdRef,
  }
}
