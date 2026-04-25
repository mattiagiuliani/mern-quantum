import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveCircuit as apiSaveCircuit, updateCircuit as apiUpdateCircuit } from '../../api/apiClient'
import { STEP_BY_STEP_STATUS } from '../feature-d-step-by-step/feature-d-step-by-step'

/**
 * Manages all save-related state for the Circuit Builder.
 * Handles save/update API calls, modal state, and lastResult persistence.
 *
 * @param {{ circuit, user, results, stepByStepStatus, liveStateRef }} params
 */
export function useSaveCircuit({ circuit, user, results, stepByStepStatus, liveStateRef }) {
  const navigate = useNavigate()

  const [saveStatus,       setSaveStatus]       = useState('idle') // idle | saving | saved | error
  const [savedCircuitName, setSavedCircuitName] = useState('')
  const [savedCircuitId,   setSavedCircuitId]   = useState(null)
  const [saveModalOpen,    setSaveModalOpen]    = useState(false)
  const [saveNameDraft,    setSaveNameDraft]    = useState('')

  const openSaveModal = useCallback(() => {
    if (!user) { navigate('/login'); return }
    setSaveNameDraft(savedCircuitName || 'My Circuit')
    setSaveModalOpen(true)
  }, [navigate, savedCircuitName, user])

  const closeSaveModal = useCallback(() => setSaveModalOpen(false), [])

  const handleSaveConfirm = useCallback(async () => {
    setSaveModalOpen(false)
    setSaveStatus('saving')
    try {
      const trimmedName = saveNameDraft.trim() || 'My Circuit'
      if (savedCircuitId) {
        await apiUpdateCircuit(savedCircuitId, { name: trimmedName, circuitMatrix: circuit })
      } else {
        const data = await apiSaveCircuit(trimmedName, circuit)
        setSavedCircuitId(data.circuit._id)
      }
      setSavedCircuitName(trimmedName)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }, [circuit, saveNameDraft, savedCircuitId])

  // Persist lastResult to backend after full multi-run
  useEffect(() => {
    if (!results || !savedCircuitId) return
    apiUpdateCircuit(savedCircuitId, { lastResult: results }).catch(() => {})
  }, [results, savedCircuitId])

  // Persist lastResult after step-by-step completes
  useEffect(() => {
    if (stepByStepStatus !== STEP_BY_STEP_STATUS.COMPLETED || !savedCircuitId) return
    apiUpdateCircuit(savedCircuitId, { lastResult: liveStateRef.current }).catch(() => {})
  }, [stepByStepStatus, savedCircuitId, liveStateRef])

  return {
    saveStatus,
    savedCircuitName,
    setSavedCircuitName,
    savedCircuitId,
    setSavedCircuitId,
    saveModalOpen,
    saveNameDraft,
    setSaveNameDraft,
    openSaveModal,
    closeSaveModal,
    handleSaveConfirm,
  }
}
