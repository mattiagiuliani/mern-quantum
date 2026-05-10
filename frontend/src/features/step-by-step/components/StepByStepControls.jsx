import { Button, Form, Spinner } from 'react-bootstrap'
import {
  STEP_BY_STEP_AUTOPLAY_DELAYS,
  STEP_BY_STEP_COPY,
  STEP_BY_STEP_MODES,
  STEP_BY_STEP_STATUS,
} from '../stepByStep.constants'
import { describeQueueUnit } from '../stepByStep.utils'

export function StepByStepControls({
  mode,
  onModeChange,
  status,
  totalUnits,
  currentIndex,
  currentUnit,
  percent,
  canStart,
  canNext,
  onStart,
  onNext,
  onReset,
  disabled,
  autoPlayEnabled,
  onToggleAutoPlay,
  autoPlayDelay,
  onChangeAutoPlayDelay,
}) {
  const currentLabel = describeQueueUnit(currentUnit)
  const isRunning = status === STEP_BY_STEP_STATUS.RUNNING
  const isCompleted = status === STEP_BY_STEP_STATUS.COMPLETED

  return (
    <div style={{
      marginTop: 6,
      paddingTop: 12,
      borderTop: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div style={{
        fontSize: 10,
        letterSpacing: '0.12em',
        color: 'rgba(110,231,208,0.8)',
        textTransform: 'uppercase',
        fontFamily: "'Space Mono', monospace",
      }}>
        {STEP_BY_STEP_COPY.title}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Button
          size="sm"
          variant={mode === STEP_BY_STEP_MODES.TIME_STEP ? 'outline-info' : 'outline-secondary'}
          disabled={disabled || isRunning}
          onClick={() => onModeChange(STEP_BY_STEP_MODES.TIME_STEP)}
          style={{ fontSize: 10, letterSpacing: '0.05em' }}
        >
          Time-step
        </Button>
        <Button
          size="sm"
          variant={mode === STEP_BY_STEP_MODES.GATE_BY_GATE ? 'outline-info' : 'outline-secondary'}
          disabled={disabled || isRunning}
          onClick={() => onModeChange(STEP_BY_STEP_MODES.GATE_BY_GATE)}
          style={{ fontSize: 10, letterSpacing: '0.05em' }}
        >
          Gate-by-gate
        </Button>
      </div>

      <div style={{
        fontFamily: "'Lora', Georgia, serif",
        fontSize: 12,
        color: 'rgba(255,255,255,0.45)',
      }}>
        {STEP_BY_STEP_COPY.helper}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Button
          size="sm"
          variant="outline-info"
          disabled={disabled || !canStart}
          onClick={onStart}
        >
          {STEP_BY_STEP_COPY.start}
        </Button>
        <Button
          size="sm"
          variant="outline-light"
          disabled={disabled || !canNext}
          onClick={onNext}
        >
          {isRunning
            ? <><Spinner size="sm" animation="border" style={{ width: 10, height: 10, marginRight: 6 }} />{STEP_BY_STEP_COPY.next}</>
            : STEP_BY_STEP_COPY.next
          }
        </Button>
        <Button
          size="sm"
          variant="outline-secondary"
          disabled={disabled || isRunning}
          onClick={onReset}
        >
          {STEP_BY_STEP_COPY.reset}
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button
          size="sm"
          variant={autoPlayEnabled ? 'outline-warning' : 'outline-success'}
          disabled={disabled || !canStart}
          onClick={onToggleAutoPlay}
        >
          {autoPlayEnabled ? STEP_BY_STEP_COPY.autoplayStop : STEP_BY_STEP_COPY.autoplayStart}
        </Button>
        <Form.Select
          size="sm"
          value={String(autoPlayDelay)}
          disabled={disabled || autoPlayEnabled || isRunning}
          onChange={(e) => onChangeAutoPlayDelay(Number(e.target.value))}
          style={{
            maxWidth: 130,
            backgroundColor: 'rgba(255,255,255,0.02)',
            color: 'rgba(255,255,255,0.78)',
            border: '1px solid rgba(255,255,255,0.2)',
            fontSize: 11,
          }}
        >
          {STEP_BY_STEP_AUTOPLAY_DELAYS.map((delay) => (
            <option key={delay} value={String(delay)}>
              {delay} ms
            </option>
          ))}
        </Form.Select>
      </div>

      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.04em',
        color: 'rgba(255,255,255,0.5)',
      }}>
        {'Progress: ' + Math.min(currentIndex, totalUnits) + '/' + totalUnits + ' · ' + percent + '%'}
      </div>

      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.04em',
        color: 'rgba(255,255,255,0.38)',
      }}>
        {'Current: ' + currentLabel}
      </div>

      {isCompleted && (
        <div style={{
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#6EE7D0',
          border: '1px solid rgba(110,231,208,0.35)',
          borderRadius: 6,
          padding: '6px 8px',
          textAlign: 'center',
          fontFamily: "'Space Mono', monospace",
        }}>
          Guided run completed
        </div>
      )}
    </div>
  )
}
