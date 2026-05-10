import { useCallback, useEffect, useRef, useState } from 'react'
import { STEP_BY_STEP_MODES, STEP_BY_STEP_STATUS } from './stepByStep.constants'
import { buildQueueByMode } from './stepByStep.utils'

export function useFeatureDStepByStep() {
  const [mode, setMode] = useState(STEP_BY_STEP_MODES.TIME_STEP)
  const [status, setStatus] = useState(STEP_BY_STEP_STATUS.IDLE)
  const [queue, setQueue] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)

  // Refs mirror state so callbacks inside useCallback can read fresh values
  // without being re-created on every render.
  const queueRef        = useRef(queue)
  const currentIndexRef = useRef(currentIndex)

  useEffect(() => { queueRef.current = queue },        [queue])
  useEffect(() => { currentIndexRef.current = currentIndex }, [currentIndex])

  const resetStepByStep = useCallback(() => {
    setQueue([])
    setCurrentIndex(0)
    setStatus(STEP_BY_STEP_STATUS.IDLE)
  }, [])

  const startStepByStep = useCallback((circuit) => {
    const nextQueue = buildQueueByMode(circuit, mode)
    setQueue(nextQueue)
    setCurrentIndex(0)

    if (nextQueue.length === 0) {
      setStatus(STEP_BY_STEP_STATUS.COMPLETED)
      return nextQueue
    }

    setStatus(STEP_BY_STEP_STATUS.READY)
    return nextQueue
  }, [mode])

  const jumpToIndex = useCallback((index) => {
    const activeQueue = queueRef.current
    if (!Array.isArray(activeQueue) || activeQueue.length === 0) return false

    // Clamp to [0, length] — index === length signals "past the end" → COMPLETED.
    const clampedIndex = Math.max(0, Math.min(index, activeQueue.length))
    setCurrentIndex(clampedIndex)

    if (clampedIndex >= activeQueue.length) {
      setStatus(STEP_BY_STEP_STATUS.COMPLETED)
    } else {
      setStatus(STEP_BY_STEP_STATUS.READY)
    }

    return true
  }, [])

  const executeNext = useCallback(async (executor) => {
    const activeQueue = queueRef.current
    const activeIndex = currentIndexRef.current

    if (status === STEP_BY_STEP_STATUS.RUNNING) return false
    if (activeIndex >= activeQueue.length) {
      setStatus(STEP_BY_STEP_STATUS.COMPLETED)
      return false
    }

    const unit = activeQueue[activeIndex]
    setStatus(STEP_BY_STEP_STATUS.RUNNING)

    try {
      await executor(unit, activeIndex)
      const nextIndex = activeIndex + 1
      setCurrentIndex(nextIndex)
      setStatus(nextIndex >= activeQueue.length ? STEP_BY_STEP_STATUS.COMPLETED : STEP_BY_STEP_STATUS.READY)
      return true
    } catch {
      setStatus(STEP_BY_STEP_STATUS.READY)
      return false
    }
  }, [status])

  const totalUnits = queue.length
  const currentUnit = currentIndex < totalUnits ? queue[currentIndex] : null
  const canNext = status !== STEP_BY_STEP_STATUS.RUNNING && currentIndex < totalUnits && totalUnits > 0
  const canStart = status !== STEP_BY_STEP_STATUS.RUNNING
  const isCompleted = status === STEP_BY_STEP_STATUS.COMPLETED
  const isActive = status === STEP_BY_STEP_STATUS.READY || status === STEP_BY_STEP_STATUS.RUNNING
  const percent = totalUnits === 0
    ? 0
    : Math.min(100, Math.round((currentIndex / totalUnits) * 100))

  return {
    mode,
    setMode,
    status,
    queue,
    currentIndex,
    totalUnits,
    currentUnit,
    percent,
    canStart,
    canNext,
    isCompleted,
    isActive,
    startStepByStep,
    executeNext,
    jumpToIndex,
    resetStepByStep,
  }
}
