const EMPTY = null

// CNOT helpers — keeps the circuit declarations readable
const CTRL = (partner) => ({ gate: 'CNOT', role: 'ctrl', partner })
const TGT  = (partner) => ({ gate: 'CNOT', role: 'tgt',  partner })

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
    id: 'example-bell',
    name: 'Bell State',
    description: 'True two-qubit entangled state: H on q[0], CNOT q[0]→q[1], measure both. Always collapses to |00⟩ or |11⟩.',
    tags: ['entanglement', 'cnot', 'bell'],
    isPublic: true,
    source: 'example',
    circuit: [
      ['H', CTRL(1), 'M', EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
      [EMPTY, TGT(0), 'M', EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
      [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
    ],
  },
  {
    id: 'example-ghz',
    name: 'GHZ State',
    description: 'Three-qubit Greenberger–Horne–Zeilinger state: H on q[0], CNOT q[0]→q[1], CNOT q[0]→q[2]. Always |000⟩ or |111⟩.',
    tags: ['entanglement', 'cnot', '3-qubits', 'ghz'],
    isPublic: true,
    source: 'example',
    circuit: [
      ['H', CTRL(1), CTRL(2), 'M', EMPTY, EMPTY, EMPTY, EMPTY],
      [EMPTY, TGT(0), EMPTY,  'M', EMPTY, EMPTY, EMPTY, EMPTY],
      [EMPTY, EMPTY,  TGT(0), 'M', EMPTY, EMPTY, EMPTY, EMPTY],
    ],
  },
]
