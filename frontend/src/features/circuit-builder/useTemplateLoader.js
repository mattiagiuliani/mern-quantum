import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Handles loading a template or saved circuit from router location state.
 * When the circuit already has gates the caller must ask the user to confirm
 * via the `pendingLoad` / `confirmLoad` / `cancelLoad` API (no window.confirm).
 *
 * @param {{ circuitRef, appliedRef, applyTemplateCircuit, setSavedCircuitId, setSavedCircuitName }} params
 * @returns {{ pendingLoad: object|null, confirmLoad: () => void, cancelLoad: () => void }}
 */
export function useTemplateLoader({
  circuitRef,
  appliedRef,
  applyTemplateCircuit,
  setSavedCircuitId,
  setSavedCircuitName,
}) {
  const navigate = useNavigate()
  const location = useLocation()

  // { apply: () => void, message: string } while waiting for user confirmation
  const [pendingLoad, setPendingLoad] = useState(null)

  const hasGates = (ref) => ref.current.some(row => row.some(cell => cell !== null))

  const _commit = useCallback((applyFn) => {
    queueMicrotask(applyFn)
    navigate('/circuit-builder', { replace: true, state: null })
  }, [navigate])

  // Load template from templates library
  useEffect(() => {
    const template = location.state?.templateToApply
    if (!template?.circuit) return

    const key = template._id ?? template.id ?? JSON.stringify(template.circuit)
    if (appliedRef.current === key) return

    appliedRef.current = key

    const applyFn = () => applyTemplateCircuit(template.circuit)

    if (!hasGates(circuitRef)) {
      _commit(applyFn)
    } else {
      queueMicrotask(() => setPendingLoad({
        message: 'Replace current circuit with selected template? Unsaved edits will be lost.',
        apply: applyFn,
      }))
    }
  }, [_commit, applyTemplateCircuit, appliedRef, circuitRef, location.state])

  // Load saved circuit from dashboard
  useEffect(() => {
    const saved = location.state?.savedCircuitToLoad
    if (!saved?.circuitMatrix) return

    const key = saved._id ?? JSON.stringify(saved.circuitMatrix)
    if (appliedRef.current === key) return

    appliedRef.current = key

    const applyFn = () => {
      applyTemplateCircuit(saved.circuitMatrix)
      setSavedCircuitName(saved.name ?? '')
      setSavedCircuitId(saved._id ?? null)
    }

    if (!hasGates(circuitRef)) {
      _commit(applyFn)
    } else {
      queueMicrotask(() => setPendingLoad({
        message: 'Replace current circuit with saved circuit? Unsaved edits will be lost.',
        apply: applyFn,
      }))
    }
  }, [_commit, applyTemplateCircuit, appliedRef, circuitRef, location.state, setSavedCircuitId, setSavedCircuitName])

  const confirmLoad = useCallback(() => {
    if (!pendingLoad) return
    _commit(pendingLoad.apply)
    setPendingLoad(null)
  }, [_commit, pendingLoad])

  const cancelLoad = useCallback(() => {
    navigate('/circuit-builder', { replace: true, state: null })
    setPendingLoad(null)
  }, [navigate])

  return { pendingLoad, confirmLoad, cancelLoad }
}

