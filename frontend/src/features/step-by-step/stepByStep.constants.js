export const STEP_BY_STEP_MODES = {
  TIME_STEP: 'time-step',
  GATE_BY_GATE: 'gate-by-gate',
}

export const STEP_BY_STEP_STATUS = {
  IDLE: 'idle',
  READY: 'ready',
  RUNNING: 'running',
  COMPLETED: 'completed',
}

export const STEP_BY_STEP_COPY = {
  title: 'Feature D · Step-by-step',
  helper: 'Time-step executes one full column (t). Gate-by-gate executes one gate at a time.',
  start: 'Start guided run',
  next: 'Next step',
  reset: 'Reset guided run',
  autoplayStart: 'Start auto-play',
  autoplayStop: 'Stop auto-play',
}

export const STEP_BY_STEP_AUTOPLAY_DELAYS = [400, 700, 1000, 1400]
