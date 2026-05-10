import { useCallback, useEffect } from 'react'
import { STEP_BY_STEP_STATUS } from '../step-by-step/index'

/**
 * Manages the autoplay effect and toggleAutoPlay action for step-by-step mode.
 *
 * @param {{ isAutoPlayEnabled, setIsAutoPlayEnabled, autoPlayDelay, stepByStepStatus, canNextStepByStep, stepByStepTotal, onStart, onNext }} params
 */
export function useAutoPlay({
  isAutoPlayEnabled,
  setIsAutoPlayEnabled,
  autoPlayDelay,
  stepByStepStatus,
  canNextStepByStep,
  stepByStepTotal,
  onStart,
  onNext,
}) {
  useEffect(() => {
    if (!isAutoPlayEnabled) return
    if (stepByStepStatus === STEP_BY_STEP_STATUS.COMPLETED || !canNextStepByStep) {
      setIsAutoPlayEnabled(false)
      return
    }
    if (stepByStepStatus !== STEP_BY_STEP_STATUS.READY) return

    const timerId = window.setTimeout(onNext, autoPlayDelay)
    return () => window.clearTimeout(timerId)
  }, [autoPlayDelay, canNextStepByStep, isAutoPlayEnabled, onNext, setIsAutoPlayEnabled, stepByStepStatus])

  const toggleAutoPlay = useCallback(() => {
    if (isAutoPlayEnabled) { setIsAutoPlayEnabled(false); return }
    if (stepByStepStatus === STEP_BY_STEP_STATUS.IDLE || stepByStepTotal === 0) { onStart() }
    setIsAutoPlayEnabled(true)
  }, [isAutoPlayEnabled, onStart, setIsAutoPlayEnabled, stepByStepStatus, stepByStepTotal])

  return { toggleAutoPlay }
}
