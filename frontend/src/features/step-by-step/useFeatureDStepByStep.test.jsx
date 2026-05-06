import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useFeatureDStepByStep } from './useFeatureDStepByStep'
import { STEP_BY_STEP_STATUS, STEP_BY_STEP_MODES } from './stepByStep.constants'

// Minimal 2-qubit, 2-step circuit with an H gate at [0][0].
const CIRCUIT = [
  ['H', 'X'],
  [null, null],
]

describe('useFeatureDStepByStep', () => {
  it('initialises to IDLE with empty queue', () => {
    const { result } = renderHook(() => useFeatureDStepByStep())
    expect(result.current.status).toBe(STEP_BY_STEP_STATUS.IDLE)
    expect(result.current.queue).toHaveLength(0)
    expect(result.current.currentIndex).toBe(0)
    expect(result.current.totalUnits).toBe(0)
    expect(result.current.percent).toBe(0)
    expect(result.current.canNext).toBe(false)
  })

  it('startStepByStep builds queue and sets status to READY', () => {
    const { result } = renderHook(() => useFeatureDStepByStep())
    act(() => { result.current.startStepByStep(CIRCUIT) })
    expect(result.current.status).toBe(STEP_BY_STEP_STATUS.READY)
    expect(result.current.queue.length).toBeGreaterThan(0)
    expect(result.current.canNext).toBe(true)
    expect(result.current.currentIndex).toBe(0)
  })

  it('startStepByStep with empty circuit sets status to COMPLETED', () => {
    const { result } = renderHook(() => useFeatureDStepByStep())
    act(() => { result.current.startStepByStep([[null, null]]) })
    expect(result.current.status).toBe(STEP_BY_STEP_STATUS.COMPLETED)
    expect(result.current.isCompleted).toBe(true)
  })

  it('executeNext advances index and calls executor', async () => {
    const { result } = renderHook(() => useFeatureDStepByStep())
    act(() => { result.current.startStepByStep(CIRCUIT) })

    const executor = vi.fn().mockResolvedValue(undefined)
    await act(async () => { await result.current.executeNext(executor) })

    expect(executor).toHaveBeenCalledOnce()
    expect(result.current.currentIndex).toBe(1)
  })

  it('reaches COMPLETED after all steps are executed', async () => {
    const { result } = renderHook(() => useFeatureDStepByStep())
    act(() => { result.current.startStepByStep(CIRCUIT) })

    const total = result.current.totalUnits
    const executor = vi.fn().mockResolvedValue(undefined)

    for (let i = 0; i < total; i++) {
      await act(async () => { await result.current.executeNext(executor) })
    }

    expect(result.current.status).toBe(STEP_BY_STEP_STATUS.COMPLETED)
    expect(result.current.isCompleted).toBe(true)
    expect(result.current.canNext).toBe(false)
    expect(result.current.percent).toBe(100)
  })

  it('executeNext returns false when already COMPLETED', async () => {
    const { result } = renderHook(() => useFeatureDStepByStep())
    act(() => { result.current.startStepByStep([[null]]) })
    // already COMPLETED (empty circuit)
    const executor = vi.fn()
    let returnVal
    await act(async () => { returnVal = await result.current.executeNext(executor) })
    expect(returnVal).toBe(false)
    expect(executor).not.toHaveBeenCalled()
  })

  it('resetStepByStep returns to IDLE', async () => {
    const { result } = renderHook(() => useFeatureDStepByStep())
    act(() => { result.current.startStepByStep(CIRCUIT) })
    act(() => { result.current.resetStepByStep() })
    expect(result.current.status).toBe(STEP_BY_STEP_STATUS.IDLE)
    expect(result.current.queue).toHaveLength(0)
    expect(result.current.currentIndex).toBe(0)
  })

  it('jumpToIndex clamps and sets COMPLETED when past end', () => {
    const { result } = renderHook(() => useFeatureDStepByStep())
    act(() => { result.current.startStepByStep(CIRCUIT) })

    const total = result.current.totalUnits
    act(() => { result.current.jumpToIndex(total + 99) })
    expect(result.current.status).toBe(STEP_BY_STEP_STATUS.COMPLETED)
  })

  it('jumpToIndex sets READY for valid in-range index', () => {
    const { result } = renderHook(() => useFeatureDStepByStep())
    act(() => { result.current.startStepByStep(CIRCUIT) })
    act(() => { result.current.jumpToIndex(0) })
    expect(result.current.status).toBe(STEP_BY_STEP_STATUS.READY)
  })

  it('jumpToIndex returns false on empty queue', () => {
    const { result } = renderHook(() => useFeatureDStepByStep())
    let returnVal
    act(() => { returnVal = result.current.jumpToIndex(0) })
    expect(returnVal).toBe(false)
  })

  it('setMode changes the mode used by startStepByStep', () => {
    const { result } = renderHook(() => useFeatureDStepByStep())
    act(() => { result.current.setMode(STEP_BY_STEP_MODES.GATE_BY_GATE) })
    act(() => { result.current.startStepByStep(CIRCUIT) })
    // GATE_BY_GATE produces one unit per gate; CIRCUIT has 2 gates (H, X)
    expect(result.current.totalUnits).toBe(2)
  })

  it('executor throwing keeps status at READY', async () => {
    const { result } = renderHook(() => useFeatureDStepByStep())
    act(() => { result.current.startStepByStep(CIRCUIT) })
    const executor = vi.fn().mockRejectedValue(new Error('fail'))
    let returnVal
    await act(async () => { returnVal = await result.current.executeNext(executor) })
    expect(returnVal).toBe(false)
    expect(result.current.status).toBe(STEP_BY_STEP_STATUS.READY)
  })
})
