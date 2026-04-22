const EMPTY = null

export const EXAMPLE_TEMPLATES = [
  {
    id: 'example-superposition',
    name: 'Superposition',
    description: 'Single-qubit superposition followed by measurement.',
    tags: ['basic', 'hadamard'],
    isPublic: true,
    source: 'example',
    circuit: [
      ['H', 'M', EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
      [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
      [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
    ],
  },
  {
    id: 'example-bell-placeholder',
    name: 'Bell State (Educational)',
    description: 'Placeholder demo with current gates set (H, X, M).',
    tags: ['example', 'entanglement'],
    isPublic: true,
    source: 'example',
    circuit: [
      ['H', EMPTY, 'M', EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
      ['X', EMPTY, 'M', EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
      [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
    ],
  },
  {
    id: 'example-ghz-placeholder',
    name: 'GHZ (Educational)',
    description: 'Three-qubit educational placeholder with the available gates.',
    tags: ['example', '3-qubits'],
    isPublic: true,
    source: 'example',
    circuit: [
      ['H', EMPTY, 'M', EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
      ['X', EMPTY, 'M', EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
      ['X', EMPTY, 'M', EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
    ],
  },
]
