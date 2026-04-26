import { useCallback, useRef, useState } from 'react'
import { STEP_BY_STEP_MODES, STEP_BY_STEP_STATUS } from './stepByStep.constants'
import { buildQueueByMode } from './stepByStep.utils'

export function useFeatureDStepByStep() {
  const [mode, setMode] = useState(STEP_BY_STEP_MODES.TIME_STEP)
  const [status, setStatus] = useState(STEP_BY_STEP_STATUS.IDLE)
  const [queue, setQueue] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)

  const queueRef = useRef(queue)
  const currentIndexRef = useRef(currentIndex)

  const setQueueState = useCallback((nextQueue) => {
    queueRef.current = nextQueue
    setQueue(nextQueue)
  }, [])

  const setCurrentIndexState = useCallback((nextIndex) => {
    currentIndexRef.current = nextIndex
    setCurrentIndex(nextIndex)
  }, [])

  const resetStepByStep = useCallback(() => {
    setQueueState([])
    setCurrentIndexState(0)
    setStatus(STEP_BY_STEP_STATUS.IDLE)
  }, [setCurrentIndexState, setQueueState])

  const startStepByStep = useCallback((circuit) => {
    const nextQueue = buildQueueByMode(circuit, mode)
    setQueueState(nextQueue)
    setCurrentIndexState(0)

    if (nextQueue.length === 0) {
      setStatus(STEP_BY_STEP_STATUS.COMPLETED)
      return nextQueue
    }

    setStatus(STEP_BY_STEP_STATUS.READY)
    return nextQueue
  }, [mode, setCurrentIndexState, setQueueState])

  const jumpToIndex = useCallback((index) => {
    const activeQueue = queueRef.current
    if (!Array.isArray(activeQueue) || activeQueue.length === 0) return false

    const clampedIndex = Math.max(0, Math.min(index, activeQueue.length))
    setCurrentIndexState(clampedIndex)

    if (clampedIndex >= activeQueue.length) {
      setStatus(STEP_BY_STEP_STATUS.COMPLETED)
    } else {
      setStatus(STEP_BY_STEP_STATUS.READY)
    }

    return true
  }, [setCurrentIndexState])

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
      setCurrentIndexState(nextIndex)
      setStatus(nextIndex >= activeQueue.length ? STEP_BY_STEP_STATUS.COMPLETED : STEP_BY_STEP_STATUS.READY)
      return true
    } catch {
      setStatus(STEP_BY_STEP_STATUS.READY)
      return false
    }
  }, [setCurrentIndexState, status])

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
