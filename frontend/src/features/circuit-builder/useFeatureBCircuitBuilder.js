import { useEffect, useRef } from 'react'

const GATE_KEYS = { h: 'H', x: 'X', m: 'M' }

/**
 * Keyboard shortcuts for the circuit builder.
 * H / X / M  → select gate (toggle if already selected)
 * Escape      → deselect gate
 * Ctrl+Z / Cmd+Z → undo last placed gate
 *
 * Guards against input / textarea / contentEditable focus.
 */
export function useKeyboardShortcuts({ onSelectGate, onDeselect, onUndo }) {
  // Keep stable refs so the effect only re-registers when handlers change identity
  const onSelectGateRef = useRef(onSelectGate)
  const onDeselectRef   = useRef(onDeselect)
  const onUndoRef       = useRef(onUndo)

  useEffect(() => { onSelectGateRef.current = onSelectGate }, [onSelectGate])
  useEffect(() => { onDeselectRef.current   = onDeselect   }, [onDeselect])
  useEffect(() => { onUndoRef.current       = onUndo       }, [onUndo])

  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable) return

      const key = e.key?.toLowerCase()

      if (GATE_KEYS[key]) {
        e.preventDefault()
        onSelectGateRef.current(GATE_KEYS[key])
        return
      }

      if (e.key === 'Escape') {
        e.preventDefault()
        onDeselectRef.current()
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        onUndoRef.current()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, []) // empty deps — stable via refs
}

/**
 * Simple undo stack for gate placements.
 * Ref-based — push/pop do not trigger re-renders.
 * @returns {{ pushUndo: (entry: object) => void, popUndo: () => object|null }}
 */
export function useUndoStack() {
  const stackRef = useRef([])

  const pushUndo = (entry) => {
    stackRef.current.push(entry)
  }

  const popUndo = () => stackRef.current.pop() ?? null

  return { pushUndo, popUndo }
}
