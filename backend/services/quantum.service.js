import IBMQuantumRuntime from '@ibm-cloud/ibm-platform-services'

export async function runCircuit(gatesJson) {
  // IBM Quantum Runtime via Qiskit REST API
  // Converte gatesJson → QASM 2.0 → invia a ibm_sherbrooke o simulator
  const qasm = gatesToQasm(gatesJson)
  
  const response = await fetch(
    `https://api.quantum-computing.ibm.com/runtime/jobs`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.IBM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        program_id: 'sampler',
        backend: 'ibmq_qasm_simulator',  // gratuito
        params: { circuits: [qasm], shots: 1024 }
      })
    }
  )
  return response.json()
}

function gatesToQasm(gates) {
  const lines = ['OPENQASM 2.0;', 'include "qelib1.inc";',
    `qreg q[${gates.qubits}];`, `creg c[${gates.qubits}];`]
  gates.operations.forEach(op => {
    if (op.type === 'H')  lines.push(`h q[${op.qubit}];`)
    if (op.type === 'X')  lines.push(`x q[${op.qubit}];`)
    if (op.type === 'CX') lines.push(`cx q[${op.control}],q[${op.target}];`)
    if (op.type === 'M')  lines.push(`measure q[${op.qubit}] -> c[${op.qubit}];`)
  })
  return lines.join('\n')
}